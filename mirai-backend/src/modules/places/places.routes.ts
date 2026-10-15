import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { placeDetails, searchPlaces } from '../../lib/places';
import { requireAuth } from '../../middleware/auth';
import { createRateLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';

/** Birth place suggestions (Google Places through the backend, so the key never ships in the app) */
const router = Router();
router.use(requireAuth);

const limiter = createRateLimiter({
  windowMs: 60_000,
  limit: 120,
  keyGenerator: (req) => `places:${String(req.user?._id ?? 'anon')}`,
});

const session = z.string().trim().min(8).max(64).optional();
const searchQuery = z.object({ q: z.string().trim().max(100), session });
const detailsParams = z.object({ placeId: z.string().trim().min(5).max(300) });
const detailsQuery = z.object({ session });

/** GET /places/autocomplete?q=jaip&session=<uuid> -> { places: [{ placeId, name, region, description }] } */
router.get(
  '/autocomplete',
  limiter,
  validate({ query: searchQuery }),
  asyncHandler(async (req: Request, res: Response) => {
    const { q, session: s } = req.query as z.infer<typeof searchQuery>;
    return sendSuccess(res, 200, 'places.fetched', { places: await searchPlaces(q, s) });
  }),
);

/** GET /places/:placeId?session=<uuid> -> { place: { placeId, name, address, lat, lon, tzone } } */
router.get(
  '/:placeId',
  limiter,
  validate({ params: detailsParams, query: detailsQuery }),
  asyncHandler(async (req: Request, res: Response) => {
    const { session: s } = req.query as z.infer<typeof detailsQuery>;
    return sendSuccess(res, 200, 'places.fetched', { place: await placeDetails(String(req.params.placeId), s) });
  }),
);

export default router;
