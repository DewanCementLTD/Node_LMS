import { Router } from 'express';
import appVersionRoutes from './appVersion.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

router.use('/app',  appVersionRoutes);
router.use('/auth', authRoutes);

export default router;