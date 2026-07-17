# Oracle Database Tables & Views — Full Catalogue

**Date:** 2026-07-17
**Scope:** Every Oracle table/view referenced anywhere in the LIVE FastAPI backend source (`[LIVE] HRMS_COMPLETE/LMS-Backend/repositories/`, `services/`, `core/`, and any inline SQL in `routers/`), plus the standalone face-recognition microservice (`[LIVE] HRMS_COMPLETE/LMS-Face-Backend/face_rec/`).

**Total distinct tables/views catalogued: 62** (60 tables + 2 confirmed views by naming convention — several other objects are documented in code comments as "view-like" even though they don't carry a `_V` suffix; these are flagged individually below).

> This is a **source-code-derived** catalogue — it lists exactly what the application queries/writes, not a DBA export of the schema. Column names shown are the ones actually selected/bound in code, not necessarily the full column list of the underlying object.

---

## 1. Quick-Reference Index

| # | Object | Type | Domain(s) | Ops |
|---|---|---|---|---|
| 1 | `HR_EMP_MASTER` | Table | auth, attendance, location, hr, hrms, documents, face, payroll, payroll-entry, recruitment, reference | S, I, U |
| 2 | `EMPLOYEE` | View* | auth, attendance, location, hr, hrms, face, recruitment, reference | S, U |
| 3 | `SEC_USERNAME` | Table | auth, hr | S |
| 4 | `SEC_USERCMPN` | Table | auth, hr | S |
| 5 | `SEC_USERBRCH` | Table | auth, hr | S |
| 6 | `COMPANY_INFO` | Table | auth, hr, documents | S, U |
| 7 | `COM_LOCATION` | Table | auth, hr, location, documents, payroll, reference, recruitment | S, I, U |
| 8 | `ALL_LEAVE_BAL_V` | **View** | auth | S |
| 9 | `LEAVE_APPLICATION` | Table | auth, hr | S, I |
| 10 | `LEAVE_TYPES` | Table | hr | S |
| 11 | `ATTENDANCE_RECORDS` | Table | attendance, hr, location | S, I, U, MERGE |
| 12 | `DUTY_ROSTER` | Table | attendance, hr | S, U |
| 13 | `TMS_DUTY_ROSTER_V` | **View** | attendance, hr | S |
| 14 | `SHIFT_HEAD` | Table | attendance, reference | S, I, U, D |
| 15 | `LOCATION_TRACKS` | Table | location, attendance | S, I |
| 16 | `HR_EMP_QUALIFICATION` | Table | hrms, reference | S, U, I, D |
| 17 | `HR_EMP_MASTER_SAL` | Table (view-like) | hrms | S |
| 18 | `HR_DEPT` | Table | hrms, hr, location, payroll, payroll-entry, salary, reference | S, I |
| 19 | `HR_DESG` | Table | hrms, location, payroll-entry, salary, reference | S, I |
| 20 | `UNIT_MST` | Table | hrms, documents, salary, reference, recruitment, notifications | S, I |
| 21 | `HR_DOCUMENT` | Table | documents | S, I, D |
| 22 | `EMP_FACE_EMBEDDINGS` | Table | face | S, I, U, D |
| 23 | `HR_ATTND_PERIOD` | Table | payroll, payroll-entry, salary | S, I, U |
| 24 | `HR_SALARY_PROCESS_MASTER` | Table | payroll, salary | S |
| 25 | `HR_FINANCIAL_YEAR` | Table | payroll | S, I, U |
| 26 | `HR_TAX_MST` | Table | payroll | S, I, U, D |
| 27 | `HR_TAX_DTL` | Table | payroll | S, I, D |
| 28 | `HR_LOAN_TYPE` | Table | payroll, payroll-entry, salary | S, I, D |
| 29 | `HR_LOAN_MST` | Table | payroll, payroll-entry, salary | S, I, U, D |
| 30 | `HR_LOAN_RECOVERY` | Table | payroll-entry | S, I, D |
| 31 | `HR_ALLOWANCE` | Table | payroll-entry, salary | S |
| 32 | `HR_MONTHLY_ALLOW` | Table | payroll-entry | S, MERGE, D |
| 33 | `HR_DEDUCTION` | Table | payroll-entry, salary | S |
| 34 | `HR_MONTHLY_DED` | Table | payroll-entry | S, MERGE, D |
| 35 | `HR_ABSENT_DAYS` | Table | payroll-entry | S, MERGE, D |
| 36 | `HR_PAY_REG_V` | **View** | payroll | S |
| 37 | `hr_emp_master_view` | **View** | payroll | S |
| 38 | `HR_SALARY_PROCESS` | Table | salary | S |
| 39 | `HR_EMP_STATUS` | Table | salary, reference | S, I, D |
| 40 | `APP_VERSION` | Table | app_version | S |
| 41 | `HR_GRADE_CD` | Table | reference | S, I |
| 42 | `HR_BANK` | Table | reference | S, I, D |
| 43 | `HR_BRANCH` | Table | reference | S, I, D |
| 44 | `HR_SHIFT` | Table | reference | S |
| 45 | `BLOOD_GROUP` | Table | reference | S, I |
| 46 | `CADRE` | Table | reference | S, I |
| 47 | `INTERVIEW_PANEL_POOL` | Table (self-provisioning) | recruitment | S, I, U |
| 48 | `INTERVIEW_ASSIGNMENTS` | Table (self-provisioning) | recruitment | S, I |
| 49 | `INTERVIEW_TYPES` | Table (self-provisioning) | recruitment, reference | S, I, U |
| 50 | `RECRUITMENT_JOBS` | Table | recruitment | S, I, U |
| 51 | `RECRUITMENT_APPLICATIONS` | Table | recruitment | S, I, U |
| 52 | `RECRUITMENT_INTERVIEWS` | Table | recruitment | S, I, U |
| 53 | `RECRUITMENT_OFFERS` | Table | recruitment | S, I, U |
| 54 | `RECRUITMENT_CANDIDATES` | Table | recruitment | S, I, U |
| 55 | `RECRUITMENT_CANDIDATE_EDUCATION` | Table | recruitment | S, I, D |
| 56 | `RECRUITMENT_CANDIDATE_EXPERIENCE` | Table | recruitment | S, I, D |
| 57 | `RECRUITMENT_CANDIDATE_SKILLS` | Table | recruitment | S, I, D |
| 58 | `RECRUITMENT_AI_EVALUATIONS` | Table | recruitment | S, I |
| 59 | `RECRUITMENT_AI_STRENGTHS` | Table | recruitment | S, I |
| 60 | `RECRUITMENT_AI_WEAKNESSES` | Table | recruitment | S, I |
| 61 | `NOTIFICATION_TEMPLATES` | Table (self-provisioning) | recruitment | S, I |
| 62 | `APP_NOTIFICATION_MESSAGES` | Table (self-provisioning) | recruitment | S, I |

*`EMPLOYEE` is documented in code comments as a view whose internal scalar subqueries can throw `ORA-01427` for certain rows — the app works around this by never selecting its computed columns. One `UPDATE EMPLOYEE ...` statement exists (password change), suggesting it may be updatable or is a base-table alias in some environments — flagged as a data-quality note in §9.

Ops legend: **S**=SELECT, **I**=INSERT, **U**=UPDATE, **D**=DELETE, **MERGE**=Oracle MERGE (upsert)

---

## 2. Core Employee / Auth / Security Tables

### `HR_EMP_MASTER`
- **Type:** Table — the primary employee master (code explicitly avoids the `EMPLOYEE` view for some lookups to dodge `ORA-01427`, confirming this is the more reliable base table)
- **Used by:** every module in the system, directly or via join
- **Representative refs:** `repositories/user_repository.py:22-30,111-341,473-580,601-769`; `repositories/hrms_repository.py:93-984` (primary CRUD target); `repositories/location_repository.py:178-464`; `repositories/document_repository.py:46,199-226`; `core/dependencies.py:30-158`; `routers/location_tracking_router.py` (geofence/tracking settings)
- **Operations:** SELECT (extensive), INSERT (`create_employee`), UPDATE (`update_employee`, photo path, tracking/geofence settings)
- **Purpose:** Core HR employee master — name, father's name, card/mobile numbers, DOB, NIC, department/designation codes, company (`UNIT_ID`) & branch (`LOCATION`), HOD chain (`HOD1`/`HOD2`/`HOD3`), login credentials (`USER_PASWD`, `HR_ADMIN`), salary fields (`BASIC`/`GROSS`), geofence config (`LOCATION_FIXED`/`DEFAULT_LATITUDE`/`DEFAULT_LONGITUDE`/`MARGIN`), and location-tracking config (`TRACK_LOCATION`/`TRACK_LOCATION_HR`).

### `EMPLOYEE`
- **Type:** View (per code comments — "a view whose internal scalar subqueries throw `ORA-01427` for certain users")
- **Used by:** auth, attendance, location, hr, hrms, face, recruitment, reference (mostly as a join bridge)
- **Representative refs:** `repositories/user_repository.py:26-28,173-199,275-334,358-459,942-950`; `repositories/attendance_repository.py:190,233-280`; `services/hr_service.py:14-27`; `LMS-Face-Backend/face_rec/face_login.py:379-387`
- **Operations:** SELECT (heavy); one **UPDATE** (`user_repository.update_password`) — notable since `EMPLOYEE` is elsewhere treated as a view
- **Purpose:** Card-number-centric employee record — `CARD_NO` (e.g. `100002.1`), `EMPCODE`, `EMP_PK`, `COMPC`/`BRNCH`, `EMP_NAME`, `DEPARTMENT`/`DESIGNATION` text, `FACE_REGISTERED` flag, `MOBILE_NO`, `USER_PASWD`. The join bridge between login `card_no` and `HR_EMP_MASTER`'s `EMPCODE`.

### `SEC_USERNAME`
- **Type:** Table
- **Used by:** auth, hr (admin rights)
- **Refs:** `repositories/user_repository.py:22-30,53-69,125-159`; `core/dependencies.py:135-150`
- **Operations:** SELECT only
- **Purpose:** ERP HR-admin login/security account — `USRID`, `DESCR` (display name), `PASWD` (decrypted via `datacrypt.decryptdata`), `MOBILE`, `ECODE`, `ULEVL` (privilege level, `'M'` = can edit salary), `STATS` (`'E'` = enabled). First-step authentication for admin-tier users, distinct from regular employee login via `HR_EMP_MASTER`.

### `SEC_USERCMPN`
- **Type:** Table
- **Used by:** auth, hr
- **Refs:** `repositories/user_repository.py:74-79,214-224`
- **Operations:** SELECT
- **Purpose:** Maps a `SEC_USERNAME` account to the companies (`COMPC`) they're allowed to access.

### `SEC_USERBRCH`
- **Type:** Table
- **Used by:** auth, hr
- **Refs:** `repositories/user_repository.py:84-89,230-244`
- **Operations:** SELECT
- **Purpose:** Maps a `SEC_USERNAME` account to the branches (`BRNCH`) they're allowed to access.

### `COMPANY_INFO`
- **Type:** Table
- **Used by:** auth, hr, documents
- **Refs:** `repositories/user_repository.py:75-79,215-220,550-553,747-750`; `repositories/document_repository.py:239-294`
- **Operations:** SELECT, UPDATE (company logo)
- **Purpose:** Company master — `COMPC` code, `DESCR` (name), `IMG` (logo path).

### `COM_LOCATION`
- **Type:** Table
- **Used by:** auth, hr, location, documents, payroll (salary), reference, recruitment
- **Refs:** `repositories/user_repository.py:85-89,234-244`; `repositories/location_repository.py:312-314`; `repositories/document_repository.py:62-67`; `repositories/hrms_repository.py:287-288`; `repositories/salary_repository.py:119,147`; `reference_repository.py:730-732,753-755,773`; `interview_panel_repository.py:135,180,191`
- **Operations:** SELECT, INSERT, UPDATE
- **Purpose:** Branch/location master — `LCODE`, `DESCR` (branch name), `REGIONCODE`, `CITY`, scoped by `COMPC`. Also the source of a company's full branch list for "All Branches" fan-out logic in recruitment.

---

## 3. Leave Management

### `ALL_LEAVE_BAL_V` — **View**
- **Used by:** auth (self-service dashboard/leave)
- **Refs:** `repositories/user_repository.py:563-574,775-798,822-828`
- **Operations:** SELECT only
- **Purpose:** Computed/aggregated leave-balance view per employee (`leave_type`, `leave_desc`, `balance`). Powers the dashboard balance widget and validates sufficient balance before submitting a leave application. Documented in code as potentially throwing internal errors if its underlying computation fails.

### `LEAVE_APPLICATION`
- **Used by:** auth (self-service), hr (dashboard "upcoming leaves")
- **Refs:** `repositories/user_repository.py:845-895` (INSERT), `905-935` (SELECT); `repositories/hrms_repository.py:871-900,931-945`
- **Operations:** SELECT, INSERT
- **Purpose:** Leave request records — `LEAVE_DATE_FROM/TO`, `LEAVE_DAYS`, `EMP_FK` (card_no), `HRS`, `LEAVE_TYPE_FK`, `REASON`, `APPROVAL_STATUS`, `ENTRY_DATE/ENTRY_BY`, `COMPC/BRNCH`.

### `LEAVE_TYPES`
- **Used by:** hr
- **Refs:** `repositories/hrms_repository.py:935`
- **Operations:** SELECT
- **Purpose:** Leave-type lookup (`LEAVE_TYPE_PK`, `LEAVE_DESC`) — resolves `LEAVE_APPLICATION.LEAVE_TYPE_FK` for the HR "top leave reasons" analytic.

---

## 4. Attendance

### `ATTENDANCE_RECORDS`
- **Type:** Table (app-owned — explicitly documented in code as "the app's single source of truth for attendance")
- **Used by:** attendance, hr (dashboard aggregates), location (origin point on check-in)
- **Refs:** `repositories/attendance_repository.py` (whole file) — `get_today_record`, `get_open_overnight_record`, `insert_check_in` (MERGE), `update_check_out`; also aggregated in `repositories/hrms_repository.py:688-1147`
- **Operations:** SELECT, INSERT (via MERGE "WHEN NOT MATCHED"), UPDATE (via MERGE "WHEN MATCHED" and dedicated UPDATE), MERGE
- **Purpose:** Mobile-app-driven check-in/check-out ledger — `ID`, `EMPCODE`, `CARD_NO`, `ENTRY_TIME`/`EXIT_TIME`, `ATTENDANCE_DATE`, `TIME_SPENT`, GPS fields (`LATITUDE`/`LONGITUDE`/`ACCURACY`/`ADDRESS`/`FORMATTED_ADDRESS`/`LOCATION_NAME`), checkout GPS, device metadata, derived `TOTAL_HOURS`. Deliberately kept separate from the ERP's `DUTY_ROSTER`.

### `DUTY_ROSTER`
- **Type:** Table (ERP-owned — app never writes it except one narrow admin-edit path)
- **Used by:** attendance, hr
- **Refs:** `repositories/attendance_repository.py:190-200`; `repositories/hrms_repository.py:598-1524`
- **Operations:** SELECT (majority), UPDATE (`update_roster_entry` — "by primary key only, never inserts")
- **Purpose:** ERP-generated per-employee-per-day duty roster — shift, in/out times, late/OT/worked minutes, half-day/late flags, status, remarks. Source of shift scheduling and ERP-computed lateness/OT/absence for HR dashboards.

### `TMS_DUTY_ROSTER_V` — **View**
- **Used by:** attendance, hr
- **Refs:** `repositories/attendance_repository.py:538-672`; `repositories/hrms_repository.py:1256-1389`
- **Operations:** SELECT only
- **Purpose:** ERP-derived per-employee-per-day attendance-status view — roster date/shift/times, `ABSENT`/`MORNING_LATE`/`EARLY_OUT_LATE`/half-day flags, remarks. The authoritative source for attendance-report screens (Present/Late/Half-Day/Absent).

### `SHIFT_HEAD`
- **Used by:** attendance, reference
- **Refs:** `repositories/attendance_repository.py:190-200`; `reference_repository.py:406-518`
- **Operations:** SELECT (attendance); SELECT/INSERT/UPDATE/DELETE (reference — Setup → Shifts admin form)
- **Purpose:** Shift definition master — `COMPC`, `SHIFT`, `TIME_FROM/TIME_TO`, overtime and late/half-day thresholds. Used by attendance to detect overnight shifts (`TIME_TO` earlier than `TIME_FROM`) so a post-midnight mark closes the prior day's still-open check-in.

---

## 5. Location Tracking

### `LOCATION_TRACKS`
- **Type:** Table (app-owned)
- **Used by:** location, attendance (origin point on check-in)
- **Refs:** `repositories/location_repository.py` (whole file) — `insert_location_batch`, `save_attendance_origin_point`, `get_all_locations_summary`, `get_location_history`, `_fetch_trail_rows`
- **Operations:** SELECT, INSERT
- **Purpose:** Hourly/periodic GPS breadcrumb points per employee — `ID`, `CARD_NO`, `LATITUDE`/`LONGITUDE` (NUMBER(10,7)), `ACCURACY`, `RECORDED_AT`, `SYNCED_AT`, `ATTENDANCE_DATE`. Powers location-trail/summary reports and the "employees with location data" admin view.

---

## 6. Documents & Face

### `HR_DOCUMENT`
- **Used by:** documents
- **Refs:** `repositories/document_repository.py:74-172`
- **Operations:** SELECT, INSERT, DELETE
- **Purpose:** Employee document metadata registry — `DOC_ID`, `OLD_EMPCODE`, `UNIT_ID`, `D_TYPE`, `D_PATH`, `REMRK`, `IMG_NM` (relative file path under `EMP_DOCS`). File bytes are never stored in the DB, only this pointer row.

### `EMP_FACE_EMBEDDINGS`
- **Used by:** face
- **Refs:** `repositories/face_repository.py` (whole file); `LMS-Face-Backend/face_rec/face_login.py`/`face_login2.py` (real embedding pipeline)
- **Operations:** SELECT, UPDATE (`LMS-Backend`'s stub soft-delete: `IS_ACTIVE='N'`), INSERT (`LMS-Face-Backend`'s real registration), DELETE (`LMS-Face-Backend`'s hard delete)
- **Purpose:** Face-recognition embedding store — `EMBEDDING_ID`, `EMPCODE`, `EMBEDDING_BLOB` (raw float32 vector, rebuilds the FAISS index at startup), `EMBEDDING_CLOB` (base64 mirror), `EMBEDDING_DIM`, `CREATED_AT`, `IS_ACTIVE`. **See §9 — two independent, inconsistent write paths against this table.**

---

## 7. HR / HRMS Profile & Lookup Tables

### `HR_EMP_QUALIFICATION`
- **Used by:** hrms (employee profile qualification field), reference (admin-curated qualification dropdown)
- **Refs:** `repositories/hrms_repository.py:60-90,216-219`; `reference_repository.py:174-182,316-319,334`
- **Operations:** SELECT, UPDATE, INSERT (hrms upsert pattern); SELECT, INSERT, DELETE (reference, `Q_TYPE='OPT'` rows only)
- **Purpose:** Dual-purpose — holds both real employee qualification records (hrms writes a dedicated `'PR'` type row) and admin-curated "option" template rows (reference module, `Q_TYPE='OPT'`) used to build the qualification dropdown.

### `HR_EMP_MASTER_SAL`
- **Type:** Table, treated as view-only in code comments ("view-only salary from HR_EMP_MASTER_SAL")
- **Used by:** hrms
- **Refs:** `repositories/hrms_repository.py:206-215`
- **Operations:** SELECT only
- **Purpose:** Period-wise salary history per employee (keyed by `OLD_EMPCODE` + `UNIT_ID` + `PERIOD#`) — supplies latest-period `GROSS`/`BASIC` as read-only fields on the employee profile.

### `HR_DEPT`
- **Used by:** hrms, hr, location, payroll, payroll-entry, salary, reference
- **Refs:** `user_repository.py:739-742`; `hrms_repository.py` (multiple); `location_repository.py:345-347`; `payroll_repository.py:451-452`; `payroll_entry_repository.py:66-68`; `salary_repository.py:69-70,118,145-146`; `reference_repository.py:65,591-607`
- **Operations:** SELECT, INSERT (reference module only)
- **Purpose:** Department code-to-name lookup, scoped per company (`COMPC`/`DEPT_NO`/`DEPT_NAME`) — resolves `HR_EMP_MASTER.DEPT_NO` everywhere department is displayed/grouped.

### `HR_DESG`
- **Used by:** hrms, location, payroll-entry, salary, reference
- **Refs:** `user_repository.py:743-746`; `hrms_repository.py:283-284,348-350`; `location_repository.py:348-350`; `payroll_entry_repository.py:63-65`; `salary_repository.py:143-144`; `reference_repository.py:354,648-654`
- **Operations:** SELECT, INSERT (reference module)
- **Purpose:** Designation code-to-name lookup, scoped per company — `DESG_CD`, `DESG_DESC`, `COMPC`.

### `UNIT_MST`
- **Used by:** hrms, documents, salary, reference, recruitment, notifications
- **Refs:** `hrms_repository.py:287`; `document_repository.py:55`; `salary_repository.py:149`; `reference_repository.py:561,872-876`; `recruitment_repository.py:1318,2169`; `notification_repository.py:418`
- **Operations:** SELECT, INSERT (reference module)
- **Purpose:** Company/unit master — `UNIT_ID`, `UNIT_NAME`. Used for printable ID-card company names, on-disk document folder naming, payslip employer name, and resolving a company name for recruitment/notification folder paths and message context.

---

## 8. Payroll, Payroll-Entry & Salary Processing

### `HR_FINANCIAL_YEAR`
- **Used by:** payroll (Period Opening)
- **Refs:** `payroll_repository.py:58,122-132,162,175`
- **Operations:** SELECT, INSERT, UPDATE
- **Purpose:** Financial year rule master — fiscal date ranges (`FROM_DATE`/`TO_DATE`) per company (`UNIT_ID`), plus tax rate/interest/filer settings; drives auto-generation of monthly periods.

### `HR_ATTND_PERIOD`
- **Used by:** payroll (Period Opening), payroll-entry (period resolution), salary
- **Refs:** `payroll_repository.py:93-247`; `payroll_entry_repository.py:96,115-122`; `salary_repository.py:49,132,164,228,257`
- **Operations:** SELECT, INSERT, UPDATE
- **Purpose:** Monthly payroll period master (`PERIOD#`, `PERIOD_FRM/TO`, `STATUS` O/C, `BLOCK_FLAG`) per company/financial-year rule — the unit of work for attendance, monthly inputs, and salary processing. **This is the locking mechanism that gates every payroll-entry mutation.**

### `HR_TAX_MST` / `HR_TAX_DTL`
- **Used by:** payroll (Tax Slabs — global, not per-company)
- **Refs:** `payroll_repository.py:265-364`
- **Operations:** SELECT, INSERT, UPDATE, DELETE (MST); SELECT, INSERT, DELETE (DTL)
- **Purpose:** `HR_TAX_MST` = tax master header (`TAX_DESC`, `FYEAR`, `STATUS`); `HR_TAX_DTL` = slab detail lines (`SLAB_FROM/TO/RATE`, `DATE_FROM/TO`, `SLAB_DED`, `FIXED_TAX`) — progressive income-tax bracket rules.

### `HR_LOAN_TYPE` / `HR_LOAN_MST` / `HR_LOAN_RECOVERY`
- **Used by:** payroll (Loans), payroll-entry (recovery), salary (payslip)
- **Refs:** `payroll_repository.py:381-556`; `payroll_entry_repository.py:140-267`; `salary_repository.py:191-192`
- **Operations:** SELECT, INSERT, DELETE (`HR_LOAN_TYPE`); SELECT, INSERT, UPDATE, DELETE (`HR_LOAN_MST`); SELECT, INSERT, DELETE (`HR_LOAN_RECOVERY`)
- **Purpose:** `HR_LOAN_TYPE` = loan category lookup; `HR_LOAN_MST` = one row per employee loan (`DOC#`, `LOAN_CD`, `LOAN_AMT`, `INSTALMENT_AMT`, `NOF_INSTALMENT`, `LOAN_RECOVER` running total, `INT_RATE`); `HR_LOAN_RECOVERY` = recovery/adjustment ledger reducing the outstanding balance.

### `HR_ALLOWANCE` / `HR_MONTHLY_ALLOW`
- **Used by:** payroll-entry, salary
- **Refs:** `payroll_entry_repository.py:287-388`; `salary_repository.py:160-165`
- **Operations:** SELECT (`HR_ALLOWANCE` — type lookup only); SELECT, MERGE, DELETE (`HR_MONTHLY_ALLOW`)
- **Purpose:** `HR_ALLOWANCE` = allowance type master (`ALLOWANCE_ID`, `ALLOWANCE_DESC`, `INCL_GROSS`, `PAY_SEQ`); `HR_MONTHLY_ALLOW` = period-keyed monthly allowance entry per employee, consumed by the ERP salary process.

### `HR_DEDUCTION` / `HR_MONTHLY_DED`
- **Used by:** payroll-entry, salary
- **Refs:** `payroll_entry_repository.py:407-501`; `salary_repository.py:160-166`
- **Operations:** SELECT (`HR_DEDUCTION` — type lookup only); SELECT, MERGE, DELETE (`HR_MONTHLY_DED`)
- **Purpose:** `HR_DEDUCTION` = deduction type master (`DED_CD`, `DED_DESC`, `PAY_SEQ`); `HR_MONTHLY_DED` = period-keyed monthly deduction entry per employee.

### `HR_ABSENT_DAYS`
- **Used by:** payroll-entry
- **Refs:** `payroll_entry_repository.py:533-613`
- **Operations:** SELECT, MERGE, DELETE
- **Purpose:** Period-keyed manual absence-days override per employee — feeds earned-days computation in the salary process.

### `HR_PAY_REG_V` — **View**
- **Used by:** payroll (Pay Register report)
- **Refs:** `payroll_register_repository.py:29,47`
- **Operations:** SELECT (read-only report view)
- **Purpose:** Pay register reporting view — pivotable per-employee-per-period rows of earning (`'A'`) / deduction (`'D'`) components plus net (`'X'`) and totals (`TOT_ALL`/`TOT_DED`).

### `hr_emp_master_view` — **View**
- **Used by:** payroll (Pay Register report)
- **Refs:** `payroll_register_repository.py:29-31`
- **Operations:** SELECT
- **Purpose:** Employee master view (`NAME`/`UNIT_NAME`) joined to `HR_PAY_REG_V` by `OLD_EMPCODE`+`UNIT_ID` for the pay register report.

### `HR_SALARY_PROCESS_MASTER` / `HR_SALARY_PROCESS`
- **Used by:** payroll, salary (Payslip)
- **Refs:** `salary_repository.py:48-79,114-170,269`
- **Operations:** SELECT only — **the application never writes these; they're populated by the `HR_SALARY_PROCES_PRO` stored procedure** (see §10)
- **Purpose:** `HR_SALARY_PROCESS_MASTER` = one row per employee per period with computed gross/basic/earned figures, worked/absent days, net pay; `HR_SALARY_PROCESS` = line items per component (`TRANS_TYPE` A=earning/D=deduction, `TRANS_ID` references `HR_ALLOWANCE`/`HR_DEDUCTION`, `TRANS_AMOUNT`).

### `HR_EMP_STATUS`
- **Used by:** salary (payslip label), reference (Setup lookup)
- **Refs:** `salary_repository.py:148`; `reference_repository.py:97-107,210-213,226`
- **Operations:** SELECT (salary); SELECT, INSERT, DELETE (reference)
- **Purpose:** Employee status lookup (`EMP_STATUS`→`EMP_STATUS_DESC`, e.g. Permanent/Contract), scoped by company (`UNIT_ID`) plus global rows.

---

## 9. Reference / Setup Master Data

| Table | Purpose |
|---|---|
| `HR_GRADE_CD` | Employee grade-code master (active grades only), scoped by company/branch |
| `HR_BANK` | Bank master for payroll/bank-detail entry, scoped by company + global rows |
| `HR_BRANCH` | Bank-branch master, child of `HR_BANK` (filtered by `BNKCODE`) |
| `HR_SHIFT` | Master list-of-values for shift codes (active only) — distinct from `SHIFT_HEAD`'s per-company timing config |
| `BLOOD_GROUP` | Blood-group lookup list, scoped by company/branch |
| `CADRE` | Employee cadre/category lookup list, scoped by company/branch |
| `APP_VERSION` | Mobile app min/latest version+build per platform, update URL, force/soft messages — gates login/attendance until updated |

Notes: religion codes and "reporting officer" options don't have dedicated master tables — religions are derived from distinct `HR_EMP_MASTER.RELIGION` values plus a hardcoded default list; reporting officers are simply active `HR_EMP_MASTER` rows filtered by company/branch.

---

## 10. Recruitment Module

### Core pipeline
| Table | Purpose |
|---|---|
| `RECRUITMENT_JOBS` | Job requisitions — title, department, open positions, description, skills, salary band, employment type/work mode, status; scoped by company/branch. Everything else hangs off `JOB_ID`. Columns added via idempotent `ALTER TABLE` for progressive rollout (COMPC/BRNCH/EMPLOYMENT_TYPE/etc.) |
| `RECRUITMENT_APPLICATIONS` | A candidate's application to a specific job (or legacy quick-add name/mobile/email); status drives the pipeline (PENDING/SHORTLISTED/REJECTED/etc.) |
| `RECRUITMENT_INTERVIEWS` | One row per scheduled interview event — date, type, interviewer, venue/mode, structured feedback ratings and recommendation (added via `ALTER TABLE`) |
| `RECRUITMENT_OFFERS` | Job offers extended to applicants — offer date, salary offered, status; ACCEPTED offers drive "filled positions" analytics |

### Talent Pool (candidate profiles, independent of any one job)
| Table | Purpose |
|---|---|
| `RECRUITMENT_CANDIDATES` | Permanent Talent Pool profile — one row per person (deduped by email/mobile per company), contact info, preferred title, summary, CV file pointer |
| `RECRUITMENT_CANDIDATE_EDUCATION` | Education history entries, child of `RECRUITMENT_CANDIDATES` (delete+reinsert on profile update) |
| `RECRUITMENT_CANDIDATE_EXPERIENCE` | Work experience entries incl. description CLOB — text also feeds keyword-overlap matching score |
| `RECRUITMENT_CANDIDATE_SKILLS` | Individual skill tags — used for search and skill-overlap scoring against job requirements |

### AI CV-scoring pipeline
| Table | Purpose |
|---|---|
| `RECRUITMENT_AI_EVALUATIONS` | One row per AI CV-scoring run — compatibility/technical/experience/overall scores, recommendation, summary, LLM model/token/timing stats. Newest evaluation wins via `MAX(EVALUATION_ID)` |
| `RECRUITMENT_AI_STRENGTHS` | Free-text "strengths" bullets, child of an evaluation |
| `RECRUITMENT_AI_WEAKNESSES` | Free-text "weaknesses/gaps" bullets, child of an evaluation |

### Interview panel scheduling
| Table | Purpose |
|---|---|
| `INTERVIEW_PANEL_POOL` | Which active employees may sit on interview panels (company+branch+employee); membership only ever soft-removed (`IS_ACTIVE`), never deleted |
| `INTERVIEW_ASSIGNMENTS` | One row per interviewer per scheduled interview — carries type/date/time/status; also used for double-booking clash detection |
| `INTERVIEW_TYPES` | Setup-master LOV for interview types (HR/Technical/Managerial/Final seeded globally); company-specific rows addable/soft-removable, global seed rows protected |

### Recruitment-event notifications
| Table | Purpose |
|---|---|
| `NOTIFICATION_TEMPLATES` | Reusable message templates (EMAIL/WHATSAPP × INTERVIEWER/CANDIDATE × event-type) with `{{placeholder}}` bodies, seeded with a standard library |
| `APP_NOTIFICATION_MESSAGES` | Send-ready outbox — one row per recipient message, fully rendered at save time, `STATUS` for a future sender to dispatch |

> **Self-provisioning tables:** `INTERVIEW_PANEL_POOL`, `INTERVIEW_ASSIGNMENTS`, `INTERVIEW_TYPES`, `NOTIFICATION_TEMPLATES`, and `APP_NOTIFICATION_MESSAGES` are created idempotently by the application itself via inline `CREATE TABLE`/`CREATE SEQUENCE` DDL on first use, rather than assuming a pre-existing schema — worth knowing if replicating this schema elsewhere, since a fresh DB won't need manual DDL for these five.

---

## 11. Stored Procedures & Packaged Functions Called

| Procedure/Function | Called from | Parameters | Purpose |
|---|---|---|---|
| `datacrypt.decryptdata(:p)` | `repositories/user_repository.py:149` (`SELECT datacrypt.decryptdata(:p) FROM DUAL`) | encrypted password string | Decrypts `SEC_USERNAME.PASWD` for admin login; falls back to raw-string comparison on `ORA-28817`. |
| `HR_SALARY_PROCES_PRO` | `repositories/salary_repository.py:267` (`cur.callproc(...)`) | `MUNIT, MPRIOD, MPRIOD_FRM, MPRIOD_TO, MRULE_ID` | The ERP payroll-processing engine — recomputes attendance and rebuilds `HR_SALARY_PROCESS`/`HR_SALARY_PROCESS_MASTER` for a company+period. **Commits internally inside the DB procedure**; triggered by `POST /payroll/salary/process`. Highest-risk single DB call in the codebase. |

---

## 12. Data-Quality / Architectural Observations

1. **`EMPLOYEE` is treated as unreliable in places.** Multiple functions explicitly avoid selecting `EMPLOYEE`'s own computed/scalar-subquery columns and join it only for `CARD_NO`, falling back to `HR_EMP_MASTER` alone on `ORA-01427`. Yet one function (`update_password`) issues a direct `UPDATE EMPLOYEE ...` — worth confirming with a DBA whether `EMPLOYEE` is genuinely updatable or whether that statement is quietly hitting a same-named base table in some environments.
2. **`ATTENDANCE_RECORDS` vs `DUTY_ROSTER` is a deliberate architectural boundary.** The app owns `ATTENDANCE_RECORDS` (mobile check-in/out) and only reads `DUTY_ROSTER`/`TMS_DUTY_ROSTER_V` (ERP-owned), with exactly one sanctioned admin-edit path (`update_roster_entry`, primary-key-only UPDATE).
3. **`EMP_FACE_EMBEDDINGS` has two independent, inconsistent write paths.** The FastAPI stub in `LMS-Backend/repositories/face_repository.py` does soft-delete only and no real embedding math. The real InsightFace/FAISS pipeline in `LMS-Face-Backend/face_rec/face_login.py`/`face_login2.py` does hard deletes and real BLOB writes. Both target the same table with different semantics — a candidate for cleanup/documentation.
4. **Schema drift between environments is visible in the code.** Several queries defensively catch `ORA-00904` (missing column) / `ORA-00942` (missing table/view) and fall back to reduced column/table sets — e.g. `COM_LOCATION.REGIONCODE`, `HR_EMP_MASTER.CADRE`, and the "view-only" salary columns on `HR_EMP_MASTER_SAL`. `APP_VERSION`'s repository also degrades gracefully across 3 different schema shapes (full columns → platform-less → legacy single `VERSION` column).
5. **Recruitment's core tables use idempotent `ALTER TABLE` migrations** (`RECRUITMENT_JOBS`, `RECRUITMENT_CANDIDATES`) for progressive feature rollout, with `ORA-00904`/`ORA-01430` fallback handling when a column doesn't exist yet in a given environment — the same defensive pattern as #4, applied at the DDL level.
6. **`hr_emp_master_view`** (lowercase, distinct object name from `HR_EMP_MASTER`) appears only in the pay-register report — confirm with a DBA whether this is a genuinely separate view object or a case-insensitive alias to avoid confusion during any future schema documentation pass.
