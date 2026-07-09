import json
from core.database import get_connection

conn = get_connection()
cur = conn.cursor()

def q(label, sql, binds=None, n=25):
    try:
        cur.execute(sql, binds or {})
        cols = [c[0] for c in cur.description]
        rows = [dict(zip(cols, [str(v) for v in r])) for r in cur.fetchmany(n)]
        print(f"\n=== {label} ({len(rows)} rows) ===")
        print(json.dumps(rows, indent=1, default=str))
    except Exception as e:
        print(f"\n=== {label} FAILED: {e}")

# Normalized-name comparison: how many guard-dropped matches actually had the SAME name
# (i.e. genuinely correct matches we would lose)?
q("dropped but same name (bad losses)", """
    SELECT COUNT(*) N FROM HR_EMP_MASTER h
    JOIN EMPLOYEE_F e ON e.EMP_NO = h.EMPCODE
    WHERE NOT EXISTS (
      SELECT 1 FROM EMPLOYEE_F e2
      WHERE e2.EMP_NO = h.EMPCODE AND TO_CHAR(e2.COMPC) = TO_CHAR(h.UNIT_ID)
    )
    AND UPPER(REPLACE(h.NAME,' ','')) = UPPER(REPLACE(e.EMP_NAME,' ',''))
""")
q("old join wrong-name matches", """
    SELECT COUNT(*) N FROM HR_EMP_MASTER h
    JOIN EMPLOYEE_F e ON e.EMP_NO = h.EMPCODE
    WHERE UPPER(REPLACE(h.NAME,' ','')) <> UPPER(REPLACE(e.EMP_NAME,' ',''))
""")
q("new join wrong-name matches", """
    SELECT COUNT(*) N FROM HR_EMP_MASTER h
    JOIN EMPLOYEE_F e ON e.EMP_NO = h.EMPCODE AND TO_CHAR(e.COMPC) = TO_CHAR(h.UNIT_ID)
    WHERE UPPER(REPLACE(h.NAME,' ','')) <> UPPER(REPLACE(e.EMP_NAME,' ',''))
""")
q("sample dropped same-name", """
    SELECT h.EMPCODE, h.NAME, h.UNIT_ID, e.COMPC, e.CARD_NO
    FROM HR_EMP_MASTER h
    JOIN EMPLOYEE_F e ON e.EMP_NO = h.EMPCODE
    WHERE NOT EXISTS (
      SELECT 1 FROM EMPLOYEE_F e2
      WHERE e2.EMP_NO = h.EMPCODE AND TO_CHAR(e2.COMPC) = TO_CHAR(h.UNIT_ID)
    )
    AND UPPER(REPLACE(h.NAME,' ','')) = UPPER(REPLACE(e.EMP_NAME,' ',''))
    AND ROWNUM <= 15
""")
cur.close(); conn.close()
