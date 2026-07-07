import { authenticateUser, getProfile, lookupByPhone, changePassword } from '../services/auth.service.js';

export const login = async (req, res, next) => {
  try {
    const { username, password } = res.locals.validated.body;
    const result = await authenticateUser(username, password);
    if (!result)
      return res.status(401).json({ status: 'ERROR', message: 'Invalid username or password.' });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const profile = async (req, res, next) => {
  try {
    const { card_no } = res.locals.validated.params;
    const data = await getProfile(card_no);
    if (!data)
      return res.status(404).json({ status: 'ERROR', message: 'Employee not found.' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const lookup = async (req, res, next) => {
  try {
    const { phone } = res.locals.validated.params;
    const data = await lookupByPhone(phone);
    if (!data)
      return res.status(404).json({ status: 'ERROR', message: 'No employee found for this number.' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { card_no } = res.locals.validated.params;
    const { old_password, new_password } = res.locals.validated.body;
    console.log(`Attempting to change password for card_no: ${card_no}, old_password: ${old_password}, new_password: ${new_password}`); // Debugging line
    const result = await changePassword(card_no, old_password, new_password);
    if (!result.success)
      return res.status(400).json({ status: 'ERROR', message: 'Current password is incorrect.' });
    res.json({ status: 'SUCCESS', message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};
