import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import chatRoutes from '../modules/chat/chat.routes';
import healthRoutes from '../modules/health/health.routes';
import homeRoutes from '../modules/home/home.routes';
import horoscopeRoutes from '../modules/horoscope/horoscope.routes';
import kundliRoutes from '../modules/kundli/kundli.routes';
import panchangRoutes from '../modules/panchang/panchang.routes';
import userRoutes from '../modules/user/user.routes';
import planRoutes from '../modules/plan/plan.routes';
import planAdminRoutes from '../modules/plan/plan.admin.routes';
import walletRoutes from '../modules/wallet/wallet.routes';
import transactionAdminRoutes from '../modules/wallet/transaction.admin.routes';
import supportRoutes from '../modules/support/support.routes';
import supportAdminRoutes from '../modules/support/support.admin.routes';
import feedbackRoutes from '../modules/feedback/feedback.routes';
import feedbackAdminRoutes from '../modules/feedback/feedback.admin.routes';
import adminRoutes from '../modules/admin/admin.routes';
import adminUserRoutes from '../modules/admin/admin.users.routes';
import bannerRoutes from '../modules/banner/banner.routes';
import bannerAdminRoutes from '../modules/banner/banner.admin.routes';
import cmsRoutes from '../modules/cms/cms.routes';
import cmsAdminRoutes from '../modules/cms/cms.admin.routes';
import faqRoutes from '../modules/faq/faq.routes';
import faqAdminRoutes from '../modules/faq/faq.admin.routes';
import mediaRoutes from '../modules/media/media.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import notificationAdminRoutes from '../modules/notification/notification.admin.routes';
import placesRoutes from '../modules/places/places.routes';
import leadRoutes from '../modules/lead/lead.routes';
import leadAdminRoutes from '../modules/lead/lead.admin.routes';

/**
 * Central API router, mounted at /api/v1 in app.ts.
 *
 * TO ADD A MODULE: import its router above and add ONE line to `moduleRoutes`.
 *   { path: '/horoscope', router: horoscopeRoutes },
 * Admin endpoints live under '/admin/...', e.g. { path: '/admin/users', router: adminUserRoutes }.
 */
const moduleRoutes: Array<{ path: string; router: Router }> = [
  { path: '/health', router: healthRoutes },
  { path: '/auth', router: authRoutes },
  { path: '/users', router: userRoutes },
  { path: '/plans', router: planRoutes },
  { path: '/wallet', router: walletRoutes },
  { path: '/support', router: supportRoutes },
  { path: '/feedback', router: feedbackRoutes },
  { path: '/admin/plans', router: planAdminRoutes },
  { path: '/admin/transactions', router: transactionAdminRoutes },
  { path: '/admin/support', router: supportAdminRoutes },
  { path: '/admin/feedback', router: feedbackAdminRoutes },
  { path: '/home', router: homeRoutes },
  { path: '/horoscope', router: horoscopeRoutes },
  { path: '/panchang', router: panchangRoutes },
  { path: '/kundli', router: kundliRoutes },
  { path: '/chat', router: chatRoutes },
  // admin auth/profile/dashboard/cache (no global requireAdmin: shares the /admin prefix)
  { path: '/admin', router: adminRoutes },
  { path: '/admin/users', router: adminUserRoutes },
  { path: '/admin/user-management/users', router: adminUserRoutes }, // panel fallback paths
  { path: '/admin/user-management/user', router: adminUserRoutes },
  { path: '/banners', router: bannerRoutes },
  { path: '/admin/banners', router: bannerAdminRoutes },
  { path: '/cms', router: cmsRoutes },
  { path: '/admin/cms', router: cmsAdminRoutes },
  { path: '/faq', router: faqRoutes },
  { path: '/admin/faq', router: faqAdminRoutes },
  { path: '/media', router: mediaRoutes },
  { path: '/notifications', router: notificationRoutes },
  { path: '/admin/notifications', router: notificationAdminRoutes },
  { path: '/places', router: placesRoutes },
  { path: '/leads', router: leadRoutes },
  { path: '/admin/leads', router: leadAdminRoutes },
];

const apiRouter = Router();
for (const { path, router } of moduleRoutes) apiRouter.use(path, router);

export default apiRouter;
