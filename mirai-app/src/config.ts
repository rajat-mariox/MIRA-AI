import { NativeModules } from 'react-native';

/**
 * App-wide runtime configuration.
 *
 * API_BASE_URL: in development the backend runs on the same computer as Metro, so the app
 *   uses the host it loaded the JS bundle from: the computer's Wi-Fi IP when Metro is reached
 *   over Wi-Fi, or `localhost` over USB (then also run `adb reverse tcp:5000 tcp:5000`).
 *   Nothing to edit when the computer's IP changes. FALLBACK_DEV_HOST is used only if the
 *   bundle URL can't be read.
 *   Release builds (APK / store) always use PROD_API_BASE_URL (must be https: release builds
 *   block cleartext HTTP).
 */
const PROD_API_BASE_URL = 'https://mira-ai.marioxsoftware.net/api/v1';
const FALLBACK_DEV_HOST = '192.168.29.200';

function devServerHost(): string {
  const source = NativeModules.SourceCode as
    | { scriptURL?: string; getConstants?: () => { scriptURL?: string } }
    | undefined;
  const scriptURL = source?.getConstants?.().scriptURL ?? source?.scriptURL;
  const host = scriptURL?.match(/^https?:\/\/([^/:]+)/)?.[1];
  return host || FALLBACK_DEV_HOST;
}

export const API_BASE_URL = __DEV__ ? `http://${devServerHost()}:5000/api/v1` : PROD_API_BASE_URL;

/** Request timeouts (ms). Chat replies come from an LLM and can take longer. */
export const REQUEST_TIMEOUT_MS = 30_000;
export const CHAT_TIMEOUT_MS = 90_000;

export type AppLanguage = 'en' | 'hi';

/**
 * Language sent as `Accept-Language` on every request (backend messages + astrology text).
 * Change it in one place with `setAppLanguage('hi')` once the language picker exists.
 */
let appLanguage: AppLanguage = 'en';

export function getAppLanguage(): AppLanguage {
  return appLanguage;
}

export function setAppLanguage(lang: AppLanguage) {
  appLanguage = lang;
}
