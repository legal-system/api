import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error.js';
import { isProduction } from '../config/env.js';

// Step 1: AppError means the caller caused it, so return its own status and message.
// Step 2: anything else is a bug, so return a generic 500 and log the real error.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, ...(err.details === undefined ? {} : { details: err.details }) },
    });
    return;
  }

  // Never send a stack trace to the client; it names files, versions and code paths.
  req.log?.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      // Not production: message here too, so the mistake is visible while developing.
      message: isProduction ? 'Something went wrong' : (err as Error)?.message ?? 'Something went wrong',
    },
  });
}
