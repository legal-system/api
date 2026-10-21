import type { NextFunction, Request, Response } from 'express';
import { User, USER_STATUS } from '../models/index.js';
import { AppError } from '../utils/app-error.js';
import { verifyAccessToken, type AccessTokenClaims } from '../utils/jwt.js';

// What authenticate() puts on the request for every handler that runs after it.
declare module 'express-serve-static-core' {
  interface Request {
    auth?: AccessTokenClaims;
    user?: InstanceType<typeof User>;
  }
}

// Concept details: .ai/auth/lesson-5-load-user-in-authenticate.md
// Step 1: read "Authorization: Bearer <token>"; check signature, expiry, issuer and audience.
// Step 2: load the row, because a valid token outlives a deleted or suspended account.
// Step 3: attach both, so handlers never re-read the header or query the user again.
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'MISSING_TOKEN', 'Sign in to continue'));
    return;
  }

  let claims: AccessTokenClaims;
  try {
    claims = verifyAccessToken(header.slice('Bearer '.length));
  } catch {
    // Same message either way: expired or forged, the caller cannot act.
    next(new AppError(401, 'INVALID_TOKEN', 'Your session expired, sign in again'));
    return;
  }

  // A failed query rejects here, and Express 5 sends that to the error middleware.
  const user = await User.findByPk(claims.sub);

  if (!user) {
    next(new AppError(401, 'INVALID_TOKEN', 'Your session expired, sign in again'));
    return;
  }

  if (user.get().status !== USER_STATUS.ACTIVE) {
    next(new AppError(403, 'ACCOUNT_SUSPENDED', 'This account is suspended'));
    return;
  }

  req.auth = claims;
  req.user = user;
  next();
}
