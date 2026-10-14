import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { festivalInsight } from './festivalInsight';
import * as panchangService from './panchang.service';
import type { FestivalInsightQuery, FestivalsQuery, LunarSamvatQuery, PanchangDayQuery } from './panchang.validation';

// All handlers run behind requireAuth. Data = Divine's `data` payload (lightly normalised).

const q = (req: Request) => req.query as unknown as PanchangDayQuery;

export async function getPanchang(req: Request, res: Response) {
  return sendSuccess(res, 200, 'panchang.fetched', await panchangService.panchang(req.user, q(req), req.lang));
}

export async function getAuspiciousTimings(req: Request, res: Response) {
  return sendSuccess(res, 200, 'panchang.auspiciousFetched', await panchangService.auspiciousTimings(req.user, q(req), req.lang));
}

export async function getFestivals(req: Request, res: Response) {
  const data = await panchangService.festivals(req.user, req.query as unknown as FestivalsQuery, req.lang);
  return sendSuccess(res, 200, 'panchang.festivalsFetched', data);
}

/** AI insight: what the festival means for the user's rashi (not counted against the chat quota). */
export async function getFestivalInsight(req: Request, res: Response) {
  const data = await festivalInsight(req.user!, req.query as unknown as FestivalInsightQuery, req.lang);
  return sendSuccess(res, 200, 'festival.insightFetched', data);
}

export async function getSunAndMoon(req: Request, res: Response) {
  return sendSuccess(res, 200, 'panchang.sunMoonFetched', await panchangService.sunAndMoon(req.user, q(req), req.lang));
}

export async function getLunarSamvat(req: Request, res: Response) {
  const data = await panchangService.lunarSamvat(req.user, req.query as unknown as LunarSamvatQuery, req.lang);
  return sendSuccess(res, 200, 'panchang.lunarSamvatFetched', data);
}

export async function getRashiNakshatra(req: Request, res: Response) {
  return sendSuccess(res, 200, 'panchang.rashiNakshatraFetched', await panchangService.rashiNakshatra(req.user, q(req), req.lang));
}

export async function getRituAyana(req: Request, res: Response) {
  return sendSuccess(res, 200, 'panchang.rituAyanaFetched', await panchangService.rituAyana(req.user, q(req), req.lang));
}

export async function getInauspiciousTimings(req: Request, res: Response) {
  const data = await panchangService.inauspiciousTimings(req.user, q(req), req.lang);
  return sendSuccess(res, 200, 'panchang.inauspiciousFetched', data);
}

export async function getNivasShool(req: Request, res: Response) {
  return sendSuccess(res, 200, 'panchang.nivasShoolFetched', await panchangService.nivasShool(req.user, q(req), req.lang));
}

export async function getOtherCalendars(req: Request, res: Response) {
  return sendSuccess(res, 200, 'panchang.otherCalendarsFetched', await panchangService.otherCalendars(req.user, q(req), req.lang));
}

// Computed in the backend (Divine's dedicated endpoints aren't in the plan).
export async function getChandrabalamTarabalam(req: Request, res: Response) {
  const data = await panchangService.chandrabalamTarabalam(req.user, q(req), req.lang);
  return sendSuccess(res, 200, 'panchang.chandrabalamFetched', data);
}

export async function getUdayaLagna(req: Request, res: Response) {
  return sendSuccess(res, 200, 'panchang.udayaLagnaFetched', await panchangService.udayaLagna(req.user, q(req), req.lang));
}

export async function getPanchakaRahita(req: Request, res: Response) {
  return sendSuccess(res, 200, 'panchang.panchakaRahitaFetched', await panchangService.panchakaRahita(req.user, q(req), req.lang));
}
