import { Platform } from 'react-native';
import { request, requestWithMessage } from './client';
import { getDeviceId } from './storage';
import type { User } from './user';
import { getFcmTokenQuietly } from '../notifications/push';

export type DeviceInfo = {
  deviceId: string;
  deviceType: 'android' | 'ios';
  deviceName?: string;
  fcmToken?: string;
};

export type SendOtpResponse = { isNewUser: boolean };

export type VerifyOtpResponse = {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: User;
};

export async function deviceInfo(): Promise<DeviceInfo> {
  const c = Platform.constants as { Brand?: string; Model?: string };
  const name = [c.Brand, c.Model].filter(Boolean).join(' ').trim();
  return {
    deviceId: await getDeviceId(),
    deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
    deviceName: (name || Platform.OS).slice(0, 200),
  };
}

/** deviceInfo + the FCM token when it is available right away (no permission prompt here) */
async function deviceInfoWithPushToken(): Promise<DeviceInfo> {
  const [info, fcmToken] = await Promise.all([deviceInfo(), getFcmTokenQuietly(3000)]);
  return fcmToken ? { ...info, fcmToken } : info;
}

/** POST /auth/send-otp */
export function sendOtp(email: string) {
  return requestWithMessage<SendOtpResponse>('/auth/send-otp', {
    method: 'POST',
    body: { email },
    auth: false,
  });
}

/** POST /auth/verify-otp */
export async function verifyOtp(email: string, otp: string, hasAcceptedTerms: boolean) {
  return request<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: { email, otp, hasAcceptedTerms, deviceInfo: await deviceInfoWithPushToken() },
    auth: false,
  });
}

/** POST /auth/logout (this device) */
export async function logout() {
  return request<undefined>('/auth/logout', {
    method: 'POST',
    body: { deviceId: await getDeviceId() },
  });
}
