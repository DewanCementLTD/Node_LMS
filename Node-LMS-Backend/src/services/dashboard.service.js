import { getDirectConnection } from '../config/database.js';

export const getDashboardData = async (card_no) => {
  let connection;
  try {
    connection = await getDirectConnection();

    const empSql = `
      SELECT
        h.EMPCODE                              AS emp_pk,
        TO_CHAR(e.CARD_NO)                     AS card_no,
        h."ATDTCARD#"                          AS emp_no,
        h.NAME                                 AS emp_name,
        TO_CHAR(h.DTOFAPPT, 'YYYY-MM-DD')      AS date_of_join,
        h.NICNO                                AS nic_no,
        dg.DESG_DESC                           AS designation,
        d.DEPT_NAME                            AS department,
        ci.DESCR                               AS compcnm,
        h.UNIT_ID                              AS compc,
        h.LOCATION                             AS branch,
        cl.DESCR                               AS brnchnm,
        h.HOD1                                 AS hod,
        (SELECT NAME FROM HR_EMP_MASTER hod WHERE hod.EMPCODE = TO_CHAR(h.HOD1))  AS hod_nm
      FROM HR_EMP_MASTER h
      LEFT JOIN EMPLOYEE      e  ON e.EMPCODE   = h.EMPCODE
      LEFT JOIN HR_DEPT       d  ON d.DEPT_NO   = h.DEPT_NO   AND TO_CHAR(d.COMPC) = TO_CHAR(h.UNIT_ID)
      LEFT JOIN HR_DESG       dg ON dg.DESG_CD  = h.DESG_CD   AND TO_CHAR(dg.COMPC) = TO_CHAR(h.UNIT_ID)
      LEFT JOIN COMPANY_INFO  ci ON TO_CHAR(ci.COMPC)  = TO_CHAR(h.UNIT_ID)
      LEFT JOIN COM_LOCATION  cl ON cl.LCODE    = h.LOCATION
      WHERE TO_CHAR(e.CARD_NO) = :card_no
         OR h."ATDTCARD#"      = :card_no
         OR h.EMPCODE          = :card_no
      FETCH FIRST 1 ROWS ONLY
    `;
    const row = (await connection.execute(empSql, { card_no }, { outFormat: 4002 })).rows?.[0];
    if (!row) return null;

    // Aggregate leave balance for current year from ALL_LEAVE_BAL_V
    const balRow = (
      await connection.execute(
        `SELECT SUM(BALANCE) AS balance FROM ALL_LEAVE_BAL_V
         WHERE CARD_NO = :card_no AND YEAR = EXTRACT(YEAR FROM SYSDATE)`,
        { card_no: row.card_no },
        { outFormat: 4002 }
      )
    ).rows?.[0];

    return { ...row, balance: balRow?.balance ?? 0 };
  } finally {
    await connection?.close();
  }
};
