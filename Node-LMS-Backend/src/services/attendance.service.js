/**
 * Attendance service — smart check-in / check-out logic.
 *
 * Direct port of the FastAPI LMS-Backend (services/attendance_service.py +
 * repositories/attendance_repository.py). Reads and writes attendance ONLY via
 * ATTENDANCE_RECORDS — DUTY_ROSTER is ERP-owned and never touched here, so late/
 * overtime/absent/shift are reported as 0/empty (same as FastAPI).
 *
 * Smart logic (IN = earliest mark, OUT = latest mark):
 *   1. No record / no IN yet → CHECK IN  (sets ENTRY_TIME)
 *   2. Has an IN             → CHECK OUT (extends EXIT_TIME to this latest mark)
 */

import oracledb from 'oracledb';
import { getDirectConnection } from '../config/database.js';
import { cardInt } from '../utils/conversionHelpers.js';
import { saveAttendanceOriginPoint } from './location.service.js';

const OBJ = { outFormat: oracledb.OUT_FORMAT_OBJECT };

// ---------------------------------------------------------------------------
// Small helpers (mirror _now_hhmm / _btrunc / _hhmm_to_min / _later_hhmm / ...)
// ---------------------------------------------------------------------------

/** Current time as HH:MI (24h) string, using app-server local time. */
const nowHHMM = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Truncate a string so its UTF-8 encoding fits in maxBytes (Oracle VARCHAR2
 *  columns are sized in BYTES), dropping any trailing partial multibyte char. */
const btrunc = (s, maxBytes) => {
  if (s === null || s === undefined) return null;
  const buf = Buffer.from(String(s), 'utf-8').subarray(0, maxBytes);
  return new TextDecoder('utf-8', { fatal: false }).decode(buf);
};

/** Minutes-since-midnight for an "HH:MI" string, or null. */
const hhmmToMin = (s) => {
  try {
    const [h, m] = String(s).trim().slice(0, 5).split(':');
    const hi = parseInt(h, 10);
    const mi = parseInt(m, 10);
    if (Number.isNaN(hi) || Number.isNaN(mi)) return null;
    return hi * 60 + mi;
  } catch {
    return null;
  }
};

/** Return whichever of two "HH:MI" strings is the later time of day. */
const laterHHMM = (a, b) => {
  const ma = hhmmToMin(a);
  const mb = hhmmToMin(b);
  if (ma === null) return b;
  if (mb === null) return a;
  return ma >= mb ? a : b;
};

/** Minutes between two HH:MI strings (never negative). */
const timeSpentMinutes = (entry, exit_) => {
  const e = hhmmToMin(entry);
  const x = hhmmToMin(exit_);
  if (e === null || x === null) return 0;
  return Math.max(x - e, 0);
};

// Transient DB errors that should be retried rather than dropped: MAX(PK)+1 id
// races (unique-violation) on concurrent check-ins, plus deadlock/serialization.
const TRANSIENT_DB_ERRORS = ['ORA-00001', 'ORA-00060', 'ORA-08177'];

const isTransientDbError = (err) => {
  const msg = String(err?.message ?? err);
  return TRANSIENT_DB_ERRORS.some((code) => msg.includes(code));
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Run fn(); on a transient DB error retry a few times with a small backoff.
 *  Re-throws on the last try or on a non-transient error. */
const runWithRetry = async (fn, attempts = 5, what = '') => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (!isTransientDbError(e) || i === attempts - 1) throw e;
      console.log(
        `[ATTENDANCE] transient error${what ? ' on ' + what : ''}, retry ${i + 1}/${attempts}: ${e.message ?? e}`,
      );
      await sleep(50 * (i + 1));
    }
  }
};

// ---------------------------------------------------------------------------
// DB layer (mirror attendance_repository.py)
// ---------------------------------------------------------------------------

/** Today's ATTENDANCE_RECORDS row for this card, or null. */
const getTodayRecord = async (card_no) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const result = await connection.execute(
      `
      SELECT ID              AS "id",
             ENTRY_TIME       AS "entry_time",
             EXIT_TIME        AS "exit_time",
             TO_CHAR(CARD_NO) AS "card_no"
      FROM ATTENDANCE_RECORDS
      WHERE (TO_CHAR(CARD_NO) = :card OR TO_CHAR(CARD_NO) = :card_int)
        AND TRUNC(ATTENDANCE_DATE) = TRUNC(SYSDATE)
      ORDER BY ID DESC
      `,
      { card: card_no, card_int: cardInt(card_no) },
      OBJ,
    );
    const row = result.rows?.[0];
    if (!row) return null;
    return {
      id: row.id,
      entry_time: (row.entry_time ?? '').trim(),
      exit_time: (row.exit_time ?? '').trim(),
      card_no: row.card_no ?? card_no,
      source: 'attendance_records',
    };
  } finally {
    await connection?.close();
  }
};

/** Look up EMPCODE for a CARD_NO from EMPLOYEE, falling back to the card itself. */
const getEmpcode = async (card_no) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const result = await connection.execute(
      `SELECT EMPCODE AS "empcode" FROM EMPLOYEE
       WHERE TO_CHAR(CARD_NO) = :card OR TO_CHAR(CARD_NO) = :card_int`,
      { card: card_no, card_int: cardInt(card_no) },
      OBJ,
    );
    const row = result.rows?.[0];
    return row ? row.empcode : card_no;
  } finally {
    await connection?.close();
  }
};

/**
 * Upsert today's ATTENDANCE_RECORDS row (the app's only attendance store).
 * MERGE prevents duplicate rows for the same card/day and keeps the EARLIEST
 * mark as ENTRY_TIME. Best-effort: a MERGE failure is logged, not fatal.
 */
const insertCheckIn = async (card_no, empcode, opts = {}) => {
  const {
    latitude = null,
    longitude = null,
    accuracy = null,
    address = null,
    formatted_address = null,
    timestamp = null,
    device_id = null,
    device_model = null,
    app_version = null,
    attendance_type = 'check_in',
  } = opts;

  let connection;
  try {
    connection = await getDirectConnection();
    const now = nowHHMM();

    const params = {
      empcode,
      card_no,
      entry_time: now,
      att_type: attendance_type,
      latitude: latitude ? String(latitude) : null,
      longitude: longitude ? String(longitude) : null,
      accuracy: accuracy ? String(accuracy) : null,
      address: address ? btrunc(address, 100) : null,
      formatted_address: formatted_address ? btrunc(formatted_address, 400) : null,
      ts: timestamp ? btrunc(timestamp, 400) : null,
      device_id: device_id ? btrunc(device_id, 400) : null,
      device_model: device_model ? btrunc(device_model, 400) : null,
      app_version: app_version ? btrunc(app_version, 400) : null,
    };

    try {
      await runWithRetry(
        () =>
          connection.execute(
            `
            MERGE INTO ATTENDANCE_RECORDS ar
            USING (SELECT :card_no AS cno, TRUNC(SYSDATE) AS adate FROM DUAL) src
            ON (ar.CARD_NO = src.cno
                AND TRUNC(ar.ATTENDANCE_DATE) = src.adate
                AND ar.EXIT_TIME IS NULL)
            WHEN MATCHED THEN
                UPDATE SET ar.ENTRY_TIME        = CASE
                               WHEN ar.ENTRY_TIME IS NULL THEN :entry_time
                               WHEN :entry_time < ar.ENTRY_TIME THEN :entry_time
                               ELSE ar.ENTRY_TIME END,
                           ar.ATTENDANCE_TYPE   = :att_type,
                           ar.LATITUDE          = :latitude,
                           ar.LONGITUDE         = :longitude,
                           ar.ACCURACY          = :accuracy,
                           ar.ADDRESS           = :address,
                           ar.FORMATTED_ADDRESS = :formatted_address,
                           ar.TIMESTAMP         = :ts,
                           ar.DEVICE_ID         = :device_id,
                           ar.DEVICE_MODEL      = :device_model,
                           ar.APP_VERSION       = :app_version
            WHEN NOT MATCHED THEN
                INSERT (EMPCODE, CARD_NO, ENTRY_TIME,
                        ATTENDANCE_DATE, ATTENDANCE_TYPE,
                        LATITUDE, LONGITUDE, ACCURACY,
                        ADDRESS, FORMATTED_ADDRESS,
                        TIMESTAMP, DEVICE_ID, DEVICE_MODEL,
                        APP_VERSION)
                VALUES (
                    :empcode, :card_no, :entry_time,
                    TRUNC(SYSDATE), :att_type,
                    :latitude, :longitude, :accuracy,
                    :address, :formatted_address,
                    :ts, :device_id, :device_model,
                    :app_version
                )
            `,
            params,
            { autoCommit: false },
          ),
        5,
        'ATTENDANCE_RECORDS',
      );
    } catch (arErr) {
      console.log(`[ATTENDANCE_RECORDS] MERGE failed (non-fatal): ${arErr.message ?? arErr}`);
    }

    await connection.commit();

    // LOCATION_TRACKS — record the marking location as the day's first track
    // point. Best-effort: any failure here must not affect the attendance result.
    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      try {
        await saveAttendanceOriginPoint(card_no, latitude, longitude, accuracy);
      } catch (locErr) {
        console.log(`[CHECK_IN] LOCATION_TRACKS origin point failed (non-fatal): ${locErr.message ?? locErr}`);
      }
    }

    return {
      status: 'success',
      message: 'Checked in successfully',
      action: 'check_in',
      marked_at: now,
      location_verified: latitude !== null && latitude !== undefined,
    };
  } catch (e) {
    try {
      await connection?.rollback();
    } catch {
      /* ignore */
    }
    console.log(`[CHECK_IN] Fatal error for card=${card_no}: ${e.message ?? e}`);
    return { status: 'error', message: String(e.message ?? e) };
  } finally {
    await connection?.close();
  }
};

/**
 * Extend today's row's EXIT_TIME to the LATEST mark; ENTRY_TIME stays earliest.
 * The check-out location is stored in the dedicated CHECKOUT_* columns, only
 * overwritten when the latest mark actually carries a location.
 */
const updateCheckOut = async (recordId, entryTime, opts = {}) => {
  const {
    current_out = null,
    checkout_lat = null,
    checkout_long = null,
    checkout_address = null,
  } = opts;

  let connection;
  try {
    connection = await getDirectConnection();
    const now = nowHHMM();
    const outTime = laterHHMM(now, current_out);
    const spent = timeSpentMinutes(entryTime, outTime);

    const params = { exit_time: outTime, time_spent: spent, rid: recordId };
    let locSet = '';
    if (checkout_lat !== null || checkout_long !== null || checkout_address !== null) {
      params.co_lat = checkout_lat !== null && checkout_lat !== undefined ? String(checkout_lat) : null;
      params.co_long = checkout_long !== null && checkout_long !== undefined ? String(checkout_long) : null;
      params.co_addr = checkout_address ? btrunc(checkout_address, 400) : null;
      locSet =
        ',\n                CHECKOUT_LATS    = :co_lat,' +
        '\n                CHECKOUT_LONGS   = :co_long,' +
        '\n                CHECKOUT_ADDRESS = :co_addr';
    }

    await runWithRetry(
      () =>
        connection.execute(
          `
          UPDATE ATTENDANCE_RECORDS
          SET EXIT_TIME  = :exit_time,
              TIME_SPENT = :time_spent${locSet}
          WHERE ID = :rid
          `,
          params,
          { autoCommit: false },
        ),
      5,
      'ATTENDANCE_RECORDS checkout',
    );

    await connection.commit();
    return {
      status: 'success',
      message: `Checked out successfully (${spent} min)`,
      action: 'check_out',
      marked_at: outTime,
      time_spent: spent,
      location_verified: true,
    };
  } catch (e) {
    try {
      await connection?.rollback();
    } catch {
      /* ignore */
    }
    return { status: 'error', message: String(e.message ?? e) };
  } finally {
    await connection?.close();
  }
};

// ---------------------------------------------------------------------------
// Smart attendance (mirror smart_mark_attendance)
// ---------------------------------------------------------------------------

export const smartMarkAttendance = async (card_no, attendance_type = 'check_in', opts = {}) => {
  const record = await getTodayRecord(card_no);

  const checkInOpts = {
    latitude: opts.latitude,
    longitude: opts.longitude,
    accuracy: opts.accuracy,
    address: opts.address,
    formatted_address: opts.formatted_address,
    timestamp: opts.timestamp,
    device_id: opts.device_id,
    device_model: opts.device_model,
    app_version: opts.app_version,
    attendance_type,
  };

  if (record === null) {
    console.log(`[ATTENDANCE] card=${card_no} → no record today, checking in`);
    const empcode = await getEmpcode(card_no);
    return insertCheckIn(card_no, empcode, checkInOpts);
  }

  const entry = record.entry_time; // "" when ENTRY_TIME is NULL in DB
  const exit_ = record.exit_time; // "" when EXIT_TIME is NULL in DB

  if (entry) {
    // Already has an IN → this (later) mark becomes/extends the check-out.
    console.log(
      `[ATTENDANCE] card=${card_no} → has entry (${entry}, out=${exit_ || '-'}), updating check-out`,
    );
    const coAddr = opts.formatted_address || opts.address || null;
    return updateCheckOut(record.id, entry, {
      current_out: exit_ || null,
      checkout_lat: opts.latitude,
      checkout_long: opts.longitude,
      checkout_address: coAddr,
    });
  }

  // Row exists but ENTRY_TIME empty (pre-generated roster row, no clock-in yet).
  console.log(`[ATTENDANCE] card=${card_no} → row exists but no ENTRY_TIME, checking in`);
  const empcode = await getEmpcode(card_no);
  return insertCheckIn(card_no, empcode, checkInOpts);
};

// ---------------------------------------------------------------------------
// Reports (mirror get_attendance_report / _range / _summary)
// ---------------------------------------------------------------------------

// Single-day report accepts either ISO 'YYYY-MM-DD' (e.g. '2026-06-29') or the
// ORDS-style 'DD-MON-YYYY' (e.g. '9-feb-2026') the Flutter client may send.
// Returns the matching Oracle TO_DATE(...) expression for the :dt bind so the
// same date_str the FastAPI backend accepts keeps working here — plus ISO.
const dateExprFor = (date_str) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(date_str).trim())
    ? "TO_DATE(:dt, 'YYYY-MM-DD')"
    : "TO_DATE(:dt, 'DD-MON-YYYY', 'NLS_DATE_LANGUAGE=ENGLISH')";

/** Single-day report. date_str: ISO 'YYYY-MM-DD' or ORDS-style 'DD-MON-YYYY'. */
export const getAttendanceReport = async (card_no, date_str) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const result = await connection.execute(
      `
      SELECT
          TO_CHAR(TRUNC(ATTENDANCE_DATE), 'YYYY-MM-DD') AS "roster_date",
          ENTRY_TIME                      AS "in_time",
          EXIT_TIME                       AS "out_time",
          'G'                             AS "roster_shift",
          0                               AS "absent_days",
          CASE WHEN ENTRY_TIME IS NOT NULL THEN 'Present' ELSE 'Absent' END AS "status",
          FLOOR(NVL(TIME_SPENT, 0) / 60)  AS "w_hrs",
          MOD(NVL(TIME_SPENT, 0), 60)     AS "w_mnt",
          0                               AS "late_hrs",
          0                               AS "late_mnt",
          0                               AS "ot_hrs",
          0                               AS "ot_mnt",
          CAST(NULL AS VARCHAR2(200))     AS "roster_remarks",
          CAST(NULL AS VARCHAR2(20))      AS "day_name"
      FROM ATTENDANCE_RECORDS
      WHERE (TO_CHAR(CARD_NO) = :card OR TO_CHAR(CARD_NO) = :card_int)
        AND TRUNC(ATTENDANCE_DATE) = ${dateExprFor(date_str)}
      `,
      { card: card_no, card_int: cardInt(card_no), dt: date_str },
      OBJ,
    );
    return result.rows ?? [];
  } catch (e) {
    if (String(e.message ?? e).includes('ORA-00942')) return [];
    throw e;
  } finally {
    await connection?.close();
  }
};

/** Bulk date-range report. from_date/to_date: 'YYYY-MM-DD'. One row per day. */
export const getAttendanceReportRange = async (card_no, from_date, to_date) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const result = await connection.execute(
      `
      SELECT
          TO_CHAR(TRUNC(ATTENDANCE_DATE), 'YYYY-MM-DD') AS "roster_date",
          MIN(ENTRY_TIME)                 AS "in_time",
          MAX(EXIT_TIME)                  AS "out_time",
          'G'                             AS "roster_shift",
          0                               AS "absent_days",
          CASE
              WHEN MIN(ENTRY_TIME) IS NOT NULL THEN 'Present'
              ELSE 'Absent'
          END                             AS "status",
          CASE WHEN MAX(TIME_SPENT) IS NOT NULL
               THEN FLOOR(MAX(TIME_SPENT) / 60) ELSE 0
          END                             AS "w_hrs",
          CASE WHEN MAX(TIME_SPENT) IS NOT NULL
               THEN MOD(MAX(TIME_SPENT), 60) ELSE 0
          END                             AS "w_mnt",
          0                               AS "late_hrs",
          0                               AS "late_mnt",
          0                               AS "ot_hrs",
          0                               AS "ot_mnt",
          MAX(ADDRESS)                    AS "roster_remarks",
          CAST(NULL AS VARCHAR2(20))      AS "day_name"
      FROM ATTENDANCE_RECORDS
      WHERE (TO_CHAR(CARD_NO) = :card OR TO_CHAR(CARD_NO) = :card_int
             OR TO_CHAR(EMPCODE) = :card OR TO_CHAR(EMPCODE) = :card_int)
        AND TRUNC(ATTENDANCE_DATE) BETWEEN
            TO_DATE(:from_d, 'YYYY-MM-DD') AND TO_DATE(:to_d, 'YYYY-MM-DD')
      GROUP BY TRUNC(ATTENDANCE_DATE)
      ORDER BY TRUNC(ATTENDANCE_DATE)
      `,
      { card: card_no, card_int: cardInt(card_no), from_d: from_date, to_d: to_date },
      OBJ,
    );
    return result.rows ?? [];
  } catch (e) {
    if (String(e.message ?? e).includes('ORA-00942')) return [];
    throw e;
  } finally {
    await connection?.close();
  }
};

/** Aggregated stats for a date range. from_date/to_date: 'YYYY-MM-DD'. */
export const getAttendanceSummary = async (card_no, from_date, to_date) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const result = await connection.execute(
      `
      SELECT
          COUNT(*)                                                     AS "total_days",
          SUM(CASE WHEN ENTRY_TIME IS NOT NULL
                        AND EXIT_TIME IS NOT NULL THEN 1 ELSE 0 END)  AS "present",
          SUM(CASE WHEN ENTRY_TIME IS NOT NULL
                        AND EXIT_TIME IS NULL THEN 1 ELSE 0 END)      AS "incomplete",
          NVL(SUM(NVL(TIME_SPENT, 0)), 0)                              AS "total_minutes",
          0                                                            AS "late_minutes",
          0                                                            AS "overtime_minutes",
          0                                                            AS "absent_days"
      FROM ATTENDANCE_RECORDS
      WHERE (TO_CHAR(CARD_NO) = :card OR TO_CHAR(CARD_NO) = :card_int
             OR TO_CHAR(EMPCODE) = :card OR TO_CHAR(EMPCODE) = :card_int)
        AND TRUNC(ATTENDANCE_DATE) BETWEEN
            TO_DATE(:from_d, 'YYYY-MM-DD') AND TO_DATE(:to_d, 'YYYY-MM-DD')
      `,
      { card: card_no, card_int: cardInt(card_no), from_d: from_date, to_d: to_date },
      OBJ,
    );
    return result.rows?.[0] ?? {};
  } catch (e) {
    if (String(e.message ?? e).includes('ORA-00942')) return {};
    throw e;
  } finally {
    await connection?.close();
  }
};
