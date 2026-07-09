import json
from core.database import get_connection

conn = get_connection()
cur = conn.cursor()

def q(label, sql, binds=None, n=60):
    try:
        cur.execute(sql, binds or {})
        cols = [c[0] for c in cur.description]
        rows = [dict(zip(cols, [str(v) for v in r])) for r in cur.fetchmany(n)]
        print(f"\n=== {label} ({len(rows)} rows) ===")
        print(json.dumps(rows, indent=1, default=str))
    except Exception as e:
        print(f"\n=== {label} FAILED: {e}")

q("EMPLOYEE_F all cols", "SELECT column_id, column_name, data_type FROM all_tab_columns WHERE table_name='EMPLOYEE_F' ORDER BY column_id", n=80)
q("LEAVE_APPLICATION objects", "SELECT owner, object_name, object_type FROM all_objects WHERE object_name IN ('LEAVE_APPLICATION','LEAVE_APPLICATION_APPLY','EMPLOYEE_F')")
q("LEAVE_APPLICATION entry_date type", "SELECT owner, column_name, data_type FROM all_tab_columns WHERE table_name='LEAVE_APPLICATION' AND column_name IN ('ENTRY_DATE','EMP_FK')")
q("APPLY status values", "SELECT APPROVAL_STATUS, COUNT(*) N FROM LEAVE_APPLICATION_APPLY GROUP BY APPROVAL_STATUS")
q("APPLY recent rows", "SELECT LEAVE_APPLICATION_PK, EMP_FK, TO_CHAR(LEAVE_DATE_FROM,'YYYY-MM-DD') FR, LEAVE_DAYS, APPROVAL_STATUS, ENTRY_DATE, ENTRY_BY, TR_TYPE, YEAR, HOD1_MNO, HOD2_MNO FROM (SELECT * FROM LEAVE_APPLICATION_APPLY ORDER BY LEAVE_APPLICATION_PK DESC) WHERE ROWNUM <= 5")
q("LEAVE_APPLICATION count vs APPLY", "SELECT (SELECT COUNT(*) FROM LEAVE_APPLICATION) LA, (SELECT COUNT(*) FROM LEAVE_APPLICATION_APPLY) LAA FROM DUAL")
q("EMPLOYEE_F Farhad full", "SELECT * FROM EMPLOYEE_F WHERE CARD_NO = '50201552.2.3'", n=2)

cur.close(); conn.close()
