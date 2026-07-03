import hashlib

from core.database import get_connection
from datetime import datetime


def _decode_sec_paswd(raw_paswd: str) -> str | None:
    """Decode SEC_USERNAME.PASWD without calling datacrypt.decryptdata.

    Passwords are stored as RAWTOHEX(plaintext) + RAWTOHEX(chr(0)) + binary_suffix.
    We hex-decode the leading valid-hex chars up to the first null byte.
    Example: '4F5241434C4531323300O624A355' -> 'ORACLE123'
    """
    if not raw_paswd:
        return None
    hex_part = ""
    for c in raw_paswd:
        if c.upper() in "0123456789ABCDEF":
            hex_part += c
        else:
            break
    if not hex_part or len(hex_part) % 2 != 0:
        return None
    try:
        decoded = bytes.fromhex(hex_part)
        if b"\x00" in decoded:
            decoded = decoded[: decoded.index(b"\x00")]
        return decoded.decode("latin-1")
    except Exception:
        return None


# ===============================
# USER SECURITY RIGHTS
# ===============================

def admin_can_edit_salary(card_no: str) -> bool:
    """True if the admin (matched in SEC_USERNAME by mobile/empcode/card) has
    ULEVL='M'. Fails OPEN when the admin can't be resolved, so M-level managers
    are never wrongly blocked (the UI is the primary gate)."""
    if not card_no:
        return True
    c = str(card_no).strip()
    c0 = ("0" + c) if not c.startswith("0") else c
    cn = c[1:] if c.startswith("0") else c
    conn = get_connection(); cur = conn.cursor()
    try:
        cur.execute("""
            SELECT ULEVL FROM SEC_USERNAME WHERE STATS = 'E' AND (
                TO_CHAR(MOBILE) IN (:c, :c0, :cn)
                OR ECODE = :c
                OR ECODE IN (SELECT h.EMPCODE FROM HR_EMP_MASTER h
                             LEFT JOIN EMPLOYEE e ON e.EMP_NO = h.EMPCODE
                             WHERE h.EMPCODE = :c OR TO_CHAR(e.CARD_NO) = :c)
            )
        """, {"c": c, "c0": c0, "cn": cn})
        rows = cur.fetchall()
        if not rows:
            return True
        return any((r[0] or "").strip().upper() == "M" for r in rows)
    except Exception as e:
        print(f"[RIGHTS] admin_can_edit_salary check failed (allowing): {e}")
        return True
    finally:
        cur.close(); conn.close()


def get_user_rights(mobile: str, empcode: str = "") -> dict:
    """Return SEC_USERNAME company/branch rights for the given employee."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        usrid = None
        ulevel = None
        if mobile:
            m = str(mobile).strip()
            m_w   = ('0' + m) if not m.startswith('0') else m
            m_no0 = m[1:]     if m.startswith('0')     else m
            cur.execute("""
                SELECT USRID, ULEVL FROM SEC_USERNAME
                WHERE TO_CHAR(MOBILE) IN (:m1, :m2, :m3) AND STATS = 'E'
            """, {"m1": m, "m2": m_w, "m3": m_no0})
            row = cur.fetchone()
            if row:
                usrid = str(row[0]); ulevel = (row[1] or "").strip()
        if not usrid and empcode:
            cur.execute("""
                SELECT USRID, ULEVL FROM SEC_USERNAME
                WHERE ECODE = :ec AND STATS = 'E'
            """, {"ec": str(empcode).strip()})
            row = cur.fetchone()
            if row:
                usrid = str(row[0]); ulevel = (row[1] or "").strip()
        if not usrid:
            return {"usrid": None, "allowed_companies": [], "allowed_branches": [],
                    "company_list": [], "branch_list": [], "ulevel": None, "can_edit_salary": False}

        cur.execute("""
            SELECT sc.COMPC, NVL(ci.DESCR, TO_CHAR(sc.COMPC))
            FROM SEC_USERCMPN sc
            LEFT JOIN COMPANY_INFO ci ON ci.COMPC = sc.COMPC
            WHERE sc.USRID = :usrid ORDER BY sc.COMPC
        """, {"usrid": usrid})
        cmp_rows     = cur.fetchall()
        companies    = [str(r[0]) for r in cmp_rows]
        company_list = [{"code": str(r[0]), "name": str(r[1] or r[0])} for r in cmp_rows]

        cur.execute("""
            SELECT sb.BRNCH, NVL(cl.DESCR, TO_CHAR(sb.BRNCH)), cl.COMPC
            FROM SEC_USERBRCH sb
            LEFT JOIN COM_LOCATION cl ON TO_CHAR(cl.LCODE) = TO_CHAR(sb.BRNCH)
            WHERE sb.USRID = :usrid2 ORDER BY sb.BRNCH
        """, {"usrid2": usrid})
        brn_rows    = cur.fetchall()
        branches    = [str(r[0]) for r in brn_rows]
        branch_list = [{"code": str(r[0]), "name": str(r[1] or r[0]),
                        "compc": (str(r[2]).strip() if r[2] is not None else None)} for r in brn_rows]

        return {"usrid": usrid, "allowed_companies": companies, "allowed_branches": branches,
                "company_list": company_list, "branch_list": branch_list,
                "ulevel": ulevel, "can_edit_salary": (ulevel or "").upper() == "M"}
    except Exception as e:
        print(f"[RIGHTS] Error: {e}")
        return {"usrid": None, "allowed_companies": [], "allowed_branches": [],
                "company_list": [], "branch_list": [], "ulevel": None, "can_edit_salary": False}
    finally:
        cur.close()
        conn.close()


# ===============================
# AUTH — TWO-STEP LOGIN
# ===============================

def authenticate_user(username: str, password: str) -> dict | None:
    """Two-step login: SEC_USERNAME (MD5) first, then HR_EMP_MASTER (plain text)."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        m        = str(username).strip()
        m_with0  = ('0' + m) if not m.startswith('0') else m
        m_no0    = m[1:]     if m.startswith('0')     else m

        # ── STEP 1: SEC_USERNAME (ERP HR admin) ──────────────────────
        # Fetch raw PASWD first (no decryption) so ORA-28817 on one user
        # doesn't kill the entire lookup. Decrypt separately afterwards.
        sec_row = None
        try:
            cur.execute("""
                SELECT USRID, DESCR, PASWD, MOBILE, ECODE, ULEVL
                FROM SEC_USERNAME
                WHERE TO_CHAR(MOBILE) IN (:m1, :m2, :m3) AND STATS = 'E'
            """, {"m1": m, "m2": m_with0, "m3": m_no0})
            sec_row = cur.fetchone()
            if not sec_row:
                cur.execute("""
                    SELECT USRID, DESCR, PASWD, MOBILE, ECODE, ULEVL
                    FROM SEC_USERNAME WHERE ECODE = :ec AND STATS = 'E'
                """, {"ec": m})
                sec_row = cur.fetchone()
        except Exception as e:
            print(f"[AUTH] SEC_USERNAME query failed: {e}")

        sec_authenticated = False
        ulevl = None
        if sec_row:
            usrid, descr, raw_paswd, sec_mobile, ecode, ulevl = sec_row
            stored_paswd = None
            try:
                cur.execute("SELECT datacrypt.decryptdata(:p) FROM DUAL", {"p": raw_paswd})
                dec_row = cur.fetchone()
                stored_paswd = str(dec_row[0]).strip() if dec_row and dec_row[0] else None
            except Exception as e:
                print(f"[AUTH] datacrypt.decryptdata failed for USRID={usrid}: {e}")
                # PASWD is stored as RAWTOHEX(plaintext)+RAWTOHEX(chr(0))+binary_suffix
                stored_paswd = _decode_sec_paswd(str(raw_paswd or ""))

            if (stored_paswd or "").strip() == (password or "").strip():
                sec_authenticated = True
            else:
                print(f"[AUTH] SEC_USERNAME found but password mismatch for {username}, trying HR_EMP_MASTER")

        if sec_authenticated:
            # SEC_USERNAME user - HR Admin with access to company/branch management
            usrid_numeric = usrid  # Keep as numeric for database queries
            emp_name = str(descr or "").strip()  # Use DESCR from SEC_USERNAME
            empcode = str(ecode or "").strip()
            card_no = None
            has_employee_features = False  # Will be set to True only if in HR_EMP_MASTER

            # Check if SEC_USERNAME user exists in HR_EMP_MASTER (necessary for employee features)
            # First try by EMPCODE
            if empcode:
                cur.execute("""
                    SELECT TO_CHAR(e.CARD_NO), h.NAME, h.EMPCODE
                    FROM HR_EMP_MASTER h
                    LEFT JOIN EMPLOYEE e ON e.EMP_NO = h.EMPCODE
                    WHERE h.EMPCODE = :ec
                """, {"ec": empcode})
                row = cur.fetchone()
                if row:
                    card_no = str(row[0]) if row[0] else None
                    # Keep emp_name from SEC_USERNAME DESCR, don't override
                    has_employee_features = True

            # If not found by EMPCODE, try by mobile in HR_EMP_MASTER
            if not has_employee_features and sec_mobile:
                mv = str(sec_mobile).strip()
                mv_w = ('0' + mv) if not mv.startswith('0') else mv
                mv_no0 = mv[1:] if mv.startswith('0') else mv
                cur.execute("""
                    SELECT TO_CHAR(e.CARD_NO), h.NAME, h.EMPCODE
                    FROM HR_EMP_MASTER h
                    LEFT JOIN EMPLOYEE e ON e.EMP_NO = h.EMPCODE
                    WHERE h."MOBILE#" IN (:mv1, :mv2, :mv3)
                """, {"mv1": mv, "mv2": mv_w, "mv3": mv_no0})
                row = cur.fetchone()
                if row:
                    card_no = str(row[0]) if row[0] else None
                    has_employee_features = True
                    if not empcode:
                        empcode = str(row[2] or "").strip()

            # Get company and branch access rights from SEC_USERCMPN and SEC_USERBRCH
            # Use a fresh cursor to ensure clean state
            companies = []
            company_list = []
            branches = []
            branch_list = []
            
            try:
                cur2 = conn.cursor()
                try:
                    cur2.execute("""
                        SELECT sc.COMPC, NVL(ci.DESCR, TO_CHAR(sc.COMPC))
                        FROM SEC_USERCMPN sc
                        LEFT JOIN COMPANY_INFO ci ON ci.COMPC = sc.COMPC
                        WHERE sc.USRID = :usrid 
                        ORDER BY sc.COMPC
                    """, {"usrid": usrid_numeric})
                    cmp_rows = cur2.fetchall()
                    companies = [str(r[0]) for r in cmp_rows]
                    company_list = [{"code": str(r[0]), "name": str(r[1] or r[0])} for r in cmp_rows]
                    print(f"[AUTH] SEC_USERCMPN query returned {len(cmp_rows)} companies for USRID={usrid_numeric}")
                finally:
                    cur2.close()
            except Exception as e:
                print(f"[AUTH] SEC_USERCMPN query failed for USRID={usrid_numeric}: {e}")
            
            try:
                cur3 = conn.cursor()
                try:
                    cur3.execute("""
                        SELECT sb.BRNCH, NVL(cl.DESCR, TO_CHAR(sb.BRNCH)), cl.COMPC
                        FROM SEC_USERBRCH sb
                        LEFT JOIN COM_LOCATION cl ON TO_CHAR(cl.LCODE) = TO_CHAR(sb.BRNCH)
                        WHERE sb.USRID = :usrid
                        ORDER BY sb.BRNCH
                    """, {"usrid": usrid_numeric})
                    brn_rows = cur3.fetchall()
                    branches = [str(r[0]) for r in brn_rows]
                    branch_list = [{"code": str(r[0]), "name": str(r[1] or r[0]),
                                    "compc": (str(r[2]).strip() if r[2] is not None else None)} for r in brn_rows]
                    print(f"[AUTH] SEC_USERBRCH query returned {len(brn_rows)} branches for USRID={usrid_numeric}")
                finally:
                    cur3.close()
            except Exception as e:
                print(f"[AUTH] SEC_USERBRCH query failed for USRID={usrid_numeric}: {e}")

            has_self_service = has_employee_features
            print(f"[AUTH] SEC_USERNAME login: usrid={usrid_numeric}, card_no={card_no}, "
                  f"has_self_service={has_self_service}, companies={len(companies)}, branches={len(branches)}")
            return {
                "card_no": card_no or username,
                "user_paswd": None,
                "emp_name": emp_name,  # From SEC_USERNAME DESCR
                "hr_admin": "Y",  # Only SEC_USERNAME users are HR admins
                "face_registered": "N",
                "empcode": empcode,
                "allowed_companies": companies,
                "allowed_branches": branches,
                "company_list": company_list,
                "branch_list": branch_list,
                "can_edit_salary": str(ulevl or "").strip().upper() == "M",
                "has_self_service": has_self_service,
                "has_employee_features": has_employee_features,  # False if not in HR_EMP_MASTER
            }

        # ── STEP 2: HR_EMP_MASTER (normal employee) ───────────────────
        # Regular employees can only access their own data, NO HR admin features
        l     = username.strip()
        l_w0  = ('0' + l) if not l.startswith('0') else l
        l_no0 = l[1:]     if l.startswith('0')     else l
        try:
            cur.execute("""
                SELECT TO_CHAR(e.CARD_NO), e.USER_PASWD, h.NAME,
                       h.EMPCODE, h."ATDTCARD#"
                FROM HR_EMP_MASTER h
                LEFT JOIN EMPLOYEE e ON e.EMP_NO = h.EMPCODE
                WHERE h."MOBILE#" IN (:l1, :l2, :l3)
                   OR h."ATDTCARD#" = :l4 OR h.EMPCODE = :l5
            """, {"l1": l, "l2": l_w0, "l3": l_no0, "l4": l, "l5": l})
            row = cur.fetchone()
            if row:
                card_no      = str(row[0]) if row[0] else (str(row[4]) if row[4] else None)
                stored_paswd = (row[1] or "").strip()
                if stored_paswd and stored_paswd != password.strip():
                    print(f"[AUTH] HR_EMP_MASTER: password mismatch for {username}")
                    return None
                print(f"[AUTH] HR_EMP_MASTER login: card_no={card_no}, emp_name={row[2]}")
                return {
                    "card_no": card_no,
                    "user_paswd": row[1],
                    "emp_name": str(row[2] or "").strip(),
                    "hr_admin": "N",  # Never Y for HR_EMP_MASTER users
                    "face_registered": "N",
                    "empcode": str(row[3] or "").strip(),
                    "allowed_companies": [],  # No company rights
                    "allowed_branches": [],   # No branch rights
                    "company_list": [],
                    "branch_list": [],
                    "has_self_service": True,
                    "has_employee_features": True,  # Can access employee modules
                }
        except Exception as e:
            print(f"[AUTH] HR_EMP_MASTER query failed: {e}")

        # Fallback: EMPLOYEE table
        try:
            cur.execute("""
                SELECT TO_CHAR(CARD_NO), USER_PASWD FROM EMPLOYEE
                WHERE TO_CHAR(CARD_NO) = :e1
                   OR TO_CHAR(MOBILE_NO) = :e1
                   OR EMP_NO = :e1
            """, {"e1": l})
            row = cur.fetchone()
            if row:
                stored_paswd = (row[1] or "").strip()
                if stored_paswd and stored_paswd != password.strip():
                    return None
                return {
                    "card_no": str(row[0]) if row[0] else l,
                    "user_paswd": row[1],
                    "emp_name": "",
                    "hr_admin": "N",
                    "face_registered": "N",
                    "empcode": "",
                    "allowed_companies": [],
                    "allowed_branches": [],
                    "company_list": [],
                    "branch_list": [],
                    "has_self_service": True,
                    "has_employee_features": True,
                }
        except Exception as e:
            print(f"[AUTH] EMPLOYEE fallback failed: {e}")

        print(f"[AUTH] No match for '{username}'")
        return None
    finally:
        cur.close()
        conn.close()


# ===============================
# AUTH — LEGACY LOOKUP
# ===============================

def get_user_by_login(login: str):
    """Find employee by searching HR_EMP_MASTER (has USER_PASWD, HR_ADMIN)
    and EMPLOYEE tables. HR_EMP_MASTER is the primary source for auth fields.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        print(f"[LOGIN] Searching for: '{login}'")

        # ---- Try HR_EMP_MASTER + EMPLOYEE join to get real CARD_NO ----
        try:
            cursor.execute("""
                SELECT TO_CHAR(e.CARD_NO), e.USER_PASWD, h.NAME,
                       NVL(h.HR_ADMIN, 'N') AS hr_admin, h.EMPCODE,
                       h."ATDTCARD#"
                FROM HR_EMP_MASTER h
                LEFT JOIN EMPLOYEE e ON e.EMP_NO = h.EMPCODE
                WHERE h."MOBILE#" = :login
                   OR h."MOBILE#" = '0' || :login
                   OR h."ATDTCARD#" = :login
                   OR h.EMPCODE = :login
            """, {"login": login})
            row = cursor.fetchone()
            if row:
                # Prefer EMPLOYEE.CARD_NO (row[0]), fallback to ATDTCARD# (row[5])
                card_no = str(row[0]) if row[0] else (str(row[5]) if row[5] else None)
                has_pwd = bool(row[1])
                print(f"[LOGIN] Found in HR_EMP_MASTER: card_no={card_no}, "
                      f"atdtcard={row[5]}, has_password={has_pwd}, hr_admin={row[3]}")
                return {
                    "card_no": card_no,
                    "user_paswd": row[1],
                    "emp_name": row[2] or "",
                    "hr_admin": str(row[3] or "N").strip().upper(),
                    "empcode": row[4] or "",
                }
        except Exception as e:
            print(f"[LOGIN] HR_EMP_MASTER query failed: {e}")

        # ---- Fallback to EMPLOYEE table ----
        cursor2 = conn.cursor()
        try:
            cursor2.execute("""
                SELECT card_no, USER_PASWD
                FROM EMPLOYEE
                WHERE TO_CHAR(MOBILE_NO) = :login
                   OR TO_CHAR(MOBILE_NO) = '0' || :login
                   OR TO_CHAR(CARD_NO) = :login
                   OR EMP_NO = :login
            """, {"login": login})
            row = cursor2.fetchone()
            if row:
                raw = row[0]
                card_no = str(raw) if raw is not None else None
                has_pwd = bool(row[1])
                print(f"[LOGIN] Found in EMPLOYEE: card_no={card_no}, has_password={has_pwd}")
                return {"card_no": card_no, "user_paswd": row[1]}
        finally:
            cursor2.close()

        print(f"[LOGIN] No employee found for '{login}'")
        return None

    finally:
        cursor.close()
        conn.close()


# Keep old name as alias so change_password still works
def get_user_by_phone(phone: str):
    return get_user_by_login(phone)


def lookup_by_phone(phone: str):
    """Return card_no and employee details for a given phone/empcode/card_no."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Try HR_EMP_MASTER + EMPLOYEE join to get real CARD_NO and details
        try:
            cursor.execute("""
                SELECT TO_CHAR(e.CARD_NO), h.NAME, h.EMPCODE, h."ATDTCARD#"
                FROM HR_EMP_MASTER h
                LEFT JOIN EMPLOYEE e ON e.EMP_NO = h.EMPCODE
                WHERE h."MOBILE#" = :login
                   OR h."MOBILE#" = '0' || :login
                   OR h."ATDTCARD#" = :login
                   OR h.EMPCODE = :login
            """, {"login": phone})
            row = cursor.fetchone()
            if row:
                card_no = str(row[0]) if row[0] else (str(row[3]) if row[3] else None)
                if card_no:
                    return {"card_no": card_no, "emp_name": row[1] or "", "empcode": row[2] or ""}
        except Exception as e:
            print(f"[LOOKUP] HR_EMP_MASTER query failed: {e}")

        # Fallback to EMPLOYEE
        cursor2 = conn.cursor()
        try:
            cursor2.execute("""
                SELECT TO_CHAR(CARD_NO), EMP_NAME, EMP_NO
                FROM EMPLOYEE
                WHERE TO_CHAR(MOBILE_NO) = :login
                   OR TO_CHAR(MOBILE_NO) = '0' || :login
                   OR TO_CHAR(CARD_NO) = :login
                   OR EMP_NO = :login
            """, {"login": phone})
            row = cursor2.fetchone()
            if row:
                card_no = str(row[0]) if row[0] is not None else None
                return {"card_no": card_no, "emp_name": row[1] or "", "empcode": row[2] or ""}
        finally:
            cursor2.close()

        return None
    finally:
        cursor.close()
        conn.close()


# ===============================
# DASHBOARD
# ===============================

def get_dashboard(card_no: str):
    """Return dashboard for an employee. Queries HR_EMP_MASTER (a real base table)
    instead of EMPLOYEE (which is a view whose internal scalar subqueries throw
    ORA-01427 for certain users). All lookups are wrapped in isolated try/except
    so any single failure logs but doesn't crash the endpoint.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Step 1: core employee record from HR_EMP_MASTER (real table, no view internals).
        # Join EMPLOYEE only for CARD_NO and a few aux fields. If the EMPLOYEE join
        # itself throws ORA-01427, fall back to HR_EMP_MASTER alone.
        row = None
        columns = []
        try:
            cursor.execute("""
                SELECT
                    h.EMPCODE                    AS emp_pk,
                    TO_CHAR(e.CARD_NO)           AS card_no,
                    h."ATDTCARD#"                AS emp_no,
                    h.NAME                       AS emp_name,
                    TO_CHAR(h.DTOFAPPT, 'YYYY-MM-DD') AS date_of_join,
                    h.NICNO                      AS nic_no,
                    TO_CHAR(h.DESG_CD)           AS designation,
                    TO_CHAR(h.DEPT_NO)           AS department,
                    h.UNIT_ID                    AS compc,
                    h.LOCATION                   AS branch,
                    h.RPT_OFFICER                AS hod
                FROM HR_EMP_MASTER h
                LEFT JOIN EMPLOYEE e ON e.EMP_NO = h.EMPCODE
                WHERE TO_CHAR(e.CARD_NO) = :card1
                   OR h."ATDTCARD#"      = :card2
                   OR h.EMPCODE          = :card3
            """, {"card1": card_no, "card2": card_no, "card3": card_no})
            row = cursor.fetchone()
            columns = [c[0].lower() for c in cursor.description]
        except Exception as e:
            print(f"[DASHBOARD] HR_EMP_MASTER + EMPLOYEE join failed for {card_no}: {e}")
            # Fallback: HR_EMP_MASTER alone (no EMPLOYEE join at all)
            try:
                cursor.execute("""
                    SELECT
                        h.EMPCODE                    AS emp_pk,
                        h."ATDTCARD#"                AS card_no,
                        h."ATDTCARD#"                AS emp_no,
                        h.NAME                       AS emp_name,
                        TO_CHAR(h.DTOFAPPT, 'YYYY-MM-DD') AS date_of_join,
                        h.NICNO                      AS nic_no,
                        TO_CHAR(h.DESG_CD)           AS designation,
                        TO_CHAR(h.DEPT_NO)           AS department,
                        h.UNIT_ID                    AS compc,
                        h.LOCATION                   AS branch,
                        h.RPT_OFFICER                AS hod
                    FROM HR_EMP_MASTER h
                    WHERE h."ATDTCARD#" = :card1 OR h.EMPCODE = :card2
                """, {"card1": card_no, "card2": card_no})
                row = cursor.fetchone()
                columns = [c[0].lower() for c in cursor.description]
            except Exception as e2:
                print(f"[DASHBOARD] HR_EMP_MASTER fallback also failed for {card_no}: {e2}")
                return None

        if not row:
            return None

        result = dict(zip(columns, row))
        if result.get('card_no') is not None:
            result['card_no'] = str(result['card_no'])
        if result.get('emp_pk') is not None:
            try:
                result['emp_pk'] = float(result['emp_pk'])
            except (ValueError, TypeError):
                result['emp_pk'] = None
        for field in ('compc', 'branch', 'hod'):
            if result.get(field) is not None:
                result[field] = str(result[field])

        # Isolated name lookups — any failure leaves the field as None
        dept_code = result.get('department')
        result['department'] = _safe_lookup_max(
            cursor, "SELECT MAX(DEPT_NAME) FROM HR_DEPT WHERE DEPT_NO = :v",
            dept_code, tag="dashboard.department"
        ) or dept_code

        desg_code = result.get('designation')
        emp_pk_val = result.get('emp_pk')
        result['designation'] = _safe_lookup_max(
            cursor, "SELECT MAX(DESIGNATION) FROM EMPLOYEE WHERE EMP_NO = :v",
            emp_pk_val, tag="dashboard.designation"
        ) or _safe_lookup_max(
            cursor, "SELECT MAX(DESIG_NAME) FROM EMPLOYEE WHERE EMP_NO = :v",
            emp_pk_val, tag="dashboard.designation2"
        ) or desg_code

        result['compcnm'] = _safe_lookup_max(
            cursor, "SELECT MAX(DESCR) FROM COMPANY_INFO WHERE COMPC = :v",
            result.get('compc'), tag="compcnm"
        )
        result['brnchnm'] = _safe_lookup_max(
            cursor, "SELECT MAX(DESCR) FROM COM_LOCATION WHERE LCODE = :v",
            result.get('branch'), tag="brnchnm"
        )
        result['hod_nm'] = _safe_lookup_max(
            cursor, "SELECT MAX(NAME) FROM HR_EMP_MASTER WHERE EMPCODE = TO_CHAR(:v)",
            result.get('hod'), tag="hod_nm"
        )

        # Leave balance — isolated, may throw if ALL_LEAVE_BAL_V internals fail
        balance = None
        try:
            cursor.execute(
                "SELECT SUM(balance) FROM ALL_LEAVE_BAL_V WHERE card_no = :c",
                {"c": card_no},
            )
            r = cursor.fetchone()
            balance = float(r[0]) if r and r[0] is not None else None
        except Exception as e:
            print(f"[DASHBOARD] balance lookup failed for {card_no}: {e}")
        result['balance'] = balance

        return result

    finally:
        cursor.close()
        conn.close()


def _safe_lookup_max(cursor, sql: str, value, tag: str = ""):
    """Run a one-row MAX() lookup with a single bind. Returns None if value is None
    or the query fails for any reason. Logs the error tag for diagnostics."""
    if value is None:
        return None
    try:
        cursor.execute(sql, {"v": value})
        r = cursor.fetchone()
        return r[0] if r and r[0] is not None else None
    except Exception as e:
        print(f"[DASHBOARD] {tag} lookup failed for value={value}: {e}")
        return None


# ===============================
# USER PROFILE
# ===============================

def get_user_profile(card_no: str):
    """Return employee profile from HR_EMP_MASTER (primary) + EMPLOYEE (card_no only).
    card_no like '100001.1' lives in EMPLOYEE.CARD_NO (numeric), not in ATDTCARD#.
    Mirror the dashboard pattern: join EMPLOYEE only for TO_CHAR(CARD_NO), fall back
    to ATDTCARD#/EMPCODE match if the join raises ORA-01427."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        row = None
        columns = []
        resolved_card_no = card_no

        # Primary attempt: join EMPLOYEE only to resolve CARD_NO — select no view-computed columns
        try:
            cursor.execute("""
                SELECT
                    h.EMPCODE,
                    h.NAME,
                    h.FHNAME,
                    TO_CHAR(e.CARD_NO)                   AS card_no,
                    h."ATDTCARD#"                        AS atdtcard,
                    h.SEX,
                    TO_CHAR(h.DTOFBRTH, 'YYYY-MM-DD')   AS DTOFBRTH,
                    TO_CHAR(h.DTOFAPPT, 'YYYY-MM-DD')   AS DTOFAPPT,
                    h.DEPT_NO,
                    h.DESG_CD,
                    h."MOBILE#",
                    h.EMAIL,
                    h.ADDRESS,
                    h.UNIT_ID,
                    h.LOCATION,
                    h.RPT_OFFICER AS HOD1,
                    NULL          AS HOD2,
                    h.STATUS,
                    h.NICNO,
                    h.BASIC,
                    h.GRADE_CD,
                    h.MARSTAT
                FROM HR_EMP_MASTER h
                LEFT JOIN EMPLOYEE e ON e.EMP_NO = h.EMPCODE
                WHERE TO_CHAR(e.CARD_NO) = :c1
                   OR h."ATDTCARD#"      = :c2
                   OR h.EMPCODE          = :c3
            """, {"c1": card_no, "c2": card_no, "c3": card_no})
            row = cursor.fetchone()
            columns = [c[0].lower() for c in cursor.description]
        except Exception as e:
            print(f"[PROFILE] join attempt failed for {card_no}: {e}")

        # Fallback: HR_EMP_MASTER alone (no EMPLOYEE join)
        if row is None:
            try:
                cursor.execute("""
                    SELECT
                        h.EMPCODE,
                        h.NAME,
                        h.FHNAME,
                        h."ATDTCARD#"                        AS card_no,
                        h."ATDTCARD#"                        AS atdtcard,
                        h.SEX,
                        TO_CHAR(h.DTOFBRTH, 'YYYY-MM-DD')   AS DTOFBRTH,
                        TO_CHAR(h.DTOFAPPT, 'YYYY-MM-DD')   AS DTOFAPPT,
                        h.DEPT_NO,
                        h.DESG_CD,
                        h."MOBILE#",
                        h.EMAIL,
                        h.ADDRESS,
                        h.UNIT_ID,
                        h.LOCATION,
                        h.RPT_OFFICER AS HOD1,
                        NULL          AS HOD2,
                        h.STATUS,
                        h.NICNO,
                        h.BASIC,
                        h.GRADE_CD,
                        h.MARSTAT
                    FROM HR_EMP_MASTER h
                    WHERE h."ATDTCARD#" = :c1 OR h.EMPCODE = :c2
                """, {"c1": card_no, "c2": card_no})
                row = cursor.fetchone()
                columns = [c[0].lower() for c in cursor.description]
            except Exception as e:
                print(f"[PROFILE] fallback failed for {card_no}: {e}")

        if row is None:
            return None

        raw = dict(zip(columns, row))
        empcode  = raw.get('empcode')
        dept_no  = raw.get('dept_no')
        desg_cd  = raw.get('desg_cd')
        resolved_card_no = raw.get('card_no') or raw.get('atdtcard') or card_no

        result = {
            'emp_pk':        empcode,
            'emp_no':        empcode,
            'emp_code':      empcode,
            'emp_name':      raw.get('name'),
            'father_name':   raw.get('fhname'),
            'card_no':       resolved_card_no,
            'gender':        raw.get('sex'),
            'date_of_birth': raw.get('dtofbrth'),
            'date_of_join':  raw.get('dtofappt'),
            'mobile_no':     raw.get('mobile#'),
            'email':         raw.get('email'),
            'email_address': raw.get('email'),
            'address':       raw.get('address'),
            'compc':         raw.get('unit_id'),
            'brnch':         raw.get('location'),
            'hod1':          raw.get('hod1'),
            'hod2':          raw.get('hod2'),
            'emp_status':    raw.get('status'),
            'nic_no':        raw.get('nicno'),
            'salary':        raw.get('basic'),
            'type':          raw.get('grade_cd'),
            'nic_exp_date':  None,
            'eobi_no':       None,
            'uic_card_no':   None,
        }

        # Isolated name lookups
        result['department'] = _safe_lookup_max(
            cursor, "SELECT MAX(DEPT_NAME) FROM HR_DEPT WHERE DEPT_NO = :v",
            dept_no, tag="profile.department"
        ) or str(dept_no or '')
        result['designation'] = _safe_lookup_max(
            cursor, "SELECT MAX(DESIGNATION) FROM EMPLOYEE WHERE EMP_NO = :v",
            empcode, tag="profile.designation"
        ) or _safe_lookup_max(
            cursor, "SELECT MAX(DESIG_NAME) FROM EMPLOYEE WHERE EMP_NO = :v",
            empcode, tag="profile.designation2"
        ) or str(desg_cd or '')
        result['compcnm'] = _safe_lookup_max(
            cursor, "SELECT MAX(DESCR) FROM COMPANY_INFO WHERE COMPC = :v",
            result.get('compc'), tag="profile.compcnm"
        )
        result['brnchnm'] = _safe_lookup_max(
            cursor, "SELECT MAX(DESCR) FROM COM_LOCATION WHERE LCODE = :v",
            result.get('brnch'), tag="profile.brnchnm"
        )
        result['hod1nm'] = _safe_lookup_max(
            cursor, "SELECT MAX(NAME) FROM HR_EMP_MASTER WHERE EMPCODE = TO_CHAR(:v)",
            result.get('hod1'), tag="profile.hod1nm"
        )
        result['hod2nm'] = _safe_lookup_max(
            cursor, "SELECT MAX(NAME) FROM HR_EMP_MASTER WHERE EMPCODE = TO_CHAR(:v)",
            result.get('hod2'), tag="profile.hod2nm"
        )

        return result

    finally:
        cursor.close()
        conn.close()


# ===============================
# LEAVE TYPES helpers
# ===============================

def _is_od_type(desc: str) -> bool:
    d = (desc or "").upper().strip()
    return (d == "OD" or d.startswith("OD ") or d.endswith(" OD") or "- OD" in d
            or "ON DUTY" in d or "OFFICIAL DUTY" in d or "OUT DOOR" in d or "OUTDOOR" in d)


def _leave_types_meta(cursor):
    """Read LEAVE_TYPES with dynamically-detected columns (the exact schema
    varies). Returns a list of {pk, code, desc, entitlement, is_od}."""
    try:
        cursor.execute("SELECT * FROM LEAVE_TYPES")
        cols = [d[0].upper() for d in cursor.description]
        rows = cursor.fetchall()
    except Exception as e:
        print(f"[LEAVE_TYPES] read failed: {e}")
        return []

    def find(*preds):
        for p in preds:
            for i, c in enumerate(cols):
                if p(c):
                    return i
        return None

    pk_i = find(lambda c: c == "LEAVE_TYPE_PK", lambda c: c.endswith("_PK"))
    desc_i = find(lambda c: "DESC" in c)
    code_i = find(
        lambda c: c in ("LEAVE_CD", "LEAVE_CODE", "TYPE_CD", "LEAVE_TYPE_CD", "CODE", "SHORT_CD"),
        lambda c: (c.endswith("CD") or "CODE" in c) and not c.endswith("_PK"),
    )
    ent_i = find(
        lambda c: "ENTITLE" in c,
        lambda c: "ALLOW" in c and "DAY" in c,
        lambda c: c in ("NO_OF_DAYS", "DAYS", "MAX_DAYS", "TOTAL_DAYS", "LEAVE_DAYS"),
    )

    out = []
    for r in rows:
        pk = r[pk_i] if pk_i is not None else None
        desc = str(r[desc_i] or "").strip() if desc_i is not None else ""
        code = str(r[code_i]).strip() if (code_i is not None and r[code_i] is not None) else None
        ent = r[ent_i] if ent_i is not None else None
        out.append({
            "pk": pk,
            "code": code,
            "desc": desc,
            "entitlement": ent,
            "is_od": _is_od_type(desc) or _is_od_type(code or ""),
        })
    return out


def _type_matches(t: dict, value) -> bool:
    """True if a LEAVE_TYPES meta row matches a client-sent type value
    (may be the code 'ML', the numeric PK, or the description)."""
    v = str(value or "").strip().upper()
    if not v:
        return False
    if t.get("code") and t["code"].upper() == v:
        return True
    if t.get("pk") is not None and str(t["pk"]).strip().upper() == v:
        return True
    if t.get("desc") and t["desc"].upper() == v:
        return True
    return False


# ===============================
# LEAVE BALANCES (mobile + web legacy endpoint)
# Merged: ALL_LEAVE_BAL_V rows + LEAVE_TYPES entries missing from the view.
# ===============================

def get_leave_balances(card_no: str):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        items = []
        try:
            cursor.execute("""
                SELECT leave_type, leave_desc, balance
                FROM ALL_LEAVE_BAL_V
                WHERE card_no = :card
            """, {"card": card_no})
            for r in cursor.fetchall():
                items.append({
                    "leave_type": r[0],
                    "leave_desc": r[1],
                    "balance": r[2],
                    "is_od": _is_od_type(str(r[1] or "")) or _is_od_type(str(r[0] or "")),
                })
        except Exception as e:
            print(f"[LEAVE_BAL] ALL_LEAVE_BAL_V query failed: {e}")

        # Merge in LEAVE_TYPES entries the view doesn't have (e.g. OD)
        types = _leave_types_meta(cursor)
        for t in types:
            matched = None
            for it in items:
                if _type_matches(t, it["leave_type"]) or (
                    t["desc"] and str(it.get("leave_desc") or "").strip().upper() == t["desc"].upper()
                ):
                    matched = it
                    break
            if matched:
                # OD is applicable irrespective of its balance number
                if t["is_od"]:
                    matched["is_od"] = True
                    if (matched.get("balance") or 0) <= 0:
                        matched["balance"] = 999
                continue
            bal = 999 if t["is_od"] else (t["entitlement"] if t["entitlement"] is not None else 0)
            items.append({
                "leave_type": t["code"] or t["pk"],
                "leave_desc": t["desc"],
                "balance": bal,
                "is_od": t["is_od"],
            })

        return items

    finally:
        cursor.close()
        conn.close()


# ===============================
# LEAVE TYPES (full LOV — web)
# ===============================

def get_leave_types(card_no: str):
    """All leave types from LEAVE_TYPES merged with balances from
    ALL_LEAVE_BAL_V. OD types get is_od=True (no balance restriction).
    Types not in the view fall back to their LEAVE_TYPES entitlement."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        balances = []  # (leave_type, leave_desc, balance)
        try:
            cursor.execute("""
                SELECT leave_type, leave_desc, balance
                FROM ALL_LEAVE_BAL_V WHERE card_no = :card
            """, {"card": card_no})
            balances = cursor.fetchall()
        except Exception as e:
            print(f"[LEAVE_TYPES] ALL_LEAVE_BAL_V query failed: {e}")

        # Only the LEAVE_TYPES LOV is offered for applying — extra rows in
        # ALL_LEAVE_BAL_V (ABSENT, SPECIAL LEAVE, contract-staff buckets, ...)
        # are informational and must NOT appear in the apply dropdown.
        types = _leave_types_meta(cursor)
        result = []

        for t in types:
            bal = None
            for b in balances:
                if _type_matches(t, b[0]) or (
                    t["desc"] and str(b[1] or "").strip().upper() == t["desc"].upper()
                ):
                    bal = b[2]
                    break
            if bal is None and t["entitlement"] is not None:
                bal = t["entitlement"]
            result.append({
                "leave_type": t["code"] or t["pk"],
                "leave_desc": t["desc"],
                "balance": bal,
                "is_od": t["is_od"],
            })

        # Fallback: if LEAVE_TYPES couldn't be read at all, use the view rows
        if not result:
            for b in balances:
                result.append({
                    "leave_type": b[0],
                    "leave_desc": b[1],
                    "balance": b[2],
                    "is_od": _is_od_type(str(b[1] or "")) or _is_od_type(str(b[0] or "")),
                })

        return result

    finally:
        cursor.close()
        conn.close()


# ===============================
# APPLY LEAVE (POST)
# ===============================

def apply_leave(card_no: str,
                leave_type,
                from_date: str,
                to_date: str,
                reason: str,
                compc: int,
                brnch: int,
                emp_name: str,
                half_day: bool = False,
                half_day_session: str = None):
    """leave_type may be the code ('ML'), the numeric PK, or the description —
    ALL_LEAVE_BAL_V.leave_type is a code string, so never force it to int
    (int('ML') / comparing 'ML' to a number caused ORA-01722)."""

    conn = get_connection()
    cursor = conn.cursor()

    # Half day forces single-day application
    if half_day:
        to_date = from_date

    d1 = datetime.strptime(from_date, "%Y-%m-%d")
    d2 = datetime.strptime(to_date, "%Y-%m-%d")
    leave_days = 0.5 if half_day else (d2 - d1).days + 1

    # Append half-day session info to reason
    if half_day:
        if half_day_session == "second":
            reason = f"{reason} [Second Half: 13:00-18:00]"
        else:
            reason = f"{reason} [First Half: 09:30-13:00]"

    raw = str(leave_type or "").strip()

    # Resolve against LEAVE_TYPES: find OD flag and the PK for LEAVE_TYPE_FK
    types = _leave_types_meta(cursor)
    sel = next((t for t in types if _type_matches(t, raw)), None)
    is_od = sel["is_od"] if sel else False
    fk_val = sel["pk"] if (sel and sel["pk"] is not None) else raw

    # Validate leave balance (skipped for OD). Match in Python against BOTH the
    # view's leave_type code AND its description — the identifier the client
    # sends comes from LEAVE_TYPES and may only line up with the view via desc.
    if not is_od:
        candidates = {raw.upper()}
        if sel:
            if sel.get("code"):
                candidates.add(sel["code"].upper())
            if sel.get("desc"):
                candidates.add(sel["desc"].upper())
            if sel.get("pk") is not None:
                candidates.add(str(sel["pk"]).strip().upper())
        try:
            cursor.execute("""
                SELECT leave_type, leave_desc, balance
                FROM ALL_LEAVE_BAL_V
                WHERE card_no = :card
            """, {"card": card_no})
            current_balance = None
            for r in cursor.fetchall():
                vals = {str(r[0] or "").strip().upper(), str(r[1] or "").strip().upper()}
                if vals & candidates:
                    current_balance = float(r[2] or 0)
                    break
            if current_balance is None:
                print(f"[LEAVE] No balance row matched type={raw!r} (candidates={candidates}) for card={card_no}")
                current_balance = 0
            if current_balance <= 0:
                cursor.close()
                conn.close()
                return {"status": "error", "message": "No remaining balance for this leave type."}
            if leave_days > current_balance:
                cursor.close()
                conn.close()
                return {
                    "status": "error",
                    "message": f"Insufficient balance. Available: {current_balance}, Requested: {leave_days}",
                }
        except Exception as e:
            print(f"[LEAVE] Balance check warning: {e}")

    hrs = 4 if half_day else 0

    insert_params = {
        "from_date": from_date,
        "to_date": to_date,
        "leave_days": leave_days,
        "emp_fk": card_no,
        "hrs": hrs,
        "leave_type_fk": fk_val,
        "reason": reason,
        "emp_name": emp_name,
        "compc": compc,
        "brnch": brnch,
    }

    # LEAVE_APPLICATION_PK has no identity/default — generate it with
    # NVL(MAX(pk),0)+1, the pattern used for every other ERP-table insert in
    # this codebase. Retry on a PK collision from concurrent applications.
    import time as _time

    def _next_pk():
        cursor.execute("SELECT NVL(MAX(LEAVE_APPLICATION_PK), 0) + 1 FROM LEAVE_APPLICATION")
        return int((cursor.fetchone() or [1])[0])

    last_err = None
    for attempt in range(3):
        try:
            insert_params["pk"] = _next_pk()
            cursor.execute("""
                INSERT INTO LEAVE_APPLICATION (
                    LEAVE_APPLICATION_PK,
                    LEAVE_DATE_FROM,
                    LEAVE_DATE_TO,
                    LEAVE_DAYS,
                    EMP_FK,
                    HRS,
                    LEAVE_TYPE_FK,
                    REASON,
                    APPROVAL_STATUS,
                    ENTRY_DATE,
                    ENTRY_BY,
                    COMPC,
                    BRNCH
                )
                VALUES (
                    :pk,
                    TO_DATE(:from_date, 'YYYY-MM-DD'),
                    TO_DATE(:to_date, 'YYYY-MM-DD'),
                    :leave_days,
                    :emp_fk,
                    :hrs,
                    :leave_type_fk,
                    :reason,
                    'PENDING',
                    SYSDATE,
                    :emp_name,
                    :compc,
                    :brnch
                )
            """, insert_params)
            conn.commit()
            return {"status": "success"}
        except Exception as e:
            conn.rollback()
            last_err = e
            # ORA-00001 = unique constraint (PK race) → recompute and retry
            if "ORA-00001" in str(e) and attempt < 2:
                _time.sleep(0.05 * (attempt + 1))
                continue
            print(f"[LEAVE] Insert failed for card={card_no}, type={raw} (fk={fk_val}): {e}")
            return {"status": "error", "message": str(e)}

    return {"status": "error", "message": str(last_err) if last_err else "Insert failed"}


# Attendance functions moved to repositories/attendance_repository.py


# ===============================
# GET LEAVE STATUS
# ===============================

def get_leave_status(card_no: str):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        card_int = card_no.split(".")[0] if "." in card_no else card_no

        # Resolve empcode too — older/ERP rows may store EMP_FK as the empcode
        empcode = ""
        try:
            cursor.execute("""
                SELECT EMPCODE FROM HR_EMP_MASTER
                WHERE TO_CHAR("ATDTCARD#") = :c1 OR TO_CHAR("ATDTCARD#") = :c2
                   OR EMPCODE = :c1
            """, {"c1": card_no, "c2": card_int})
            r = cursor.fetchone()
            if r and r[0]:
                empcode = str(r[0]).strip()
        except Exception as e:
            print(f"[LEAVE_STATUS] empcode lookup failed: {e}")

        # ERP-entered applications store EMP_FK as EMPLOYEE.EMP_PK
        emp_pk = ""
        try:
            cursor.execute("""
                SELECT EMP_PK FROM EMPLOYEE
                WHERE TO_CHAR(CARD_NO) = :c1 OR TO_CHAR(CARD_NO) = :c2
            """, {"c1": card_no, "c2": card_int})
            r = cursor.fetchone()
            if r and r[0] is not None:
                emp_pk = str(r[0]).strip()
                if emp_pk.endswith(".0"):
                    emp_pk = emp_pk[:-2]
        except Exception as e:
            print(f"[LEAVE_STATUS] emp_pk lookup failed: {e}")

        cursor.execute("""
            SELECT
                ENTRY_DATE      AS entry_date,
                LEAVE_TYPE_FK   AS leave_type,
                LEAVE_DATE_FROM AS from_date,
                LEAVE_DATE_TO   AS to_date,
                LEAVE_DAYS      AS leave_days,
                REASON          AS reason,
                APPROVAL_STATUS AS status
            FROM LEAVE_APPLICATION
            WHERE TO_CHAR(EMP_FK) IN (:c1, :c2, :c3, :c4)
            ORDER BY ENTRY_DATE DESC
        """, {
            "c1": card_no,
            "c2": card_int,
            "c3": empcode or card_no,
            "c4": emp_pk or card_no,
        })

        rows = cursor.fetchall()
        columns = [col[0].lower() for col in cursor.description]
        result = [dict(zip(columns, r)) for r in rows]

        # Map LEAVE_TYPE_FK (PK or code) to a readable description
        try:
            types = _leave_types_meta(cursor)
            for row in result:
                sel = next((t for t in types if _type_matches(t, row.get('leave_type'))), None)
                if sel:
                    row['leave_desc'] = sel['desc']
                    row['leave_type'] = sel['code'] or sel['desc'] or row['leave_type']
        except Exception as e:
            print(f"[LEAVE_STATUS] type desc mapping failed: {e}")

        # Serialize Oracle date objects to ISO string
        for row in result:
            for key in ('from_date', 'to_date', 'entry_date'):
                if row.get(key) and hasattr(row[key], 'strftime'):
                    row[key] = row[key].strftime('%Y-%m-%d')
            # Frontend expects string leave_type
            if row.get('leave_type') is not None:
                row['leave_type'] = str(row['leave_type'])

        return result

    finally:
        cursor.close()
        conn.close()


# ===============================
# UPDATE PASSWORD
# ===============================

def update_password(card_no: str, new_hash: str):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE EMPLOYEE
            SET USER_PASWD = :hash
            WHERE card_no = :card
        """, {"hash": new_hash, "card": card_no})

        conn.commit()

        return {"status": "success", "message": "Password updated"}

    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}

    finally:
        cursor.close()
        conn.close()



# Face attendance, report, and summary functions moved to repositories/attendance_repository.py