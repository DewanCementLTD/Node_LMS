import express from "express";
import * as recruitmentController from "../controllers/recruitment.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireHrAdmin } from "../middlewares/hrAdmin.middleware.js";
import * as schemas from "../models/recruitment.schema.js";

const router = express.Router();

// All recruitment routes require HR Admin access
router.use(requireHrAdmin);

// ===================================
// JOBS
// ===================================
router.get("/jobs", recruitmentController.listJobs);
router.post("/jobs", validate(schemas.jobCreateSchema), recruitmentController.createJob);
router.get("/jobs/:job_id", recruitmentController.getJob);
router.put("/jobs/:job_id", validate(schemas.jobUpdateSchema), recruitmentController.updateJob);

// ===================================
// APPLICATIONS
// ===================================
router.get("/applications", recruitmentController.listApplications);
router.post("/applications", validate(schemas.applicationCreateSchema), recruitmentController.createApplication);
router.get("/applications/:app_id", recruitmentController.getApplication);
router.patch("/applications/:app_id/status", validate(schemas.applicationStatusUpdateSchema), recruitmentController.updateApplicationStatus);

// ===================================
// INTERVIEWS
// ===================================
router.get("/interviews", recruitmentController.listInterviews);
router.post("/interviews", validate(schemas.interviewCreateSchema), recruitmentController.createInterview);
router.patch("/interviews/:interview_id", validate(schemas.interviewUpdateSchema), recruitmentController.updateInterview);

// ===================================
// OFFERS
// ===================================
router.get("/offers", recruitmentController.listOffers);
router.post("/offers", validate(schemas.offerCreateSchema), recruitmentController.createOffer);
router.patch("/offers/:offer_id", validate(schemas.offerUpdateSchema), recruitmentController.updateOffer);

// ===================================
// ANALYTICS
// ===================================
router.get("/analytics", recruitmentController.getAnalytics);

// ===================================
// CANDIDATES (Talent Pool)
// ===================================
router.get("/candidates", recruitmentController.listCandidates);
router.post("/candidates", validate(schemas.candidateCreateSchema), recruitmentController.createCandidate);
router.get("/candidates/:candidate_id", recruitmentController.getCandidate);
router.put("/candidates/:candidate_id", validate(schemas.candidateUpdateSchema), recruitmentController.updateCandidate);

// ===================================
// INTERVIEW PANEL
// ===================================
router.get("/panel-pool", recruitmentController.listPanelPool);
router.post("/panel-pool", validate(schemas.panelPoolAddSchema), recruitmentController.addPanelMembers);
router.delete("/panel-pool/:id", recruitmentController.deactivatePanelRow);
router.post("/panel-pool/deactivate", validate(schemas.panelPoolDeactivateSchema), recruitmentController.deactivatePanelMember);

router.get("/applications/:app_id/interview-panel-options", recruitmentController.panelOptionsForApp);
router.post("/applications/:app_id/interview-assignments", validate(schemas.interviewAssignmentCreateSchema), recruitmentController.createInterviewAssignments);
router.get("/applications/:app_id/interview-assignments", recruitmentController.listInterviewAssignments);

// ===================================
// NOTIFICATIONS
// ===================================
router.get("/notification-templates", recruitmentController.listNotificationTemplates);
router.post("/applications/:app_id/notification-selections", validate(schemas.notificationSelectionsCreateSchema), recruitmentController.createNotificationSelections);
router.get("/applications/:app_id/notification-selections", recruitmentController.listNotificationSelections);

export default router;
