import * as recruitmentService from "../services/recruitment.service.js";
import { resolveFilterLists } from "../services/adminRights.service.js";

const handleResult = (res, result) => {
  if (result.status === "error") {
    return res.status(result.code || 400).json({ detail: result.message });
  }
  return res.json(result);
};

const _getScope = async (req, res) => {
  const validatedQuery = res.locals?.validated?.query || {};
  const validatedBody = res.locals?.validated?.body || {};
  
  const admin_card = validatedQuery.admin_card_no || req.query.admin_card_no || validatedBody.admin_card_no || req.body?.admin_card_no;
  const c = validatedQuery.compc || req.query.compc || validatedBody.compc || req.body?.compc;
  const b = validatedQuery.brnch || req.query.brnch || validatedBody.brnch || req.body?.brnch;

  const { finalCompanies, finalBranches } = await resolveFilterLists(admin_card, c, b);
  return { final_c: finalCompanies, final_b: finalBranches, req_c: c, admin_card };
};

// ===================================
// JOBS
// ===================================

export const listJobs = async (req, res, next) => {
  try {
    const { status } = req.query;
    const { final_c, final_b } = await _getScope(req, res);
    const items = await recruitmentService.listJobs(status, final_c, final_b);
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const createJob = async (req, res, next) => {
  try {
    const data = res.locals.validated.body;
    const { final_c, req_c, admin_card } = await _getScope(req, res);
    
    if (final_c.length > 0 && req_c && !final_c.includes(String(req_c))) {
      return res.status(403).json({ detail: "Cannot create job for this company." });
    }
    
    handleResult(res, await recruitmentService.createJob(data, admin_card));
  } catch (err) {
    next(err);
  }
};

export const getJob = async (req, res, next) => {
  try {
    const { job_id } = req.params;
    const job = await recruitmentService.getJob(job_id);
    if (!job) return res.status(404).json({ detail: "Job not found" });
    
    const { final_c } = await _getScope(req, res);
    if (final_c.length > 0 && job.compc && !final_c.includes(String(job.compc))) {
      return res.status(404).json({ detail: "Job not found" });
    }
    
    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const { job_id } = req.params;
    const data = res.locals.validated.body;
    
    const job = await recruitmentService.getJob(job_id);
    if (!job) return res.status(404).json({ detail: "Job not found" });
    
    const { final_c } = await _getScope(req, res);
    if (final_c.length > 0 && job.compc && !final_c.includes(String(job.compc))) {
      return res.status(404).json({ detail: "Job not found" });
    }
    
    handleResult(res, await recruitmentService.updateJob(job_id, data));
  } catch (err) {
    next(err);
  }
};

// ===================================
// APPLICATIONS
// ===================================

export const listApplications = async (req, res, next) => {
  try {
    const { status, job_id } = req.query;
    const { final_c, final_b } = await _getScope(req, res);
    const items = await recruitmentService.listApplications(status, job_id, final_c, final_b);
    res.json({ items: recruitmentService.lowerKeys(items) });
  } catch (err) {
    next(err);
  }
};

export const createApplication = async (req, res, next) => {
  try {
    const data = res.locals.validated.body;
    const { admin_card } = await _getScope(req, res);
    handleResult(res, await recruitmentService.createApplication(data, admin_card));
  } catch (err) {
    next(err);
  }
};

export const getApplication = async (req, res, next) => {
  try {
    const { app_id } = req.params;
    const app = await recruitmentService.getApplication(app_id);
    if (!app) return res.status(404).json({ detail: "Application not found" });
    res.json(recruitmentService.lowerKeys(app));
  } catch (err) {
    next(err);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { app_id } = req.params;
    const { status, notes } = res.locals.validated.body;
    handleResult(res, await recruitmentService.updateApplicationStatus(app_id, status, notes));
  } catch (err) {
    next(err);
  }
};

// ===================================
// INTERVIEWS
// ===================================

export const listInterviews = async (req, res, next) => {
  try {
    const { status, app_id } = req.query;
    const { final_c, final_b } = await _getScope(req, res);
    const items = await recruitmentService.listInterviews(status, app_id, final_c, final_b);
    res.json({ items: recruitmentService.lowerKeys(items) });
  } catch (err) {
    next(err);
  }
};

export const createInterview = async (req, res, next) => {
  try {
    const data = res.locals.validated.body;
    const { admin_card } = await _getScope(req, res);
    handleResult(res, await recruitmentService.createInterview(data, admin_card));
  } catch (err) {
    next(err);
  }
};

export const updateInterview = async (req, res, next) => {
  try {
    const { interview_id } = req.params;
    const data = res.locals.validated.body;
    handleResult(res, await recruitmentService.updateInterview(interview_id, data));
  } catch (err) {
    next(err);
  }
};

// ===================================
// OFFERS
// ===================================

export const listOffers = async (req, res, next) => {
  try {
    const { status } = req.query;
    const { final_c, final_b } = await _getScope(req, res);
    const items = await recruitmentService.listOffers(status, final_c, final_b);
    res.json({ items: recruitmentService.lowerKeys(items) });
  } catch (err) {
    next(err);
  }
};

export const createOffer = async (req, res, next) => {
  try {
    const data = res.locals.validated.body;
    const { admin_card } = await _getScope(req, res);
    handleResult(res, await recruitmentService.createOffer(data, admin_card));
  } catch (err) {
    next(err);
  }
};

export const updateOffer = async (req, res, next) => {
  try {
    const { offer_id } = req.params;
    const data = res.locals.validated.body;
    handleResult(res, await recruitmentService.updateOffer(offer_id, data));
  } catch (err) {
    next(err);
  }
};

// ===================================
// ANALYTICS
// ===================================

export const getAnalytics = async (req, res, next) => {
  try {
    const { final_c, final_b } = await _getScope(req, res);
    res.json(await recruitmentService.getAnalytics(final_c, final_b));
  } catch (err) {
    next(err);
  }
};

// ===================================
// CANDIDATES (Talent Pool)
// ===================================

export const listCandidates = async (req, res, next) => {
  try {
    const { search } = req.query;
    const { final_c, final_b } = await _getScope(req, res);
    const items = await recruitmentService.listCandidates(search, final_c, final_b);
    res.json({ items: recruitmentService.lowerKeys(items) });
  } catch (err) {
    next(err);
  }
};

export const createCandidate = async (req, res, next) => {
  try {
    const data = res.locals.validated.body;
    const { final_c, final_b, req_c } = await _getScope(req, res);
    
    if (final_c.length > 0 && req_c && !final_c.includes(String(req_c))) {
      return res.status(403).json({ detail: "Cannot create candidate for this company." });
    }
    
    const result = await recruitmentService.createCandidate(data, final_c, final_b);
    if (result.status === "duplicate") {
      return res.status(409).json({ detail: result.message, candidate_id: result.candidate_id });
    }
    handleResult(res, result);
  } catch (err) {
    next(err);
  }
};

export const getCandidate = async (req, res, next) => {
  try {
    const { candidate_id } = req.params;
    const cand = await recruitmentService.getCandidate(candidate_id);
    if (!cand) return res.status(404).json({ detail: "Candidate not found" });
    
    const { final_c } = await _getScope(req, res);
    if (final_c.length > 0 && cand.compc && !final_c.includes(String(cand.compc))) {
      return res.status(404).json({ detail: "Candidate not found" });
    }
    
    res.json(recruitmentService.lowerKeys(cand));
  } catch (err) {
    next(err);
  }
};

export const updateCandidate = async (req, res, next) => {
  try {
    const { candidate_id } = req.params;
    const data = res.locals.validated.body;
    handleResult(res, await recruitmentService.updateCandidate(candidate_id, data));
  } catch (err) {
    next(err);
  }
};

// ===================================
// INTERVIEW PANEL
// ===================================

export const listPanelPool = async (req, res, next) => {
  try {
    const { final_c, final_b } = await _getScope(req, res);
    const items = await recruitmentService.listPanelPool(final_c, final_b);
    res.json(recruitmentService.lowerKeys(items));
  } catch (err) {
    next(err);
  }
};

export const addPanelMembers = async (req, res, next) => {
  try {
    const { empcodes } = res.locals.validated.body;
    const { final_c, final_b, admin_card } = await _getScope(req, res);
    handleResult(res, await recruitmentService.addPanelMembers(empcodes, final_c, final_b, admin_card));
  } catch (err) {
    next(err);
  }
};

export const deactivatePanelRow = async (req, res, next) => {
  try {
    const { id } = req.params;
    handleResult(res, await recruitmentService.deactivatePanelRow(id));
  } catch (err) {
    next(err);
  }
};

export const deactivatePanelMember = async (req, res, next) => {
  try {
    const { empcode } = res.locals.validated.body;
    const { final_c, final_b } = await _getScope(req, res);
    handleResult(res, await recruitmentService.deactivatePanelMember(empcode, final_c, final_b));
  } catch (err) {
    next(err);
  }
};

export const panelOptionsForApp = async (req, res, next) => {
  try {
    const { app_id } = req.params;
    const items = await recruitmentService.panelOptionsForApp(app_id);
    res.json({ items: recruitmentService.lowerKeys(items) });
  } catch (err) {
    next(err);
  }
};

export const createInterviewAssignments = async (req, res, next) => {
  try {
    const { app_id } = req.params;
    const data = res.locals.validated.body;
    const { admin_card } = await _getScope(req, res);
    handleResult(res, await recruitmentService.createInterviewAssignments(app_id, data, admin_card));
  } catch (err) {
    next(err);
  }
};

export const listInterviewAssignments = async (req, res, next) => {
  try {
    const { app_id } = req.params;
    const items = await recruitmentService.listInterviewAssignments(app_id);
    res.json({ items: recruitmentService.lowerKeys(items) });
  } catch (err) {
    next(err);
  }
};

// ===================================
// NOTIFICATIONS
// ===================================

export const listNotificationTemplates = async (req, res, next) => {
  try {
    const { event_type, notification_type, recipient_type } = req.query;
    const items = await recruitmentService.listNotificationTemplates(event_type, notification_type, recipient_type);
    res.json({ items: recruitmentService.lowerKeys(items) });
  } catch (err) {
    next(err);
  }
};

export const createNotificationSelections = async (req, res, next) => {
  try {
    const { app_id } = req.params;
    const data = res.locals.validated.body;
    const { admin_card } = await _getScope(req, res);
    handleResult(res, await recruitmentService.createNotificationSelections(app_id, data, admin_card));
  } catch (err) {
    next(err);
  }
};

export const listNotificationSelections = async (req, res, next) => {
  try {
    const { app_id } = req.params;
    const items = await recruitmentService.listNotificationSelections(app_id);
    res.json({ items: recruitmentService.lowerKeys(items) });
  } catch (err) {
    next(err);
  }
};
