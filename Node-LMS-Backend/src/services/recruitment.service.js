import oracledb from "oracledb";
import { getDirectConnection } from "../config/database.js";
import { resolveFilterLists } from "./adminRights.service.js";

const rToInt = (v) => {
  const num = parseInt(v, 10);
  return isNaN(num) ? null : num;
};

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

export const lowerKeys = (obj) => {
  if (Array.isArray(obj)) return obj.map(lowerKeys);
  if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k.toLowerCase(), lowerKeys(v)])
    );
  }
  return obj;
};

const _jobScopeFilter = (params, compc, brnch, alias = "j") => {
  const parts = [];
  const cnums = (Array.isArray(compc) ? compc : [compc]).map(rToInt).filter((n) => n !== null);
  const bnums = (Array.isArray(brnch) ? brnch : [brnch]).map(rToInt).filter((n) => n !== null);

  if (cnums.length > 0) {
    const ph = cnums.map((_, i) => `:jc${i}`).join(", ");
    parts.push(`${alias}.COMPC IN (${ph})`);
    cnums.forEach((n, i) => {
      params[`jc${i}`] = n;
    });
  }
  if (bnums.length > 0) {
    const ph = bnums.map((_, i) => `:jb${i}`).join(", ");
    parts.push(`(${alias}.BRNCH IN (${ph}) OR ${alias}.BRNCH IS NULL)`);
    bnums.forEach((n, i) => {
      params[`jb${i}`] = n;
    });
  }
  return parts.length > 0 ? " AND " + parts.join(" AND ") : "";
};

const _scopedList = async (connection, sqlWithPlaceholder, baseConditions, baseParams, compc, brnch) => {
  const baseWhere = baseConditions.length > 0 ? "WHERE " + baseConditions.join(" AND ") : "";
  const scopedParams = { ...baseParams };
  const scope = _jobScopeFilter(scopedParams, compc, brnch);

  const _run = async (where, params) => {
    const finalSql = sqlWithPlaceholder.replace("__WHERE__", where);
    const result = await connection.execute(finalSql, params, { outFormat: 4002 });
    return result.rows || [];
  };

  if (scope) {
    const where = baseWhere ? baseWhere + scope : "WHERE 1=1" + scope;
    try {
      return await _run(where, scopedParams);
    } catch (e) {
      if (!e.message.includes("ORA-00904")) throw e;
      console.warn(`[RECRUITMENT] COMPC/BRNCH absent, listing unscoped: ${e.message}`);
    }
  }
  return await _run(baseWhere, baseParams);
};

// ------------------------------------------------------------------
// JOBS
// ------------------------------------------------------------------

export const createJob = async (data, createdBy, compc = null, brnch = null) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const cval = rToInt(compc);
    const bval = rToInt(brnch);

    const base = {
      job_title: data.job_title,
      dept_no: data.dept_no,
      open_positions: data.open_positions || 1,
      job_desc: data.job_desc,
      skills_req: data.skills_req,
      created_by: createdBy,
      employment_type: data.employment_type,
      work_mode: data.work_mode,
      nice_to_have_skills: data.nice_to_have_skills,
      min_experience_years: rToInt(data.min_experience_years),
      education_req: data.education_req,
      salary_min: data.salary_min,
      salary_max: data.salary_max,
      compc: cval,
      brnch: bval,
    };

    const sql = `
      INSERT INTO RECRUITMENT_JOBS (
          JOB_ID, JOB_TITLE, DEPT_NO, OPEN_POSITIONS, JOB_DESC, SKILLS_REQ,
          EMPLOYMENT_TYPE, WORK_MODE, NICE_TO_HAVE_SKILLS, MIN_EXPERIENCE_YEARS,
          EDUCATION_REQ, SALARY_MIN, SALARY_MAX, STATUS, CREATED_BY, CREATED_AT, UPDATED_AT,
          COMPC, BRNCH
      ) VALUES (
          RECRUITMENT_JOBS_SEQ.NEXTVAL, :job_title, :dept_no, :open_positions,
          :job_desc, :skills_req, :employment_type, :work_mode, :nice_to_have_skills,
          :min_experience_years, :education_req, :salary_min, :salary_max, 'OPEN', :created_by,
          SYSDATE, SYSDATE, :compc, :brnch
      )
    `;

    await connection.execute(sql, base, { autoCommit: true });
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err.message };
  } finally {
    await connection?.close();
  }
};

export const listJobs = async (status = null, compc = null, brnch = null) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const params = {};
    const conds = [];
    if (status) {
      conds.push("j.STATUS = :status");
      params.status = status;
    }

    const sql = `
      SELECT
          j.JOB_ID,
          j.JOB_TITLE,
          j.DEPT_NO,
          NVL(d.DEPT_NAME, TO_CHAR(j.DEPT_NO)) AS DEPT_NAME,
          j.OPEN_POSITIONS,
          (SELECT COUNT(*) FROM RECRUITMENT_OFFERS o
            JOIN RECRUITMENT_APPLICATIONS a2 ON a2.APP_ID = o.APP_ID
            WHERE a2.JOB_ID = j.JOB_ID AND o.STATUS = 'ACCEPTED') AS FILLED_POSITIONS,
          j.JOB_DESC,
          j.SKILLS_REQ,
          j.EMPLOYMENT_TYPE,
          j.WORK_MODE,
          j.NICE_TO_HAVE_SKILLS,
          j.MIN_EXPERIENCE_YEARS,
          j.EDUCATION_REQ,
          j.SALARY_MIN,
          j.SALARY_MAX,
          j.STATUS,
          j.CREATED_BY,
          TO_CHAR(j.CREATED_AT, 'YYYY-MM-DD') AS CREATED_AT
      FROM RECRUITMENT_JOBS j
      LEFT JOIN HR_DEPT d ON TO_CHAR(d.DEPT_NO) = TO_CHAR(j.DEPT_NO) AND TO_CHAR(d.COMPC) = TO_CHAR(j.COMPC)
      __WHERE__
      ORDER BY j.JOB_ID DESC
    `;

    const rows = await _scopedList(connection, sql, conds, params, compc, brnch);
    return rows.map((r) => {
      const filled = parseInt(r.FILLED_POSITIONS || 0, 10);
      const openPos = parseInt(r.OPEN_POSITIONS || 0, 10);
      return {
        job_id: r.JOB_ID,
        job_title: r.JOB_TITLE,
        dept_no: r.DEPT_NO,
        dept_name: r.DEPT_NAME ? String(r.DEPT_NAME) : null,
        open_positions: openPos,
        filled_positions: filled,
        remaining_positions: Math.max(openPos - filled, 0),
        job_desc: r.JOB_DESC,
        skills_req: r.SKILLS_REQ,
        employment_type: r.EMPLOYMENT_TYPE,
        work_mode: r.WORK_MODE,
        nice_to_have_skills: r.NICE_TO_HAVE_SKILLS,
        min_experience_years: r.MIN_EXPERIENCE_YEARS,
        education_req: r.EDUCATION_REQ,
        salary_min: r.SALARY_MIN,
        salary_max: r.SALARY_MAX,
        status: r.STATUS,
        created_by: r.CREATED_BY,
        created_at: r.CREATED_AT,
      };
    });
  } finally {
    await connection?.close();
  }
};

export const getJob = async (jobId) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const result = await connection.execute(
      `
      SELECT
          j.JOB_ID,
          j.JOB_TITLE,
          j.DEPT_NO,
          NVL(d.DEPT_NAME, TO_CHAR(j.DEPT_NO)) AS DEPT_NAME,
          j.OPEN_POSITIONS,
          (SELECT COUNT(*) FROM RECRUITMENT_OFFERS o
            JOIN RECRUITMENT_APPLICATIONS a2 ON a2.APP_ID = o.APP_ID
            WHERE a2.JOB_ID = j.JOB_ID AND o.STATUS = 'ACCEPTED') AS FILLED_POSITIONS,
          j.JOB_DESC,
          j.SKILLS_REQ,
          j.EMPLOYMENT_TYPE,
          j.WORK_MODE,
          j.NICE_TO_HAVE_SKILLS,
          j.MIN_EXPERIENCE_YEARS,
          j.EDUCATION_REQ,
          j.SALARY_MIN,
          j.SALARY_MAX,
          j.STATUS,
          j.CREATED_BY,
          TO_CHAR(j.CREATED_AT, 'YYYY-MM-DD') AS CREATED_AT
      FROM RECRUITMENT_JOBS j
      LEFT JOIN HR_DEPT d ON TO_CHAR(d.DEPT_NO) = TO_CHAR(j.DEPT_NO) AND TO_CHAR(d.COMPC) = TO_CHAR(j.COMPC)
      WHERE j.JOB_ID = :job_id
      `,
      { job_id: jobId },
      { outFormat: 4002 }
    );
    const r = result.rows?.[0];
    if (!r) return null;

    const filled = parseInt(r.FILLED_POSITIONS || 0, 10);
    const openPos = parseInt(r.OPEN_POSITIONS || 0, 10);
    return {
      job_id: r.JOB_ID,
      job_title: r.JOB_TITLE,
      dept_no: r.DEPT_NO,
      dept_name: r.DEPT_NAME ? String(r.DEPT_NAME) : null,
      open_positions: openPos,
      filled_positions: filled,
      remaining_positions: Math.max(openPos - filled, 0),
      job_desc: r.JOB_DESC,
      skills_req: r.SKILLS_REQ,
      employment_type: r.EMPLOYMENT_TYPE,
      work_mode: r.WORK_MODE,
      nice_to_have_skills: r.NICE_TO_HAVE_SKILLS,
      min_experience_years: r.MIN_EXPERIENCE_YEARS,
      education_req: r.EDUCATION_REQ,
      salary_min: r.SALARY_MIN,
      salary_max: r.SALARY_MAX,
      status: r.STATUS,
      created_by: r.CREATED_BY,
      created_at: r.CREATED_AT,
    };
  } finally {
    await connection?.close();
  }
};

export const updateJob = async (jobId, data) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const fieldMap = {
      job_title: "JOB_TITLE",
      dept_no: "DEPT_NO",
      open_positions: "OPEN_POSITIONS",
      job_desc: "JOB_DESC",
      skills_req: "SKILLS_REQ",
      employment_type: "EMPLOYMENT_TYPE",
      work_mode: "WORK_MODE",
      nice_to_have_skills: "NICE_TO_HAVE_SKILLS",
      min_experience_years: "MIN_EXPERIENCE_YEARS",
      education_req: "EDUCATION_REQ",
      salary_min: "SALARY_MIN",
      salary_max: "SALARY_MAX",
      status: "STATUS",
    };
    const setParts = ["UPDATED_AT = SYSDATE"];
    const params = { job_id: jobId };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== undefined && data[key] !== null) {
        setParts.push(`${col} = :${key}`);
        params[key] = data[key];
      }
    }
    if (setParts.length === 1) return { status: "error", message: "No fields to update" };

    const sql = `UPDATE RECRUITMENT_JOBS SET ${setParts.join(", ")} WHERE JOB_ID = :job_id`;
    await connection.execute(sql, params, { autoCommit: true });
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err.message };
  } finally {
    await connection?.close();
  }
};

// ------------------------------------------------------------------
// APPLICATIONS
// ------------------------------------------------------------------

export const applyCandidateToJob = async (candidateId, jobId, source = null, notes = null) => {
  let connection;
  try {
    connection = await getDirectConnection();

    const candResult = await connection.execute(
      `SELECT CANDIDATE_NAME, MOBILE, EMAIL FROM RECRUITMENT_CANDIDATES WHERE CANDIDATE_ID = :cid`,
      { cid: candidateId },
      { outFormat: 4002 }
    );
    const cand = candResult.rows?.[0];
    if (!cand) return { status: "error", message: "Candidate not found" };

    const countResult = await connection.execute(
      `SELECT COUNT(*) AS CNT FROM RECRUITMENT_APPLICATIONS WHERE CANDIDATE_ID = :cid AND JOB_ID = :jid`,
      { cid: candidateId, jid: jobId },
      { outFormat: 4002 }
    );
    if (countResult.rows[0].CNT > 0) {
      return { status: "error", message: "This candidate has already applied to this job" };
    }

    const sql = `
      INSERT INTO RECRUITMENT_APPLICATIONS (
          APP_ID, JOB_ID, CANDIDATE_ID, CANDIDATE_NAME, MOBILE, EMAIL,
          SOURCE, APP_DATE, STATUS, NOTES, CREATED_AT
      ) VALUES (
          RECRUITMENT_APPS_SEQ.NEXTVAL, :jid, :cid, :name, :mobile, :email,
          :source, SYSDATE, 'PENDING', :notes, SYSDATE
      )
    `;
    await connection.execute(
      sql,
      {
        jid: jobId,
        cid: candidateId,
        name: cand.CANDIDATE_NAME,
        mobile: cand.MOBILE,
        email: cand.EMAIL,
        source,
        notes,
      },
      { autoCommit: true }
    );
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err.message };
  } finally {
    await connection?.close();
  }
};

export const createApplication = async (data) => {
  if (data.candidate_id) {
    return applyCandidateToJob(data.candidate_id, data.job_id, data.source, data.notes);
  }

  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      INSERT INTO RECRUITMENT_APPLICATIONS (
          APP_ID, JOB_ID, CANDIDATE_NAME, MOBILE, EMAIL,
          SOURCE, APP_DATE, STATUS, NOTES, CREATED_AT
      ) VALUES (
          RECRUITMENT_APPS_SEQ.NEXTVAL, :job_id, :candidate_name,
          :mobile, :email, :source, SYSDATE, 'PENDING', :notes, SYSDATE
      )
    `;
    await connection.execute(
      sql,
      {
        job_id: data.job_id,
        candidate_name: data.candidate_name,
        mobile: data.mobile,
        email: data.email,
        source: data.source,
        notes: data.notes,
      },
      { autoCommit: true }
    );
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err.message };
  } finally {
    await connection?.close();
  }
};

export const listApplications = async (jobId = null, status = null, compc = null, brnch = null) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const params = {};
    const conds = [];
    if (jobId) {
      conds.push("a.JOB_ID = :job_id");
      params.job_id = jobId;
    }
    if (status) {
      conds.push("a.STATUS = :status");
      params.status = status;
    }

    const sql = `
      SELECT
          a.APP_ID,
          a.JOB_ID,
          j.JOB_TITLE,
          a.CANDIDATE_ID,
          a.CANDIDATE_NAME,
          a.MOBILE,
          a.EMAIL,
          a.SOURCE,
          TO_CHAR(a.APP_DATE, 'YYYY-MM-DD') AS APP_DATE,
          a.STATUS,
          a.NOTES,
          TO_CHAR(a.CREATED_AT, 'YYYY-MM-DD') AS CREATED_AT
      FROM RECRUITMENT_APPLICATIONS a
      JOIN RECRUITMENT_JOBS j ON j.JOB_ID = a.JOB_ID
      __WHERE__
      ORDER BY a.APP_ID DESC
    `;

    return await _scopedList(connection, sql, conds, params, compc, brnch);
  } finally {
    await connection?.close();
  }
};

export const getApplication = async (appId) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const result = await connection.execute(
      `
      SELECT
          a.APP_ID, a.JOB_ID, j.JOB_TITLE, a.CANDIDATE_ID,
          a.CANDIDATE_NAME, a.MOBILE, a.EMAIL, a.SOURCE,
          TO_CHAR(a.APP_DATE, 'YYYY-MM-DD') AS APP_DATE,
          a.STATUS, a.NOTES,
          TO_CHAR(a.CREATED_AT, 'YYYY-MM-DD') AS CREATED_AT
      FROM RECRUITMENT_APPLICATIONS a
      JOIN RECRUITMENT_JOBS j ON j.JOB_ID = a.JOB_ID
      WHERE a.APP_ID = :app_id
      `,
      { app_id: appId },
      { outFormat: 4002 }
    );
    return result.rows?.[0] || null;
  } finally {
    await connection?.close();
  }
};

export const updateApplicationStatus = async (appId, status, notes = null) => {
  let connection;
  try {
    connection = await getDirectConnection();
    await connection.execute(
      `
      UPDATE RECRUITMENT_APPLICATIONS
      SET STATUS = :status, NOTES = NVL(:notes, NOTES)
      WHERE APP_ID = :app_id
      `,
      { status, notes, app_id: appId },
      { autoCommit: true }
    );
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err.message };
  } finally {
    await connection?.close();
  }
};

// ------------------------------------------------------------------
// INTERVIEWS
// ------------------------------------------------------------------

export const createInterview = async (data) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      INSERT INTO RECRUITMENT_INTERVIEWS (
          INTERVIEW_ID, APP_ID, INTERVIEW_DATE, INTERVIEW_TYPE,
          INTERVIEWER, FEEDBACK_OWNER, STATUS, CREATED_AT
      ) VALUES (
          RECRUITMENT_INTERVIEWS_SEQ.NEXTVAL, :app_id,
          TO_DATE(:interview_date, 'YYYY-MM-DD'),
          :interview_type, :interviewer, :feedback_owner, 'SCHEDULED', SYSDATE
      )
    `;
    await connection.execute(
      sql,
      {
        app_id: data.app_id,
        interview_date: data.interview_date,
        interview_type: data.interview_type,
        interviewer: data.interviewer,
        feedback_owner: data.feedback_owner,
      },
      { autoCommit: true }
    );
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err.message };
  } finally {
    await connection?.close();
  }
};

export const listInterviews = async (appId = null, status = null, compc = null, brnch = null) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const params = {};
    const conds = [];
    if (appId) {
      conds.push("i.APP_ID = :app_id");
      params.app_id = appId;
    }
    if (status) {
      conds.push("i.STATUS = :status");
      params.status = status;
    }

    const sql = `
      SELECT
          i.INTERVIEW_ID,
          i.APP_ID,
          a.CANDIDATE_NAME,
          j.JOB_TITLE,
          TO_CHAR(i.INTERVIEW_DATE, 'YYYY-MM-DD') AS INTERVIEW_DATE,
          i.INTERVIEW_TYPE,
          i.INTERVIEWER,
          i.FEEDBACK_OWNER,
          i.TECHNICAL_RATING,
          i.COMMUNICATION_RATING,
          i.CULTURE_FIT_RATING,
          i.RECOMMENDATION,
          i.STATUS,
          i.FEEDBACK,
          TO_CHAR(i.CREATED_AT, 'YYYY-MM-DD') AS CREATED_AT
      FROM RECRUITMENT_INTERVIEWS i
      JOIN RECRUITMENT_APPLICATIONS a ON a.APP_ID = i.APP_ID
      JOIN RECRUITMENT_JOBS j ON j.JOB_ID = a.JOB_ID
      __WHERE__
      ORDER BY i.INTERVIEW_ID DESC
    `;

    const rows = await _scopedList(connection, sql, conds, params, compc, brnch);
    return rows.map((r) => {
      // Oracle CLOBs might need to be converted to strings in oracledb
      const feedback = typeof r.FEEDBACK === "string" ? r.FEEDBACK : (r.FEEDBACK ? String(r.FEEDBACK) : null);
      return { ...r, FEEDBACK: feedback };
    });
  } finally {
    await connection?.close();
  }
};

export const updateInterview = async (interviewId, data) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const fieldMap = {
      status: "STATUS",
      feedback: "FEEDBACK",
      interviewer: "INTERVIEWER",
      interview_type: "INTERVIEW_TYPE",
      feedback_owner: "FEEDBACK_OWNER",
      technical_rating: "TECHNICAL_RATING",
      communication_rating: "COMMUNICATION_RATING",
      culture_fit_rating: "CULTURE_FIT_RATING",
      recommendation: "RECOMMENDATION",
    };
    const setParts = [];
    const params = { interview_id: interviewId };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== undefined && data[key] !== null) {
        setParts.push(`${col} = :${key}`);
        params[key] = data[key];
      }
    }
    if (data.interview_date) {
      setParts.push("INTERVIEW_DATE = TO_DATE(:interview_date, 'YYYY-MM-DD')");
      params.interview_date = data.interview_date;
    }

    if (setParts.length === 0) return { status: "error", message: "No fields to update" };

    const sql = `UPDATE RECRUITMENT_INTERVIEWS SET ${setParts.join(", ")} WHERE INTERVIEW_ID = :interview_id`;
    await connection.execute(sql, params, { autoCommit: true });
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err.message };
  } finally {
    await connection?.close();
  }
};

// ------------------------------------------------------------------
// OFFERS
// ------------------------------------------------------------------

export const createOffer = async (data) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      INSERT INTO RECRUITMENT_OFFERS (
          OFFER_ID, APP_ID, OFFER_DATE, SALARY_OFFERED, STATUS, NOTES, CREATED_AT
      ) VALUES (
          RECRUITMENT_OFFERS_SEQ.NEXTVAL, :app_id,
          SYSDATE, :salary_offered, 'SENT', :notes, SYSDATE
      )
    `;
    await connection.execute(
      sql,
      {
        app_id: data.app_id,
        salary_offered: data.salary_offered,
        notes: data.notes,
      },
      { autoCommit: true }
    );
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err.message };
  } finally {
    await connection?.close();
  }
};

export const listOffers = async (status = null, compc = null, brnch = null) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const params = {};
    const conds = [];
    if (status) {
      conds.push("o.STATUS = :status");
      params.status = status;
    }

    const sql = `
      SELECT
          o.OFFER_ID,
          o.APP_ID,
          a.CANDIDATE_NAME,
          j.JOB_TITLE,
          TO_CHAR(o.OFFER_DATE, 'YYYY-MM-DD') AS OFFER_DATE,
          o.SALARY_OFFERED,
          o.STATUS,
          o.NOTES,
          TO_CHAR(o.CREATED_AT, 'YYYY-MM-DD') AS CREATED_AT
      FROM RECRUITMENT_OFFERS o
      JOIN RECRUITMENT_APPLICATIONS a ON a.APP_ID = o.APP_ID
      JOIN RECRUITMENT_JOBS j ON j.JOB_ID = a.JOB_ID
      __WHERE__
      ORDER BY o.OFFER_ID DESC
    `;
    return await _scopedList(connection, sql, conds, params, compc, brnch);
  } finally {
    await connection?.close();
  }
};

export const updateOffer = async (offerId, data) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const fieldMap = {
      status: "STATUS",
      salary_offered: "SALARY_OFFERED",
      notes: "NOTES",
    };
    const setParts = [];
    const params = { offer_id: offerId };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== undefined && data[key] !== null) {
        setParts.push(`${col} = :${key}`);
        params[key] = data[key];
      }
    }
    if (setParts.length === 0) return { status: "error", message: "No fields to update" };

    const sql = `UPDATE RECRUITMENT_OFFERS SET ${setParts.join(", ")} WHERE OFFER_ID = :offer_id`;
    await connection.execute(sql, params, { autoCommit: true });
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err.message };
  } finally {
    await connection?.close();
  }
};

// ------------------------------------------------------------------
// CANDIDATES (Talent Pool)
// ------------------------------------------------------------------

const readLob = async (lob) => {
  if (!lob) return null;
  if (typeof lob === "string") return lob;
  try {
    return await lob.getData(); // oracledb CLOB read
  } catch (e) {
    return String(lob);
  }
};

const _insertCandidateChildren = async (connection, candidateId, data) => {
  const edu = data.education || [];
  for (const e of edu) {
    if (!e.institution && !e.degree) continue;
    await connection.execute(
      `
      INSERT INTO RECRUITMENT_CANDIDATE_EDUCATION
          (EDUCATION_ID, CANDIDATE_ID, INSTITUTION, DEGREE, GRADUATION_YEAR)
      VALUES (RECRUITMENT_CAND_EDU_SEQ.NEXTVAL, :cid, :inst, :deg, :yr)
      `,
      {
        cid: candidateId,
        inst: e.institution ? String(e.institution).substring(0, 300) : null,
        deg: e.degree ? String(e.degree).substring(0, 300) : null,
        yr: e.graduation_year ? String(e.graduation_year).substring(0, 20) : null,
      }
    );
  }

  const exp = data.experience || [];
  for (const e of exp) {
    if (!e.company && !e.role) continue;
    await connection.execute(
      `
      INSERT INTO RECRUITMENT_CANDIDATE_EXPERIENCE
          (EXPERIENCE_ID, CANDIDATE_ID, COMPANY, ROLE, DURATION, DESCRIPTION)
      VALUES (RECRUITMENT_CAND_EXP_SEQ.NEXTVAL, :cid, :co, :role, :dur, :descr)
      `,
      {
        cid: candidateId,
        co: e.company ? String(e.company).substring(0, 300) : null,
        role: e.role ? String(e.role).substring(0, 200) : null,
        dur: e.duration ? String(e.duration).substring(0, 100) : null,
        descr: e.description || null,
      }
    );
  }

  const skills = data.skills || [];
  for (const s of skills) {
    const strS = String(s || "").trim().substring(0, 100);
    if (!strS) continue;
    await connection.execute(
      `
      INSERT INTO RECRUITMENT_CANDIDATE_SKILLS (SKILL_ID, CANDIDATE_ID, SKILL_NAME)
      VALUES (RECRUITMENT_CAND_SKILL_SEQ.NEXTVAL, :cid, :s)
      `,
      { cid: candidateId, s: strS }
    );
  }
};

const findDuplicateCandidate = async (connection, email, mobile, excludeId = null, compc = null) => {
  const conds = [];
  const params = {};
  if (email && email.trim()) {
    conds.push("LOWER(TRIM(EMAIL)) = :em");
    params.em = email.trim().toLowerCase();
  }
  if (mobile && mobile.trim()) {
    conds.push("TRIM(MOBILE) = :mb");
    params.mb = mobile.trim();
  }
  if (conds.length === 0) return null;

  let sql = `SELECT CANDIDATE_ID, CANDIDATE_NAME FROM RECRUITMENT_CANDIDATES WHERE (${conds.join(" OR ")})`;
  
  const cval = rToInt(compc);
  if (cval !== null) {
    sql += " AND (COMPC = :dupc OR COMPC IS NULL)";
    params.dupc = cval;
  }
  if (excludeId !== null) {
    sql += " AND CANDIDATE_ID != :xid";
    params.xid = excludeId;
  }
  sql += " FETCH FIRST 1 ROWS ONLY";

  const result = await connection.execute(sql, params, { outFormat: 4002 });
  return result.rows?.[0] || null;
};

export const createCandidate = async (data, compc = null, brnch = null) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const cval = rToInt(compc);
    const bval = rToInt(brnch);

    const dup = await findDuplicateCandidate(connection, data.email, data.mobile, null, cval);
    if (dup) {
      return {
        status: "duplicate",
        candidate_id: dup.CANDIDATE_ID,
        message: `Candidate already exists: ${dup.CANDIDATE_NAME} (#${dup.CANDIDATE_ID}). Update their profile instead of creating a duplicate.`,
      };
    }

    const sql = `
      INSERT INTO RECRUITMENT_CANDIDATES (
          CANDIDATE_ID, CANDIDATE_NAME, EMAIL, MOBILE, LOCATION,
          PREFERRED_JOB_TITLE, PROFILE_SUMMARY, COMPC, BRNCH,
          CREATED_AT, UPDATED_AT
      ) VALUES (
          RECRUITMENT_CANDIDATES_SEQ.NEXTVAL, :name, :email, :mobile, :loc,
          :pref, :summary, :compc, :brnch, SYSDATE, SYSDATE
      ) RETURNING CANDIDATE_ID INTO :out_id
    `;
    const result = await connection.execute(
      sql,
      {
        name: String(data.candidate_name || "").trim().substring(0, 200),
        email: data.email ? String(data.email).trim().substring(0, 200) : null,
        mobile: data.mobile ? String(data.mobile).trim().substring(0, 30) : null,
        loc: data.location ? String(data.location).trim().substring(0, 200) : null,
        pref: data.preferred_job_title ? String(data.preferred_job_title).trim().substring(0, 200) : null,
        summary: data.profile_summary || null,
        compc: cval,
        brnch: bval,
        out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: false }
    );
    const candidateId = result.outBinds.out_id[0];

    await _insertCandidateChildren(connection, candidateId, data);
    await connection.commit();
    return { status: "success", candidate_id: candidateId };
  } catch (err) {
    await connection?.rollback();
    return { status: "error", message: err.message };
  } finally {
    await connection?.close();
  }
};

export const listCandidates = async (search = null, compc = null, brnch = null) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const params = {};
    const conds = [];
    if (search && search.trim()) {
      params.q = `%${search.trim().toLowerCase()}%`;
      conds.push(`(
          LOWER(c.CANDIDATE_NAME) LIKE :q
          OR LOWER(NVL(c.EMAIL, ' ')) LIKE :q
          OR NVL(c.MOBILE, ' ') LIKE :q
          OR LOWER(NVL(c.LOCATION, ' ')) LIKE :q
          OR LOWER(NVL(c.PREFERRED_JOB_TITLE, ' ')) LIKE :q
          OR EXISTS (SELECT 1 FROM RECRUITMENT_CANDIDATE_SKILLS s
                      WHERE s.CANDIDATE_ID = c.CANDIDATE_ID
                        AND LOWER(s.SKILL_NAME) LIKE :q)
      )`);
    }

    const scope = _jobScopeFilter(params, compc, brnch, "c");
    let where = conds.length > 0 ? "WHERE " + conds.join(" AND ") : "";
    if (scope) {
      where = where ? where + scope : "WHERE 1=1" + scope;
    }

    const runList = async (w, p) => {
      const sql = `
        SELECT
            c.CANDIDATE_ID,
            c.CANDIDATE_NAME,
            c.EMAIL,
            c.MOBILE,
            c.LOCATION,
            c.PREFERRED_JOB_TITLE,
            c.CV_FILE_NAME,
            TO_CHAR(c.CREATED_AT, 'YYYY-MM-DD') AS CREATED_AT,
            (SELECT COUNT(*) FROM RECRUITMENT_APPLICATIONS a
              WHERE a.CANDIDATE_ID = c.CANDIDATE_ID)          AS APPLICATIONS,
            (SELECT LISTAGG(s.SKILL_NAME, ', ') WITHIN GROUP (ORDER BY s.SKILL_ID)
              FROM RECRUITMENT_CANDIDATE_SKILLS s
              WHERE s.CANDIDATE_ID = c.CANDIDATE_ID)          AS SKILLS
        FROM RECRUITMENT_CANDIDATES c
        ${w}
        ORDER BY c.CANDIDATE_ID DESC
        FETCH FIRST 500 ROWS ONLY
      `;
      const res = await connection.execute(sql, p, { outFormat: 4002 });
      return res.rows || [];
    };

    try {
      return await runList(where, params);
    } catch (e) {
      if (!e.message.includes("ORA-00904") || !scope) throw e;
      console.warn(`[RECRUITMENT] candidate COMPC/BRNCH absent, listing unscoped: ${e.message}`);
      const unscopedParams = {};
      for (const [k, v] of Object.entries(params)) {
        if (!k.startsWith("jc") && !k.startsWith("jb") && !k.startsWith("cc") && !k.startsWith("cb")) {
          unscopedParams[k] = v;
        }
      }
      const unscopedWhere = conds.length > 0 ? "WHERE " + conds.join(" AND ") : "";
      return await runList(unscopedWhere, unscopedParams);
    }
  } finally {
    await connection?.close();
  }
};

export const getCandidate = async (candidateId) => {
  let connection;
  try {
    connection = await getDirectConnection();
    
    // Candidate Main Profile
    const cResult = await connection.execute(
      `
      SELECT CANDIDATE_ID, CANDIDATE_NAME, EMAIL, MOBILE, LOCATION,
              PREFERRED_JOB_TITLE, CV_FILE_NAME, CV_FILE_PATH, PROFILE_SUMMARY,
              COMPC, BRNCH,
              TO_CHAR(CREATED_AT, 'YYYY-MM-DD') AS CREATED_AT,
              TO_CHAR(UPDATED_AT, 'YYYY-MM-DD') AS UPDATED_AT
      FROM RECRUITMENT_CANDIDATES WHERE CANDIDATE_ID = :cid
      `,
      { cid: candidateId },
      { outFormat: 4002 }
    );
    const cand = cResult.rows?.[0];
    if (!cand) return null;
    cand.PROFILE_SUMMARY = await readLob(cand.PROFILE_SUMMARY);

    // Education
    const eduResult = await connection.execute(
      `
      SELECT EDUCATION_ID, INSTITUTION, DEGREE, GRADUATION_YEAR
      FROM RECRUITMENT_CANDIDATE_EDUCATION
      WHERE CANDIDATE_ID = :cid ORDER BY EDUCATION_ID
      `,
      { cid: candidateId },
      { outFormat: 4002 }
    );
    cand.education = eduResult.rows || [];

    // Experience
    const expResult = await connection.execute(
      `
      SELECT EXPERIENCE_ID, COMPANY, ROLE, DURATION, DESCRIPTION
      FROM RECRUITMENT_CANDIDATE_EXPERIENCE
      WHERE CANDIDATE_ID = :cid ORDER BY EXPERIENCE_ID
      `,
      { cid: candidateId },
      { outFormat: 4002 }
    );
    cand.experience = [];
    for (const r of expResult.rows || []) {
      cand.experience.push({
        ...r,
        DESCRIPTION: await readLob(r.DESCRIPTION),
      });
    }

    // Skills
    const skillsResult = await connection.execute(
      `
      SELECT SKILL_NAME FROM RECRUITMENT_CANDIDATE_SKILLS
      WHERE CANDIDATE_ID = :cid ORDER BY SKILL_ID
      `,
      { cid: candidateId },
      { outFormat: 4002 }
    );
    cand.skills = (skillsResult.rows || []).map((r) => r.SKILL_NAME).filter((s) => !!s);

    // Applications
    const appsResult = await connection.execute(
      `
      SELECT a.APP_ID, a.JOB_ID, j.JOB_TITLE, a.STATUS,
              TO_CHAR(a.APP_DATE, 'YYYY-MM-DD') AS APP_DATE,
              (SELECT e.OVERALL_SCORE FROM RECRUITMENT_AI_EVALUATIONS e
              WHERE e.APPLICATION_ID = a.APP_ID
              ORDER BY e.EVALUATION_ID DESC FETCH FIRST 1 ROWS ONLY) AS AI_OVERALL_SCORE
      FROM RECRUITMENT_APPLICATIONS a
      JOIN RECRUITMENT_JOBS j ON j.JOB_ID = a.JOB_ID
      WHERE a.CANDIDATE_ID = :cid
      ORDER BY a.APP_ID DESC
      `,
      { cid: candidateId },
      { outFormat: 4002 }
    );
    cand.applications = (appsResult.rows || []).map((r) => ({
      ...r,
      AI_OVERALL_SCORE: rToInt(r.AI_OVERALL_SCORE),
    }));

    // Standardize object keys to lowercase for JS
    return {
      candidate_id: cand.CANDIDATE_ID,
      candidate_name: cand.CANDIDATE_NAME,
      email: cand.EMAIL,
      mobile: cand.MOBILE,
      location: cand.LOCATION,
      preferred_job_title: cand.PREFERRED_JOB_TITLE,
      cv_file_name: cand.CV_FILE_NAME,
      cv_file_path: cand.CV_FILE_PATH,
      profile_summary: cand.PROFILE_SUMMARY,
      compc: cand.COMPC,
      brnch: cand.BRNCH,
      created_at: cand.CREATED_AT,
      updated_at: cand.UPDATED_AT,
      education: cand.education.map(e => ({
        education_id: e.EDUCATION_ID,
        institution: e.INSTITUTION,
        degree: e.DEGREE,
        graduation_year: e.GRADUATION_YEAR
      })),
      experience: cand.experience.map(e => ({
        experience_id: e.EXPERIENCE_ID,
        company: e.COMPANY,
        role: e.ROLE,
        duration: e.DURATION,
        description: e.DESCRIPTION
      })),
      skills: cand.skills,
      applications: cand.applications.map(a => ({
        app_id: a.APP_ID,
        job_id: a.JOB_ID,
        job_title: a.JOB_TITLE,
        status: a.STATUS,
        app_date: a.APP_DATE,
        ai_overall_score: a.AI_OVERALL_SCORE
      }))
    };
  } finally {
    await connection?.close();
  }
};

export const updateCandidate = async (candidateId, data) => {
  let connection;
  try {
    connection = await getDirectConnection();
    
    let ownCompc = null;
    try {
      const cr = await connection.execute(
        `SELECT COMPC FROM RECRUITMENT_CANDIDATES WHERE CANDIDATE_ID = :cid`,
        { cid: candidateId },
        { outFormat: 4002 }
      );
      if (cr.rows?.[0]) ownCompc = cr.rows[0].COMPC;
    } catch (e) { }

    const dup = await findDuplicateCandidate(connection, data.email, data.mobile, candidateId, ownCompc);
    if (dup) {
      return {
        status: "error",
        message: `Another candidate already uses this email/mobile: ${dup.CANDIDATE_NAME} (#${dup.CANDIDATE_ID})`,
      };
    }

    const fieldMap = {
      candidate_name: "CANDIDATE_NAME",
      email: "EMAIL",
      mobile: "MOBILE",
      location: "LOCATION",
      preferred_job_title: "PREFERRED_JOB_TITLE",
      profile_summary: "PROFILE_SUMMARY",
    };
    const sets = ["UPDATED_AT = SYSDATE"];
    const params = { cid: candidateId };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== undefined && data[key] !== null) {
        sets.push(`${col} = :${key}`);
        params[key] = data[key];
      }
    }

    const result = await connection.execute(
      `UPDATE RECRUITMENT_CANDIDATES SET ${sets.join(", ")} WHERE CANDIDATE_ID = :cid`,
      params,
      { autoCommit: false }
    );
    if (result.rowsAffected === 0) {
      await connection.rollback();
      return { status: "error", message: "Candidate not found" };
    }

    // Replace children if provided
    const replaceParams = {};
    if (data.education !== undefined) {
      await connection.execute(`DELETE FROM RECRUITMENT_CANDIDATE_EDUCATION WHERE CANDIDATE_ID = :cid`, { cid: candidateId });
      replaceParams.education = data.education;
    }
    if (data.experience !== undefined) {
      await connection.execute(`DELETE FROM RECRUITMENT_CANDIDATE_EXPERIENCE WHERE CANDIDATE_ID = :cid`, { cid: candidateId });
      replaceParams.experience = data.experience;
    }
    if (data.skills !== undefined) {
      await connection.execute(`DELETE FROM RECRUITMENT_CANDIDATE_SKILLS WHERE CANDIDATE_ID = :cid`, { cid: candidateId });
      replaceParams.skills = data.skills;
    }

    if (Object.keys(replaceParams).length > 0) {
      await _insertCandidateChildren(connection, candidateId, replaceParams);
    }

    await connection.commit();
    return { status: "success" };
  } catch (err) {
    await connection?.rollback();
    return { status: "error", message: err.message };
  } finally {
    await connection?.close();
  }
};

// ------------------------------------------------------------------
// ANALYTICS
// ------------------------------------------------------------------

export const getAnalytics = async (compc = null, brnch = null) => {
  let connection;
  try {
    connection = await getDirectConnection();

    const sp = {};
    const scope = _jobScopeFilter(sp, compc, brnch, "j");
    const jJoinApp = "JOIN RECRUITMENT_JOBS j ON j.JOB_ID = a.JOB_ID";
    const jJoinOff = "JOIN RECRUITMENT_APPLICATIONS a ON a.APP_ID = o.APP_ID JOIN RECRUITMENT_JOBS j ON j.JOB_ID = a.JOB_ID";
    
    let whereClause = "WHERE 1=1";
    if (scope) {
      whereClause += scope;
    }

    const getCount = async (sql, params) => {
      try {
        const res = await connection.execute(sql, params, { outFormat: 4002 });
        return parseInt(res.rows?.[0]?.[Object.keys(res.rows[0])[0]] || 0, 10);
      } catch (e) {
        if (e.message.includes("ORA-00904")) throw e;
        return 0;
      }
    };

    const runAnalytics = async (w, p) => {
      const openJobs = await getCount(`SELECT COUNT(*) FROM RECRUITMENT_JOBS j WHERE j.STATUS = 'OPEN' ${w.replace("WHERE 1=1", "")}`, p);

      const appCountsRes = await connection.execute(
        `SELECT a.STATUS, COUNT(*) AS CNT FROM RECRUITMENT_APPLICATIONS a ${jJoinApp} ${w} GROUP BY a.STATUS`,
        p, { outFormat: 4002 }
      );
      const appCounts = {};
      (appCountsRes.rows || []).forEach(r => appCounts[r.STATUS] = parseInt(r.CNT, 10));

      const totalInterviews = await getCount(
        `SELECT COUNT(*) FROM RECRUITMENT_INTERVIEWS i JOIN RECRUITMENT_APPLICATIONS a ON a.APP_ID = i.APP_ID ${jJoinApp} ${w}`, p
      );

      const hiresThisMonth = await getCount(
        `SELECT COUNT(*) FROM RECRUITMENT_OFFERS o ${jJoinOff} WHERE o.STATUS = 'ACCEPTED' AND TRUNC(o.OFFER_DATE, 'MM') = TRUNC(SYSDATE, 'MM') ${w.replace("WHERE 1=1", "")}`, p
      );

      const monthlyHiresRes = await connection.execute(
        `SELECT TO_CHAR(o.OFFER_DATE, 'MON YYYY') AS MONTH, COUNT(*) AS HIRES 
         FROM RECRUITMENT_OFFERS o ${jJoinOff} 
         WHERE o.STATUS = 'ACCEPTED' AND o.OFFER_DATE >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -5) ${w.replace("WHERE 1=1", "")} 
         GROUP BY TO_CHAR(o.OFFER_DATE, 'MON YYYY'), TRUNC(o.OFFER_DATE, 'MM') 
         ORDER BY TRUNC(o.OFFER_DATE, 'MM')`, p, { outFormat: 4002 }
      );
      const monthlyHires = (monthlyHiresRes.rows || []).map(r => ({ month: r.MONTH, hires: parseInt(r.HIRES, 10) }));

      const avgTimeRes = await connection.execute(
        `SELECT AVG(o.OFFER_DATE - a.APP_DATE) AS AVG_TIME FROM RECRUITMENT_OFFERS o ${jJoinOff} WHERE o.STATUS = 'ACCEPTED' ${w.replace("WHERE 1=1", "")}`, p, { outFormat: 4002 }
      );
      const avgTimeToHire = Math.round(parseFloat(avgTimeRes.rows?.[0]?.AVG_TIME || 0) * 10) / 10;

      const avgCostRes = await connection.execute(
        `SELECT AVG(o.SALARY_OFFERED) AS AVG_COST FROM RECRUITMENT_OFFERS o ${jJoinOff} WHERE o.STATUS = 'ACCEPTED' ${w.replace("WHERE 1=1", "")}`, p, { outFormat: 4002 }
      );
      const avgCostPerHire = Math.round(parseFloat(avgCostRes.rows?.[0]?.AVG_COST || 0));

      return {
        open_jobs: openJobs,
        total_applications: Object.values(appCounts).reduce((a, b) => a + b, 0),
        pending: appCounts.PENDING || 0,
        shortlisted: appCounts.SHORTLISTED || 0,
        rejected: appCounts.REJECTED || 0,
        total_interviews: totalInterviews,
        hires_this_month: hiresThisMonth,
        avg_time_to_hire_days: avgTimeToHire,
        avg_cost_per_hire: avgCostPerHire,
        monthly_hires: monthlyHires,
      };
    };

    try {
      return await runAnalytics(whereClause, sp);
    } catch (e) {
      if (!e.message.includes("ORA-00904") || !scope) throw e;
      console.warn(`[RECRUITMENT] COMPC/BRNCH absent, analytics unscoped: ${e.message}`);
      return await runAnalytics("WHERE 1=1", {});
    }

  } finally {
    await connection?.close();
  }
};

// ------------------------------------------------------------------
// INTERVIEW PANEL
// ------------------------------------------------------------------

export const listPanelPool = async (compc = null, brnch = null, includeInactive = false) => {
  let connection;
  try {
    const c = rToInt(compc);
    if (c === null) return { items: [], company_branches: [] };

    connection = await getDirectConnection();
    const params = { c };
    const conds = ["p.COMPC = :c"];
    const b = rToInt(brnch);
    if (b !== null) {
      conds.push("p.BRNCH = :b");
      params.b = b;
    }
    if (!includeInactive) {
      conds.push("p.IS_ACTIVE = 'Y'");
    }

    const sql = `
      SELECT p.PANEL_POOL_ID, p.COMPC, p.BRNCH, p.EMPCODE, p.IS_ACTIVE,
             p.ADDED_BY, TO_CHAR(p.ADDED_ON, 'YYYY-MM-DD') AS ADDED_ON,
             h.NAME, h.STATUS AS EMP_STATUS,
             (SELECT MAX(l.DESCR) FROM COM_LOCATION l
               WHERE TO_NUMBER(l.LCODE) = p.BRNCH
                 AND TO_CHAR(l.COMPC) = TO_CHAR(p.COMPC)) AS BRNCH_NAME
      FROM INTERVIEW_PANEL_POOL p
      LEFT JOIN HR_EMP_MASTER h ON h.EMPCODE = p.EMPCODE
      WHERE ${conds.join(" AND ")}
      ORDER BY h.NAME, p.BRNCH
    `;
    const res = await connection.execute(sql, params, { outFormat: 4002 });
    const items = res.rows || [];

    const branchRes = await connection.execute(
      "SELECT LCODE, DESCR FROM COM_LOCATION WHERE TO_CHAR(COMPC) = TO_CHAR(:c)",
      { c: String(c) }, { outFormat: 4002 }
    );
    const branches = (branchRes.rows || []).map(r => ({
      lcode: rToInt(r.LCODE),
      descr: (r.DESCR || "").trim()
    })).filter(b => b.lcode !== null);

    return { items, company_branches: branches };
  } catch (e) {
    if (e.message.includes("ORA-00942")) return { items: [], company_branches: [] };
    throw e;
  } finally {
    await connection?.close();
  }
};

export const addPanelMembers = async (empcodes, compc = null, brnch = null, addedBy = "SYSTEM") => {
  let connection;
  try {
    const c = rToInt(compc);
    if (c === null) return { status: "error", message: "A specific company is required" };
    const codes = (empcodes || []).map(e => String(e).trim()).filter(e => e);
    if (codes.length === 0) return { status: "error", message: "No employees given" };

    connection = await getDirectConnection();
    
    let branches = [];
    const b = rToInt(brnch);
    if (b !== null) {
      branches = [b];
    } else {
      const resB = await connection.execute(
        "SELECT LCODE FROM COM_LOCATION WHERE TO_CHAR(COMPC) = TO_CHAR(:c)",
        { c: String(c) }, { outFormat: 4002 }
      );
      branches = [...new Set((resB.rows || []).map(r => rToInt(r.LCODE)).filter(n => n !== null))].sort((x, y) => x - y);
      if (branches.length === 0) return { status: "error", message: `Company ${c} has no branches in COM_LOCATION` };
    }

    const ph = codes.map((_, i) => `:e${i}`).join(", ");
    const paramsE = { c };
    codes.forEach((v, i) => paramsE[`e${i}`] = v);

    const validRes = await connection.execute(
      `SELECT EMPCODE FROM HR_EMP_MASTER WHERE EMPCODE IN (${ph}) AND STATUS = 'A' AND TO_NUMBER(UNIT_ID) = :c`,
      paramsE, { outFormat: 4002 }
    );
    const valid = (validRes.rows || []).map(r => String(r.EMPCODE).trim());
    const validSet = new Set(valid);
    const rejected = codes.filter(e => !validSet.has(e));

    if (valid.length === 0) {
      return { status: "error", message: "No active employees of this company in the selection", rejected };
    }

    let inserted = 0, reactivated = 0;
    valid.sort();
    for (const emp of valid) {
      for (const br of branches) {
        const upRes = await connection.execute(
          `UPDATE INTERVIEW_PANEL_POOL SET IS_ACTIVE = 'Y' WHERE COMPC = :c AND BRNCH = :b AND EMPCODE = :e`,
          { c, b: br, e: emp }
        );
        if (upRes.rowsAffected && upRes.rowsAffected > 0) {
          reactivated += upRes.rowsAffected;
          continue;
        }
        await connection.execute(
          `INSERT INTO INTERVIEW_PANEL_POOL
            (PANEL_POOL_ID, COMPC, BRNCH, EMPCODE, IS_ACTIVE, ADDED_BY, ADDED_ON)
           VALUES (INTERVIEW_PANEL_POOL_SEQ.NEXTVAL, :c, :b, :e, 'Y', :addedby, SYSTIMESTAMP)`,
          { c, b: br, e: emp, addedby: (addedBy || "SYSTEM").substring(0, 20) }
        );
        inserted++;
      }
    }
    await connection.commit();
    return { status: "success", inserted, reactivated, rejected };
  } catch (e) {
    if (e.message.includes("ORA-00942")) return { status: "error", message: "Panel pool table does not exist. (Ensure FastAPI migration runs first if needed)" };
    await connection?.rollback();
    return { status: "error", message: e.message };
  } finally {
    await connection?.close();
  }
};

export const deactivatePanelRow = async (id) => {
  let connection;
  try {
    connection = await getDirectConnection();
    await connection.execute(`UPDATE INTERVIEW_PANEL_POOL SET IS_ACTIVE = 'N' WHERE PANEL_POOL_ID = :id`, { id }, { autoCommit: true });
    return { status: "success" };
  } catch (e) {
    return { status: "error", message: e.message };
  } finally {
    await connection?.close();
  }
};

export const deactivatePanelMember = async (empcode, compc = null, brnch = null) => {
  let connection;
  try {
    const c = rToInt(compc);
    if (c === null) return { status: "error", message: "Company is required" };
    connection = await getDirectConnection();
    
    let branches = [];
    const b = rToInt(brnch);
    if (b !== null) {
      branches = [b];
    } else {
      const resB = await connection.execute(
        "SELECT LCODE FROM COM_LOCATION WHERE TO_CHAR(COMPC) = TO_CHAR(:c)",
        { c: String(c) }, { outFormat: 4002 }
      );
      branches = [...new Set((resB.rows || []).map(r => rToInt(r.LCODE)).filter(n => n !== null))].sort((x, y) => x - y);
      if (branches.length === 0) return { status: "error", message: `Company ${c} has no branches in COM_LOCATION` };
    }

    let deactivated = 0;
    for (const br of branches) {
      const upRes = await connection.execute(
        `UPDATE INTERVIEW_PANEL_POOL SET IS_ACTIVE = 'N' WHERE COMPC = :c AND BRNCH = :b AND EMPCODE = :e`,
        { c, b: br, e: empcode }
      );
      if (upRes.rowsAffected) deactivated += upRes.rowsAffected;
    }
    await connection.commit();
    return { status: "success", deactivated };
  } catch (e) {
    await connection?.rollback();
    return { status: "error", message: e.message };
  } finally {
    await connection?.close();
  }
};

export const panelOptionsForApp = async (appId) => {
  let connection;
  try {
    connection = await getDirectConnection();
    
    // get app's compc/brnch through jobs
    const appRes = await connection.execute(
      `SELECT j.COMPC, j.BRNCH FROM RECRUITMENT_APPLICATIONS a JOIN RECRUITMENT_JOBS j ON j.JOB_ID = a.JOB_ID WHERE a.APP_ID = :appId`,
      { appId }, { outFormat: 4002 }
    );
    if (!appRes.rows || appRes.rows.length === 0) {
      return { status: "error", message: "Application not found" };
    }
    const job = appRes.rows[0];
    const compc = job.COMPC;
    const brnch = job.BRNCH;

    const params = {};
    const conds = ["p.IS_ACTIVE = 'Y'"];
    if (compc !== null && compc !== undefined) {
      conds.push("p.COMPC = :c");
      params.c = compc;
    }
    if (brnch !== null && brnch !== undefined) {
      conds.push("p.BRNCH = :b");
      params.b = brnch;
    }

    const sql = `
      SELECT p.EMPCODE, MAX(h.NAME) AS NAME,
             LISTAGG(TO_CHAR(p.BRNCH), ',') WITHIN GROUP (ORDER BY p.BRNCH) AS BRANCHES
      FROM INTERVIEW_PANEL_POOL p
      LEFT JOIN HR_EMP_MASTER h ON h.EMPCODE = p.EMPCODE
      WHERE ${conds.join(' AND ')}
      GROUP BY p.EMPCODE
      ORDER BY MAX(h.NAME)
    `;

    const res = await connection.execute(sql, params, { outFormat: 4002 });
    
    const items = (res.rows || []).map(r => ({
      empcode: r.EMPCODE ? String(r.EMPCODE).trim() : null,
      name: r.NAME ? String(r.NAME).trim() : null,
      branches: r.BRANCHES || ""
    }));

    return { status: "success", compc, brnch, items };
  } catch (e) {
    if (e.message.includes("ORA-00942")) return { status: "error", message: "Table missing" };
    return { status: "error", message: e.message };
  } finally {
    await connection?.close();
  }
};

const _normTime = (t) => {
  const parts = String(t || "").trim().split(":");
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) throw new Error("Times must be HH:MM (24-hour), e.g. 09:30");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (!(h >= 0 && h <= 23 && m >= 0 && m <= 59)) throw new Error("Times must be HH:MM (24-hour), e.g. 09:30");
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const _plusHour = (t) => {
  const [h, m] = t.split(":").map(Number);
  if (h < 23) return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return "23:59";
};

export const createInterviewAssignments = async (appId, data, assignedBy = "") => {
  if (!data.interview_type || !data.interview_type.trim()) {
    return { status: "error", code: 400, message: "interview_type is required" };
  }
  if (!data.interview_date || !data.interview_date.trim()) {
    return { status: "error", code: 400, message: "interview_date is required" };
  }
  
  const seen = new Set();
  const codes = [];
  for (let e of (data.empcodes || [])) {
    e = String(e).trim();
    if (e && !seen.has(e)) {
      seen.add(e);
      codes.push(e);
    }
  }
  if (codes.length === 0) {
    return { status: "error", code: 400, message: "At least one interviewer is required" };
  }
  
  let start, end;
  try {
    start = _normTime(data.start_time);
    end = (data.end_time || "").trim() ? _normTime(data.end_time) : _plusHour(start);
  } catch (err) {
    return { status: "error", code: 400, message: err.message };
  }
  if (end <= start) {
    return { status: "error", code: 400, message: "End time must be after start time" };
  }

  let connection;
  try {
    connection = await getDirectConnection();
    
    // Check app scope
    const scopeRes = await connection.execute(
      `SELECT r.COMPC, r.BRNCH FROM RECRUITMENT_APPLICATIONS a JOIN RECRUITMENT_JOBS r ON r.JOB_ID = a.JOB_ID WHERE a.APP_ID = :id`,
      { id: appId }, { outFormat: 4002 }
    );
    if (!scopeRes.rows || scopeRes.rows.length === 0) {
      return { status: "error", code: 404, message: "Application not found" };
    }
    const { COMPC: compc, BRNCH: brnch } = scopeRes.rows[0];

    const conds = ["IS_ACTIVE = 'Y'"];
    const params = {};
    if (compc !== null && compc !== undefined) { conds.push("COMPC = :c"); params.c = compc; }
    if (brnch !== null && brnch !== undefined) { conds.push("BRNCH = :b"); params.b = brnch; }
    
    const ph = codes.map((_, i) => `:e${i}`).join(", ");
    codes.forEach((v, i) => params[`e${i}`] = v);

    const poolRes = await connection.execute(
      `SELECT DISTINCT EMPCODE FROM INTERVIEW_PANEL_POOL WHERE ${conds.join(" AND ")} AND EMPCODE IN (${ph})`,
      params, { outFormat: 4002 }
    );
    const inPool = new Set(poolRes.rows.map(r => String(r.EMPCODE).trim()));
    const outsiders = codes.filter(e => !inPool.has(e));
    if (outsiders.length > 0) {
      return { status: "error", code: 400, message: `Not in this company/branch's interview panel pool: ${outsiders.join(", ")}` };
    }

    // Clash check
    const clashParams = {
      d: data.interview_date,
      startt: start,
      endt: end
    };
    codes.forEach((v, i) => clashParams[`e${i}`] = v);
    
    const clashRes = await connection.execute(
      `SELECT ia.EMPCODE, MAX(h.NAME) AS NAME, ia.START_TIME, ia.END_TIME
       FROM INTERVIEW_ASSIGNMENTS ia
       LEFT JOIN HR_EMP_MASTER h ON h.EMPCODE = ia.EMPCODE
       WHERE ia.STATUS = 'PENDING'
         AND ia.EMPCODE IN (${ph})
         AND ia.INTERVIEW_DATE = TO_DATE(:d, 'YYYY-MM-DD')
         AND ia.START_TIME < :endt AND :startt < ia.END_TIME
       GROUP BY ia.EMPCODE, ia.START_TIME, ia.END_TIME`,
      clashParams, { outFormat: 4002 }
    );
    if (clashRes.rows && clashRes.rows.length > 0) {
      const clashes = clashRes.rows.map(r => {
        const name = (r.NAME || "").trim() || r.EMPCODE;
        return `${name} (${r.EMPCODE}) already has an interview ${r.START_TIME}-${r.END_TIME} on ${data.interview_date}`;
      });
      return { status: "error", code: 409, message: "Time clash: " + clashes.join("; ") };
    }

    // Interviewer names
    const namesParams = {};
    codes.forEach((v, i) => namesParams[`e${i}`] = v);
    const namesRes = await connection.execute(
      `SELECT EMPCODE, NAME FROM HR_EMP_MASTER WHERE EMPCODE IN (${ph})`,
      namesParams, { outFormat: 4002 }
    );
    const namesMap = {};
    namesRes.rows.forEach(r => namesMap[String(r.EMPCODE).trim()] = (r.NAME || "").trim());
    const display = codes.map(e => `${namesMap[e] || e} (${e})`).join(", ");

    // Insert Event Row
    const ivOut = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER };
    const ivRes = await connection.execute(
      `INSERT INTO RECRUITMENT_INTERVIEWS (
          INTERVIEW_ID, APP_ID, INTERVIEW_DATE, INTERVIEW_TYPE,
          INTERVIEWER, LOCATION_OR_LINK, INTERVIEW_MODE, STATUS, CREATED_AT
       ) VALUES (
          RECRUITMENT_INTERVIEWS_SEQ.NEXTVAL, :app_id,
          TO_DATE(:d, 'YYYY-MM-DD'), :typ, :interviewer, :loc, :ivmode,
          'SCHEDULED', SYSDATE
       ) RETURNING INTERVIEW_ID INTO :out_id`,
      {
        app_id: appId,
        d: data.interview_date,
        typ: data.interview_type.trim().substring(0, 50),
        interviewer: display.substring(0, 200),
        loc: (data.location_or_link || "").trim().substring(0, 300) || null,
        ivmode: (data.interview_mode || "").trim().substring(0, 30) || null,
        out_id: ivOut
      },
      { autoCommit: false }
    );
    const interviewId = ivRes.outBinds.out_id[0];

    // Insert Assignment Rows
    const ids = [];
    for (const emp of codes) {
      const aOut = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER };
      const aRes = await connection.execute(
        `INSERT INTO INTERVIEW_ASSIGNMENTS (
            ASSIGNMENT_ID, APP_ID, INTERVIEW_ID, EMPCODE, INTERVIEW_TYPE,
            INTERVIEW_DATE, START_TIME, END_TIME, ASSIGNED_BY, ASSIGNED_ON,
            STATUS, REMARKS
         ) VALUES (
            INTERVIEW_ASSIGNMENTS_SEQ.NEXTVAL, :app_id, :iv_id, :emp, :typ,
            TO_DATE(:d, 'YYYY-MM-DD'), :startt, :endt, :addedby, SYSTIMESTAMP,
            'PENDING', :remarks
         ) RETURNING ASSIGNMENT_ID INTO :out_id`,
        {
          app_id: appId,
          iv_id: interviewId,
          emp,
          typ: data.interview_type.trim().substring(0, 50),
          d: data.interview_date,
          startt: start,
          endt: end,
          addedby: (String(assignedBy || "").trim() || "SYSTEM").substring(0, 20),
          remarks: (data.remarks || "").trim().substring(0, 500) || null,
          out_id: aOut
        },
        { autoCommit: false }
      );
      ids.push(aRes.outBinds.out_id[0]);
    }
    
    await connection.commit();
    return { status: "success", interview_id: interviewId, assignment_ids: ids, interviewers: display };
  } catch (e) {
    await connection?.rollback();
    return { status: "error", code: 500, message: e.message };
  } finally {
    await connection?.close();
  }
};

export const listInterviewAssignments = async (appId) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      SELECT ia.ASSIGNMENT_ID, ia.APP_ID, ia.INTERVIEW_ID, ia.EMPCODE,
             h.NAME, ia.INTERVIEW_TYPE,
             TO_CHAR(ia.INTERVIEW_DATE, 'YYYY-MM-DD') AS INTERVIEW_DATE,
             ia.START_TIME, ia.END_TIME, ia.ASSIGNED_BY,
             TO_CHAR(ia.ASSIGNED_ON, 'YYYY-MM-DD HH24:MI') AS ASSIGNED_ON,
             ia.STATUS, ia.REMARKS
      FROM INTERVIEW_ASSIGNMENTS ia
      LEFT JOIN HR_EMP_MASTER h ON h.EMPCODE = ia.EMPCODE
      WHERE ia.APP_ID = :id
      ORDER BY ia.INTERVIEW_DATE DESC, ia.START_TIME DESC, ia.ASSIGNMENT_ID DESC
    `;
    const res = await connection.execute(sql, { id: appId }, { outFormat: 4002 });
    return res.rows ? res.rows.map(r => ({
      assignment_id: r.ASSIGNMENT_ID,
      app_id: r.APP_ID,
      interview_id: r.INTERVIEW_ID,
      empcode: r.EMPCODE,
      name: r.NAME,
      interview_type: r.INTERVIEW_TYPE,
      interview_date: r.INTERVIEW_DATE,
      start_time: r.START_TIME,
      end_time: r.END_TIME,
      assigned_by: r.ASSIGNED_BY,
      assigned_on: r.ASSIGNED_ON,
      status: r.STATUS,
      remarks: r.REMARKS
    })) : [];
  } catch (e) {
    if (e.message.includes("ORA-00942")) return [];
    throw e;
  } finally {
    await connection?.close();
  }
};

// ------------------------------------------------------------------
// NOTIFICATIONS
// ------------------------------------------------------------------

export const listNotificationTemplates = async (eventType = null, notificationType = null, recipientType = null) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const conds = ["IS_ACTIVE = 'Y'"];
    const params = {};

    if (eventType) {
      conds.push("UPPER(EVENT_TYPE) = UPPER(:ev)");
      params.ev = String(eventType).trim();
    }
    if (notificationType) {
      conds.push("UPPER(NOTIFICATION_TYPE) = UPPER(:nt)");
      params.nt = String(notificationType).trim();
    }
    if (recipientType) {
      conds.push("UPPER(RECIPIENT_TYPE) = UPPER(:rt)");
      params.rt = String(recipientType).trim();
    }

    const where = conds.length ? "WHERE " + conds.join(" AND ") : "";

    const sql = `
      SELECT TEMPLATE_ID, TEMPLATE_NAME, NOTIFICATION_TYPE, RECIPIENT_TYPE,
             EVENT_TYPE, SUBJECT, MESSAGE_BODY, PLACEHOLDERS, IS_ACTIVE,
             CREATED_BY, TO_CHAR(CREATED_ON, 'YYYY-MM-DD') AS CREATED_ON
      FROM NOTIFICATION_TEMPLATES ${where}
      ORDER BY NOTIFICATION_TYPE, RECIPIENT_TYPE, TEMPLATE_ID
    `;
    const res = await connection.execute(sql, params, { 
      outFormat: 4002,
      fetchInfo: { 
        MESSAGE_BODY: { type: oracledb.STRING },
        PLACEHOLDERS: { type: oracledb.STRING } 
      }
    });
    
    // Parse placeholders from clob/string
    const rows = res.rows || [];
    for (const r of rows) {
      try {
        r.PLACEHOLDERS = JSON.parse(r.PLACEHOLDERS || "[]");
      } catch (e) {
        r.PLACEHOLDERS = [];
      }
    }
    return rows;
  } catch (e) {
    if (e.message.includes("ORA-00942")) return [];
    throw e;
  } finally {
    await connection?.close();
  }
};

const _render = (text, ctx) => {
  if (!text) return text;
  let out = text.replace(/\{\{([^}]+)\}\}/g, (_, key) => String(ctx[key] || ""));
  out = out.replace(/[ \t]+\n/g, "\n");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
};

const _fmtDuration = (start, end) => {
  try {
    const [sh, sm] = String(start).trim().substring(0, 5).split(":").map(Number);
    const [eh, em] = String(end).trim().substring(0, 5).split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) return "";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const parts = [];
    if (h) parts.push(`${h} hour${h > 1 ? "s" : ""}`);
    if (m) parts.push(`${m} minutes`);
    return parts.join(" ");
  } catch (e) {
    return "";
  }
};

const _messageContext = async (connection, appId, selectedBy) => {
  const ctx = { app_id: appId };
  
  const res1 = await connection.execute(`
    SELECT NVL(c.CANDIDATE_NAME, a.CANDIDATE_NAME) AS CANDIDATE_NAME,
           COALESCE(c.EMAIL, a.EMAIL) AS EMAIL,
           COALESCE(c.MOBILE, a.MOBILE) AS MOBILE,
           j.JOB_TITLE,
           j.COMPC
    FROM RECRUITMENT_APPLICATIONS a
    LEFT JOIN RECRUITMENT_CANDIDATES c ON c.CANDIDATE_ID = a.CANDIDATE_ID
    JOIN RECRUITMENT_JOBS j ON j.JOB_ID = a.JOB_ID
    WHERE a.APP_ID = :id
  `, { id: appId }, { outFormat: 4002 });
  if (!res1.rows || res1.rows.length === 0) return {};
  const row1 = res1.rows[0];
  ctx.candidate_name = String(row1.CANDIDATE_NAME || "").trim();
  ctx.candidate_email = String(row1.EMAIL || "").trim() || null;
  ctx.candidate_phone = String(row1.MOBILE || "").trim() || null;
  ctx.job_title = String(row1.JOB_TITLE || "").trim();
  const compc = row1.COMPC;
  
  ctx.company_name = "";
  if (compc !== null && compc !== undefined) {
    try {
      const uRes = await connection.execute(`SELECT UNIT_NAME FROM UNIT_MST WHERE UNIT_ID = :u`, { u: compc }, { outFormat: 4002 });
      if (uRes.rows && uRes.rows.length > 0) ctx.company_name = String(uRes.rows[0].UNIT_NAME || "").trim();
    } catch(e){}
  }

  ctx.interview_date = ""; ctx.interview_time = ""; ctx.duration = "";
  ctx.interview_mode = ""; ctx.location_or_link = ""; ctx.interview_round = "";
  ctx.instructions_note = "";
  let interviewId = null;
  
  try {
    const ivRes = await connection.execute(`
      SELECT INTERVIEW_ID, TO_CHAR(INTERVIEW_DATE, 'DD-MON-YYYY') AS INTERVIEW_DATE,
             INTERVIEW_TYPE, INTERVIEW_MODE, LOCATION_OR_LINK
      FROM RECRUITMENT_INTERVIEWS
      WHERE APP_ID = :id
      ORDER BY INTERVIEW_ID DESC
      FETCH FIRST 1 ROWS ONLY
    `, { id: appId }, { outFormat: 4002 });
    if (ivRes.rows && ivRes.rows.length > 0) {
      const r = ivRes.rows[0];
      interviewId = r.INTERVIEW_ID;
      ctx.interview_date = String(r.INTERVIEW_DATE || "").trim();
      ctx.interview_round = String(r.INTERVIEW_TYPE || "").trim();
      ctx.interview_mode = String(r.INTERVIEW_MODE || "").trim();
      ctx.location_or_link = String(r.LOCATION_OR_LINK || "").trim();
    }
  } catch(e){}

  try {
    const aRes = await connection.execute(`
      SELECT START_TIME, END_TIME, REMARKS, INTERVIEW_TYPE
      FROM INTERVIEW_ASSIGNMENTS
      WHERE APP_ID = :id AND (:iid IS NULL OR INTERVIEW_ID = :iid)
      ORDER BY ASSIGNMENT_ID DESC
      FETCH FIRST 1 ROWS ONLY
    `, { id: appId, iid: interviewId }, { outFormat: 4002 });
    if (aRes.rows && aRes.rows.length > 0) {
      const r = aRes.rows[0];
      const start = String(r.START_TIME || "").trim();
      const end = String(r.END_TIME || "").trim();
      if (start) {
        ctx.interview_time = end ? `${start} - ${end}` : start;
        ctx.duration = _fmtDuration(start, end);
      }
      ctx.instructions_note = String(r.REMARKS || "").trim();
      ctx.interview_round = ctx.interview_round || String(r.INTERVIEW_TYPE || "").trim();
    }
  } catch(e){}

  ctx.salary_offered = "";
  ctx.offer_date = "";
  try {
    const oRes = await connection.execute(`
      SELECT SALARY_OFFERED, TO_CHAR(OFFER_DATE, 'DD-MON-YYYY') AS OFFER_DATE
      FROM RECRUITMENT_OFFERS
      WHERE APP_ID = :id
      ORDER BY OFFER_ID DESC
      FETCH FIRST 1 ROWS ONLY
    `, { id: appId }, { outFormat: 4002 });
    if (oRes.rows && oRes.rows.length > 0) {
      const r = oRes.rows[0];
      if (r.SALARY_OFFERED !== null && r.SALARY_OFFERED !== undefined) {
        ctx.salary_offered = `PKR ${parseFloat(r.SALARY_OFFERED).toLocaleString('en-US', {maximumFractionDigits: 0})}`;
      }
      ctx.offer_date = String(r.OFFER_DATE || "").trim();
    }
  } catch(e){}

  ctx.recruiter_name = "";
  ctx.hr_contact = "";
  try {
    const hrRes = await connection.execute(`
      SELECT h.NAME, h.EMAIL, h."MOBILE#" AS MOBILE
      FROM HR_EMP_MASTER h
      LEFT JOIN EMPLOYEE e ON e.EMPCODE = h.EMPCODE
      WHERE h.EMPCODE = :sb OR TO_CHAR(e.CARD_NO) = :sb
      FETCH FIRST 1 ROWS ONLY
    `, { sb: String(selectedBy || "").trim() }, { outFormat: 4002 });
    if (hrRes.rows && hrRes.rows.length > 0) {
      const r = hrRes.rows[0];
      ctx.recruiter_name = String(r.NAME || "").trim();
      ctx.hr_contact = String(r.EMAIL || r.MOBILE || "").trim();
    }
  } catch(e){}

  return ctx;
};

export const createNotificationSelections = async (appId, data, selectedBy = "") => {
  if (!data.selections || data.selections.length === 0) {
    return { status: "error", code: 400, message: "No notifications selected" };
  }
  let connection;
  try {
    connection = await getDirectConnection();
    const appRes = await connection.execute("SELECT COUNT(*) AS CNT FROM RECRUITMENT_APPLICATIONS WHERE APP_ID = :id", { id: appId }, { outFormat: 4002 });
    if (appRes.rows[0].CNT === 0) return { status: "error", code: 404, message: "Application not found" };

    const baseCtx = await _messageContext(connection, appId, selectedBy);
    const createdBy = (String(selectedBy || "").trim() || "SYSTEM").substring(0, 20);

    const _insertMessage = async (templateId, eventType, ntype, rtype, empcode, personName, email, phone, subject, body) => {
      const outId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER };
      const res = await connection.execute(`
          INSERT INTO APP_NOTIFICATION_MESSAGES (
              MESSAGE_ID, APP_ID, TEMPLATE_ID, EVENT_TYPE,
              NOTIFICATION_TYPE, RECIPIENT_TYPE, EMPCODE, PERSON_NAME,
              EMAIL, PHONE, SUBJECT, MESSAGE_BODY, JOB_TITLE,
              INTERVIEW_MODE, STATUS, CREATED_BY, CREATED_ON
          ) VALUES (
              APP_NOTIF_MESSAGES_SEQ.NEXTVAL, :app_id, :tid, :ev,
              :nt, :rt, :emp, :pname,
              :email, :phone, :subj, :body, :jobt,
              :imode, 'PENDING', :cby, SYSTIMESTAMP
          ) RETURNING MESSAGE_ID INTO :out_id
      `, {
        app_id: appId, tid: templateId, ev: (eventType || "").substring(0, 50) || null,
        nt: ntype, rt: rtype, emp: empcode || null,
        pname: (personName || "").substring(0, 200) || null,
        email: (email || "").substring(0, 150) || null,
        phone: (phone || "").substring(0, 50) || null,
        subj: (subject || "").substring(0, 300) || null,
        body: body,
        jobt: (baseCtx.job_title || "").substring(0, 200) || null,
        imode: (baseCtx.interview_mode || "").substring(0, 30) || null,
        cby: createdBy, out_id: outId
      }, { autoCommit: false });
      return res.outBinds.out_id[0];
    };

    const created = [];
    for (const sel of data.selections) {
      const templateId = sel.template_id;
      const ntype = (sel.notification_type || "").trim().toUpperCase();
      const rtype = (sel.recipient_type || "").trim().toUpperCase();
      const empcodes = (sel.empcodes || []).map(e => String(e).trim()).filter(e => e);
      if (!["EMAIL", "WHATSAPP"].includes(ntype) || !["INTERVIEWER", "CANDIDATE"].includes(rtype)) {
        return { status: "error", code: 400, message: `Invalid notification/recipient type: ${ntype}/${rtype}` };
      }

      const tRes = await connection.execute(`
        SELECT NOTIFICATION_TYPE, RECIPIENT_TYPE, EVENT_TYPE, SUBJECT, MESSAGE_BODY
        FROM NOTIFICATION_TEMPLATES
        WHERE TEMPLATE_ID = :id AND IS_ACTIVE = 'Y'
      `, { id: templateId }, { outFormat: 4002, fetchInfo: { "MESSAGE_BODY": { type: oracledb.STRING } } });
      
      if (!tRes.rows || tRes.rows.length === 0) {
        return { status: "error", code: 400, message: `Template ${templateId} not found or inactive` };
      }
      const trow = tRes.rows[0];
      if ((trow.NOTIFICATION_TYPE || "").toUpperCase() !== ntype || (trow.RECIPIENT_TYPE || "").toUpperCase() !== rtype) {
        return { status: "error", code: 400, message: `Template ${templateId} is ${trow.NOTIFICATION_TYPE}/${trow.RECIPIENT_TYPE}, not ${ntype}/${rtype}` };
      }
      if (rtype === "INTERVIEWER" && empcodes.length === 0) {
        return { status: "error", code: 400, message: "Interviewer notification needs at least one interviewer" };
      }

      const eventType = String(trow.EVENT_TYPE || "").trim();
      const rawSubject = trow.SUBJECT;
      const rawBody = trow.MESSAGE_BODY;

      if (rtype === "CANDIDATE") {
        const ctx = { ...baseCtx };
        const msgId = await _insertMessage(
          templateId, eventType, ntype, rtype, null,
          baseCtx.candidate_name, baseCtx.candidate_email, baseCtx.candidate_phone,
          _render(rawSubject, ctx), _render(rawBody, ctx)
        );
        created.push({
          message_id: msgId, recipient_type: rtype, notification_type: ntype,
          person_name: baseCtx.candidate_name, email: baseCtx.candidate_email, phone: baseCtx.candidate_phone
        });
      } else {
        const ph = empcodes.map((_, i) => `:e${i}`).join(", ");
        const eParams = {};
        empcodes.forEach((v, i) => eParams[`e${i}`] = v);
        
        const hRes = await connection.execute(`
          SELECT EMPCODE, NAME, EMAIL, COALESCE("MOBILE#", NXT_MOBILE, "PHONE#") AS PHONE
          FROM HR_EMP_MASTER WHERE EMPCODE IN (${ph})
        `, eParams, { outFormat: 4002 });
        
        const info = {};
        if (hRes.rows) {
          hRes.rows.forEach(r => {
            info[String(r.EMPCODE).trim()] = {
              name: String(r.NAME || "").trim(),
              email: String(r.EMAIL || "").trim() || null,
              phone: String(r.PHONE || "").trim() || null
            };
          });
        }
        
        const names = {};
        for (const e of empcodes) {
          names[e] = info[e]?.name || e;
        }

        for (const emp of empcodes) {
          const others = empcodes.filter(o => o !== emp).map(o => names[o]).join(", ") || "—";
          const ctx = { ...baseCtx, panel_member_name: names[emp], panel_role: "Panel Member", other_panel_members: others };
          const iInfo = info[emp] || {};
          
          const msgId = await _insertMessage(
            templateId, eventType, ntype, rtype, emp,
            names[emp], iInfo.email, iInfo.phone,
            _render(rawSubject, ctx), _render(rawBody, ctx)
          );
          created.push({
            message_id: msgId, recipient_type: rtype, notification_type: ntype, empcode: emp,
            person_name: names[emp], email: iInfo.email, phone: iInfo.phone
          });
        }
      }
    }
    await connection.commit();
    return { status: "success", created };
  } catch (e) {
    await connection?.rollback();
    return { status: "error", code: 500, message: e.message };
  } finally {
    await connection?.close();
  }
};

export const listNotificationSelections = async (appId) => {
  let connection;
  try {
    connection = await getDirectConnection();
    const sql = `
      SELECT m.MESSAGE_ID, m.APP_ID, m.TEMPLATE_ID, t.TEMPLATE_NAME,
             m.EVENT_TYPE, m.NOTIFICATION_TYPE, m.RECIPIENT_TYPE,
             m.EMPCODE, m.PERSON_NAME, m.EMAIL, m.PHONE,
             m.SUBJECT, m.MESSAGE_BODY, m.JOB_TITLE, m.INTERVIEW_MODE,
             m.STATUS, m.CREATED_BY,
             TO_CHAR(m.CREATED_ON, 'YYYY-MM-DD HH24:MI') AS CREATED_ON
      FROM APP_NOTIFICATION_MESSAGES m
      LEFT JOIN NOTIFICATION_TEMPLATES t ON t.TEMPLATE_ID = m.TEMPLATE_ID
      WHERE m.APP_ID = :appId
      ORDER BY m.MESSAGE_ID DESC
    `;
    const res = await connection.execute(
      sql, 
      { appId }, 
      { 
        outFormat: 4002,
        fetchInfo: { "MESSAGE_BODY": { type: oracledb.STRING } }
      }
    );
    return res.rows ? res.rows.map(r => ({
      message_id: r.MESSAGE_ID,
      app_id: r.APP_ID,
      template_id: r.TEMPLATE_ID,
      template_name: r.TEMPLATE_NAME,
      event_type: r.EVENT_TYPE,
      notification_type: r.NOTIFICATION_TYPE,
      recipient_type: r.RECIPIENT_TYPE,
      empcode: r.EMPCODE,
      person_name: r.PERSON_NAME,
      email: r.EMAIL,
      phone: r.PHONE,
      subject: r.SUBJECT,
      message_body: r.MESSAGE_BODY,
      job_title: r.JOB_TITLE,
      interview_mode: r.INTERVIEW_MODE,
      status: r.STATUS,
      created_by: r.CREATED_BY,
      created_on: r.CREATED_ON
    })) : [];
  } catch (e) {
    if (e.message.includes("ORA-00942")) return [];
    throw e;
  } finally {
    await connection?.close();
  }
};
