import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './kundli.controller';
import { idParam } from '../../utils/validators';
import { chartParams, chartQuery, createKundliProfileSchema, dashaQuery, kundliQuery } from './kundli.validation';

const router = Router();

router.use(requireAuth);

const vq = validate({ query: kundliQuery });

// Saved kundli profiles (own only). Every endpoint below also accepts `?profileId=`.
router.post('/profiles', validate({ body: createKundliProfileSchema }), asyncHandler(controller.createProfile));
router.get('/profiles', asyncHandler(controller.listProfiles));
router.get('/profiles/:id', validate({ params: idParam() }), asyncHandler(controller.getProfile));
router.delete('/profiles/:id', validate({ params: idParam() }), asyncHandler(controller.deleteProfile));

router.get('/basic-details', vq, asyncHandler(controller.basicDetails));
router.get('/planetary-positions', vq, asyncHandler(controller.planetaryPositions));
router.get('/doshas/kaal-sarpa', vq, asyncHandler(controller.kaalSarpa));
router.get('/doshas/manglik', vq, asyncHandler(controller.manglik));
router.get('/doshas/sadhe-sati', vq, asyncHandler(controller.sadheSati));
router.get('/charts/:chartId', validate({ params: chartParams, query: chartQuery }), asyncHandler(controller.chart));
router.get('/dasha/vimshottari', validate({ query: dashaQuery }), asyncHandler(controller.vimshottari));
router.get('/reports/ascendant', vq, asyncHandler(controller.ascendantReport));
router.get('/ghata-chakra', vq, asyncHandler(controller.ghataChakra));

export default router;
