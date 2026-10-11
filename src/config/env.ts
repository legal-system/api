// The single place process.env is read and validated; everything else imports env.
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// dotenv never overwrites an existing value, so the first file read wins.
// Loading .env.test first gives the test run its own database.
const nodeEnv = process.env.NODE_ENV ?? 'development';
loadDotenv({ path: nodeEnv === 'test' ? '.env.test' : '.env' });
loadDotenv();

// z.coerce.boolean() treats any non-empty string as true, so "false" would
// silently become true. Requiring the literal words makes that mistake visible.
const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  TZ: z.string().min(1).default('Africa/Addis_Ababa'),

  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),

  // Long random values sign our tokens, so a weak one is a security bug.
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),

  REFRESH_COOKIE_NAME: z.string().min(1).default('refresh_token'),
  // httpOnly keeps the token out of JavaScript reach; secure is for https only.
  REFRESH_COOKIE_HTTP_ONLY: booleanString.default(true),
  REFRESH_COOKIE_SECURE: booleanString.default(false),
  REFRESH_COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
  REFRESH_COOKIE_PATH: z.string().default('/api/auth'),
  // Replaying a revoked token means theft, so revoke that user's whole family.
  REFRESH_TOKEN_REUSE_DETECTION: booleanString.default(true),

  // Stored comma-separated in .env, split here for cors.
  CORS_ORIGIN: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  TRUST_PROXY: booleanString.default(false),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
});

const parsed = envSchema.safeParse(process.env);

// Fail at startup rather than midway, and report every problem in one pass.
if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${details}\n\nCopy .env.example to .env and fill in the missing values.`);
}

// Set after validation so token and record timestamps share one timezone.
process.env.TZ = parsed.data.TZ;

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDevelopment = env.NODE_ENV === 'development';
