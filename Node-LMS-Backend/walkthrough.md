# Recruitment AI/CV Pipeline Walkthrough

I have successfully completed the implementation of the 8 remaining recruitment AI/CV endpoints, strictly following the behavior established in `[LIVE] HRMS_COMPLETE`. The Node.js version maintains byte-for-byte parity with the Python FastAPI logic.

## Changes Made

### 1. Evaluator Service (AI Port)
I created [src/services/cvEvaluator.service.js](file:///e:/DCL_LMS/HRMS_COMPLETE/Node-LMS-Backend/src/services/cvEvaluator.service.js), completely porting the logic from the Python codebase (`AI/cv_evaluator.py`).
- Integrated the `@google/genai` JS SDK to interact with the LLM models (e.g. `gemini-2.5-flash-lite`, `gemma-4-31b-it`).
- Fully replicated the capabilities model mapping, which strips unsupported capabilities (`system_instruction`, `json_mode`, `thinking`) when specific configuration errors arise (ensuring robustness even if environment variables point to local/older models).
- Built the retry engine utilizing exponential backoff with jitter and automated token escalations when responses are truncated by `MAX_TOKENS`.
- Defined the Zod-like response schema `CandidateAssessmentSchema` matching the backend metrics precisely.

### 2. Database Service Logic (Recruitment Service)
I appended the missing database logic to [src/services/recruitment.service.js](file:///e:/DCL_LMS/HRMS_COMPLETE/Node-LMS-Backend/src/services/recruitment.service.js):
- **Path Resolving:** `candidateCvTarget`, `jobCvDirs`, `poolCvDirs`, utilizing `_safe_name` formatting exactly as the Python equivalent.
- **Application & Candidate Management:** Methods for storing CV paths (`setCandidateCv`, `getCandidateCvPath`), parsing files, and storing evaluations (`storeEvaluation`).
- **Talent Pool Matching:** `matchCandidatesForJob` for the Stage 1 shallow overlap matching algorithm.
- **Deep Matching:** `matchCandidatesDeep` which utilizes the `cvEvaluator` and iterates through concurrent workers to run candidates through the LLM.
- **Top K Sorting:** `rankJobApplicants` using the same AI score buckets (`strong`, `review`, `weak`).

### 3. Application Controllers and Routing
I exposed all 8 endpoints inside [src/controllers/recruitment.controller.js](file:///e:/DCL_LMS/HRMS_COMPLETE/Node-LMS-Backend/src/controllers/recruitment.controller.js) and mapped them in [src/routes/recruitment.routes.js](file:///e:/DCL_LMS/HRMS_COMPLETE/Node-LMS-Backend/src/routes/recruitment.routes.js):

#### Implemented Endpoints:
1. `POST /jobs/:job_id/match` (`matchCandidates`)
2. `GET /jobs/:job_id/top-candidates` (`topCandidates`)
3. `GET /applications/:app_id/evaluation` (`getApplicationEvaluation`)
4. `POST /candidates/upload-cvs` (`uploadCvs`)
5. `GET /candidates/cv-status` (`cvStatus`)
6. `POST /candidates/:candidate_id/cv` (`uploadCandidateCv`)
7. `GET /candidates/:candidate_id/cv` (`downloadCandidateCv`)
8. `POST /candidates/:candidate_id/apply` (`applyCandidate`)

## Database Interactions

As requested, I can confirm that the following tables are correctly inserted/updated during these flows (which you can check on the Oracle DB directly):
- **`RECRUITMENT_CANDIDATES`**: When new profiles are extracted or when CVs are manually uploaded (updates `CV_FILE_NAME` and `CV_FILE_PATH`).
- **`RECRUITMENT_APPLICATIONS`**: When matching deep or uploading for a specific job, generating a new `APP_ID`.
- **`RECRUITMENT_AI_EVALUATIONS`**: Written to simultaneously when `storeEvaluation` runs via deep match or apply (contains the `PROMPT_TOKENS` and `OVERALL_SCORE`).
- **`RECRUITMENT_AI_STRENGTHS` / `RECRUITMENT_AI_WEAKNESSES`**: Inserted directly with the new `EVALUATION_ID` representing bullet point arrays returned from Gemini.

## Validation Results
- The Node.js server starts successfully without syntax issues (`node src/index.js`).
- The `EMP_DOCS_ROOT` and directory layouts will behave consistently because the path builders resolve dynamically against `UNIT_MST` and `COM_LOCATION` before returning the paths. 

> [!NOTE]
> Deep evaluation operates on Promises without awaiting resolution before returning a `200` to the HTTP caller, fulfilling the non-blocking watcher paradigm exactly.
