import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as kundliService from './kundli.service';
import * as profileService from './kundliProfile.service';
import type { KundliResult } from './kundli.service';
import type { ChartId, ChartQuery, CreateKundliProfileInput, DashaQuery, KundliQuery } from './kundli.validation';

// All handlers run behind requireAuth. Birth data = user's profile unless overridden via query.

/** 200 + profile-setup shape when birth data is incomplete; else `{ isProfileComplete: true, ...data }`. */
function respond<T extends object>(res: Response, result: KundliResult<T>, messageKey: string) {
  if (!result.ok) return sendSuccess(res, 200, 'kundli.profileIncomplete', result.setup);
  return sendSuccess(res, 200, messageKey, { isProfileComplete: true, ...result.data });
}

const q = (req: Request) => req.query as unknown as KundliQuery;

export async function basicDetails(req: Request, res: Response) {
  return respond(res, await kundliService.basicDetails(req.user!, q(req), req.lang), 'kundli.basicDetailsFetched');
}

export async function planetaryPositions(req: Request, res: Response) {
  return respond(res, await kundliService.planetaryPositions(req.user!, q(req), req.lang), 'kundli.planetaryPositionsFetched');
}

export async function kaalSarpa(req: Request, res: Response) {
  return respond(res, await kundliService.kaalSarpa(req.user!, q(req), req.lang), 'kundli.kaalSarpaFetched');
}

export async function manglik(req: Request, res: Response) {
  return respond(res, await kundliService.manglik(req.user!, q(req), req.lang), 'kundli.manglikFetched');
}

export async function sadheSati(req: Request, res: Response) {
  return respond(res, await kundliService.sadheSati(req.user!, q(req), req.lang), 'kundli.sadheSatiFetched');
}

export async function chart(req: Request, res: Response) {
  const chartId = req.params.chartId as ChartId;
  const result = await kundliService.chart(req.user!, chartId, req.query as unknown as ChartQuery, req.lang);
  return respond(res, result, 'kundli.chartFetched');
}

export async function vimshottari(req: Request, res: Response) {
  const result = await kundliService.vimshottari(req.user!, req.query as unknown as DashaQuery, req.lang);
  return respond(res, result, 'kundli.dashaFetched');
}

export async function ascendantReport(req: Request, res: Response) {
  return respond(res, await kundliService.ascendantReport(req.user!, q(req), req.lang), 'kundli.ascendantReportFetched');
}

// ---- Saved kundli profiles ----

export async function createProfile(req: Request, res: Response) {
  const profile = await profileService.createProfile(req.user!, req.body as CreateKundliProfileInput);
  return sendSuccess(res, 201, 'kundli.savedProfileCreated', { profile });
}

export async function listProfiles(req: Request, res: Response) {
  const profiles = await profileService.listProfiles(req.user!._id);
  return sendSuccess(res, 200, 'kundli.savedProfilesFetched', { profiles });
}

export async function getProfile(req: Request, res: Response) {
  const profile = await profileService.getProfile(req.user!._id, String(req.params.id));
  return sendSuccess(res, 200, 'kundli.savedProfileFetched', { profile });
}

export async function deleteProfile(req: Request, res: Response) {
  await profileService.deleteProfile(req.user!._id, String(req.params.id));
  return sendSuccess(res, 200, 'kundli.savedProfileDeleted');
}

export async function ghataChakra(req: Request, res: Response) {
  return respond(res, await kundliService.ghataChakra(req.user!, q(req), req.lang), 'kundli.ghataChakraFetched');
}
