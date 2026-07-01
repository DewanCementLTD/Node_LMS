import { getDirectConnection } from '../config/database.js';

export const batchInsertLocations = async (card_no, locations) => {
  let connection;
  try {
    connection = await getDirectConnection();
    for (const loc of locations) {
      await connection.execute(
        `INSERT INTO LOCATION_TRACKS
           (CARD_NO, LATITUDE, LONGITUDE, ACCURACY, RECORDED_AT, SYNCED_AT, ATTENDANCE_DATE)
         VALUES
           (:card_no, :lat, :lng, :accuracy, :recorded_at, SYSTIMESTAMP, TRUNC(SYSDATE))`,
        {
          card_no,
          lat: loc.latitude,
          lng: loc.longitude,
          accuracy: loc.accuracy ?? null,
          recorded_at: loc.recorded_at ? new Date(loc.recorded_at) : new Date(),
        }
      );
    }
    await connection.commit();
    return { status: 'SUCCESS', message: `${locations.length} location(s) saved.` };
  } finally {
    await connection?.close();
  }
};

export const getLocationHistory = async (card_no, date) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      SELECT
        LATITUDE    AS latitude,
        LONGITUDE   AS longitude,
        ACCURACY    AS accuracy,
        RECORDED_AT AS recorded_at
      FROM LOCATION_TRACKS
      WHERE CARD_NO = :card_no
        AND ATTENDANCE_DATE = TO_DATE(:date,'YYYY-MM-DD')
      ORDER BY RECORDED_AT
    `;
    const result = await connection.execute(sql, { card_no, date }, { outFormat: 4002 });
    return result.rows ?? [];
  } finally {
    await connection?.close();
  }
};

export const getLocationSummary = async (date, compc, brnch) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      SELECT
        lt.CARD_NO              AS card_no,
        e.EMP_NAME              AS emp_name,
        COUNT(*)                AS track_count,
        MAX(lt.RECORDED_AT)     AS last_seen
      FROM LOCATION_TRACKS lt
      LEFT JOIN EMPLOYEE e ON TO_CHAR(e.CARD_NO) = lt.CARD_NO
      WHERE lt.ATTENDANCE_DATE = TO_DATE(:date,'YYYY-MM-DD')
        AND (:compc IS NULL OR TO_CHAR(e.COMPC) = :compc)
        AND (:brnch IS NULL OR TO_CHAR(e.BRNCH) = :brnch)
      GROUP BY lt.CARD_NO, e.EMP_NAME
      ORDER BY lt.CARD_NO
    `;
    const result = await connection.execute(
      sql,
      { date, compc: compc ?? null, brnch: brnch ?? null },
      { outFormat: 4002 }
    );
    return result.rows ?? [];
  } finally {
    await connection?.close();
  }
};

export const getLocationReportSummary = async ({ from_date, to_date, compc, brnch, dept_no, desg_cd }) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      SELECT
        lt.CARD_NO                          AS card_no,
        e.EMP_NAME                          AS emp_name,
        COUNT(DISTINCT lt.ATTENDANCE_DATE)  AS days_tracked,
        COUNT(*)                            AS total_pings
      FROM LOCATION_TRACKS lt
      LEFT JOIN EMPLOYEE e ON TO_CHAR(e.CARD_NO) = lt.CARD_NO
      LEFT JOIN HR_EMP_MASTER h ON h.EMPCODE = e.EMPCODE
      WHERE lt.ATTENDANCE_DATE BETWEEN TO_DATE(:from_date,'YYYY-MM-DD') AND TO_DATE(:to_date,'YYYY-MM-DD')
        AND (:compc   IS NULL OR TO_CHAR(h.UNIT_ID)  = :compc)
        AND (:brnch   IS NULL OR TO_CHAR(h.LOCATION) = :brnch)
        AND (:dept_no IS NULL OR h.DEPT_NO = :dept_no)
        AND (:desg_cd IS NULL OR h.DESG_CD = :desg_cd)
      GROUP BY lt.CARD_NO, e.EMP_NAME
      ORDER BY lt.CARD_NO
    `;
    const result = await connection.execute(
      sql,
      {
        from_date, to_date,
        compc: compc ?? null, brnch: brnch ?? null,
        dept_no: dept_no ?? null, desg_cd: desg_cd ?? null,
      },
      { outFormat: 4002 }
    );
    return result.rows ?? [];
  } finally {
    await connection?.close();
  }
};

export const getLocationTrail = async ({ from_date, to_date, compc, brnch }) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      SELECT
        lt.CARD_NO                                     AS card_no,
        lt.LATITUDE                                    AS latitude,
        lt.LONGITUDE                                   AS longitude,
        lt.ACCURACY                                    AS accuracy,
        lt.RECORDED_AT                                 AS recorded_at,
        TO_CHAR(lt.ATTENDANCE_DATE,'YYYY-MM-DD')       AS attendance_date
      FROM LOCATION_TRACKS lt
      LEFT JOIN EMPLOYEE e ON TO_CHAR(e.CARD_NO) = lt.CARD_NO
      WHERE lt.ATTENDANCE_DATE BETWEEN TO_DATE(:from_date,'YYYY-MM-DD') AND TO_DATE(:to_date,'YYYY-MM-DD')
        AND (:compc IS NULL OR TO_CHAR(e.COMPC) = :compc)
        AND (:brnch IS NULL OR TO_CHAR(e.BRNCH) = :brnch)
      ORDER BY lt.CARD_NO, lt.RECORDED_AT
    `;
    const result = await connection.execute(
      sql,
      { from_date, to_date, compc: compc ?? null, brnch: brnch ?? null },
      { outFormat: 4002 }
    );
    return result.rows ?? [];
  } finally {
    await connection?.close();
  }
};
