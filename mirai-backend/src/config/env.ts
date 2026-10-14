import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

/** Empty strings in .env are treated as "not set". */
const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === '' ? undefined : v.trim()));

const booleanString = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  PUBLIC_BASE_URL: z.string().default('http://localhost:5000'),
  CORS_ORIGINS: z.string().default('*'),
  /** Express 'trust proxy' hop count (0 = direct, 1 = behind one reverse proxy / load balancer). */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/mirai'),
  REDIS_URL: optionalString,

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default('1d'),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),
  JWT_ADMIN_SECRET: z.string().min(16),
  JWT_ADMIN_EXPIRES: z.string().default('1d'),

  OTP_LENGTH: z.coerce.number().int().min(4).max(6).default(4),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  DEV_FIXED_OTP: optionalString,

  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: booleanString,
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  SMTP_FROM: z.string().default('MIRAI <no-reply@miraiastro.com>'),

  DIVINE_API_KEY: optionalString,
  DIVINE_AUTH_TOKEN: optionalString,
  /** Older name for DIVINE_AUTH_TOKEN, still accepted */
  DIVINE_API_TOKEN: optionalString,
  /** true = send non-English `lan` to Divine's `-translator` hosts (Translator must be enabled in the Divine dashboard). false = always English. */
  DIVINE_USE_TRANSLATOR: booleanString,
  /** Festivals from Google Calendar's public Indian holidays calendar (used when the key is set) */
  GOOGLE_CALENDAR_API_KEY: optionalString,
  GOOGLE_HOLIDAY_CALENDAR_ID: z.string().trim().min(1).default('en.indian#holiday@group.v.calendar.google.com'),
  /** true = don't start the scheduled notification jobs (daily/weekly horoscope, festival, muhurat) in this process */
  NOTIFICATION_JOBS_DISABLED: booleanString,
  ANTHROPIC_API_KEY: optionalString,
  /** Chat AI (src/lib/ai.ts). AI_PROVIDER=mock returns canned replies (dev only, ignored in production). */
  AI_PROVIDER: z.enum(['anthropic', 'openai', 'mock']).default('anthropic'),
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.string().trim().min(1).default('gpt-4o-mini'),
  ANTHROPIC_MODEL: z.string().trim().min(1).default('claude-sonnet-5-5'),
  CHAT_MAX_TOKENS: z.coerce.number().int().min(64).max(16000).default(1024),
  /** Wallet debit per chat message (0 = free). */
  CHAT_PRICE_PER_MESSAGE: z.coerce.number().min(0).default(0),
  CHAT_RATE_LIMIT_PER_MIN: z.coerce.number().int().min(1).default(20),
  /** AI chat questions every user may ask for free before a plan (POST /plans/:id/purchase) is needed. */
  CHAT_FREE_QUESTIONS: z.coerce.number().int().min(0).default(1),
  AWS_REGION: optionalString,
  AWS_ACCESS_KEY_ID: optionalString,
  AWS_SECRET_ACCESS_KEY: optionalString,
  AWS_S3_BUCKET: optionalString,
  FIREBASE_SERVICE_ACCOUNT_PATH: optionalString,
  ADMIN_SEED_EMAIL: optionalString,
  ADMIN_SEED_PASSWORD: optionalString,
  /** Website contact form (POST /leads): submissions per hour per IP. */
  LEADS_RATE_LIMIT_PER_HOUR: z.coerce.number().int().min(1).default(5),
  /** Who gets the "new lead" e-mail (only sent when SMTP_HOST is set); falls back to ADMIN_SEED_EMAIL. */
  LEADS_NOTIFY_EMAIL: optionalString,
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  DIVINE_AUTH_TOKEN: raw.DIVINE_AUTH_TOKEN || raw.DIVINE_API_TOKEN,
  isProd: raw.NODE_ENV === 'production',
  isDev: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
  /** Parsed CORS origins: `true` = allow any origin. */
  corsOrigins:
    raw.CORS_ORIGINS.trim() === '*'
      ? (true as const)
      : raw.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  /** DEV_FIXED_OTP is only honoured outside production. */
  devFixedOtp: raw.NODE_ENV !== 'production' ? raw.DEV_FIXED_OTP : undefined,
} as const;

export type Env = typeof env;
