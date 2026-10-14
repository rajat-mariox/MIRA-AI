import { navigationRef } from '../navigation/navigationRef';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

/**
 * Opens the app screen named by a notification's `data.screen` (case-insensitive). Unknown or
 * missing screens open the Notification screen. When the app is not ready yet (cold start, splash,
 * signed out, onboarding) the screen is kept and opened by `flushPendingNotification()`, which
 * App.tsx calls on every navigation state change.
 */

const TAB_SCREENS: Array<keyof MainTabParamList> = ['Home', 'Horoscope', 'Kundli', 'Panchang', 'QueReport'];
const STACK_SCREENS: Array<keyof RootStackParamList> = [
  'HoroscopeDetail',
  'CareerInsights',
  'AstroGuide',
  'Profile',
  'EditProfile',
  'Notification',
  'PrivacySecurity',
  'HelpSupport',
  'RateApp',
  'Wallet',
  'WalletHistory',
  'Plans',
];
/** Routes where a signed-in user is NOT in the app yet */
const NOT_READY_ROUTES = new Set<string>([
  'Splash',
  'Welcome',
  'Otp',
  'Name',
  'BirthDate',
  'BirthTime',
  'BirthPlace',
  'Gender',
  'Relationship',
]);

let pending: string | null = null;

function resolve(screen: string | null | undefined) {
  const key = (screen ?? '').trim().toLowerCase();
  const tab = TAB_SCREENS.find(s => s.toLowerCase() === key);
  if (tab) return { tab };
  const stack = STACK_SCREENS.find(s => s.toLowerCase() === key);
  return { stack: stack ?? ('Notification' as const) };
}

function isAppReady() {
  if (!navigationRef.isReady()) return false;
  const route = navigationRef.getCurrentRoute();
  const root = navigationRef.getRootState()?.routes?.[0]?.name;
  return Boolean(route && root && !NOT_READY_ROUTES.has(String(root)) && !NOT_READY_ROUTES.has(route.name));
}

function go(screen: string) {
  const target = resolve(screen);
  if (target.tab) {
    navigationRef.navigate('Main', { screen: target.tab } as never);
  } else {
    navigationRef.navigate(target.stack as never);
  }
}

/** Opens the screen now, or as soon as the user is signed in and past the splash / onboarding. */
export function openNotificationTarget(screen: string | null | undefined) {
  pending = screen && screen.trim() ? screen : 'Notification';
  flushPendingNotification();
}

export function flushPendingNotification() {
  if (!pending || !isAppReady()) return;
  const screen = pending;
  pending = null;
  try {
    go(screen);
  } catch {
    // navigation not possible right now: drop it
  }
}

/** Signed out: forget a tap that was waiting for the app. */
export function clearPendingNotification() {
  pending = null;
}

/** `data.screen` from an FCM / notifee data payload */
export function screenFromData(data: Record<string, unknown> | undefined | null): string | null {
  const s = data?.screen;
  return typeof s === 'string' && s.trim() ? s.trim() : null;
}
