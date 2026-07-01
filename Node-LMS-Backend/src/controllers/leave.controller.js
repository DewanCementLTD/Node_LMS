import { getLeaveBalancesData, getLeaveStatusData, applyLeaveData } from '../services/leave.service.js';

export const getLeaveBalances = async (req, res, next) => {
  try {
    const { card_no } = res.locals.validated.params;
    const items = await getLeaveBalancesData(card_no);
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const getLeaveStatus = async (req, res, next) => {
  try {
    const { card_no } = res.locals.validated.params;
    const items = await getLeaveStatusData(card_no);
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const applyLeave = async (req, res, next) => {
  try {
    const { card_no } = res.locals.validated.params;
    const result = await applyLeaveData(card_no, res.locals.validated.body);
    if (!result.success)
      return res.status(404).json({ status: 'ERROR', message: 'Employee not found.' });
    res.json({ status: 'SUCCESS', message: 'Leave application submitted.' });
  } catch (err) {
    next(err);
  }
};
