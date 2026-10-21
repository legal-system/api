// Maps URL prefixes to route files. Mounted under /api by app.ts.
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

export default router;
