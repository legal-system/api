import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import type { LoginInput } from '../schemas/auth.schema.js';
import { AppError } from '../utils/app-error.js';

// Concept details: .ai/auth/lesson-4-login.md
// Step 1: by this point validate/authenticate have already checked the input.
// Step 2: failures leave as thrown AppErrors, which error.middleware formats.
// (Express 5 forwards rejected promises from async handlers automatically.)
export async function login(req: Request, res: Response): Promise<void> {
  // validate() already parsed the body into LoginInput; Express types req.body as any.
  const result = await authService.login(req.body as LoginInput);
  res.status(200).json(result);
}

// authenticate() already loaded the row and rejected anything not ACTIVE.
// Concept details: .ai/auth/lesson-5-load-user-in-authenticate.md
export function me(req: Request, res: Response): void {
  // The guard only satisfies TypeScript, which types req.user as optional.
  const user = req.user;
  if (!user) {
    throw new AppError(401, 'MISSING_TOKEN', 'Sign in to continue');
  }

  res.status(200).json({ user: authService.toSafeUser(user.get()) });
}
