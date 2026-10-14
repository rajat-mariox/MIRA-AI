import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './panchang.controller';
import { festivalInsightQuery, festivalsQuery, lunarSamvatQuery, panchangDayQuery } from './panchang.validation';

const router = Router();

router.use(requireAuth);

// All query params optional: day, month, year (default today), place, lat, lon, tzone (default user location / New Delhi).
const vq = validate({ query: panchangDayQuery });

router.get('/', vq, asyncHandler(controller.getPanchang));
router.get('/auspicious-timings', vq, asyncHandler(controller.getAuspiciousTimings));
// AI: what this festival means for the user's rashi (?name&date=YYYY-MM-DD[&sign]); cached 30 days
router.get('/festivals/insight', validate({ query: festivalInsightQuery }), asyncHandler(controller.getFestivalInsight));
router.get('/festivals', validate({ query: festivalsQuery }), asyncHandler(controller.getFestivals));
router.get('/sun-and-moon', vq, asyncHandler(controller.getSunAndMoon));
router.get('/lunar-samvat', validate({ query: lunarSamvatQuery }), asyncHandler(controller.getLunarSamvat));
router.get('/rashi-nakshatra', vq, asyncHandler(controller.getRashiNakshatra));
router.get('/ritu-ayana', vq, asyncHandler(controller.getRituAyana));
router.get('/inauspicious-timings', vq, asyncHandler(controller.getInauspiciousTimings));
router.get('/nivas-shool', vq, asyncHandler(controller.getNivasShool));
router.get('/other-calendars-epoch', vq, asyncHandler(controller.getOtherCalendars));
// Computed from find-panchang + our own ascendant (see panchang.compute.ts)
router.get('/chandrabalam-tarabalam', vq, asyncHandler(controller.getChandrabalamTarabalam));
router.get('/udaya-lagna', vq, asyncHandler(controller.getUdayaLagna));
router.get('/panchaka-rahita', vq, asyncHandler(controller.getPanchakaRahita));

export default router;
