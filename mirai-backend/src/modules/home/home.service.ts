import { translate, type Lang } from '../../lib/i18n';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import { Banner } from '../banner/banner.model';
import { getHoroscope, type HoroscopeData, type HoroscopeSetupRequired } from '../horoscope/horoscope.service';
import { todayMuhurat } from '../panchang/panchang.service';
import { toPublicUser, type PublicUser, type UserDocument } from '../user/user.model';

export interface HomePartError {
  statusCode: number;
  message: string;
}

export interface HomeData {
  user: PublicUser;
  horoscope: HoroscopeData | HoroscopeSetupRequired | null;
  panchang: Awaited<ReturnType<typeof todayMuhurat>> | null;
  banners: unknown[] | null;
  wallet: { balance: number };
  /** Per-part failures (part -> error); empty object when everything succeeded. */
  errors: Partial<Record<'horoscope' | 'panchang' | 'banners', HomePartError>>;
}


function toPartError(err: unknown, lang: Lang): HomePartError {
  if (err instanceof ApiError) return { statusCode: err.statusCode, message: translate(lang, err.messageKey, err.params) };
  return { statusCode: 500, message: translate(lang, 'common.internalError') };
}

/** Aggregates the home screen. Parts run in parallel; a failing part becomes null + an `errors` entry. */
export async function getHome(user: UserDocument, lang: Lang): Promise<HomeData> {
  const [horoscope, panchang, banners] = await Promise.allSettled([
    getHoroscope(user, { period: 'daily', day: 'today' }, lang).then((r) => (r.ok ? r.data : r.setup)),
    todayMuhurat(user, lang),
    Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).then((docs) => docs.map((d) => d.toJSON())),
  ]);

  const errors: HomeData['errors'] = {};
  const pick = <T>(name: keyof HomeData['errors'], r: PromiseSettledResult<T>): T | null => {
    if (r.status === 'fulfilled') return r.value;
    errors[name] = toPartError(r.reason, lang);
    if (!(r.reason instanceof ApiError)) logger.error({ err: r.reason, part: name }, 'Home part failed');
    return null;
  };

  return {
    user: toPublicUser(user),
    horoscope: pick('horoscope', horoscope),
    panchang: pick('panchang', panchang),
    banners: pick('banners', banners),
    wallet: { balance: user.walletBalance ?? 0 },
    errors,
  };
}
