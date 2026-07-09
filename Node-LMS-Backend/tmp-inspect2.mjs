import oracledb from 'oracledb';
import dotenv from 'dotenv';
dotenv.config({ path: 'E:/DCL_LMS/HRMS_COMPLETE/Node-LMS-Backend/.env' });

try { oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' }); } catch {}

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
    console.log(JSON.stringify(r.rows.slice(0, 40), null, 1));
  } catch (e) {
    console.log(`\n=== ${label} FAILED: ${e.message}`);
  }
}

await q('current user', `SELECT USER FROM DUAL`);
await q('object owners', `SELECT owner, object_name, object_type FROM all_objects WHERE object_name IN ('EMPLOYEE','EMPLOYEE_F','HR_EMP_MASTER','LEAVE_APPLICATION_APPLY','LEAVE_TYPES','ALL_LEAVE_BAL_V') ORDER BY object_name, owner`);
await q('EMPLOYEE view text', `SELECT owner, text FROM all_views WHERE view_name = 'EMPLOYEE'`);
await q('synonyms', `SELECT owner, synonym_name, table_owner, table_name FROM all_synonyms WHERE synonym_name IN ('EMPLOYEE','HR_EMP_MASTER','LEAVE_TYPES','ALL_LEAVE_BAL_V','LEAVE_APPLICATION_APPLY','EMPLOYEE_F')`);
await q('EMPLOYEE cols', `SELECT column_name, data_type FROM all_tab_columns WHERE table_name='EMPLOYEE' AND owner=USER ORDER BY column_id`);
await q('EMPLOYEE fuzzy card', `SELECT EMPCODE, TO_CHAR(CARD_NO) CARD, EMP_NAME, MOBILE_NO, DESIGNATION FROM EMPLOYEE WHERE EMP_NAME LIKE '%FARHAD%' OR EMP_NAME LIKE '%FAIZAN%'`);
await q('HR_EMP_MASTER fuzzy', `SELECT EMPCODE, NAME, "MOBILE#", "ATDTCARD#", DESG_CD, DEPT_NO, UNIT_ID FROM HR_EMP_MASTER WHERE UPPER(NAME) LIKE '%FARHAD ALI%' OR UPPER(NAME) LIKE '%FAIZAN%'`);
await q('EMPLOYEE by mobile', `SELECT EMPCODE, TO_CHAR(CARD_NO) CARD, EMP_NAME, MOBILE_NO, DESIGNATION FROM EMPLOYEE WHERE TO_CHAR(MOBILE_NO) LIKE '%3012873945%'`);
await conn.close();
