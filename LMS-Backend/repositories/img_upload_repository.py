"""IMG_UPLOAD_TRACKING repository — employee field-image uploads from the app.

Files are stored flat under IMG_UPLOADS_ROOT (filenames are unique:
{empcode-prefix}_{yyyymmdd}_{hhmmss}_{hex8}.{ext}, same pattern the legacy
rows use); the table records the filename plus location/device metadata.

TID has no identity/sequence on this schema (legacy rows were written with
plain numbers), so inserts use MAX(TID)+1 with a retry on ORA-00001 when two
uploads race.
"""

import os
import re
import time
import uuid
from datetime import datetime

from core.database import get_connection

# Root directory for uploaded images. Sibling of EMP_DOCS (see
# document_repository) so all app-managed files live together.
UPLOADS_ROOT = os.environ.get(
    "IMG_UPLOADS_ROOT",
    r"C:\Erp_Systems\HRMS_LMS_APP\IMG_UPLOADS",
)

_SAFE_FILENAME_RE = re.compile(r"^[A-Za-z0-9._-]+$")


def safe_image_path(filename: str):
    """Absolute path for a stored image, or None if the name is unsafe/missing.
    Filenames come back from clients, so reject anything path-like."""
    name = os.path.basename(str(filename or ""))
    if not name or not _SAFE_FILENAME_RE.match(name) or name.startswith("."):
        return None
    path = os.path.join(UPLOADS_ROOT, name)
    return path if os.path.isfile(path) else None


def build_filename(empcode: str, ext: str) -> str:
    """Match the legacy naming: {empcode-int-prefix}_{date}_{time}_{hex8}.{ext}."""
    prefix = str(empcode).split(".")[0] or "emp"
    prefix = re.sub(r"[^A-Za-z0-9]", "", prefix) or "emp"
    now = datetime.now()
    return f"{prefix}_{now:%Y%m%d}_{now:%H%M%S}_{uuid.uuid4().hex[:8]}.{ext}"


def _digits_to_int(s, default=0):
    digits = re.sub(r"\D", "", str(s or ""))
    return int(digits) if digits else default


def insert_upload_record(empcode: str, mobile_no: str, filename: str, *,
                         attendance_type=None, latitude=None, longitude=None,
                         accuracy=None, location_name=None, address=None,
                         formatted_address=None, timestamp_str=None,
                         device_type=None, device_model=None, device_id=None,
                         device_info=None, app_version=None,
                         client_ip=None) -> int:
    """Insert one IMG_UPLOAD_TRACKING row; returns the new TID."""
    conn = get_connection()
    cursor = conn.cursor()

    def _clip(v, n):
        return str(v)[:n] if v is not None and str(v).strip() != "" else None

    params = {
        "empcode": _clip(empcode, 30),
        "mobile_no": _digits_to_int(mobile_no),
        "filename": _clip(filename, 255),
        "att_type": _clip(attendance_type, 100),
        "latitude": _clip(latitude, 50),
        "longitude": _clip(longitude, 50),
        "accuracy": _clip(accuracy, 100),
        "location_name": _clip(location_name, 400),
        "address": _clip(address, 100),
        "formatted_address": _clip(formatted_address, 400),
        "ts": _clip(timestamp_str, 400),
        "device_type": _clip(device_type, 50),
        "device_model": _clip(device_model, 400),
        "device_id": _clip(device_id, 400),
        "device_info": _clip(device_info, 400),
        "app_version": _clip(app_version, 400),
        "client_ip": _clip(client_ip, 50),
    }

    try:
        last_err = None
        for attempt in range(5):
            try:
                cursor.execute("""
                    INSERT INTO IMG_UPLOAD_TRACKING (
                        TID, EMPCODE, MOBILE_NO, SCREENSHOT_FILENAME,
                        ATTENDANCE_TYPE, LATITUDE, LONGITUDE, ACCURACY,
                        LOCATION_NAME, ADDRESS, FORMATTED_ADDRESS, TIMESTAMP,
                        DEVICE_TYPE, DEVICE_MODEL, DEVICE_ID, DEVICE_INFO,
                        APP_VERSION, CLIENT_IP, UPLOAD_DATE, UPLOAD_TIME
                    )
                    SELECT NVL(MAX(TID), 0) + 1, :empcode, :mobile_no, :filename,
                           :att_type, :latitude, :longitude, :accuracy,
                           :location_name, :address, :formatted_address, :ts,
                           :device_type, :device_model, :device_id, :device_info,
                           :app_version, :client_ip, SYSDATE, SYSTIMESTAMP
                    FROM IMG_UPLOAD_TRACKING
                """, params)
                conn.commit()
                break
            except Exception as e:
                last_err = e
                conn.rollback()
                if "ORA-00001" not in str(e) or attempt == 4:
                    raise
                time.sleep(0.05 * (attempt + 1))  # TID race — re-read MAX and retry
        cursor.execute(
            "SELECT MAX(TID) FROM IMG_UPLOAD_TRACKING WHERE SCREENSHOT_FILENAME = :f",
            {"f": params["filename"]},
        )
        row = cursor.fetchone()
        return int(row[0]) if row and row[0] is not None else 0
    finally:
        cursor.close()
        conn.close()


def get_upload_history(empcode: str, limit: int = 50) -> list[dict]:
    """Most recent uploads for an employee. Matches both the full dotted
    identifier the app sends ('50202309.1.2') and the bare integer prefix
    the legacy rows carry ('50202309')."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        prefix = str(empcode).split(".")[0]
        cursor.execute("""
            SELECT * FROM (
                SELECT TID, EMPCODE, TO_CHAR(MOBILE_NO), SCREENSHOT_FILENAME,
                       ATTENDANCE_TYPE, LATITUDE, LONGITUDE, ACCURACY,
                       LOCATION_NAME, ADDRESS, FORMATTED_ADDRESS,
                       TO_CHAR(NVL(UPLOAD_TIME, UPLOAD_DATE), 'YYYY-MM-DD HH24:MI:SS'),
                       DEVICE_TYPE, APP_VERSION
                FROM IMG_UPLOAD_TRACKING
                WHERE EMPCODE = :emp OR EMPCODE = :emp_prefix
                ORDER BY TID DESC
            ) WHERE ROWNUM <= :lim
        """, {"emp": str(empcode), "emp_prefix": prefix, "lim": int(limit)})
        items = []
        for r in cursor.fetchall():
            items.append({
                "tid": r[0],
                "empcode": r[1],
                "mobile_no": r[2],
                "screenshot_filename": r[3],
                "attendance_type": r[4],
                "latitude": r[5],
                "longitude": r[6],
                "accuracy": r[7],
                "location_name": r[8],
                "address": r[9],
                "formatted_address": r[10],
                "upload_time": r[11],
                "device_type": r[12],
                "app_version": r[13],
            })
        return items
    finally:
        cursor.close()
        conn.close()
