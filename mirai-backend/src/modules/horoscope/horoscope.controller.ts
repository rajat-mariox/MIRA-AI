import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { getInsight } from './horoscope.insights';
import * as horoscopeService from './horoscope.service';
import type { HoroscopeQuery, InsightQuery, InsightTopic } from './horoscope.validation';

export async function getHoroscope(req: Request, res: Response) {
  const result = await horoscopeService.getHoroscope(req.user!, req.query as unknown as HoroscopeQuery, req.lang);
  if (!result.ok) return sendSuccess(res, 200, 'horoscope.profileSetupRequired', result.setup);
  return sendSuccess(res, 200, 'horoscope.fetched', result.data);
}

export async function getTopicInsight(req: Request, res: Response) {
  const { sign } = req.query as unknown as InsightQuery;
  const result = await getInsight(req.user!, req.params.topic as InsightTopic, sign, req.lang);
  if (!result.ok) return sendSuccess(res, 200, 'horoscope.profileSetupRequired', result.setup);
  return sendSuccess(res, 200, 'horoscope.insightFetched', result.data);
}
