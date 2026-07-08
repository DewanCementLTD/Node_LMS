import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware.js';
// Schemas
import { versionCheckSchema } from '../models/appVersion.schema.js';
// Controllers
import { versionCheck, downloadLatestApk } from '../controllers/appVersion.controller.js';

const router = Router();
// Mounted at /app. Mirrors FastAPI routers/app_version_router.py. No auth —
// these are called by the mobile app before/without a login.

// ---------------------------------------------------------------------------
// Version check (up-to-date / soft update / force update)
// ---------------------------------------------------------------------------
router.get('/version-check', validate(versionCheckSchema), versionCheck); // http://localhost:8000/app/version-check?platform=ANDROID&version=1.4.2&build=48

// ---------------------------------------------------------------------------
// Latest APK download (drop the release into static/apk/app-latest.apk)
// ---------------------------------------------------------------------------
router.get('/download/latest', downloadLatestApk); // http://localhost:8000/app/download/latest

export default router;
