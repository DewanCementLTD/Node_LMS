# Dry-run the new LEAVE_APPLICATION_APPLY insert: execute then ROLLBACK.
from core.database import get_connection

conn = get_connection()
cur = conn.cursor()

cur.execute("SELECT EMP_PK, EMP_NAME, COMPC, BRNCH, TO_CHAR(HOD1), TO_CHAR(HOD2), TO_CHAR(HOD3) FROM EMPLOYEE_F WHERE TO_CHAR(CARD_NO) = :c", {"c": "50201552.2.3"})
er = cur.fetchone()
print("employee row:", er)

cur.execute("SELECT NVL(MAX(LEAVE_APPLICATION_PK), 0) + 1 FROM LEAVE_APPLICATION_APPLY")
pk = int(cur.fetchone()[0])
print("next pk:", pk)

params = {
    "pk": pk,
    "from_date": "2026-07-20",
    "to_date": "2026-07-20",
    "leave_days": 1,
    "emp_fk": int(er[0]),
    "hrs": 0,
    "leave_type_fk": 1,
    "reason": "DRY RUN - ROLLBACK",
    "emp_name": er[1],
    "previous_balance": 3.5,
    "year": 2026,
    "compc": er[2],
    "brnch": er[3],
    "hod1": er[4],
    "hod2": er[5],
    "hod3": er[6],
}
cur.execute("""
    INSERT INTO LEAVE_APPLICATION_APPLY (
        LEAVE_APPLICATION_PK, LEAVE_DATE_FROM, LEAVE_DATE_TO, LEAVE_DAYS, EMP_FK, HRS,
        LEAVE_TYPE_FK, REASON, APPROVAL_STATUS, ENTRY_DATE, ENTRY_BY,
        PREVIOUS_BALANCE, YEAR, COMPC, BRNCH, TR_TYPE, HOD1_MNO, HOD2_MNO, HOD3_MNO
    ) VALUES (
        :pk, TO_DATE(:from_date, 'YYYY-MM-DD'), TO_DATE(:to_date, 'YYYY-MM-DD'), :leave_days, :emp_fk, :hrs,
        :leave_type_fk, :reason, 'Waiting',
        TO_CHAR(SYSDATE, 'DD-MON-RR HH24:MI', 'NLS_DATE_LANGUAGE=AMERICAN'),
        :emp_name, :previous_balance, :year, :compc, :brnch, 'Online', :hod1, :hod2, :hod3
    )
""", params)
print("insert OK (rows:", cur.rowcount, ")")

cur.execute("SELECT ENTRY_DATE, APPROVAL_STATUS, EMP_FK FROM LEAVE_APPLICATION_APPLY WHERE LEAVE_APPLICATION_PK = :pk", {"pk": pk})
print("inserted row check:", cur.fetchone())

conn.rollback()
print("ROLLED BACK")

cur.execute("SELECT COUNT(*) FROM LEAVE_APPLICATION_APPLY WHERE LEAVE_APPLICATION_PK = :pk", {"pk": pk})
print("after rollback, rows with pk:", cur.fetchone()[0])
cur.close(); conn.close()
