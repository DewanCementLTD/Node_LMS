import { Router } from 'express';
import appVersionRoutes from './appVersion.routes.js';
import authRoutes from './auth.routes.js';
import hrRoutes from './hr.routes.js';
import hrmsRoutes from './hrms.routes.js';

const router = Router();

router.use('/app',  appVersionRoutes);   // http://localhost:8000/app
router.use('/auth', authRoutes);          // http://localhost:8000/auth/*
router.use('/hr',   hrRoutes);            // http://localhost:8000/hr/*   (HR-admin: search + face enroll)
router.use('/hrms', hrmsRoutes);          // http://localhost:8000/hrms/* (HR-admin: employees, dashboard, attendance, roster)

export default router;