import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/app-error.js';

// Step 1: parse the request body against the schema.
// Step 2: on failure, hand the field-level messages straight to the client.
// Step 3: on success, replace req.body with the cleaned value (trim applied by the schema).
export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      next(new AppError(400, 'VALIDATION_ERROR', 'Some fields need fixing', details));
      return;
    }

    req.body = result.data;
    next();
  };
}
