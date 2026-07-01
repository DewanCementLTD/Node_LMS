import {
  recordFaceAttendance,
  recordManualAttendance,
  getAttendanceRange,
  getAttendanceByDate,
  getAttendanceSummary,
} from '../services/attendance.service.js';

export const faceAttendance = async (req, res, next) => {
  try {
    const result = await recordFaceAttendance(res.locals.validated.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const manualAttendance = async (req, res, next) => {
  try {
    const { card_no } = res.locals.validated.params;
    const result = await recordManualAttendance(card_no, res.locals.validated.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const attendanceReportRange = async (req, res, next) => {
  try {
    const { card_no } = res.locals.validated.params;
    const { from_date, to_date } = res.locals.validated.query;
    const items = await getAttendanceRange(card_no, from_date, to_date);
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const attendanceReportByDate = async (req, res, next) => {
  try {
    const { card_no, date_str } = res.locals.validated.params;
    const data = await getAttendanceByDate(card_no, date_str);
    if (!data)
      return res.status(404).json({ status: 'ERROR', message: 'No attendance record found for this date.' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const attendanceSummary = async (req, res, next) => {
  try {
    const { emp_pk, from_date, to_date } = res.locals.validated.query;
    const data = await getAttendanceSummary(emp_pk, from_date, to_date);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
