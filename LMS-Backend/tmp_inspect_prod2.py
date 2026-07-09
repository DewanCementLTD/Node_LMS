import json
from core.database import get_connection

conn = get_connection()
cur = conn.cursor()

def q(label, sql, binds=None):
    try:
        cur.execute(sql, binds or {})
        cols = [c[0] for c in cur.description]
        rows = [dict(zip(cols, [str(v) for v in r])) for r in cur.fetchmany(30)]
        print(f"\n=== {label} ({len(rows)} rows) ===")
        print(json.dumps(rows, indent=1, default=str))
    except Exception as e:
        print(f"\n=== {label} FAILED: {e}")

q("EMPLOYEE_F Farhad", "SELECT EMP_PK, CARD_NO, CARD_NOW, EMP_NO, EMP_NAME, DESIGNATION, CADRE, ORG_ID, ORG_NM, TO_CHAR(MOBILE_NO) MOB, TO_CHAR(DATE_OF_JOIN,'YYYY-MM-DD') DOJ FROM EMPLOYEE_F WHERE CARD_NO = '50201552.2.3' OR TO_CHAR(MOBILE_NO) = '3012873945'")
q("EMPLOYEE_F same EMP_NO F-74", "SELECT EMP_PK, CARD_NO, EMP_NO, EMP_NAME, DESIGNATION, ORG_NM, TO_CHAR(DATE_OF_JOIN,'YYYY-MM-DD') DOJ FROM EMPLOYEE_F WHERE EMP_NO = 'F-74'")
q("HR_EMP_MASTER EMPCODE F-74", "SELECT EMPCODE, NAME, \"MOBILE#\", \"ATDTCARD#\", TO_CHAR(DESG_CD) DESG_CD, TO_CHAR(DEPT_NO) DEPT_NO, UNIT_ID, TO_CHAR(DTOFAPPT,'YYYY-MM-DD') DOJ FROM HR_EMP_MASTER WHERE EMPCODE = 'F-74'")
q("HR_EMP_MASTER by mobile", "SELECT EMPCODE, NAME, \"MOBILE#\", \"ATDTCARD#\", TO_CHAR(DESG_CD) DESG_CD, TO_CHAR(DEPT_NO) DEPT_NO, UNIT_ID FROM HR_EMP_MASTER WHERE \"MOBILE#\" IN ('3012873945','03012873945')")
q("HR_EMP_MASTER FAIZAN AHMED", "SELECT EMPCODE, NAME, \"MOBILE#\", \"ATDTCARD#\", TO_CHAR(DESG_CD) DESG_CD, TO_CHAR(DEPT_NO) DEPT_NO, UNIT_ID, TO_CHAR(DTOFAPPT,'YYYY-MM-DD') DOJ FROM HR_EMP_MASTER WHERE UPPER(NAME) LIKE 'FAIZAN AHMED%'")
q("ALL_LEAVE_BAL_V cols", "SELECT column_name, data_type FROM all_tab_columns WHERE table_name='ALL_LEAVE_BAL_V' ORDER BY column_id")
q("ALL_LEAVE_BAL_V any 50201552", "SELECT * FROM ALL_LEAVE_BAL_V WHERE TO_CHAR(CARD_NO) LIKE '50201552%'")
q("LEAVE_APPLICATION_APPLY seq?", "SELECT sequence_name FROM all_sequences WHERE sequence_name LIKE 'LEAVE%'")
q("LEAVE_APPLICATION cols vs APPLY", "SELECT column_name FROM all_tab_columns WHERE table_name='LEAVE_APPLICATION' ORDER BY column_id")
q("LEAVE_APPLICATION_APPLY Farhad", "SELECT LEAVE_APPLICATION_PK, EMP_FK, LEAVE_TYPE_FK, TO_CHAR(LEAVE_DATE_FROM,'YYYY-MM-DD') FR, TO_CHAR(LEAVE_DATE_TO,'YYYY-MM-DD') TT, LEAVE_DAYS, APPROVAL_STATUS, ENTRY_DATE FROM LEAVE_APPLICATION_APPLY WHERE TO_CHAR(EMP_FK) IN ('50201552','282') AND ROWNUM <= 10")
q("max pk apply", "SELECT MAX(LEAVE_APPLICATION_PK) MX FROM LEAVE_APPLICATION_APPLY")
q("triggers on apply", "SELECT trigger_name, triggering_event, status FROM all_triggers WHERE table_name = 'LEAVE_APPLICATION_APPLY'")

cur.close(); conn.close()
