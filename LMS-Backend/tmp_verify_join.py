import json
from core.database import get_connection

conn = get_connection()
cur = conn.cursor()

def q(label, sql, binds=None, n=30):
    try:
        cur.execute(sql, binds or {})
        cols = [c[0] for c in cur.description]
        rows = [dict(zip(cols, [str(v) for v in r])) for r in cur.fetchmany(n)]
        print(f"\n=== {label} ({len(rows)} rows) ===")
        print(json.dumps(rows, indent=1, default=str))
    except Exception as e:
        print(f"\n=== {label} FAILED: {e}")

q("F-74 EMPLOYEE_F compc", "SELECT EMP_PK, CARD_NO, EMP_NO, EMP_NAME, COMPC, BRNCH, ORG_ID FROM EMPLOYEE_F WHERE EMP_NO='F-74'")
q("join with unit guard", """
    SELECT h.EMPCODE, h.NAME hr_name, h.UNIT_ID, e.EMP_NAME ef_name, e.CARD_NO, e.COMPC
    FROM HR_EMP_MASTER h
    LEFT JOIN EMPLOYEE_F e ON e.EMP_NO = h.EMPCODE AND TO_CHAR(e.COMPC) = TO_CHAR(h.UNIT_ID)
    WHERE h.EMPCODE = 'F-74'
""")
# How many HR rows lose their EMPLOYEE_F match if we add the COMPC guard?
q("match counts", """
    SELECT
      (SELECT COUNT(*) FROM HR_EMP_MASTER h JOIN EMPLOYEE_F e ON e.EMP_NO = h.EMPCODE) old_matches,
      (SELECT COUNT(*) FROM HR_EMP_MASTER h JOIN EMPLOYEE_F e ON e.EMP_NO = h.EMPCODE AND TO_CHAR(e.COMPC) = TO_CHAR(h.UNIT_ID)) new_matches,
      (SELECT COUNT(*) FROM HR_EMP_MASTER h) hr_total
    FROM DUAL
""")
# HR rows that previously matched but would lose their match with the guard
q("rows losing match", """
    SELECT h.EMPCODE, h.NAME, h.UNIT_ID, e.COMPC, e.EMP_NAME
    FROM HR_EMP_MASTER h
    JOIN EMPLOYEE_F e ON e.EMP_NO = h.EMPCODE
    WHERE NOT EXISTS (
      SELECT 1 FROM EMPLOYEE_F e2
      WHERE e2.EMP_NO = h.EMPCODE AND TO_CHAR(e2.COMPC) = TO_CHAR(h.UNIT_ID)
    ) AND ROWNUM <= 15
""")
cur.close(); conn.close()
