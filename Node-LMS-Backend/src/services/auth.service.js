import { ca } from 'zod/v4/locales';
import { getDirectConnection } from '../config/database.js';

export const authenticateUser = async (username, password) => {
  let connection;
  try {
    connection = await getDirectConnection();

    // Match on mobile, attendance-card, or empcode
    const userSql = `
      SELECT
        h.EMPCODE            AS "empcode",
        TO_CHAR(e.CARD_NO)   AS "card_no",
        h.NAME               AS "emp_name",
        h.HR_ADMIN           AS "hr_admin",
        h.UNIT_ID            AS "unit_id"
      FROM HR_EMP_MASTER h
      LEFT JOIN EMPLOYEE e ON e.EMPCODE = h.EMPCODE
      WHERE (h."MOBILE#" = :username OR h."ATDTCARD#" = :username OR h.EMPCODE = :username)
        AND h.USER_PASWD = :password
        AND ROWNUM = 1
    `;
    const userRow = (
      await connection.execute(userSql, { username, password }, { outFormat: 4002 })
    ).rows?.[0];

    if (!userRow) return null;

    const { empcode, card_no } = userRow;

    // Check face registration
    const faceRow = (
      await connection.execute(
        `SELECT COUNT(*) AS cnt FROM EMP_FACE_EMBEDDINGS WHERE EMPCODE = :empcode AND IS_ACTIVE = 'Y'`,
        { empcode },
        { outFormat: 4002 }
      )
    ).rows?.[0];
    const face_registered = Number(faceRow?.cnt ?? 0) > 0;

    // Resolve SEC user ID for company / branch lookups
    const secRow = (
      await connection.execute(
        `SELECT USRID FROM SEC_USERNAME WHERE ECODE = :empcode AND ROWNUM = 1`,
        { empcode },
        { outFormat: 4002 }
      )
    ).rows?.[0];
    const usrid = secRow?.usrid ?? null;

    let company_list = [];
    let branch_list = [];

    if (usrid) {
      company_list = (
        await connection.execute(
          `SELECT sc.COMPC AS compc, ci.DESCR AS name
           FROM SEC_USERCMPN sc
           LEFT JOIN COMPANY_INFO ci ON TO_CHAR(ci.COMPC) = sc.COMPC
           WHERE sc.USRID = :usrid`,
          { usrid },
          { outFormat: 4002 }
        )
      ).rows ?? [];

      branch_list = (
        await connection.execute(
          `SELECT sb.BRNCH AS brnch, cl.DESCR AS name
           FROM SEC_USERBRCH sb
           LEFT JOIN COM_LOCATION cl ON TO_CHAR(cl.LCODE) = sb.BRNCH
           WHERE sb.USRID = :usrid`,
          { usrid },
          { outFormat: 4002 }
        )
      ).rows ?? [];
    }

    return {
      status: 'SUCCESS',
      card_no,
      emp_name: userRow.emp_name,
      face_registered,
      hr_admin: userRow.hr_admin === 'Y',
      has_self_service: true,
      has_employee_features: true,
      allowed_companies: company_list.map(c => c.compc),
      allowed_branches: branch_list.map(b => b.brnch),
      company_list,
      branch_list,
      can_edit_salary: false,
    };
  } finally {
    await connection?.close();
  }
};

export const getProfile = async (card_no) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      SELECT
        h.NAME                                     AS "emp_name",
        -- h.USER_PASWD                               AS "password",
        d.DEPT_NAME                                AS "department",
        dg.DESG_DESC                               AS "designation",
        h.EMAIL                                    AS "email_address",
        h."MOBILE#"                                AS "mobile_no",
        TO_CHAR(h.DTOFBRTH, 'YYYY-MM-DD')          AS "date_of_birth",
        TO_CHAR(h.DTOFAPPT, 'YYYY-MM-DD')          AS "date_of_join",
        h.FHNAME                                   AS "father_name",
        h.NICNO                                    AS "nic_no"
      FROM HR_EMP_MASTER h
      LEFT JOIN EMPLOYEE    e  ON e.EMPCODE   = h.EMPCODE
      LEFT JOIN HR_DEPT     d  ON d.DEPT_NO   = h.DEPT_NO  AND TO_CHAR(d.COMPC) = TO_CHAR(h.UNIT_ID)
      LEFT JOIN HR_DESG     dg ON dg.DESG_CD  = h.DESG_CD  AND TO_CHAR(dg.COMPC) = TO_CHAR(h.UNIT_ID)
      WHERE TO_CHAR(e.CARD_NO) = :card_no
         OR h."ATDTCARD#"      = :card_no
         OR h.EMPCODE          = :card_no
      FETCH FIRST 1 ROWS ONLY
    `;
    const result = await connection.execute(sql, { card_no }, { outFormat: 4002 });
    return result.rows?.[0] ?? null;
  } finally {
    await connection?.close();
  }
};

export const lookupByPhone = async (phone) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      SELECT
        h.EMPCODE           AS "empcode",
        TO_CHAR(e.CARD_NO)  AS "card_no",
        h.NAME              AS "emp_name",
        h."MOBILE#"         AS "mobile_no"
      FROM HR_EMP_MASTER h
      LEFT JOIN EMPLOYEE e ON e.EMPCODE = h.EMPCODE
      WHERE h."MOBILE#" = :phone
      FETCH FIRST 1 ROWS ONLY
    `;
    const result = await connection.execute(sql, { phone }, { outFormat: 4002 });
    return result.rows?.[0] ?? null;
  } finally {
    await connection?.close();
  }
};

export const changePassword = async (card_no, old_password, new_password) => {
  let connection;
  try {
    connection = await getDirectConnection();

    // Verify old password against the matched employee
    const checkSql = `
    SELECT h.EMPCODE FROM HR_EMP_MASTER h
    LEFT JOIN EMPLOYEE e ON e.EMPCODE = h.EMPCODE
    WHERE (TO_CHAR(e.CARD_NO) = :card_no OR h."ATDTCARD#" = :card_no OR h.EMPCODE = :card_no)
      AND (h.USER_PASWD = :old_password OR h.USER_PASWD Is NUll)
      FETCH FIRST 1 ROWS ONLY
    `;
      const checkRow = (
        await connection.execute(checkSql, { card_no, old_password }, { outFormat: 4002 })
      ).rows?.[0];
      
      if (!checkRow) return { success: false };
        
    await connection.execute(
      `UPDATE HR_EMP_MASTER SET USER_PASWD = :new_password WHERE EMPCODE = :empcode`,
      { new_password, empcode: checkRow.EMPCODE },
      { autoCommit: true }
    );
    return { success: true };
  } catch (err) {
    console.error('Error in changePassword:', err);
    throw err;
  }
   finally {
    await connection?.close();
  }
};
