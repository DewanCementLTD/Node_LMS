import { getDirectConnection } from '../config/database.js';

export const getLeaveBalancesData = async (card_no) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
        SELECT 
          leave_type AS "leave_type", 
          leave_desc AS "leave_desc", 
          balance AS "balance"
        FROM ALL_LEAVE_BAL_V
        WHERE card_no = :card_no
    `;
    const result = await connection.execute(sql, { card_no }, { outFormat: 4002 });
    return result.rows ?? [];
  } finally {
    await connection?.close();
  }
};

// Mirrors `get_leave_status` in the FastAPI LMS-Backend (repositories/user_repository.py):
// LEAVE_APPLICATION.EMP_FK holds the card_no directly (no EMPLOYEE join).
export const getLeaveStatusData = async (card_no) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      SELECT
        ENTRY_DATE      AS "entry_date",
        LEAVE_TYPE_FK   AS "leave_type",
        LEAVE_DATE_FROM AS "from_date",
        LEAVE_DATE_TO   AS "to_date",
        APPROVAL_STATUS AS "status"
      FROM LEAVE_APPLICATION
      WHERE EMP_FK = :card
      ORDER BY ENTRY_DATE DESC
    `;
    const result = await connection.execute(sql, { card: card_no }, { outFormat: 4002 });
    const rows = result.rows ?? [];
    for (const row of rows) {
      for (const key of ['from_date', 'to_date', 'entry_date']) {
        const v = row[key];
        if (v instanceof Date) {
          const y = v.getFullYear();
          const m = String(v.getMonth() + 1).padStart(2, '0');
          const d = String(v.getDate()).padStart(2, '0');
          row[key] = `${y}-${m}-${d}`;
        }
      }
    }
    return rows;
  } finally {
    await connection?.close();
  }
};

// Parses a 'YYYY-MM-DD' string to a UTC-midnight timestamp (avoids local-timezone
// drift when diffing two calendar dates).
const parseYmd = (s) => {
  const [y, m, d] = String(s).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

// Mirrors `apply_leave` in the FastAPI LMS-Backend (repositories/user_repository.py):
// EMP_FK is the card_no directly, and the leave balance is validated against
// ALL_LEAVE_BAL_V before the insert.
export const applyLeaveData = async (card_no, body) => {
  const { leave_type_id, from_date, to_date, reason, compc, brnch, emp_name } = body;
  const leaveTypeId = leave_type_id ?? 0;
  const leave_days = Math.round((parseYmd(to_date) - parseYmd(from_date)) / 86400000) + 1;

  let connection;
  try {
    connection = await getDirectConnection();

    // Validate leave balance before inserting
    try {
      const balRow = (
        await connection.execute(
          `SELECT balance AS "balance" FROM ALL_LEAVE_BAL_V WHERE card_no = :card AND leave_type = :lt`,
          { card: card_no, lt: leaveTypeId },
          { outFormat: 4002 }
        )
      ).rows?.[0];
      const currentBalance = balRow?.balance != null ? Number(balRow.balance) : 0;
      if (currentBalance <= 0) {
        return { status: 'error', message: 'No remaining balance for this leave type.' };
      }
      if (leave_days > currentBalance) {
        return {
          status: 'error',
          message: `Insufficient balance. Available: ${currentBalance}, Requested: ${leave_days}`,
        };
      }
    } catch (e) {
      console.log(`[LEAVE] Balance check warning: ${e.message ?? e}`);
      // Continue if view doesn't exist — let insert proceed
    }

    try {
      await connection.execute(
        `INSERT INTO LEAVE_APPLICATION (
           LEAVE_DATE_FROM, LEAVE_DATE_TO, LEAVE_DAYS, EMP_FK, HRS,
           LEAVE_TYPE_FK, REASON, APPROVAL_STATUS, ENTRY_DATE, ENTRY_BY,
           COMPC, BRNCH
         ) VALUES (
           TO_DATE(:from_date, 'YYYY-MM-DD'), TO_DATE(:to_date, 'YYYY-MM-DD'),
           :leave_days, :emp_fk, 0, :leave_type_id, :reason, 'PENDING', SYSDATE,
           :emp_name, :compc, :brnch
         )`,
        {
          from_date,
          to_date,
          leave_days,
          emp_fk: card_no,
          leave_type_id: leaveTypeId,
          reason,
          emp_name: emp_name ?? null,
          compc: compc ?? null,
          brnch: brnch ?? null,
        },
        { autoCommit: true }
      );
      return { status: 'success' };
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  } finally {
    await connection?.close();
  }
};
