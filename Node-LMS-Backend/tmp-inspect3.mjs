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

await q('employee-ish objects', `SELECT owner, object_name, object_type FROM all_objects WHERE object_name LIKE 'EMPLOYEE%' OR object_name LIKE 'HR_EMP%' ORDER BY owner, object_name`);
await q('GEMRWA.HR_EMP_MASTER by mobile/code', `SELECT EMPCODE, OLD_EMPCODE, NAME, "MOBILE#", DESG_CD, DESG_DESC, DEPT_NO, DEPT_NAME, UNIT_ID, TO_CHAR(DTOFAPPT,'YYYY-MM-DD') DOJ FROM GEMRWA.HR_EMP_MASTER WHERE "MOBILE#" IN ('3012873945','03012873945') OR OLD_EMPCODE LIKE '50201552%' OR EMPCODE LIKE '50201552%'`);
await q('GEMRWA.HR_EMP_MASTER cols', `SELECT column_name, data_type FROM all_tab_columns WHERE table_name='HR_EMP_MASTER' AND owner='GEMRWA' ORDER BY column_id`);
await q('hr_emp_master_view owner', `SELECT owner, object_name, object_type FROM all_objects WHERE object_name = 'HR_EMP_MASTER_VIEW'`);
await conn.close();
