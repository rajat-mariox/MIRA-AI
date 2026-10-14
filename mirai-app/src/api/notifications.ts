import { request } from './client';

/** GET /notifications item (own notifications + broadcasts) */
export type AppNotification = {
  id: string;
  title: string;
  body: string;
  /** general, horoscope, prediction, event, promo, ... */
  type: string;
  /** app route opened on tap (e.g. Horoscope, Wallet), null = none */
  screen: string | null;
  imageUrl: string | null;
  data: Record<string, string> | null;
  /** ISO date */
  createdAt: string;
  read: boolean;
};

export type NotificationsPage = {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

/** GET /notifications, newest first */
export function listNotifications(page = 1, limit = 30) {
  return request<NotificationsPage>('/notifications', { query: { page, limit } });
}

/** GET /notifications/unread-count */
export async function getUnreadCount() {
  return (await request<{ unreadCount: number }>('/notifications/unread-count')).unreadCount;
}

/** PATCH /notifications/:id/read -> remaining unread count */
export async function markNotificationRead(id: string) {
  return (await request<{ unreadCount: number }>(`/notifications/${id}/read`, { method: 'PATCH' })).unreadCount;
}

/** PATCH /notifications/read-all */
export function markAllNotificationsRead() {
  return request<{ updated: number; unreadCount: number }>('/notifications/read-all', { method: 'PATCH' });
}

/** PUT /users/me/fcm-token: push token of THIS session (null clears it) */
export function saveFcmToken(fcmToken: string | null) {
  return request<undefined>('/users/me/fcm-token', { method: 'PUT', body: { fcmToken } });
}
