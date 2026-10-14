import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as authService from './auth.service';
import type { LogoutInput, RefreshTokenInput, SendOtpInput, VerifyOtpInput } from './auth.validation';

const clientMeta = (req: Request): authService.ClientMeta => ({
  ip: req.ip,
  userAgent: req.header('user-agent')?.slice(0, 500),
  lang: req.lang,
});

export async function sendOtp(req: Request, res: Response) {
  const { email } = req.body as SendOtpInput;
  const data = await authService.sendOtp(email, clientMeta(req));
  return sendSuccess(res, 200, 'auth.otpSent', data);
}

export async function verifyOtp(req: Request, res: Response) {
  const result = await authService.verifyOtp(req.body as VerifyOtpInput, clientMeta(req));
  return sendSuccess(res, 200, result.isNewUser ? 'auth.accountCreated' : 'auth.loggedIn', result);
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body as RefreshTokenInput;
  const tokens = await authService.refreshTokens(refreshToken, clientMeta(req));
  return sendSuccess(res, 200, 'auth.tokenRefreshed', tokens);
}

export async function logout(req: Request, res: Response) {
  const { deviceId } = req.body as LogoutInput;
  await authService.logout(String(req.user!._id), deviceId, req.sessionId);
  return sendSuccess(res, 200, 'auth.loggedOut');
}

export async function logoutAll(req: Request, res: Response) {
  await authService.logoutAll(String(req.user!._id));
  return sendSuccess(res, 200, 'auth.loggedOutAll');
}
