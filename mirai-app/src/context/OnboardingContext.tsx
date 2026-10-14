import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import * as userApi from '../api/user';
import type { MaritalStatus, UpdateMeInput, User } from '../api/user';
import { ApiError, setSessionExpiredHandler } from '../api/client';
import {
  clearSession,
  loadCachedUser,
  loadTokens,
  saveCachedUser,
  saveTokens,
} from '../api/storage';
import { resetToWelcome } from '../navigation/navigationRef';
import {
  clearPendingNotification,
  registerPushToken,
  setUnreadCount,
  unregisterPushToken,
} from '../notifications';

export type Gender = 'male' | 'female' | 'other';
export type RelationshipStatus =
  | 'in-relationship'
  | 'single'
  | 'married'
  | 'engaged'
  | 'divorced'
  | 'widow';

export type OnboardingData = {
  email: string;
  name: string;
  /** month is 0-based (as in the pickers) */
  birthDate?: { day: number; month: number; year: number };
  /** undefined when the user tapped "I don't know" */
  birthTime?: { hour: number; minute: number; period: 'AM' | 'PM' };
  birthPlace?: string;
  gender?: Gender;
  relationship?: RelationshipStatus;
};

// The backend only knows single | married | divorced | widowed
const RELATIONSHIP_TO_API: Record<RelationshipStatus, MaritalStatus> = {
  'in-relationship': 'single',
  single: 'single',
  engaged: 'single',
  married: 'married',
  divorced: 'divorced',
  widow: 'widowed',
};
const RELATIONSHIP_FROM_API: Record<MaritalStatus, RelationshipStatus> = {
  single: 'single',
  married: 'married',
  divorced: 'divorced',
  widowed: 'widow',
};

export function relationshipToApi(r: RelationshipStatus): MaritalStatus {
  return RELATIONSHIP_TO_API[r];
}

const pad = (n: number) => String(n).padStart(2, '0');

/** { day, month (0-based), year } -> "YYYY-MM-DD" */
export function birthDateToIso(d: { day: number; month: number; year: number }) {
  return `${d.year}-${pad(d.month + 1)}-${pad(d.day)}`;
}

/** 12h picker value -> "HH:mm" */
export function birthTimeTo24h(t: { hour: number; minute: number; period: 'AM' | 'PM' }) {
  const h = (t.hour % 12) + (t.period === 'PM' ? 12 : 0);
  return `${pad(h)}:${pad(t.minute)}`;
}

/** Profile fields -> the onboarding / profile form shape used by the screens. */
export function userToOnboarding(user: User): OnboardingData {
  const out: OnboardingData = { email: user.email, name: user.fullName ?? '' };
  if (user.dateOfBirth) {
    // stored as midnight UTC
    const d = new Date(user.dateOfBirth);
    if (!Number.isNaN(d.getTime())) {
      out.birthDate = { day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() };
    }
  }
  const m = /^(\d{1,2}):(\d{2})$/.exec(user.birthTime ?? '');
  if (m) {
    const h = Number(m[1]);
    out.birthTime = { hour: h % 12 === 0 ? 12 : h % 12, minute: Number(m[2]), period: h < 12 ? 'AM' : 'PM' };
  }
  if (user.birthPlace) out.birthPlace = user.birthPlace;
  if (user.gender) out.gender = user.gender;
  if (user.maritalStatus) out.relationship = RELATIONSHIP_FROM_API[user.maritalStatus];
  return out;
}

type ContextValue = {
  /** onboarding / profile form values (kept in sync with `user`) */
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  /** signed-in user, null when signed out */
  user: User | null;
  setUser: (user: User | null) => void;
  /** GET /users/me; returns null when it fails */
  refreshUser: () => Promise<User | null>;
  /** PUT /users/me and keep the result */
  saveProfile: (patch: UpdateMeInput) => Promise<User>;
  /** after verify-otp */
  signIn: (tokens: { accessToken: string; refreshToken: string }, user: User) => Promise<void>;
  /**
   * Launch: restores the stored session. Returns the user, or null when signed out.
   * Offline launches fall back to the last cached user.
   */
  restoreSession: () => Promise<User | null>;
  /** POST /auth/logout (best effort), then clears the session and resets to Welcome */
  logout: () => Promise<void>;
  /** DELETE /users/me, then clears the session and resets to Welcome. Throws on failure. */
  deleteAccount: () => Promise<string>;
};

const OnboardingContext = createContext<ContextValue | null>(null);

const EMPTY: OnboardingData = { email: '', name: '' };

/**
 * Onboarding answers + the auth session. The onboarding screens save each step with
 * PUT /users/me; `data` mirrors the saved user so the screens can keep reading it.
 */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(EMPTY);
  const [user, setUserState] = useState<User | null>(null);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) {
      setData(userToOnboarding(u));
      saveCachedUser(u);
    }
  }, []);

  const endSession = useCallback(async () => {
    await unregisterPushToken();
    clearPendingNotification();
    setUnreadCount(0);
    await clearSession();
    setUserState(null);
    setData(EMPTY);
    resetToWelcome();
  }, []);

  useEffect(() => {
    // Refresh token rejected: tokens are already cleared by the client
    setSessionExpiredHandler(() => {
      unregisterPushToken();
      clearPendingNotification();
      setUnreadCount(0);
      setUserState(null);
      setData(EMPTY);
      resetToWelcome();
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await userApi.getMe();
      setUser(u);
      return u;
    } catch {
      return null;
    }
  }, [setUser]);

  const saveProfile = useCallback(
    async (patch: UpdateMeInput) => {
      const u = await userApi.updateMe(patch);
      setUser(u);
      return u;
    },
    [setUser],
  );

  const signIn = useCallback(
    async (tokens: { accessToken: string; refreshToken: string }, u: User) => {
      await saveTokens(tokens);
      setUser(u);
      // push token -> PUT /users/me/fcm-token (permission prompt on Android 13+)
      registerPushToken();
    },
    [setUser],
  );

  const restoreSession = useCallback(async () => {
    const tokens = await loadTokens();
    if (!tokens) return null;
    try {
      const u = await userApi.getMe();
      setUser(u);
      registerPushToken();
      return u;
    } catch (e) {
      if (e instanceof ApiError && e.isNetworkError) {
        const cached = await loadCachedUser<User>();
        if (cached) setUser(cached);
        return cached;
      }
      await clearSession();
      return null;
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // signed out locally even if the server call fails
    }
    await endSession();
  }, [endSession]);

  const deleteAccount = useCallback(async () => {
    const { message } = await userApi.deleteMe();
    await endSession();
    return message;
  }, [endSession]);

  const update = useCallback((patch: Partial<OnboardingData>) => setData(d => ({ ...d, ...patch })), []);

  const value = useMemo(
    () => ({
      data,
      update,
      user,
      setUser,
      refreshUser,
      saveProfile,
      signIn,
      restoreSession,
      logout,
      deleteAccount,
    }),
    [data, update, user, setUser, refreshUser, saveProfile, signIn, restoreSession, logout, deleteAccount],
  );
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}

/** Alias for screens that only need the session part. */
export const useSession = useOnboarding;
