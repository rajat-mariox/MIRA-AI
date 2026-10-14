import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as userService from './user.service';
import type { FcmTokenInput, UpdateMeInput } from './user.validation';

// All handlers run behind requireAuth, so req.user is always set.

export async function getMe(req: Request, res: Response) {
  const user = userService.getProfile(req.user!);
  return sendSuccess(res, 200, 'user.profileFetched', { user });
}

export async function updateMe(req: Request, res: Response) {
  const user = await userService.updateProfile(req.user!, req.body as UpdateMeInput);
  return sendSuccess(res, 200, 'user.profileUpdated', { user });
}

export async function getDevices(req: Request, res: Response) {
  const devices = await userService.listDevices(String(req.user!._id), req.sessionId);
  return sendSuccess(res, 200, 'user.devicesFetched', { devices });
}

export async function setFcmToken(req: Request, res: Response) {
  const { fcmToken } = req.body as FcmTokenInput;
  await userService.setFcmToken(String(req.user!._id), String(req.sessionId), fcmToken);
  return sendSuccess(res, 200, fcmToken ? 'user.fcmTokenSaved' : 'user.fcmTokenCleared');
}

export async function removeDevice(req: Request, res: Response) {
  await userService.removeDevice(String(req.user!._id), String(req.params.sessionId));
  return sendSuccess(res, 200, 'user.deviceRemoved');
}

export async function deleteMe(req: Request, res: Response) {
  await userService.deleteAccount(String(req.user!._id));
  return sendSuccess(res, 200, 'user.accountDeleted');
}
