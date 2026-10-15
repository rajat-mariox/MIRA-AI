import { env } from '../config/env';
import { logger } from './logger';
import { isMailerConfigured, sendMail } from './mailer';
import { isMsg91EmailConfigured, sendMsg91TemplateEmail } from './msg91';

/**
 * Delivers a login / password-reset OTP by email:
 *   1. MSG91 template (MSG91_OTP_TEMPLATE_ID, variables company_name + otp) when MSG91 is configured,
 *   2. otherwise SMTP with the given subject/text/html,
 *   3. otherwise (no email set up, dev) the OTP is only written to the server log.
 * Throws when the configured provider fails, so the caller can report it.
 */
export async function sendOtpEmail(opts: {
  to: string;
  otp: string;
  subject: string;
  text: string;
  html: string;
  /** label for the log line, e.g. "auth" or "admin" */
  context: string;
}): Promise<void> {
  if (isMsg91EmailConfigured()) {
    await sendMsg91TemplateEmail({
      to: opts.to,
      templateId: env.MSG91_OTP_TEMPLATE_ID,
      variables: { company_name: env.MSG91_COMPANY_NAME, otp: opts.otp },
    });
    return;
  }
  if (!isMailerConfigured()) {
    logger.info(`[${opts.context}] OTP for ${opts.to}: ${opts.otp} (no email provider configured)`);
  }
  await sendMail({ to: opts.to, subject: opts.subject, text: opts.text, html: opts.html });
}
