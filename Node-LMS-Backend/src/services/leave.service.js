import { getDirectConnection } from '../config/database.js';

export const getLeaveBalancesData = async (card_no) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
        SELECT leave_type, leave_desc, balance
        FROM ALL_LEAVE_BAL_V
        WHERE card_no = :card_no
    `;
    const result = await connection.execute(sql, { card_no }, { outFormat: 4002 });
    return result.rows ?? [];
  } finally {
    await connection?.close();
  }
};

export const getLeaveStatusData = async (card_no) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      SELECT
        la.LEAVE_APPLICATION_PK                    AS id,
        TO_CHAR(la.LEAVE_DATE_FROM, 'YYYY-MM-DD')  AS from_date,
        TO_CHAR(la.LEAVE_DATE_TO,   'YYYY-MM-DD')  AS to_date,
        la.LEAVE_DAYS                              AS days,
        la.REASON                                  AS reason,
        la.APPROVAL_STATUS                         AS status,
        TO_CHAR(la.APPROVAL_DATE, 'YYYY-MM-DD')    AS approval_date,
        la.ENTRY_DATE                              AS applied_on
      FROM LEAVE_APPLICATION la
      JOIN EMPLOYEE e ON e.EMP_PK = la.EMP_FK
      WHERE TO_CHAR(e.CARD_NO) = :card_no
      ORDER BY la.LEAVE_APPLICATION_PK DESC
    `;
    const result = await connection.execute(sql, { card_no }, { outFormat: 4002 });
    return result.rows ?? [];
  } finally {
    await connection?.close();
  }
};

export const applyLeaveData = async (card_no, body) => {
  const { leave_type_id, from_date, to_date, reason, compc, brnch } = body;
  let connection;
  try {
    connection = await getDirectConnection();

    // Resolve EMP_FK and org scope from card_no
    const empRow = (
      await connection.execute(
        `SELECT EMP_PK, COMPC, BRNCH FROM EMPLOYEE WHERE TO_CHAR(CARD_NO) = :card_no FETCH FIRST 1 ROWS ONLY`,
        { card_no },
        { outFormat: 4002 }
      )
    ).rows?.[0];
    if (!empRow) return { success: false };

    // Calculate leave days (inclusive)
    const daysRow = (
      await connection.execute(
        `SELECT TO_DATE(:to_date,'YYYY-MM-DD') - TO_DATE(:from_date,'YYYY-MM-DD') + 1 AS days FROM DUAL`,
        { from_date, to_date },
        { outFormat: 4002 }
      )
    ).rows?.[0];
    const leave_days = daysRow?.days ?? 1;

    await connection.execute(
      `INSERT INTO LEAVE_APPLICATION
         (EMP_FK, LEAVE_TYPE_FK, LEAVE_DATE_FROM, LEAVE_DATE_TO,
          LEAVE_DAYS, REASON, APPROVAL_STATUS, ENTRY_DATE, COMPC, BRNCH)
       VALUES
         (:emp_fk, :leave_type_fk,
          TO_DATE(:from_date,'YYYY-MM-DD'), TO_DATE(:to_date,'YYYY-MM-DD'),
          :leave_days, :reason, 'PENDING',
          TO_CHAR(SYSDATE,'DD-MON-YY'),
          :compc, :brnch)`,
      {
        emp_fk: empRow.emp_pk,
        leave_type_fk: leave_type_id ?? null,
        from_date,
        to_date,
        leave_days,
        reason,
        compc: compc ?? empRow.compc,
        brnch: brnch ?? empRow.brnch,
      },
      { autoCommit: true }
    );
    return { success: true };
  } finally {
    await connection?.close();
  }
};
