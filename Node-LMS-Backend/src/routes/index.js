import { Router } from 'express';
import appVersionRoutes from './appVersion.routes.js';
import authRoutes from './auth.routes.js';
import hrmsRoutes from './hrms.routes.js';

const router = Router();

router.use('/app',  appVersionRoutes);
router.use('/auth', authRoutes);
router.use('/hrms', hrmsRoutes);

export default router;