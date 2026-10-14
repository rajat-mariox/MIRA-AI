import mongoose from 'mongoose';
import { logger } from '../../lib/logger';
import { Session } from '../auth/auth.model';
import { User } from '../user/user.model';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Revenue = successful wallet recharges (money actually paid in; debits are spent from the wallet). */
const REVENUE_MATCH: Record<string, unknown> = { type: 'credit', purpose: 'recharge', status: 'success' };
const GROWTH_DAYS = 30;

export interface DashboardStats {
  /** Fields the admin panel reads today. */
  totalUsers: number;
  activeUsers: number;
  profileCompleteUsers: number;
  /** 0-100, two decimals (active / total). */
  activePercentage: number;
  /** Extras (not yet used by the panel). */
  inactiveUsers: number;
  profileCompletePercentage: number;
  newUsersToday: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  /** Device sessions with activity in the last 24h. */
  activeSessions24h: number;
  /** Distinct users with a session active in the last 24h / 30 days. */
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  /** New sign-ups per UTC day for the last 30 days (zero-filled, oldest first). */
  userGrowth: Array<{ date: string; count: number }>;
  /** Present only when the wallet module's Transaction model is registered. */
  revenue?: {
    currency: 'INR';
    total: number;
    today: number;
    last30Days: number;
    transactions: number;
    daily: Array<{ date: string; amount: number }>;
  };
}

function utcDayStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dayKeys(from: Date, days: number): string[] {
  return Array.from({ length: days }, (_, i) => new Date(from.getTime() + i * DAY_MS).toISOString().slice(0, 10));
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 10000) / 100 : 0);

export async function getStats(): Promise<DashboardStats> {
  const now = new Date();
  const today = utcDayStart(now);
  const growthFrom = new Date(today.getTime() - (GROWTH_DAYS - 1) * DAY_MS);
  const since24h = new Date(now.getTime() - DAY_MS);
  const since30d = new Date(now.getTime() - 30 * DAY_MS);

  const [totalUsers, activeUsers, profileCompleteUsers, newToday, new7, new30, activeSessions24h, dau, mau, growthAgg] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ isProfileComplete: true }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: new Date(today.getTime() - 6 * DAY_MS) } }),
      User.countDocuments({ createdAt: { $gte: growthFrom } }),
      Session.countDocuments({ lastActiveAt: { $gte: since24h } }),
      Session.distinct('userId', { lastActiveAt: { $gte: since24h } }).then((ids) => ids.length),
      Session.distinct('userId', { lastActiveAt: { $gte: since30d } }).then((ids) => ids.length),
      User.aggregate<{ _id: string; count: number }>([
        { $match: { createdAt: { $gte: growthFrom } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
    ]);

  const byDay = new Map(growthAgg.map((g) => [g._id, g.count]));
  const stats: DashboardStats = {
    totalUsers,
    activeUsers,
    profileCompleteUsers,
    activePercentage: pct(activeUsers, totalUsers),
    inactiveUsers: totalUsers - activeUsers,
    profileCompletePercentage: pct(profileCompleteUsers, totalUsers),
    newUsersToday: newToday,
    newUsersLast7Days: new7,
    newUsersLast30Days: new30,
    activeSessions24h,
    dailyActiveUsers: dau,
    monthlyActiveUsers: mau,
    userGrowth: dayKeys(growthFrom, GROWTH_DAYS).map((date) => ({ date, count: byDay.get(date) ?? 0 })),
  };

  const revenue = await getRevenue(today, growthFrom).catch((err: unknown) => {
    logger.warn({ err }, '[admin] Revenue stats failed');
    return undefined;
  });
  if (revenue) stats.revenue = revenue;
  return stats;
}

/**
 * Revenue = successful money-in transactions. Uses the wallet module's `Transaction` model when it is
 * registered (looked up at runtime so this module has no hard dependency on it).
 */
async function getRevenue(today: Date, from: Date): Promise<DashboardStats['revenue']> {
  if (!mongoose.modelNames().includes('Transaction')) return undefined;
  const Transaction = mongoose.model('Transaction');
  const match: Record<string, unknown> = REVENUE_MATCH;

  const [totals, daily] = await Promise.all([
    Transaction.aggregate<{ _id: null; total: number; count: number; today: number; last30: number }>([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          today: { $sum: { $cond: [{ $gte: ['$createdAt', today] }, '$amount', 0] } },
          last30: { $sum: { $cond: [{ $gte: ['$createdAt', from] }, '$amount', 0] } },
        },
      },
    ]),
    Transaction.aggregate<{ _id: string; amount: number }>([
      { $match: { ...match, createdAt: { $gte: from } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$amount' } } },
    ]),
  ]);
  const t = totals[0];
  const byDay = new Map(daily.map((d) => [d._id, d.amount]));
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    currency: 'INR',
    total: round(t?.total ?? 0),
    today: round(t?.today ?? 0),
    last30Days: round(t?.last30 ?? 0),
    transactions: t?.count ?? 0,
    daily: dayKeys(from, GROWTH_DAYS).map((date) => ({ date, amount: round(byDay.get(date) ?? 0) })),
  };
}
