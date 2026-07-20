import { Router } from 'express';
import appVersionRoutes from './appVersion.routes.js';
import authRoutes from './auth.routes.js';
import documentsRoutes from './documents.routes.js';
import hrRoutes from './hr.routes.js';
import hrmsRoutes from './hrms.routes.js';
import referenceRoutes from './reference.routes.js';
import locationTrackingRoutes from './locationTracking.routes.js';
import faceRoutes from './face.routes.js';

const router = Router();

router.use('/app', appVersionRoutes); // http://localhost:8000/app/* (mobile update flow: version-check + APK download)
router.use('/auth', authRoutes); // http://localhost:8000/auth/*
router.use('/documents', documentsRoutes); // http://localhost:8000/documents/* (employee documents, photos, company logo)
router.use('/hr', hrRoutes); // http://localhost:8000/hr/* (HR-admin: search + face enroll)
router.use('/hrms', hrmsRoutes); // http://localhost:8000/hrms/* (HR-admin: employees, dashboard, attendance, roster)
router.use('/reference', referenceRoutes); // http://localhost:8000/reference/*
router.use('/location-tracking', locationTrackingRoutes); // http://localhost:8000/location-tracking/*
router.use('/face', faceRoutes); // http://localhost:8000/face/*

export default router;