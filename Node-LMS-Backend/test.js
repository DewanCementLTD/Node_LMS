const oracledb = require('oracledb');
const f = async () => {
  const c = await oracledb.getConnection({user:'hrms',password:'oracle123',connectString:'163.61.91.221:1521/orcl'}); 
  try { 
    await c.execute(`
      INSERT INTO RECRUITMENT_INTERVIEW_ASGN (
        ASSIGNMENT_ID, APP_ID, EMPCODE, INTERVIEW_TYPE, 
        INTERVIEW_DATE, START_TIME, END_TIME, REMARKS, 
        LOCATION_OR_LINK, INTERVIEW_MODE, ASSIGNED_AT
      ) VALUES (
        RECRUITMENT_INTV_ASGN_SEQ.NEXTVAL, :app_id, :emp, :itype, 
        TO_DATE(:idate, 'YYYY-MM-DD'), :startt, :endt, :remarks, :loc, :mode, SYSDATE
      )
    `, {
      app_id: 1, emp: '1', itype: 'A', idate: '2026-08-01', 
      startt: '10:00', endt: '11:00', remarks: 'A', loc: 'A', mode: 'A'
    }); 
    console.log('success'); 
  } catch(e) { 
    console.error(e.message); 
  } 
  await c.close();
};
f();
