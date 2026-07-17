# FastAPI (LIVE) vs Node.js Backend — Full Route, Functional & Live-Usage Audit

**Date:** 2026-07-17
**Scope:** A complete, source-verified comparison of the LIVE production FastAPI backend (copied into `[LIVE] HRMS_COMPLETE/LMS-Backend` and `[LIVE] HRMS_COMPLETE/LMS-Face-Backend`) against the in-progress Node.js port (`Node-LMS-Backend`), plus a live-usage audit of every endpoint against the LIVE frontend (`[LIVE] HRMS_COMPLETE/LMS-Web`).

This document **supersedes** the previous `route_gap_analysis.md` in this repo — several of its claims (upload_router.py existing, LEAVE_APPLICATION_APPLY table, profile field-count mismatch) are stale/incorrect against the current source and are corrected below. Where this audit disagrees with the old one, that is called out explicitly.

> **Mobile app note:** The copied `[LIVE] HRMS_COMPLETE` directory contains only `LMS-Backend`, `LMS-Face-Backend`, `LMS-Web`, `docs`, `start_all.bat`. **No mobile app (`LMS_APP`) is present in this copy.** All "live usage" findings below are therefore based on `LMS-Web` (Next.js admin/employee web portal) only. Endpoints that exist purely to serve a mobile client (face auth, app-version-check, manual/face attendance punch) cannot be shown as "used" by this audit even though they may be actively used in production by a mobile app that simply isn't in this repo copy.

---

## 1. Executive Summary

| Metric | Value |
|---|---|
| Total FastAPI endpoints (13 routers + face microservice) | ~160 (155 in LMS-Backend's 13 routers + 5 in the separate LMS-Face-Backend microservice) |
| Fully missing in Node (entire module) | **Payroll (28), Payroll-Entry (18), Recruitment (36), Location-Tracking (5), Face (5)** = **92 endpoints, ~58% of all FastAPI routes** |
| Individually missing endpoints in otherwise-ported modules | 5 (`PUT /hrms/duty-roster/entry/{pk}`, 3× `/reference/interview-types`, `GET /hr/employees/search` is ported but see bugs) |
| Endpoints ported and functionally equivalent | The bulk of `auth`, `attendance`, `location` (minus location-tracking), `documents`, `hr`, `hrms`, `reference`, `app_version` |
| New, real bugs found in *ported* code (not just gaps) | **13** — see §5, ranked by severity. Includes 1 exploitable authorization bug, 1 attendance data-integrity regression, 2 request-hang/crash bugs, several wrong-table/wrong-column SQL bugs |
| Endpoints confirmed actively used by LMS-Web | The large majority of `hrms`, `payroll`, `payroll-entry`, `recruitment`, `reference` calls (once ported) plus core `auth`/`attendance`/`documents`/`location` flows |
| Endpoints confirmed **dead** even in FastAPI/LMS-Web today | All of `face_router` (5), all of `app_version_router` (2, mobile-only), 4/5 `location_tracking_router`, `/auth/lookup/{phone}`, 3 attendance endpoints (face-punch, manual-punch, single-day report), ~12 payroll/recruitment/reference functions that are defined but never called |

**Bottom line:** The Node port is functionally solid for the employee self-service and HR-admin "core HR" surface (auth, attendance, leave, documents, location live-tracking, employee CRUD, reference data) but **payroll, payroll-entry, and recruitment are 0% ported** — and those three modules are the ones most heavily used by the live web app's HR-admin panels. Location-tracking (geofence/settings) and standalone face auth are also 0% ported. Beyond the gaps, the auth/attendance/location group has one **exploitable authorization bug** and one **attendance-data-integrity regression** that should be treated as high priority even before new features are ported.

---

## 2. How this audit was produced

Four independent deep-dive passes were run against the current source (not the stale prior audit):

1. **Auth / Attendance / Leave / Location / Location-Tracking** — full endpoint inventory + SQL/logic/error-handling diff.
2. **Documents / HR / HRMS / Reference / App-Version / Face** — full endpoint inventory + SQL/logic/error-handling diff, plus the standalone `LMS-Face-Backend` microservice.
3. **Payroll / Payroll-Entry / Recruitment** — full endpoint inventory and confirmation of missing status (grep-verified across all of `Node-LMS-Backend/src`).
4. **LMS-Web live-usage mapping** — every `services/*.ts` function traced to its backend path, then traced forward to every page/component that actually calls it, to distinguish "used in production" from "defined but dead."

FastAPI mount prefixes were confirmed from `LMS-Backend/main.py`'s `app.include_router(...)` calls, not assumed from filenames.

---

## 3. Full Route Coverage Matrix

| FastAPI Router | Prefix | # Endpoints | Node Coverage | Status |
|---|---|---|---|---|
| `app_version_router.py` | `/app` | 2 | 2/2 | ✅ Fully ported, confirmed correct |
| `auth_router.py` | `/auth` | 8 | 8/8 | ✅ Ported — see §5 for 2 regressions (login force-update, dashboard columns) |
| `attendance_router.py` | `/auth` | 5 | 5/5 | ✅ Ported — see §5 for smart-attendance logic regression |
| `location_router.py` | `/auth` | 5 | 5/5 | ✅ Ported — see §5 for **authorization bug** on report/summary |
| `location_tracking_router.py` | `/location-tracking` | 5 | **0/5** | ❌ **Completely missing** — includes the safety-critical geofence endpoint |
| `document_router.py` | `/documents` | 10 | 10/10 | ✅ Ported — see §5 for 2 bugs + 2 SQL issues |
| `face_router.py` | `/face` | 5 | **0/5** | ❌ **Completely missing** as standalone routes (partially reachable only via `/hr/face/enroll`) |
| `hr_router.py` | `/hr` | 2 | 2/2 | ✅ Ported — see §5 for SQL discrepancy |
| `hrms_router.py` | `/hrms` | 12 | **11/12** | ⚠️ Missing `PUT /hrms/duty-roster/entry/{pk}` (previously unflagged); 1 SQL bug |
| `reference_router.py` | `/reference` | 37 | **34/37** | ⚠️ Missing `/reference/interview-types` (GET/POST/DELETE, previously unflagged) |
| `payroll_router.py` | `/payroll` | 28 | **0/28** | ❌ **Completely missing** |
| `payroll_entry_router.py` | `/payroll-entry` | 18 | **0/18** | ❌ **Completely missing** |
| `recruitment_router.py` | `/recruitment` | 36 | **0/36** | ❌ **Completely missing** |
| `LMS-Face-Backend` (separate microservice) | `/face/*` (own app) | 5 | N/A | Out of scope — never called by `LMS-Backend` either; independent InsightFace/FAISS service |

Corrections to the prior `route_gap_analysis.md`:
- There is **no `upload_router.py`** in the current FastAPI codebase. File uploads live entirely under `document_router.py` and are fully ported.
- `LEAVE_APPLICATION` (not `LEAVE_APPLICATION_APPLY`) is the correct table on **both** sides — the previously-flagged table mismatch does not exist in the current code.
- The `/auth/profile` "9 fields vs 30 fields" concern is stale: FastAPI's `response_model=ProfileResponse` already restricts the live JSON response to the same 9 fields Node returns.

---

## 4. Completely Missing Modules (0% ported) — full endpoint list

### 4.1 Payroll (`/payroll/*`) — 28 endpoints, **highest business risk**

| Method | Path | What it does |
|---|---|---|
| GET | `/payroll/pay-register/periods` | Periods for the pay-register report |
| GET | `/payroll/pay-register` | Pay-register report rows |
| GET | `/payroll/financial-years` | List financial years |
| POST | `/payroll/financial-years` | Create financial year (optionally auto-generates periods) |
| PUT | `/payroll/financial-years/{rule_id}` | Update financial year |
| PATCH | `/payroll/financial-years/{rule_id}/status` | Open/close financial year |
| GET | `/payroll/periods` | List monthly periods |
| POST | `/payroll/periods` | Open new period |
| PATCH | `/payroll/periods/{period}/status` | Lock/unlock/block period — **gates all payroll-entry writes** |
| GET | `/payroll/tax-masters` | List tax masters |
| POST | `/payroll/tax-masters` | Create tax master |
| PATCH | `/payroll/tax-masters/{tax_id}/status` | Enable/disable |
| DELETE | `/payroll/tax-masters/{tax_id}` | Delete tax master |
| GET | `/payroll/tax-masters/{tax_id}/details` | Tax slab brackets |
| POST | `/payroll/tax-masters/{tax_id}/details` | Add slab bracket |
| DELETE | `/payroll/tax-masters/{tax_id}/details/{srno}` | Delete slab bracket |
| GET | `/payroll/loan-types` | List loan types |
| POST | `/payroll/loan-types` | Add loan type |
| DELETE | `/payroll/loan-types/{loan_cd}` | Delete loan type |
| GET | `/payroll/loans` | List employee loans |
| POST | `/payroll/loans` | Disburse loan |
| PUT | `/payroll/loans/{doc}` | Update loan |
| DELETE | `/payroll/loans/{doc}` | Delete loan |
| GET | `/payroll/salary/periods` | Periods with processed salary |
| GET | `/payroll/salary/sheet` | Processed salary sheet |
| GET | `/payroll/salary/payslip` | Single employee payslip |
| GET | `/payroll/salary/open-period` | Currently open period |
| POST | `/payroll/salary/process` | **Triggers Oracle PL/SQL proc `HR_SALARY_PROCES_PRO`** — commits internally inside the DB; highest-risk endpoint in the whole audit |

### 4.2 Payroll-Entry (`/payroll-entry/*`) — 18 endpoints

| Method | Path | What it does |
|---|---|---|
| GET | `/payroll-entry/open-periods` | Open periods for data entry |
| GET | `/payroll-entry/recovery-types` | Loan recovery type LOV |
| GET | `/payroll-entry/allowance-types` | Allowance type LOV |
| GET | `/payroll-entry/deduction-types` | Deduction type LOV |
| GET | `/payroll-entry/loans` | Loans eligible for recovery entry |
| GET | `/payroll-entry/loan-recoveries` | Recovery entries |
| POST | `/payroll-entry/loan-recoveries` | Record a recovery |
| DELETE | `/payroll-entry/loan-recoveries` | Delete recovery |
| GET | `/payroll-entry/allowances` | Monthly allowance entries |
| POST | `/payroll-entry/allowances` | Upsert allowance |
| DELETE | `/payroll-entry/allowances` | Delete allowance entry |
| GET | `/payroll-entry/deductions` | Monthly deduction entries |
| POST | `/payroll-entry/deductions` | Upsert deduction |
| DELETE | `/payroll-entry/deductions` | Delete deduction entry |
| GET | `/payroll-entry/absent-days` | Absent-day entries |
| GET | `/payroll-entry/absent-days/employee` | Per-employee absent days |
| POST | `/payroll-entry/absent-days` | Set absent days |
| DELETE | `/payroll-entry/absent-days` | Remove absent-day entry |

All mutating endpoints here key off the currently **open period** managed by `/payroll/periods/{period}/status` — porting payroll-entry before payroll's period-locking logic risks writes against periods that should be closed.

### 4.3 Recruitment (`/recruitment/*`) — 36 endpoints

Full applicant-tracking system: jobs, AI-based candidate matching/scoring, applications, interviews (with 409 double-booking conflict detection), interview panel pool, notification templates/selections, offers, CV bulk upload (feeds an **external AI screening pipeline** watching a filesystem drop folder), candidate talent pool, and recruitment analytics. See the standalone detail table in the original agent report for the full per-endpoint list (all 36 confirmed missing) — key highlights:

- `POST /recruitment/jobs/{job_id}/match` and `GET /recruitment/jobs/{job_id}/top-candidates` — LLM-backed matching, depends on an external `AI/` pipeline directory, not pure CRUD.
- `POST /recruitment/candidates/upload-cvs` — drops PDFs into `EMP_DOCS/<Company>/<Branch>/RECRUITMENT_CVS/...`, watched asynchronously by an out-of-band process not part of this router's code at all.
- `POST /recruitment/candidates/{candidate_id}/apply` — uses FastAPI `BackgroundTasks` to fire an async AI evaluation; Express has no direct equivalent (would need `setImmediate`/a queue).
- `POST /recruitment/applications/{app_id}/interview-assignments` — real conflict-detection business logic (409 on double-booking), not a passthrough insert.

Both `payroll_router.py` and `recruitment_router.py` share company/branch-scoping helpers with `hrms_router.py` (`_resolve_filter_lists`/`_get_admin_rights`). Node already has `services/adminRights.service.js`, which is the likely Node analog — reusing it would meaningfully de-risk porting either module instead of re-deriving scoping logic from scratch.

### 4.4 Location-Tracking (`/location-tracking/*`) — 5 endpoints, **safety-critical gap**

| Method | Path | What it does |
|---|---|---|
| GET | `/location-tracking/settings/{emp_code}` | GPS tracking toggle + interval |
| POST | `/location-tracking/settings/{emp_code}/update` | Update toggle/interval |
| GET | `/location-tracking/geofence/{emp_code}` | `LOCATION_FIXED`, `DEFAULT_LATITUDE`, `DEFAULT_LONGITUDE`, `MARGIN` |
| GET | `/location-tracking/active-employees` | List employees with tracking on |
| GET | `/location-tracking/statistics` | Tracking coverage stats |

Confirmed by full-source grep — **zero** trace of `geofence`, `LOCATION_FIXED`, `MARGIN`, `DEFAULT_LATITUDE`/`DEFAULT_LONGITUDE` anywhere in `Node-LMS-Backend`. `TRACK_LOCATION`/`TRACK_LOCATION_HR` only appear as two ordinary fields inside the employee-CRUD payload in `hrms.service.js` — there is no dedicated settings-read, geofence-read, active-employee-list, or statistics endpoint. **The geofence endpoint is what a mobile client uses to gate attendance check-in/out by distance from the office** — its absence means Node cannot support that safety check at all today.

### 4.5 Face Authentication (`/face/*`) — 5 endpoints

| Method | Path | What it does |
|---|---|---|
| POST | `/face/register` | Save face embeddings during registration |
| POST | `/face/verify` | Match frames against one employee's registered face |
| POST | `/face/identify` | 1:N match against all registered faces |
| GET | `/face/status/{card_no}` | Whether an employee has a registered face |
| DELETE | `/face/delete/{card_no}` | Soft-delete (`IS_ACTIVE='N'`) |

`Node-LMS-Backend/src/services/face.service.js` exists and is a faithful port of FastAPI's `face_service.py`/`face_repository.py` register/status logic — but it is **only wired into `POST /hr/face/enroll`** (the HR-admin-initiated enrollment flow). None of the 5 standalone endpoints above have a Node route, controller, or even a service export (`verifyFace`, `identifyFace`, `deleteFace`, and the "list all registered employees" query needed for 1:N search are all absent from `face.service.js`). A client (mobile app) pointed at the Node server for self-service face register/verify/identify/status/delete would get a 404 on all five.

Separately, the standalone **`LMS-Face-Backend`** microservice (`face_rec/api.py`, InsightFace/FAISS-backed, its own FastAPI app) implements real face matching for its own `/face/register|verify|identify|status|delete` routes — but `LMS-Backend` never calls it (no HTTP client call to it anywhere in the FastAPI source), so it's an entirely separate system, out of scope for this Node port, not a "hidden" implementation of `face_router.py`.

---

## 5. Bugs & Regressions Found in Code That *IS* Ported (ranked by severity)

These are not gaps — they are places where the Node implementation exists but behaves differently from FastAPI in a way that matters.

### 🔴 Critical

**1. `GET /auth/location/report/summary` — HR-admin company/branch scoping not enforced (exploitable authorization bug)**
`controllers/location.controller.js` → `services/location.service.js:318-451` (`getLocationReportSummary`) never calls `resolveFilterLists(admin_card_no, ...)`, unlike its sibling `locationTrail` (same file) which does. Result: any authenticated HR admin can retrieve every company's location-tracking data simply by omitting `compc`/`brnch` from the query string — `requireHrAdmin` only checks that the caller is *some* active admin, not which companies they're scoped to. FastAPI enforces this on both `/report/summary` and `/report/trail`; Node only enforces it on `/report/trail`.
**Fix:** call `resolveFilterLists(admin_card_no, compc, brnch)` in `getLocationReportSummary` exactly as `getLocationTrail` already does.

**2. Smart attendance (`POST /auth/attendance/{card_no}`, `/auth/attendance/face`) — two logic gaps corrupt attendance data**
`services/attendance.service.js`'s `smartMarkAttendance` (line ~410) is missing, relative to FastAPI's `smart_mark_attendance`:
- **Overnight-shift closure**: FastAPI checks for a still-open check-in from a prior night's overnight shift and closes it; Node has no such check (confirmed absent by full-text search for "overnight") — night-shift employees get a spurious new check-in instead of their prior shift being closed.
- **60-minute double-tap guard**: FastAPI treats a second mark within 60 minutes of check-in as a no-op ("already checked in"); Node immediately treats any second mark as a check-out, writing `EXIT_TIME`/`TIME_SPENT ≈ 0`. An accidental double-tap right after clocking in wrongly checks the employee out.

### 🟠 High

**3. `POST /auth/login` — no force-update (426) guard**
FastAPI blocks outdated mobile app versions from logging in (`force_update_block`, HTTP 426). Node's `login` controller never calls the already-existing, already-correctly-used-elsewhere `forceUpdateBlock` from `appVersion.service.js`, even though `loginSchema` already carries `app_version`/`app_build`/`platform`. Outdated clients are silently let through the Node backend.

**4. `documents.controller.js` — two request-handling bugs**
- `listEmployeeDocuments` (`GET /documents`, line ~60): catches errors but only `console.error`s — **never sends a response**. A DB error hangs the client's request until timeout.
- `uploadDocument` (`POST /documents`, line ~71): declared as `(req, res)` (no `next` param) but its `catch` block calls `next(err)` → `ReferenceError: next is not defined`, an unhandled exception inside an async catch handler on every upload failure.

**5. `documents.service.js` — wrong storage root default**
`DOCS_ROOT` defaults to `E:\...\Node-LMS-Backend\EMP_PHOTOS`; FastAPI defaults to `C:\Erp_Systems\HRMS_LMS_APP\EMP_DOCS` — different drive, different folder name. Unless `EMP_DOCS_ROOT` is explicitly set to match production in Node's environment, files written by one backend won't be found by the other during any phased cutover.

**6. `documents.service.js` — `empcodeForCard` joins on a nonexistent column**
`empcodeForCard` (used by both `/documents/my-photo` endpoints) joins `EMPLOYEE e ON e.EMP_NO = h.EMPCODE` — no other query anywhere in either codebase uses an `EMP_NO` column; every other join uses `e.EMPCODE = h.EMPCODE`. This will either throw at query time or silently return no rows, breaking employee self-service photo upload/view for affected users while FastAPI's equivalent (`e.EMPCODE = h.EMPCODE`) succeeds.

### 🟡 Medium

**7. `GET /hr/employees/search` — wrong face-status source + row-duplication risk**
FastAPI reads `EMPLOYEE.FACE_REGISTERED` directly. Node instead `LEFT JOIN`s `EMP_FACE_EMBEDDINGS` with **no `IS_ACTIVE='Y'` filter and no de-duplication** — an employee with an old soft-deleted embedding plus a new one will appear as **multiple rows** in search results, and the reported `face_registered` flag can disagree with FastAPI's for the same employee.

**8. `GET /hrms/employees/{empcode}/card` — missing company scope on designation lookup**
The `DESIGNATION` subquery in Node's ID-card query drops the `AND TO_CHAR(dg.COMPC)=TO_CHAR(m.UNIT_ID)` predicate that FastAPI (and Node's own `DEPARTMENT` subquery two lines below it) correctly applies. In a multi-company DB with reused `DESG_CD` codes, this can print the wrong company's designation on an employee's ID card.

**9. `GET /auth/dashboard/{card_no}` — different source columns than FastAPI**
Node resolves `department` (from `HR_DEPT.DEPT_NAME`, a resolved name) and `designation` (from `EMPLOYEE.DESIGNATION`, an entirely different table/column) differently from FastAPI (`h.DEPT_NO`/`h.DESG_CD`, raw codes). `hod`/`hod_nm` are sourced from `RPT_OFFICER` in Node vs. `HOD1` in FastAPI — these are different columns and not guaranteed to hold the same value, so the dashboard can show a different "reports to" person than FastAPI for the same employee. Node also lacks FastAPI's join-failure fallback and per-field balance-lookup isolation, so one query error 500s the whole dashboard instead of degrading gracefully.

**10. `GET /auth/profile/{card_no}` — department/designation join lacks FastAPI's zero-padding fuzzy match**
FastAPI intentionally uses `LTRIM(DEPT_NO,'0')=LTRIM(:v,'0')` because department/designation codes can differ in leading-zero formatting between `HR_EMP_MASTER` and `HR_DEPT`/`HR_DESG` (per FastAPI's own code comments). Node's `getProfile` uses a plain equi-join with no `LTRIM` — for any employee where this zero-padding mismatch actually occurs (the exact scenario FastAPI's fix was written for), Node will silently return `NULL` department/designation where FastAPI resolves it correctly.

**11. Error-response envelope is inconsistent across the Node codebase**
FastAPI uniformly returns `{"detail": "..."}` for every error. Node has **three different shapes** in active use:
- `{ detail: ... }` — correct, used by `documents`, `reference`, some of `attendance`/`location`.
- `{ status: "ERROR", message: ... }` (generic, from the global handler in `app.js`) — used for any error that reaches `next(err)` in most `auth`, `hrms` controllers.
- `{ status: "ERROR", message: "HR admin access required" }` (a third, HR-admin-specific shape) — from `hrAdmin.middleware.js`'s 403 gate, shared by every `/hr`, `/hrms`, and admin-only `/reference` route.

Any client parsing `error.detail` (the FastAPI-trained convention) gets `undefined` for the majority of error paths through `hr`/`hrms`/the shared admin gate. This is a one-line-per-handler fix but touches a wide surface.

### 🟢 Low / Notes

**12.** `changePasswordSchema` requires `new_password.length >= 8`; FastAPI has no such constraint — stricter than source, could reject requests FastAPI would accept. Likely a deliberate improvement, but a real behavioral divergence.

**13.** `GET /auth/location/report/summary` (same endpoint as bug #1) additionally only supports single-value equality filters for dept/designation and drops multi-value `IN (...)` support that its sibling `/report/trail` has, and its designation-name lookup is also missing the company-scope predicate (same class of bug as #8). Response shape also differs: Node omits `from_date`/`to_date` that FastAPI includes and adds an extra `status` field FastAPI doesn't send.

### ✅ Confirmed correct / stale-audit corrections (no action needed)

- `/auth/profile` field count matches FastAPI's actual (response-model-limited) 9-field output — the prior audit's "30 vs 9 fields" claim does not hold against current source.
- `POST /auth/apply-leave/{card_no}` is one of the most faithful ports found — identical table (`LEAVE_APPLICATION`), columns, literal values, and PK strategy on both sides. Neither backend actually uses the `half_day`/`type` fields in business logic — a shared FastAPI limitation, not a Node regression.
- `app_version_router.py` is genuinely fully ported with matching fallback/degrade logic.
- `POST /auth/attendance/face`, attendance summary/report-range/report-by-date, `/auth/location/batch`, `/auth/location/summary`, `/auth/location/history`, `/auth/location/report/trail` all match FastAPI closely.

---

## 6. Individually Missing Endpoints in Otherwise-Ported Modules

| Endpoint | Module | Notes |
|---|---|---|
| `PUT /hrms/duty-roster/entry/{pk}` | hrms | HR can view a roster entry via Node but cannot edit its shift/remarks — write path missing. **Used by LMS-Web** (`DutyRosterPanel.tsx:69`), so this is a live gap, not just theoretical. |
| `GET /reference/interview-types` | reference | Missing, no Node route/controller/service function at all |
| `POST /reference/interview-types` | reference | Missing |
| `DELETE /reference/interview-types/{type_id}` | reference | Missing — all three **used by LMS-Web** (`RecruitmentPanel.tsx:2414`, `SetupPanel.tsx:531,685,686`) |

---

## 7. Live Usage: What LMS-Web Actually Calls

Frontend (`LMS-Web`) talks to the FastAPI backend at `BACKEND_URL=http://163.61.91.221:8001` via a Next.js rewrite (`/api/:path*` → backend), through `services/api.ts`'s `apiRequest()`. No hardcoded URLs or path typos were found — every call maps to a real FastAPI route.

### 7.1 Usage summary by router

| Router | Endpoints used by LMS-Web | Endpoints never called by LMS-Web |
|---|---|---|
| `auth_router.py` | login, dashboard, leave-balances, apply-leave, leave-status, profile, change-password (7/8) | `GET /auth/lookup/{phone}` — no service wrapper at all |
| `attendance_router.py` | summary, report-range (2/5) | face-punch, manual-punch, single-day report — mobile/kiosk-only or dead |
| `document_router.py` | 9/10 (all except company-logo GET, which likely renders inline — not fully confirmed) | — |
| `face_router.py` | **0/5** | Entire module unreachable from web — no `faceService.ts` exists at all |
| `hr_router.py` | employees/search (1/2) | `POST /hr/face/enroll` — unreachable from web |
| `hrms_router.py` | **12/12** | — fully used, including the currently-missing-in-Node `PUT /duty-roster/entry/{pk}` |
| `location_router.py` | summary, history, report/trail, report/summary (4/5, via direct `apiRequest` calls for the first two, bypassing a typed service wrapper) | `POST /auth/location/batch` — code exists client-side (`locationTracker.ts`) but that module is **never imported anywhere**, so it never fires in practice |
| `location_tracking_router.py` | settings/update only (1/5) | settings-read, geofence, active-employees, statistics — all unused by web (would be mobile-only if implemented) |
| `payroll_router.py` | 26/28 | `PUT /payroll/financial-years/{rule_id}`, `POST /payroll/periods` — service functions exist but are never invoked from any UI |
| `payroll_entry_router.py` | **18/18** | — fully used |
| `recruitment_router.py` | 27/36 | `GET /jobs/{id}`, `POST /jobs/{id}/match`, `GET /applications/{id}`, `GET /applications/{id}/evaluation`, `POST /interviews` (superseded by interview-assignments), `DELETE /panel-pool/{id}` (superseded by the scope-aware deactivate), `GET .../interview-assignments`, `GET .../notification-selections` |
| `reference_router.py` | 32/37 | `POST /reference/grades`, `POST /reference/cadre` (imported but never called), `POST /reference/units` |
| `app_version_router.py` | **0/2** | Mobile-only, no web use case |

### 7.2 Notable live-usage findings

- **`locationTracker.ts` (the GPS background-capture poller) is dead code** — it is never imported anywhere in the app. `POST /auth/location/batch` is fully implemented client-side (buffering, retry, flush) but never actually fires from the live web app.
- **`face_router` and `app_version_router` are 100% unreachable from LMS-Web** — consistent with being mobile-app-only surfaces. Since no mobile app is present in this repo copy, this audit cannot confirm real-world usage of those 7 endpoints either way — only that the web client never touches them.
- **`hrms_router` and `payroll_entry_router` are the two modules used at 100%** by the live web app — meaning porting payroll-entry to Node (once payroll's period-locking exists) would immediately restore full HR-admin functionality parity for that module.
- `/reference/locations` and `/auth/location/summary`/`/history` are called through **both** the typed service layer **and** raw inline `apiRequest()` calls in `LocationPanel.tsx` — duplicate client logic hitting the same valid endpoints (not a bug, but a maintenance risk).
- Roughly a dozen service functions across payroll/recruitment/reference are defined and even imported in some cases, but never actually invoked by any button/handler — see the detailed list in the agent transcript if a full dead-code cleanup pass is wanted (`updateFinancialYear`, `createPeriod`, `createInterview`, `deactivatePanelPoolRow`, `listInterviewAssignments`, `listNotificationSelections`, `addGrade`, `addUnit`, `addCadre`, `fetchAttendanceReport`, plus the recruitment matching trigger and a few single-record GETs).

---

## 8. Prioritized Recommendations

1. **Fix the location-report-summary authorization bug (§5.1) immediately** — it's a live data-exposure issue in currently-deployed Node code, not a missing feature, and requires only mirroring the fix already present two functions away in the same file.
2. **Fix the smart-attendance overnight/double-tap regressions (§5.2)** before Node attendance handles any real night-shift traffic — this is silently corrupting attendance records today for any night-shift employee routed through Node.
3. **Add the login force-update guard (§5.3)** — one function call, already implemented and used correctly elsewhere.
4. **Fix the two `documents.controller.js` bugs (§5.4)** — both are unhandled-error paths that hang or crash requests; trivial fixes (add `next`, call it).
5. **Normalize error-response shape to `{detail}` everywhere (§5.11)** — mechanical but wide-reaching; do this before shipping any new module so new code doesn't perpetuate three different conventions.
6. **Port `payroll_entry_router.py` (18 endpoints) next** — it is used at 100% by the live web app, and every endpoint is comparatively low-risk CRUD *once* the period-locking state from `payroll_router.py` exists to gate it correctly.
7. **Port the period/financial-year-locking subset of `payroll_router.py`** as a prerequisite for #6 (it's the gating mechanism, and the salary-processing endpoint is separable and can be deferred).
8. **Defer `POST /payroll/salary/process`, the recruitment AI-matching/CV pipeline, and the recruitment background-task-based `apply` endpoint** — these depend on external systems (PL/SQL stored proc with internal commit; LLM evaluator; filesystem CV watcher) and need an architecture decision (how does Express replace FastAPI `BackgroundTasks`?) before porting, not just translation.
9. **Port `location-tracking` geofence + settings endpoints** if any mobile client is actually live against the Node backend — this is a safety-relevant gap, not a nice-to-have, if mobile attendance geofencing is meant to work through Node.
10. **Decide the fate of standalone `/face/*`** — either implement the 4 missing service functions (`verifyFace`, `identifyFace`, `deleteFace`, list-all-registered) on top of the existing `face.service.js` foundation, or confirm the mobile app will keep using `LMS-Face-Backend` directly and treat this as intentionally out of scope.
11. Low-priority SQL correctness fixes (§5.7–5.10) can be batched together since they're all "add a missing COMPC scope / LTRIM / correct join column" style one-liners.
