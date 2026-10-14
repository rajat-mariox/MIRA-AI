import type { Lang } from '../lib/i18n';
import type { AdminTokenPayload } from '../lib/jwt';
import type { UserDocument } from '../modules/user/user.model';

declare global {
  namespace Express {
    interface Request {
      /** Unique id for this request (also sent back as X-Request-Id). */
      requestId: string;
      /** Resolved language from Accept-Language ('en' | 'hi'). */
      lang: Lang;
      /** Authenticated app user (set by requireAuth). */
      user?: UserDocument;
      /** Current device session id (set by requireAuth). */
      sessionId?: string;
      /** Authenticated admin JWT payload (set by requireAdmin). The admin module may also attach `adminDoc`. */
      admin?: AdminTokenPayload;
    }
  }
}

export {};
