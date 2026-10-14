import AsyncStorage from '@react-native-async-storage/async-storage';

/** Persistent keys. Tokens + device id + the last known user (used when offline at launch). */
const KEYS = {
  accessToken: 'mirai.accessToken',
  refreshToken: 'mirai.refreshToken',
  deviceId: 'mirai.deviceId',
  user: 'mirai.user',
} as const;

export type Tokens = { accessToken: string; refreshToken: string };

let memoryTokens: Tokens | null = null;
let loaded = false;

export async function loadTokens(): Promise<Tokens | null> {
  if (loaded) return memoryTokens;
  try {
    const [[, access], [, refresh]] = await AsyncStorage.multiGet([KEYS.accessToken, KEYS.refreshToken]);
    memoryTokens = access && refresh ? { accessToken: access, refreshToken: refresh } : null;
  } catch {
    memoryTokens = null;
  }
  loaded = true;
  return memoryTokens;
}

export function getTokens(): Tokens | null {
  return memoryTokens;
}

export async function saveTokens(tokens: Tokens): Promise<void> {
  memoryTokens = tokens;
  loaded = true;
  await AsyncStorage.multiSet([
    [KEYS.accessToken, tokens.accessToken],
    [KEYS.refreshToken, tokens.refreshToken],
  ]);
}

export async function clearSession(): Promise<void> {
  memoryTokens = null;
  loaded = true;
  await AsyncStorage.multiRemove([KEYS.accessToken, KEYS.refreshToken, KEYS.user]).catch(() => {});
}

/** RFC 4122 v4 UUID (Hermes has no crypto.randomUUID). */
function uuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : 8 + (r % 4)).toString(16);
  });
}

let deviceIdCache: string | null = null;

/** Random id generated on first launch and kept for the lifetime of the install. */
export async function getDeviceId(): Promise<string> {
  if (deviceIdCache) return deviceIdCache;
  let id: string | null = null;
  try {
    id = await AsyncStorage.getItem(KEYS.deviceId);
  } catch {}
  if (!id) {
    id = uuidV4();
    await AsyncStorage.setItem(KEYS.deviceId, id).catch(() => {});
  }
  deviceIdCache = id;
  return id;
}

export async function saveCachedUser(user: unknown): Promise<void> {
  await AsyncStorage.setItem(KEYS.user, JSON.stringify(user)).catch(() => {});
}

export async function loadCachedUser<T>(): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.user);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
