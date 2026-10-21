// Single error type for failures the client should see, with the HTTP status it maps to.
// Concept details: .ai/auth/lesson-4-login.md
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
