import { PermissionsAndroid, Platform } from 'react-native';
import notifee, { AndroidImportance, EventType, type Event } from '@notifee/react-native';
import {
  AuthorizationStatus,
  deleteToken,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { saveFcmToken } from '../api/notifications';
import { openNotificationTarget, screenFromData } from './navigation';
import { refreshUnreadCount } from './unread';

/**
 * Firebase Cloud Messaging + notifee.
 *  - background / killed: FCM shows `notification` payloads itself (channel "default", see AndroidManifest)
 *  - foreground: shown with notifee on the same channel
 *  - taps open `data.screen` (navigation.ts)
 * Every call is best effort: push must never break sign-in (e.g. iOS without GoogleService-Info.plist).
 */

export const DEFAULT_CHANNEL_ID = 'default';
const ACCENT = '#A7D8F2';

let started = false;
let refreshUnsub: (() => void) | null = null;

function messaging() {
  return getMessaging();
}

function dataOf(m: RemoteMessage | null | undefined): Record<string, unknown> | undefined {
  return (m?.data as Record<string, unknown> | undefined) ?? undefined;
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: DEFAULT_CHANNEL_ID,
    name: 'General',
    description: 'Horoscope, panchang and account updates',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
}

async function showForeground(m: RemoteMessage) {
  const title = m.notification?.title ?? (typeof m.data?.title === 'string' ? m.data.title : undefined);
  const body = m.notification?.body ?? (typeof m.data?.body === 'string' ? m.data.body : undefined);
  if (!title && !body) return;
  await notifee.displayNotification({
    title,
    body,
    data: (m.data ?? {}) as Record<string, string>,
    android: {
      channelId: DEFAULT_CHANNEL_ID,
      smallIcon: 'ic_notification',
      color: ACCENT,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
      ...(m.notification?.android?.imageUrl
        ? { largeIcon: m.notification.android.imageUrl }
        : {}),
    },
    ios: { sound: 'default' },
  });
}

/** notifee press (foreground or background) -> open its screen */
export function handleNotifeeEvent({ type, detail }: Event) {
  if (type === EventType.PRESS) {
    openNotificationTarget(screenFromData(detail.notification?.data as Record<string, unknown> | undefined));
  }
}

/**
 * Once per app launch (App.tsx): channel, foreground display, tap handling.
 * Nothing here asks for permission.
 */
export function startNotifications() {
  if (started) return;
  started = true;
  ensureChannel().catch(() => {});
  try {
    const m = messaging();
    onMessage(m, async msg => {
      refreshUnreadCount();
      try {
        await showForeground(msg);
      } catch {
        // display failed: the message is still in the in-app list
      }
    });
    // Tap on an FCM-shown notification while the app was in the background
    onNotificationOpenedApp(m, msg => openNotificationTarget(screenFromData(dataOf(msg))));
    // Tap that launched the app from a killed state
    getInitialNotification(m)
      .then(msg => {
        if (msg) openNotificationTarget(screenFromData(dataOf(msg)));
      })
      .catch(() => {});
  } catch {
    // Firebase not configured on this platform
  }
  notifee.onForegroundEvent(handleNotifeeEvent);
  notifee
    .getInitialNotification()
    .then(initial => {
      if (initial) openNotificationTarget(screenFromData(initial.notification.data as Record<string, unknown> | undefined));
    })
    .catch(() => {});
}

/** Android 13+ runtime permission / iOS authorization. Returns true when notifications may be shown. */
async function askPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      if (Number(Platform.Version) < 33) return true;
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }
    const status = await requestPermission(messaging());
    return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
  } catch {
    return false;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise(resolve => {
    const t = setTimeout(() => resolve(null), ms);
    p.then(
      v => {
        clearTimeout(t);
        resolve(v);
      },
      () => {
        clearTimeout(t);
        resolve(null);
      },
    );
  });
}

/** FCM token without asking for permission (verify-otp `deviceInfo.fcmToken`). null when unavailable. */
export async function getFcmTokenQuietly(timeoutMs = 4000): Promise<string | null> {
  try {
    return (await withTimeout(getToken(messaging()), timeoutMs)) || null;
  } catch {
    return null;
  }
}

let permissionPrompted = false;

/**
 * Home screen (first visit per launch): asks for the notification permission there instead of
 * during login, then registers the token again so pushes start right away once allowed.
 * Android shows nothing when the permission was already granted (or permanently denied).
 */
export async function promptNotificationPermission() {
  if (permissionPrompted) return;
  permissionPrompted = true;
  if (await askPermission()) await registerPushToken();
}

/**
 * Signed in (login / session restore): sends the FCM token to the backend (PUT
 * /users/me/fcm-token) and resends it whenever FCM rotates it. The permission is asked on Home.
 */
export async function registerPushToken() {
  try {
    const m = messaging();
    const token = await getFcmTokenQuietly(10000);
    if (token) await saveFcmToken(token);
    if (!refreshUnsub) {
      refreshUnsub = onTokenRefresh(m, t => {
        saveFcmToken(t).catch(() => {});
      });
    }
  } catch {
    // offline / Firebase not configured: retried on the next launch
  }
  refreshUnreadCount();
}

/** Signing out / account deleted: stop listening and delete the token on this device. */
export async function unregisterPushToken() {
  refreshUnsub?.();
  refreshUnsub = null;
  try {
    await deleteToken(messaging());
  } catch {
    // nothing to delete
  }
}
