import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Firebase Cloud Messaging (push notifications) via firebase-admin.
 * Enabled only when FIREBASE_SERVICE_ACCOUNT_PATH points to a service-account JSON file
 * (Firebase console -> Project settings -> Service accounts -> Generate new private key).
 * A relative path is resolved against the backend folder (e.g. `secrets/firebase-service-account.json`).
 *
 *   if (!isPushConfigured()) throw new ApiError(503, 'push.notConfigured');
 *   const r = await sendPushToTokens(tokens, { title, body, data });
 *   // r.invalidTokens -> remove them from Session.fcmToken
 */
type Messaging = import('firebase-admin/messaging').Messaging;

/** Android notification channel created by the app (notifee); must match the app's default channel. */
export const ANDROID_CHANNEL_ID = 'default';

/** Backend root (this file is src/lib/push.ts or dist/lib/push.js). */
const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

let messaging: Messaging | null = null;
let initError: Error | null = null;

export function serviceAccountFile(): string | undefined {
  const p = env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!p) return undefined;
  return path.isAbsolute(p) ? p : path.resolve(BACKEND_ROOT, p);
}

/** True when the service-account file is set AND exists (send endpoints answer 503 otherwise). */
export function isPushConfigured(): boolean {
  const file = serviceAccountFile();
  return Boolean(file && fs.existsSync(file));
}

async function getMessaging(): Promise<Messaging> {
  if (messaging) return messaging;
  if (initError) throw initError;
  try {
    const file = serviceAccountFile();
    if (!file) throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is not set');
    const serviceAccount = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>;
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getMessaging: gm } = await import('firebase-admin/messaging');
    const app = getApps()[0] ?? initializeApp({ credential: cert(serviceAccount) });
    messaging = gm(app);
    logger.info({ projectId: serviceAccount.project_id }, '[push] firebase-admin initialised');
    return messaging;
  } catch (err) {
    initError = err as Error;
    logger.error({ err }, '[push] Failed to initialise firebase-admin');
    throw err;
  }
}

export interface PushPayload {
  title: string;
  body: string;
  /** FCM data values must be strings (e.g. `{ screen: 'Horoscope' }` opens that screen on tap). */
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface PushResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
  errors: Array<{ token: string; code: string; message: string }>;
}

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

function stringData(data?: Record<string, unknown>): Record<string, string> | undefined {
  if (!data) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return Object.keys(out).length ? out : undefined;
}

/** Sends a notification to up to 500 tokens per batch. Never throws for per-token failures. */
export async function sendPushToTokens(tokens: string[], payload: PushPayload): Promise<PushResult> {
  const result: PushResult = { successCount: 0, failureCount: 0, invalidTokens: [], errors: [] };
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!unique.length) return result;

  const m = await getMessaging();
  const data = stringData(payload.data);
  for (let i = 0; i < unique.length; i += 500) {
    const batch = unique.slice(i, i + 500);
    const res = await m.sendEachForMulticast({
      tokens: batch,
      notification: { title: payload.title, body: payload.body, ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}) },
      ...(data ? { data } : {}),
      android: {
        priority: 'high',
        notification: {
          channelId: ANDROID_CHANNEL_ID,
          icon: 'ic_notification',
          color: '#A7D8F2',
          sound: 'default',
          ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
        },
      },
      apns: { payload: { aps: { sound: 'default' } } },
    });
    result.successCount += res.successCount;
    result.failureCount += res.failureCount;
    res.responses.forEach((r, idx) => {
      if (r.success || !r.error) return;
      const token = batch[idx] as string;
      result.errors.push({ token, code: r.error.code, message: r.error.message });
      if (INVALID_TOKEN_CODES.has(r.error.code)) result.invalidTokens.push(token);
    });
  }
  return result;
}
