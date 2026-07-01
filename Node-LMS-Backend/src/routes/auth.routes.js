import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware.js';

// Schemas
import { loginSchema, changePasswordSchema, card_noSchema, phoneSchema } from '../models/auth.schema.js';
import {
  faceAttendanceSchema,
  manualAttendanceSchema,
  attendanceRangeSchema,
  attendanceDateSchema,
  attendanceSummarySchema,
} from '../models/attendance.schema.js';
import { applyLeaveSchema } from '../models/leave.schema.js';
import {
  locationBatchSchema,
  locationHistorySchema,
  locationSummarySchema,
  locationReportSchema,
} from '../models/location.schema.js';

// Controllers
import { login, profile, lookup, updatePassword } from '../controllers/auth.controller.js';
import { getDashboard } from '../controllers/dashboard.controller.js';
import {
  faceAttendance,
  manualAttendance,
  attendanceReportRange,
  attendanceReportByDate,
  attendanceSummary,
} from '../controllers/attendance.controller.js';
import { getLeaveBalances, getLeaveStatus, applyLeave } from '../controllers/leave.controller.js';
import {
  locationBatch,
  locationHistory,
  locationSummary,
  locationReportSummary,
  locationTrail,
} from '../controllers/location.controller.js';

const router = Router();
// Append /auth to all routes defined in this file
// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
router.post('/login',                    validate(loginSchema),          login); //-- http://localhost:8000/auth/login?username="3458000041"&password="abcd1234"
router.get( '/profile/:card_no',         validate(card_noSchema),        profile); // http://localhost:8000/auth/profile/100002.1
router.get( '/lookup/:phone',            validate(phoneSchema),           lookup);     // http://localhost:8000/auth/lookup/03363052865
router.post('/change-password/:card_no', validate(changePasswordSchema), updatePassword); // 

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
router.get('/dashboard/:card_no', validate(card_noSchema), getDashboard); // http://localhost:8000/auth/dashboard/100660.1

// ---------------------------------------------------------------------------
// Attendance  (specific routes BEFORE /:card_no wildcard)
// ---------------------------------------------------------------------------
router.post('/attendance/face',                          validate(faceAttendanceSchema),   faceAttendance);
router.get( '/attendance/summary',                       validate(attendanceSummarySchema), attendanceSummary); // http://localhost:8000/auth/attendance/summary?emp_pk=100002.1&from_date=2026-07-01&to_date=2026-07-31
router.get( '/attendance/report-range/:card_no',         validate(attendanceRangeSchema),  attendanceReportRange); //-- http://localhost:8000/auth/attendance/report-range/100660.1?from_date=2026-01-01&to_date=2026-07-31
router.get( '/attendance/report/:card_no/:date_str',     validate(attendanceDateSchema),   attendanceReportByDate); //-- http://localhost:8000/auth/attendance/report/100660.1/2026-06-29
router.post('/attendance/:card_no',                      validate(manualAttendanceSchema), manualAttendance);

// ---------------------------------------------------------------------------
// Leave
// ---------------------------------------------------------------------------
router.get( '/leave-balances/:card_no', validate(card_noSchema),   getLeaveBalances); // http://localhost:8000/auth/leave-balances/100358.1
router.get( '/leave-status/:card_no',   validate(card_noSchema),   getLeaveStatus); // http://localhost:8000/auth/leave-status/100358.1
router.post('/apply-leave/:card_no',    validate(applyLeaveSchema), applyLeave);


// ---------------------------------------------------------------------------
// Location  (specific routes BEFORE /:card_no wildcard)
// ---------------------------------------------------------------------------
router.post('/location/batch',           validate(locationBatchSchema),   locationBatch);
router.get( '/location/report/summary',  validate(locationReportSchema),  locationReportSummary);
router.get( '/location/report/trail',    validate(locationReportSchema),  locationTrail);
router.get( '/location/summary',         validate(locationSummarySchema), locationSummary);
router.get( '/location/history/:card_no',validate(locationHistorySchema), locationHistory);

export default router;
