// The single place process.env is read and validated; everything else imports env.
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// Step 1: Load environment files (.env.test takes precedence if running in test)
const nodeEnv = process.env.NODE_ENV ?? 'development';
loadDotenv({ path: nodeEnv === 'test' ? '.env.test' : '.env' });
loadDotenv();

// Step 2: Custom schema helpers
// Explicit string parsing: prevents "false" string from silently coercing to true
const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

// Duration validator: accepts standard units (e.g., '15m', '7d', '900')
const durationString = z
  .string()
  .regex(/^\d+(ms|s|m|h|d|w|y)?$/, 'Use a duration like 15m, 7d, or 900 (seconds)');

// Step 3: Define application config schema
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

  // JWT configuration
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: durationString.default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: durationString.default('7d'),

  // Bcrypt cost factor (higher = more secure, but slower)
  PASSWORD_HASH_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  // Cookie and refresh token settings
  REFRESH_COOKIE_NAME: z.string().min(1).default('refresh_token'),
  REFRESH_COOKIE_HTTP_ONLY: booleanString.default(true),
  REFRESH_COOKIE_SECURE: booleanString.default(false),
  REFRESH_COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
  REFRESH_COOKIE_PATH: z.string().default('/api/auth'),
  REFRESH_TOKEN_REUSE_DETECTION: booleanString.default(true),

  // CORS origins: comma-separated in .env, parsed into array
  CORS_ORIGIN: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  // Rate limiting & proxy settings
  TRUST_PROXY: booleanString.default(false),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
});

// Step 4: Validate environment variables on startup and fail immediately if invalid
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${details}\n\nCopy .env.example to .env and fill in the missing values.`);
}

// Step 5: Apply global timezone and export typed configuration
process.env.TZ = parsed.data.TZ;

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDevelopment = env.NODE_ENV === 'development';
