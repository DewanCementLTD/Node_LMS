import { getDirectConnection } from "../config/database.js";

export const requireHrAdmin = async (req, res, next) => {
  let connection;

  try {
    connection = await getDirectConnection();

    const { admin_card_no } = res.locals.validated.query;

    let mobile = "";
    let empcode = "";

    // -------------------------------
    // STEP 1: Lookup employee/mobile
    // -------------------------------
    try {
      const lookup = await connection.execute(
        `
        SELECT
            h."MOBILE#" AS MOBILE,
            h.EMPCODE
        FROM HR_EMP_MASTER h
        LEFT JOIN EMPLOYEE e
               ON e.EMPCODE = h.EMPCODE
        WHERE TO_CHAR(e.CARD_NO) = :cn1
           OR TO_CHAR(h."ATDTCARD#") = :cn2
           OR h.EMPCODE = :cn3
        `,
        {
          cn1: admin_card_no,
          cn2: admin_card_no,
          cn3: admin_card_no,
        },
        { outFormat: 4002 }
      );

      if (lookup.rows.length > 0) {
        mobile = String(lookup.rows[0].MOBILE ?? "").trim();
        empcode = String(lookup.rows[0].EMPCODE ?? "").trim();
      } else {
        mobile = admin_card_no;
      }
    } catch (err) {
      console.error("[HR_ADMIN] employee lookup failed:", err);
      mobile = admin_card_no;
    }

    // --------------------------------
    // STEP 2: Check by employee code
    // --------------------------------

    if (empcode) {
      const result = await connection.execute(
        `
        SELECT COUNT(*) CNT
        FROM SEC_USERNAME
        WHERE ECODE = :ec
          AND STATS='E'
        `,
        {
          ec: empcode,
        },
        { outFormat: 4002 }
      );

      if (result.rows[0].CNT > 0) {
        return next();
      }
    }

    // --------------------------------
    // STEP 3: Check by mobile number
    // --------------------------------

    const m1 = mobile;
    const m2 = mobile.startsWith("0") ? mobile : "0" + mobile;
    const m3 = mobile.startsWith("0") ? mobile.substring(1) : mobile;
    console.log("[HR_ADMIN] Checking mobile numbers:", m1, m2, m3);
    const result = await connection.execute(
      `
      SELECT COUNT(*) CNT
      FROM SEC_USERNAME
      WHERE TO_CHAR(MOBILE) IN (:m1,:m2,:m3)
        AND STATS='E'
      `,
      {
        m1,
        m2,
        m3,
      },
      { outFormat: 4002 }
    );

    if (result.rows[0].CNT > 0) {
      return next();
    }

    return res.status(403).json({
      detail: "HR admin access required",
    });
  } catch (err) {
    next(err);
  } finally {
    await connection?.close();
  }
};