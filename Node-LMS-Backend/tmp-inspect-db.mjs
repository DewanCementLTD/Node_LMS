// Read-only DB inspection for the reported issues.
import oracledb from 'oracledb';
import dotenv from 'dotenv';
dotenv.config({ path: 'E:/DCL_LMS/HRMS_COMPLETE/Node-LMS-Backend/.env' });

try {
  oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });
} catch (e) {
  console.error('thick init failed', e.message);
}

const conn = await oracledb.getConnection({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_DSN,
});
const OBJ = { outFormat: oracledb.OUT_FORMAT_OBJECT };

async function q(label, sql, binds = {}) {
  try {
    const r = await conn.execute(sql, binds, OBJ);
    console.log(`\n=== ${label} (${r.rows.length} rows) ===`);
    console.log(JSON.stringify(r.rows.slice(0, 30), null, 1));
  } catch (e) {
    console.log(`\n=== ${label} FAILED: ${e.message}`);
  }
}

// 1. What tables exist matching our names
await q('tables', `SELECT table_name FROM all_tables WHERE table_name IN ('EMPLOYEE_F','EMPLOYEE','HR_EMP_MASTER','LEAVE_APPLICATION_APPLY','LEAVE_APPLICATION','LEAVE_TYPES') ORDER BY table_name`);
await q('views', `SELECT view_name FROM all_views WHERE view_name IN ('EMPLOYEE','ALL_LEAVE_BAL_V','EMPLOYEE_F')`);

// 2. EMPLOYEE_F columns
await q('EMPLOYEE_F cols', `SELECT column_name, data_type FROM all_tab_columns WHERE table_name = 'EMPLOYEE_F' ORDER BY column_id`);

// 3. Rows for the problem user
await q('EMPLOYEE_F by mobile', `SELECT * FROM EMPLOYEE_F WHERE TO_CHAR(MOBILE_NO) IN ('3012873945','03012873945')`);
await q('EMPLOYEE by card 50201552.2.3', `SELECT * FROM EMPLOYEE WHERE TO_CHAR(CARD_NO) = '50201552.2.3'`);
await q('EMPLOYEE by empcode 50201552', `SELECT EMPCODE, TO_CHAR(CARD_NO) CARD, EMP_NAME, EMP_NO, DESIGNATION, MOBILE_NO FROM EMPLOYEE WHERE TO_CHAR(EMPCODE) LIKE '50201552%'`);
await q('HR_EMP_MASTER by empcode like', `SELECT EMPCODE, NAME, "MOBILE#", "ATDTCARD#", DESG_CD, DEPT_NO, UNIT_ID, TO_CHAR(DTOFAPPT,'YYYY-MM-DD') DOJ FROM HR_EMP_MASTER WHERE EMPCODE LIKE '50201552%' OR "MOBILE#" IN ('3012873945','03012873945')`);

// 4. LEAVE_APPLICATION_APPLY structure
await q('LEAVE_APPLICATION_APPLY cols', `SELECT column_name, data_type, nullable FROM all_tab_columns WHERE table_name = 'LEAVE_APPLICATION_APPLY' ORDER BY column_id`);
await q('LEAVE_APPLICATION_APPLY sample', `SELECT * FROM LEAVE_APPLICATION_APPLY WHERE ROWNUM <= 3`);

// 5. LEAVE_TYPES full list
await q('LEAVE_TYPES cols', `SELECT column_name, data_type FROM all_tab_columns WHERE table_name = 'LEAVE_TYPES' ORDER BY column_id`);
await q('LEAVE_TYPES rows', `SELECT * FROM LEAVE_TYPES`);

await conn.close();
