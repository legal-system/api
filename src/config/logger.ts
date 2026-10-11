import pino from 'pino';
import { env, isProduction } from './env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'legal-sys-api' },

  // Replaced with [redacted] before writing, so no future bug can log a secret.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'passwordHash',
      '*.passwordHash',
      'refreshToken',
      '*.refreshToken',
    ],
    censor: '[redacted]',
  },

  // Colours locally, machine-readable JSON in production. pino-pretty is a dev
  // dependency, which is safe because this branch never runs in production.
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }),
});
