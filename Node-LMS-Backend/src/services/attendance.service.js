import { fr } from "zod/v4/locales";
import { getDirectConnection } from "../config/database.js";

export const recordFaceAttendance = async (body) => {
  const {
    card_no,
    attendance_type,
    latitude,
    longitude,
    accuracy,
    address,
    formatted_address,
    timestamp,
    device_id,
    device_model,
    app_version,
  } = body;

  let connection;
  try {
    connection = await getDirectConnection();
    await connection.execute(
      `INSERT INTO ATTENDANCE_RECORDS
         (CARD_NO, ATTENDANCE_DATE, ATTENDANCE_TYPE, ENTRY_TIME,
          LATITUDE, LONGITUDE, ACCURACY, ADDRESS, FORMATTED_ADDRESS,
          TIMESTAMP, DEVICE_ID, DEVICE_MODEL, APP_VERSION)
       VALUES
         (:card_no, TRUNC(SYSDATE), :attendance_type, TO_CHAR(SYSDATE,'HH24:MI'),
          :lat, :lng, :accuracy, :address, :formatted_address,
          :timestamp, :device_id, :device_model, :app_version)`,
      {
        card_no,
        attendance_type,
        lat: String(latitude ?? ""),
        lng: String(longitude ?? ""),
        accuracy: String(accuracy ?? ""),
        address: address ?? "",
        formatted_address: formatted_address ?? "",
        timestamp: timestamp ?? "",
        device_id: device_id ?? "",
        device_model: device_model ?? "",
        app_version: app_version ?? "",
      },
      { autoCommit: true },
    );
    return { status: "SUCCESS", message: "Attendance recorded." };
  } finally {
    await connection?.close();
  }
};

export const recordManualAttendance = async (card_no, body) => {
  const { latitude, longitude } = body;
  let connection;
  try {
    connection = await getDirectConnection();

    // If an open check-in exists today, record check-out; otherwise check-in
    const existingRow = (
      await connection.execute(
        `SELECT ID FROM ATTENDANCE_RECORDS
         WHERE CARD_NO = :card_no
           AND ATTENDANCE_DATE = TRUNC(SYSDATE)
           AND EXIT_TIME IS NULL
         FETCH FIRST 1 ROWS ONLY`,
        { card_no },
        { outFormat: 4002 },
      )
    ).rows?.[0];

    if (existingRow) {
      await connection.execute(
        `UPDATE ATTENDANCE_RECORDS
         SET EXIT_TIME    = TO_CHAR(SYSDATE,'HH24:MI'),
             EXIT_DATE    = SYSDATE,
             CHECKOUT_LATS  = :lat,
             CHECKOUT_LONGS = :lng
         WHERE ID = :id`,
        {
          lat: String(latitude ?? ""),
          lng: String(longitude ?? ""),
          id: existingRow.id,
        },
        { autoCommit: true },
      );
      return { status: "SUCCESS", message: "Check-out recorded." };
    }

    await connection.execute(
      `INSERT INTO ATTENDANCE_RECORDS
         (CARD_NO, ENTRY_TIME, ATTENDANCE_DATE, ATTENDANCE_TYPE, LATITUDE, LONGITUDE)
       VALUES
         (:card_no, TO_CHAR(SYSDATE,'HH24:MI'), TRUNC(SYSDATE), 'MANUAL', :lat, :lng)`,
      { card_no, lat: String(latitude ?? ""), lng: String(longitude ?? "") },
      { autoCommit: true },
    );
    return { status: "SUCCESS", message: "Check-in recorded." };
  } finally {
    await connection?.close();
  }
};

export const getAttendanceRange = async (card_no, from_date, to_date) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      SELECT
        ID                                         AS id,
        CARD_NO                                    AS card_no,
        TO_CHAR(ATTENDANCE_DATE, 'YYYY-MM-DD')     AS attendance_date,
        IN_DT                                      AS in_dt,
        OUT_DT                                     AS out_dt,
        TOTAL_HOURS                                AS total_hours,
        ATTENDANCE_TYPE                            AS attendance_type,
        ADDRESS                                    AS address
      FROM ATTENDANCE_RECORDS
      WHERE CARD_NO = :card_no
        AND ATTENDANCE_DATE >= TO_DATE(:from_date,'YYYY-MM-DD')
        AND ATTENDANCE_DATE <= TO_DATE(:to_date,  'YYYY-MM-DD')
      ORDER BY ATTENDANCE_DATE DESC
    `;
    const result = await connection.execute(
      sql,
      { card_no, from_date, to_date },
      { outFormat: 4002 },
    );
    return result.rows ?? [];
  } finally {
    await connection?.close();
  }
};

export const getAttendanceByDate = async (card_no, date_str) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      SELECT
        ID                                         AS id,
        CARD_NO                                    AS card_no,
        TO_CHAR(ATTENDANCE_DATE, 'YYYY-MM-DD')     AS attendance_date,
        IN_DT                                      AS in_dt,
        OUT_DT                                     AS out_dt,
        TOTAL_HOURS                                AS total_hours,
        ATTENDANCE_TYPE                            AS attendance_type,
        ADDRESS                                    AS address,
        FORMATTED_ADDRESS                          AS formatted_address
      FROM ATTENDANCE_RECORDS
      WHERE CARD_NO = :card_no
        AND ATTENDANCE_DATE = TO_DATE(:date_str,'YYYY-MM-DD')
      FETCH FIRST 1 ROWS ONLY
    `;
    const result = await connection.execute(
      sql,
      { card_no, date_str },
      { outFormat: 4002 },
    );
    return result.rows?.[0] ?? null;
  } finally {
    await connection?.close();
  }
};

export const getAttendanceSummary = async (emp_pk, from_date, to_date) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const card = emp_pk;
    const card_int = String(parseInt(emp_pk, 10));
    const from_d = from_date;
    const to_d = to_date;
    const sql = `
        SELECT
          COUNT(*) AS total_days,
          SUM(CASE WHEN ENTRY_TIME IS NOT NULL AND EXIT_TIME IS NOT NULL THEN 1 ELSE 0 END)  AS present,
          SUM(CASE WHEN ENTRY_TIME IS NOT NULL AND EXIT_TIME IS NULL THEN 1 ELSE 0 END)      AS incomplete,
          NVL(SUM(NVL(TIME_SPENT, 0)), 0) AS total_minutes,
          0 AS late_minutes,
          0 AS overtime_minutes,
          0 AS absent_days
      FROM ATTENDANCE_RECORDS
      WHERE (TO_CHAR(CARD_NO) = :card OR TO_CHAR(CARD_NO) = :card_int)
        AND TRUNC(ATTENDANCE_DATE) BETWEEN TO_DATE(:from_d, 'YYYY-MM-DD') AND TO_DATE(:to_d, 'YYYY-MM-DD')
    `;
    const result = await connection.execute(
      sql,
      { card, card_int, from_d, to_d },
      { outFormat: 4002 },
    );
    return result.rows?.[0] ?? {};
  } finally {
    await connection?.close();
  }
};
