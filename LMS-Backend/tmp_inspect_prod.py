# Read-only inspection of the production ERP DB for the reported issues.
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

q("EMPLOYEE_F cols", "SELECT column_name, data_type FROM all_tab_columns WHERE table_name='EMPLOYEE_F' ORDER BY column_id")
q("EMPLOYEE_F Farhad", "SELECT EMP_PK, TO_CHAR(CARD_NO) CARD_NO, EMP_NO, EMPCODE, EMP_NAME, DESIGNATION, DEPARTMENT, MOBILE_NO FROM EMPLOYEE_F WHERE TO_CHAR(CARD_NO) = '50201552.2.3' OR TO_CHAR(MOBILE_NO) IN ('3012873945','03012873945')")
q("HR_EMP_MASTER 50201552*", "SELECT EMPCODE, NAME, \"MOBILE#\", \"ATDTCARD#\", TO_CHAR(DESG_CD) DESG_CD, TO_CHAR(DEPT_NO) DEPT_NO, UNIT_ID, TO_CHAR(DTOFAPPT,'YYYY-MM-DD') DOJ FROM HR_EMP_MASTER WHERE EMPCODE LIKE '50201552%' OR \"MOBILE#\" IN ('3012873945','03012873945')")
q("LEAVE_APPLICATION_APPLY cols", "SELECT column_name, data_type, nullable FROM all_tab_columns WHERE table_name='LEAVE_APPLICATION_APPLY' ORDER BY column_id")
q("LEAVE_APPLICATION_APPLY sample", "SELECT * FROM LEAVE_APPLICATION_APPLY WHERE ROWNUM <= 2")
q("LEAVE_TYPES rows", "SELECT * FROM LEAVE_TYPES")
q("ALL_LEAVE_BAL_V for Farhad", "SELECT * FROM ALL_LEAVE_BAL_V WHERE TO_CHAR(CARD_NO) = '50201552.2.3'")
q("HR_DESG for 157/21", "SELECT TO_CHAR(DESG_CD) DESG_CD, DESG_DESC, COMPC FROM HR_DESG WHERE TO_CHAR(DESG_CD) IN ('157','21')")

cur.close(); conn.close()
