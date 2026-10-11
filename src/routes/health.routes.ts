// Routes only bind method + path to a controller; the controller does the work.
import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';

const router = Router();

// Full path is /api/health: the prefixes come from app.ts and routes/index.ts.
router.get('/', healthController);

export default router;
