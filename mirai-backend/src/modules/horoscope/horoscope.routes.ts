import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './horoscope.controller';
import { horoscopeQuery, insightParams, insightQuery } from './horoscope.validation';

const router = Router();

router.use(requireAuth);

// GET /horoscope?period=daily|weekly|monthly|yearly&day=today|tomorrow|yesterday&sign=<optional override>
router.get('/', validate({ query: horoscopeQuery }), asyncHandler(controller.getHoroscope));

// GET /horoscope/insights/:topic (career|finance|marriage|health)?sign=<optional override>
router.get(
  '/insights/:topic',
  validate({ params: insightParams, query: insightQuery }),
  asyncHandler(controller.getTopicInsight),
);

export default router;
