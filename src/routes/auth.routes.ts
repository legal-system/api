// Routes only bind method + path to middleware and a controller; they hold no logic.
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../schemas/auth.schema.js';

const router = Router();

// Full paths are /api/auth/login and /api/auth/me (app.ts adds /api, index.ts adds /auth).
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);

export default router;
