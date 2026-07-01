import {
  batchInsertLocations,
  getLocationHistory,
  getLocationSummary,
  getLocationReportSummary,
  getLocationTrail,
} from '../services/location.service.js';

export const locationBatch = async (req, res, next) => {
  try {
    const { card_no, locations } = res.locals.validated.body;
    const result = await batchInsertLocations(card_no, locations);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const locationHistory = async (req, res, next) => {
  try {
    const { card_no } = res.locals.validated.params;
    const { date } = res.locals.validated.query;
    const items = await getLocationHistory(card_no, date);
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const locationSummary = async (req, res, next) => {
  try {
    const { date, compc, brnch } = res.locals.validated.query;
    const items = await getLocationSummary(date, compc, brnch);
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const locationReportSummary = async (req, res, next) => {
  try {
    const items = await getLocationReportSummary(res.locals.validated.query);
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const locationTrail = async (req, res, next) => {
  try {
    const items = await getLocationTrail(res.locals.validated.query);
    res.json({ items });
  } catch (err) {
    next(err);
  }
};
