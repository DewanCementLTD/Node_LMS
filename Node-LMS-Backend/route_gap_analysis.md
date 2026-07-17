# API Route Gap Analysis: FastAPI vs. Node.js Backend

This report provides a detailed audit of the Node.js backend (`Node-LMS-Backend`) compared against the original FastAPI backend (`LMS-Backend`). It identifies completely missing modules, individual missing endpoints, and critical functional, SQL, and error-handling discrepancies.

---

## 1. Summary of Route Coverage

| FastAPI Router File | Express Route File | Status | Gap Details |
| :--- | :--- | :--- | :--- |
| `app_version_router.py` | `appVersion.routes.js` | **Fully Ported** | Complete parity. |
| `auth_router.py` | `auth.routes.js` | **Partially Ported** | 1 endpoint missing, massive data mismatch in `/auth/profile`. |
| `attendance_router.py` | `auth.routes.js` (Attendance section) | **Partially Ported** | PDF report endpoint missing. |
| `document_router.py` | `documents.routes.js` | **Fully Ported** | Complete endpoint parity, but minor controller bugs. |
| `face_router.py` | *None* | **Missing Completely** | 5 face authentication endpoints missing. |
| `hr_router.py` | `hr.routes.js` | **Fully Ported** | Complete parity. |
| `hrms_router.py` | `hrms.routes.js` | **Fully Ported** | Complete parity. |
| `location_router.py` | `auth.routes.js` (Location section) | **Partially Ported** | 1 endpoint missing. |
| `location_tracking_router.py` | *None* | **Missing Completely** | 5 location tracking configuration/geofence endpoints missing. |
| `payroll_router.py` | *None* | **Missing Completely** | 22 payroll management endpoints missing. |
| `payroll_entry_router.py` | *None* | **Missing Completely** | 18 payroll entry/adjustments endpoints missing. |
| `recruitment_router.py` | *None* | **Missing Completely** | 14 recruitment/applicant tracking endpoints missing. |
| `upload_router.py` | *None* | **Missing Completely** | 3 upload tracking/history endpoints missing. |
| `reference_router.py` | `reference.routes.js` | **Fully Ported** | Complete parity. |

---

## 2. Completely Missing Route Modules

The following five route modules exist in the FastAPI backend but have no equivalent routes, controllers, schemas, or services implemented in Node.js.

### A. Recruitment Module (`/recruitment/*`)
Manages job postings, candidate applications, interview scheduling, and hiring offers.
*   `GET /recruitment/jobs` — List jobs (company/branch scoped)
*   `POST /recruitment/jobs` — Create a new job posting
*   `GET /recruitment/jobs/{job_id}` — Get single job details
*   `PUT /recruitment/jobs/{job_id}` — Update job posting
*   `GET /recruitment/applications` — List applications (job/status/company filtered)
*   `POST /recruitment/applications` — Add candidate application
*   `GET /recruitment/applications/{app_id}` — Get application details
*   `PATCH /recruitment/applications/{app_id}/status` — Shortlist or reject candidates
*   `GET /recruitment/interviews` — List scheduled interviews
*   `POST /recruitment/interviews` — Schedule a new interview
*   `PATCH /recruitment/interviews/{interview_id}` — Update interview status/details
*   `GET /recruitment/offers` — List employment offers
*   `POST /recruitment/offers` — Create a new offer letter record
*   `PATCH /recruitment/offers/{offer_id}` — Update offer status (e.g. accepted, declined)
*   `GET /recruitment/analytics` — Dashboard indicators for recruitment KPIs

### B. Payroll Module (`/payroll/*`)
Drives financial year opening, periods, tax slabs, loans, and salary processing.
*   `GET /payroll/pay-register/periods` — Periods list for pay register reports
*   `GET /payroll/pay-register` — Pay register report rows (scoped by unit)
*   `GET /payroll/financial-years` — List financial years
*   `POST /payroll/financial-years` — Create new financial year configuration
*   `PUT /payroll/financial-years/{rule_id}` — Update financial year settings
*   `PATCH /payroll/financial-years/{rule_id}/status` — Close or open a financial year
*   `GET /payroll/periods` — List monthly periods
*   `POST /payroll/periods` — Open a new monthly payroll period
*   `PATCH /payroll/periods/{period}/status` — Lock/unlock or block a period
*   `GET /payroll/tax-masters` — List tax rulesets
*   `POST /payroll/tax-masters` — Create a new tax master year
*   `PATCH /payroll/tax-masters/{tax_id}/status` — Enable/disable tax slab rules
*   `DELETE /payroll/tax-masters/{tax_id}` — Remove tax ruleset
*   `GET /payroll/tax-masters/{tax_id}/details` — Get tax slab details
*   `POST /payroll/tax-masters/{tax_id}/details` — Add tax slab range/rate
*   `DELETE /payroll/tax-masters/{tax_id}/details/{srno}` — Delete tax slab
*   `GET /payroll/loan-types` — List loan types
*   `POST /payroll/loan-types` — Add new loan type
*   `DELETE /payroll/loan-types/{loan_cd}` — Delete loan type
*   `GET /payroll/loans` — List active employee loans
*   `POST /payroll/loans` — Disburse new loan to employee
*   `PUT /payroll/loans/{doc}` — Update loan parameters
*   `DELETE /payroll/loans/{doc}` — Revoke/remove loan before processing
*   `GET /payroll/salary/periods` — List periods with processed salary sheet data
*   `GET /payroll/salary/sheet` — Processed salary sheet for verification
*   `GET /payroll/salary/payslip` — Individual employee payslip details
*   `GET /payroll/salary/open-period` — Show currently open salary period for a unit
*   `POST /payroll/salary/process` — Trigger the database salary processing PL/SQL engine

### C. Payroll Entry Module (`/payroll-entry/*`)
Enables HR inputs for monthly allowances, deductions, loan recoveries, and absent days.
*   `GET /payroll-entry/open-periods` — Active periods list for data entries
*   `GET /payroll-entry/recovery-types` — LOV for loan recovery types
*   `GET /payroll-entry/allowance-types` — LOV for allowances
*   `GET /payroll-entry/deduction-types` — LOV for deductions
*   `GET /payroll-entry/loans` — List recoverable loans in the current branch
*   `GET /payroll-entry/loan-recoveries` — View monthly loan recovery entries
*   `POST /payroll-entry/loan-recoveries` — Log a loan recovery adjustment
*   `DELETE /payroll-entry/loan-recoveries` — Remove recovery record
*   `GET /payroll-entry/allowances` — List monthly allowance entries
*   `POST /payroll-entry/allowances` — Upsert an employee allowance amount
*   `DELETE /payroll-entry/allowances` — Delete monthly allowance entry
*   `GET /payroll-entry/deductions` — List monthly deduction entries
*   `POST /payroll-entry/deductions` — Upsert an employee deduction amount
*   `DELETE /payroll-entry/deductions` — Delete monthly deduction entry
*   `GET /payroll-entry/absent-days` — List monthly employee absent day count entries
*   `GET /payroll-entry/absent-days/employee` — Get absent days for single employee
*   `POST /payroll-entry/absent-days` — Set absent days for an employee
*   `DELETE /payroll-entry/absent-days` — Reset/remove absent day entries

### D. Location Tracking Configuration Module (`/location-tracking/*`)
Provides settings and diagnostic statistics for mobile GPS tracking.
*   `GET /location-tracking/settings/{emp_code}` — Fetch GPS tracking toggle ('Y'/'N') and interval
*   `POST /location-tracking/settings/{emp_code}/update` — Update tracking toggle and hour interval
*   `GET /location-tracking/geofence/{emp_code}` — Geofence parameters (`LOCATION_FIXED`, `DEFAULT_LATITUDE`, `DEFAULT_LONGITUDE`, `MARGIN`)
*   `GET /location-tracking/active-employees` — List all employees currently set to track
*   `GET /location-tracking/statistics` — Summary stats (e.g. total tracking enabled vs disabled)

### E. Face Authentication Module (`/face/*`)
Drives face registration, verification, 1:N identification, and status checks.
*   `POST /face/register` — Process registration frames and save embeddings
*   `POST /face/verify` — Match frames against employee's registered face
*   `POST /face/identify` — Match frames against all registered faces (1:N search)
*   `GET /face/status/{card_no}` — Check if employee has registered face
*   `DELETE /face/delete/{card_no}` — Soft-delete face registration (sets `IS_ACTIVE = 'N'`)

### F. Image Uploads Tracking Module (`/upload/*`)
Used for general mobile photo uploads (separate from profile photos) with GPS stamp.
*   `POST /upload` — Upload image with location and device metadata to `IMG_UPLOAD_TRACKING`
*   `GET /upload/history/{empcode}` — Fetch recent image uploads history
*   `GET /upload/image/{filename}` — Serve uploaded image file

---

## 3. Missing Endpoints in Partially Ported Route Groups

The following individual endpoints exist in FastAPI but were omitted during the Express route porting process:

### A. Attendance Group (Under `/auth/attendance/*` in Node.js)
*   `GET /auth/attendance/report-pdf/{card_no}` — Serves a downloadable PDF report of the employee's attendance roster in a date range. ( Omitted entirely from `auth.routes.js` and `attendance.controller.js` ).

### B. Authentication Group (Under `/auth/*` in Node.js)
*   `POST /auth/emergency-contact/{card_no}` — Saves profile emergency contact details (`NAME`, `RELATIONSHIP`, `PHONE`) into `HR_EMP_MASTER` (uses `save_emergency_contact` in Python). ( Omitted from `auth.routes.js` and `auth.controller.js` ).

### C. Location Group (Under `/auth/location/*` in Node.js)
*   `GET /auth/location/my-history/{card_no}` — A self-service endpoint allowing an employee to retrieve their own GPS tracking history for a date without needing HR admin rights. ( Omitted from `auth.routes.js` and `location.controller.js` ).

---

## 4. Critical Functional & SQL Discrepancies

### A. Leave Application Logic (`leave.service.js` vs. `user_repository.py`)
This is the most severe functional gap. The Express implementation of `applyLeaveData` is incomplete and writes to the wrong table in a simplified structure that skips crucial HRMS features:
1.  **Wrong Target Table**: Express inserts into `LEAVE_APPLICATION`. FastAPI inserts into `LEAVE_APPLICATION_APPLY`.
2.  **Omitted Primary Key**: Express does not supply or generate the `LEAVE_APPLICATION_PK`. In FastAPI, this PK is mandatory and calculated as `NVL(MAX(LEAVE_APPLICATION_PK), 0) + 1` with automatic retries on collisions.
3.  **Invalid Employee Key**: Express inserts `card_no` directly into the `EMP_FK` field. In FastAPI, `EMP_FK` must be the numeric `EMP_PK` resolved from the `EMPLOYEE_F` table.
4.  **No Half-Day Support**: Express completely ignores `half_day`, `half_day_session`, `from_time`, and `to_time` parameters, and hardcodes `HRS = 0`. FastAPI properly calculates `leave_days = 0.5`, sets `HRS = 4` if `half_day` is true, and appends the half-day session time to the `reason` field.
5.  **Status Mismatch**: Express sets `APPROVAL_STATUS` to `'PENDING'`. FastAPI sets it to `'Waiting'`.
6.  **Missing Routing and Audit Columns**: Express does not populate `PREVIOUS_BALANCE`, `YEAR`, `TR_TYPE = 'Online'`, or the `HOD1_MNO`, `HOD2_MNO`, `HOD3_MNO` columns. Without these HOD phone columns, the approval workflow will break entirely.

### B. Profile Endpoint Mismatch (`auth.service.js` vs. `user_repository.py`)
The response schema of the `/auth/profile/:card_no` endpoint is severely degraded in Node.js:
1.  **FastAPI profile response** contains **30+ fields** fetched from `EMPLOYEE_F` view, with fallback queries against `HR_EMP_MASTER` and name-resolution lookups for designations/departments. It also queries the `ALL_LEAVE_BAL_V` view to calculate balance, and includes `emergency_contact` details.
2.  **Express profile response** contains only **9 fields** fetched from a basic query on `HR_EMP_MASTER`. Essential fields like `card_no`, `gender`, `address`, `salary`, `confirmation_date`, and `emergency_contact` are completely absent. This will cause runtime failures in the mobile app.

### C. Controller Error Handling Bugs (`documents.controller.js`)
Two endpoints in the document controller contain syntax and architectural bugs that will fail on error:
1.  **`listEmployeeDocuments` (Express `GET /documents`)**:
    *   **Bug**: The controller function is defined as `(req, res)` (omitting the `next` parameter) and logs the error to the console without sending any response back to the client. If the service throws an error (e.g. database timeout), the HTTP request will hang indefinitely.
2.  **`uploadDocument` (Express `POST /documents`)**:
    *   **Bug**: The controller function is defined as `(req, res)` (omitting `next`) but calls `next(err)` in the `catch` block. If an error occurs, Node.js will crash with `ReferenceError: next is not defined`.

### D. Employee Registration Code Race Condition (`hrms.service.js` vs. `hrms_repository.py`)
1.  **Race-Prone Query**: In Express `createEmployee`, after committing the insert statement, it queries `SELECT EMPCODE FROM HR_EMP_MASTER WHERE NAME = :name`. If two employees are registered with the same name, or if another insert occurs concurrently, it might return the wrong employee code.
2.  **FastAPI Safe Return**: The FastAPI codebase does not query the table after insertion; it simply returns the exact value returned by `get_next_empcode()`.
