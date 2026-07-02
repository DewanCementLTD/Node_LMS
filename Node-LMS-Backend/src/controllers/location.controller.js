import {
  batchInsertLocations,
  getLocationHistory,
  getLocationSummary,
  getLocationReportSummary,
  getLocationTrail,
} from "../services/location.service.js";
import { resolveFilterLists } from "../services/adminRights.service.js";
import { toList } from "../utils/conversionHelpers.js";

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
    const { date, admin_card_no, compc, brnch } = res.locals.validated.query;

    // Company/branch are always intersected with the admin's rights server-side.
    const { finalCompanies, finalBranches } = await resolveFilterLists(admin_card_no, compc, brnch);

    const employees = await getLocationSummary(date, finalCompanies, finalBranches);
    res.json({ body: { date, employees } });
  } catch (err) {
    next(err);
  }
};

export const locationReportSummary = async (req, res, next) => {
  try {
    const items = await getLocationReportSummary(res.locals.validated.query);

    res.json({
      status: "SUCCESS",
      items,
    });
  } catch (err) {
    next(err);
  }
};

export const locationTrail = async (req, res, next) => {
  try {
    const {
      from_date,
      to_date,
      admin_card_no,
      compc,
      brnch,
      dept_no,
      desg_cd,
      empcodes,
      region,
      category,
    } = res.locals.validated.query;

    // Company/branch are always intersected with the admin's rights server-side.
    const { finalCompanies, finalBranches } = await resolveFilterLists(admin_card_no, compc, brnch);

    const items = await getLocationTrail({
      fromDate: from_date,
      toDate: to_date,
      allowedCompanies: finalCompanies,
      allowedBranches: finalBranches,
      deptNo: toList(dept_no),
      desgCd: toList(desg_cd),
      empcodes: toList(empcodes),
      region: toList(region),
      category: toList(category),
    });

    res.json({ items, from_date, to_date });
  } catch (err) {
    next(err);
  }
};
