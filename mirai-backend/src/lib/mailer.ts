import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export function isMailerConfigured(): boolean {
  return Boolean(env.SMTP_HOST);
}

/** Sends an email via SMTP. If SMTP_HOST is not configured, logs the email to the console instead. */
export async function sendMail(opts: MailOptions): Promise<void> {
  const t = getTransporter();
  if (!t) {
    logger.info(
      { to: opts.to, subject: opts.subject, text: opts.text },
      '[mailer] SMTP not configured - email logged instead of sent',
    );
    return;
  }
  try {
    await t.sendMail({ from: env.SMTP_FROM, ...opts });
  } catch (err) {
    // In development a broken SMTP setup shouldn't block logins: log the email instead
    if (env.NODE_ENV === 'production') throw err;
    logger.warn(
      { err: (err as Error).message, to: opts.to, subject: opts.subject, text: opts.text },
      '[mailer] SMTP send failed - email logged instead (development only)',
    );
  }
}
