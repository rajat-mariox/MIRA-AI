import { env } from '../config/env';
import { logger } from './logger';

/**
 * MSG91 Email (v5): sends a pre-approved MSG91 email template.
 *   POST https://control.msg91.com/api/v5/email/send   (header `authkey`)
 * The sending domain must be verified in MSG91, and a new authkey may have IP security on —
 * whitelist the server's IP in MSG91 if sends fail with an auth error.
 */

const SEND_URL = 'https://control.msg91.com/api/v5/email/send';
const REQUEST_TIMEOUT_MS = 15_000;

export function isMsg91EmailConfigured(): boolean {
  return Boolean(env.MSG91_AUTH_KEY && env.MSG91_EMAIL_DOMAIN && env.MSG91_FROM_EMAIL);
}

interface Msg91Response {
  status?: string;
  hasError?: boolean;
  message?: string;
  errors?: unknown;
  data?: { unique_id?: string };
}

/** Send one templated email. Throws when MSG91 rejects it. */
export async function sendMsg91TemplateEmail(opts: {
  to: string;
  name?: string;
  templateId: string;
  variables: Record<string, string>;
}): Promise<string | undefined> {
  const body = {
    recipients: [
      {
        to: [{ email: opts.to, ...(opts.name ? { name: opts.name } : {}) }],
        variables: opts.variables,
      },
    ],
    from: { email: env.MSG91_FROM_EMAIL, name: env.MSG91_FROM_NAME },
    domain: env.MSG91_EMAIL_DOMAIN,
    template_id: opts.templateId,
  };

  const res = await fetch(SEND_URL, {
    method: 'POST',
    headers: {
      authkey: env.MSG91_AUTH_KEY!,
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const json = (await res.json().catch(() => ({}))) as Msg91Response;

  // A 200 only means "queued"; MSG91 also reports failures in the body
  if (!res.ok || json.hasError || (json.status && json.status !== 'success')) {
    logger.error(
      { status: res.status, msgStatus: json.status, message: json.message, errors: json.errors, template: opts.templateId },
      '[msg91] email send failed',
    );
    throw new Error(`MSG91 email failed (${res.status}): ${json.message ?? 'unknown error'}`);
  }
  return json.data?.unique_id;
}
