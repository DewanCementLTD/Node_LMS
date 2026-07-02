import { getDirectConnection } from "../config/database.js";

/**
 * Resolves an HR admin's company/branch (UNIT_ID/LOCATION) rights so report
 * endpoints can intersect a caller-selected compc/brnch with what the admin
 * is actually allowed to see, instead of trusting the raw query params.
 *
 * Mirrors `_get_admin_rights` / `get_user_rights` / `_resolve_filter_lists`
 * in the FastAPI LMS-Backend (routers/hrms_router.py + repositories/user_repository.py).
 */

const OUT_FORMAT_OBJECT = 4002;

const mobileVariants = (mobile) => {
  const m = String(mobile ?? "").trim();
  const withLeadingZero = m.startsWith("0") ? m : `0${m}`;
  const withoutLeadingZero = m.startsWith("0") ? m.substring(1) : m;
  return [m, withLeadingZero, withoutLeadingZero];
};

// Looks up the admin's mobile/empcode plus their own UNIT_ID/LOCATION, used both
// to resolve SEC_USERNAME rights and as a fallback if no rights are configured.
const lookupAdminIdentity = async (connection, adminCardNo) => {
  const result = await connection.execute(
    `
    SELECT
      h."MOBILE#" AS MOBILE,
      h.EMPCODE   AS EMPCODE,
      h.UNIT_ID   AS UNIT_ID,
      h.LOCATION  AS LOCATION
    FROM HR_EMP_MASTER h
    LEFT JOIN EMPLOYEE e ON e.EMPCODE = h.EMPCODE
    WHERE TO_CHAR(e.CARD_NO) = :cn1
       OR TO_CHAR(h."ATDTCARD#") = :cn2
       OR h.EMPCODE = :cn3
    `,
    { cn1: adminCardNo, cn2: adminCardNo, cn3: adminCardNo },
    { outFormat: OUT_FORMAT_OBJECT }
  );

  const row = result.rows?.[0];
  if (!row) {
    return { mobile: adminCardNo, empcode: "", ownUnitId: null, ownLocation: null };
  }

  return {
    mobile: String(row.MOBILE ?? "").trim(),
    empcode: String(row.EMPCODE ?? "").trim(),
    ownUnitId: row.UNIT_ID != null ? String(row.UNIT_ID).trim() : null,
    ownLocation: row.LOCATION != null ? String(row.LOCATION).trim() : null,
  };
};

const lookupSecUserId = async (connection, mobile, empcode) => {
  if (mobile) {
    const [m1, m2, m3] = mobileVariants(mobile);
    const result = await connection.execute(
      `SELECT USRID FROM SEC_USERNAME WHERE TO_CHAR(MOBILE) IN (:m1, :m2, :m3) AND STATS = 'E'`,
      { m1, m2, m3 },
      { outFormat: OUT_FORMAT_OBJECT }
    );
    const usrid = result.rows?.[0]?.USRID;
    if (usrid != null) return usrid;
  }

  if (empcode) {
    const result = await connection.execute(
      `SELECT USRID FROM SEC_USERNAME WHERE ECODE = :ec AND STATS = 'E'`,
      { ec: empcode },
      { outFormat: OUT_FORMAT_OBJECT }
    );
    const usrid = result.rows?.[0]?.USRID;
    if (usrid != null) return usrid;
  }

  return null;
};

const lookupUserRights = async (connection, mobile, empcode) => {
  const usrid = await lookupSecUserId(connection, mobile, empcode);
  if (usrid == null) {
    return { allowedCompanies: [], allowedBranches: [] };
  }

  const [companyRows, branchRows] = await Promise.all([
    connection.execute(
      `SELECT sc.COMPC AS COMPC FROM SEC_USERCMPN sc WHERE sc.USRID = :usrid ORDER BY sc.COMPC`,
      { usrid },
      { outFormat: OUT_FORMAT_OBJECT }
    ),
    connection.execute(
      `SELECT sb.BRNCH AS BRNCH FROM SEC_USERBRCH sb WHERE sb.USRID = :usrid ORDER BY sb.BRNCH`,
      { usrid },
      { outFormat: OUT_FORMAT_OBJECT }
    ),
  ]);

  return {
    allowedCompanies: (companyRows.rows ?? []).map((r) => String(r.COMPC)),
    allowedBranches: (branchRows.rows ?? []).map((r) => String(r.BRNCH)),
  };
};

/**
 * Returns the admin's allowed companies/branches from SEC_USERCMPN/SEC_USERBRCH.
 * If no rights are configured, falls back to the admin's own UNIT_ID/LOCATION so
 * they are always restricted to at least their own company (never "see all").
 */
export const getAdminRights = async (adminCardNo) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const { mobile, empcode, ownUnitId, ownLocation } = await lookupAdminIdentity(connection, adminCardNo);
    const { allowedCompanies, allowedBranches } = await lookupUserRights(connection, mobile, empcode);

    return {
      allowedCompanies: allowedCompanies.length ? allowedCompanies : ownUnitId ? [ownUnitId] : [],
      allowedBranches: allowedBranches.length ? allowedBranches : ownLocation ? [ownLocation] : [],
    };
  } finally {
    await connection?.close();
  }
};

/**
 * Resolves the final company/branch filter lists for an HR report query.
 * - If the admin selected a specific compc/brnch, use just that one (but only
 *   if it's within their allowed list — otherwise fall back to the allowed list).
 * - If no selection was made, use the full allowed list.
 */
export const resolveFilterLists = async (adminCardNo, compc, brnch) => {
  const { allowedCompanies, allowedBranches } = await getAdminRights(adminCardNo);

  const finalCompanies =
    compc && (!allowedCompanies.length || allowedCompanies.includes(compc)) ? [compc] : allowedCompanies;
  const finalBranches =
    brnch && (!allowedBranches.length || allowedBranches.includes(brnch)) ? [brnch] : allowedBranches;

  return { finalCompanies, finalBranches };
};
