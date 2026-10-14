import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Activity,
  TrendingUp,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { adminService, type DashboardStats } from '../services/admin.service';
import { getErrorMessage } from '../lib/errors';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Percentage shown in the corner badge (0 = neutral). */
  trend: number;
  color: string;
  hint?: string;
}

const StatCard = ({ label, value, icon: Icon, trend, color, hint }: StatCardProps) => (
  <div className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-semibold ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-white/30'}`}>
        {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
        {trend !== 0 ? `${Math.abs(trend)}%` : '0%'}
      </div>
    </div>
    <div>
      <p className="text-white/40 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-white mt-1 uppercase tracking-tight max-w-full break-words">{value}</p>
      {hint ? <p className="text-white/30 text-xs font-medium mt-1">{hint}</p> : null}
    </div>
  </div>
);

const tooltipStyle = {
  contentStyle: { backgroundColor: '#16161e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
  itemStyle: { color: '#fff' },
  labelStyle: { color: 'rgba(255,255,255,0.6)' },
};

/** "2026-10-14" -> "14 Oct" (dates are UTC days from the backend). */
const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'UTC' });

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Growth of the last 7 days relative to the user base before them, in % (1 decimal). */
function weeklyGrowth(stats: DashboardStats): number {
  const recent = stats.newUsersLast7Days ?? 0;
  const before = stats.totalUsers - recent;
  if (recent <= 0) return 0;
  if (before <= 0) return 100;
  return Math.round((recent / before) * 1000) / 10;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await adminService.getStats();
        if (!cancelled) {
          setStats(res.data);
          setStatsError(null);
        }
      } catch (err) {
        if (!cancelled) setStatsError(getErrorMessage(err, 'Failed to load dashboard stats.'));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const growthData = useMemo(
    () => (stats?.userGrowth ?? []).map((d) => ({ name: dayLabel(d.date), users: d.count })),
    [stats],
  );
  const revenueData = useMemo(
    () => (stats?.revenue?.daily ?? []).map((d) => ({ name: dayLabel(d.date), revenue: d.amount })),
    [stats],
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white">System Overview</h1>
        <p className="text-white/30 text-sm">Real-time statistics and system performance metrics.</p>
      </div>

      {statsError ? (
        <div className="glass-card p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-200 text-sm">
          {statsError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Users"
          value={stats ? String(stats.totalUsers ?? 0) : '—'}
          icon={Users}
          trend={stats ? weeklyGrowth(stats) : 0}
          color="bg-brand-cyan"
          hint={stats ? `+${stats.newUsersToday ?? 0} today · +${stats.newUsersLast7Days ?? 0} this week` : undefined}
        />
        <StatCard
          label="Active Sessions (24h)"
          value={stats ? String(stats.activeSessions24h ?? 0) : '—'}
          icon={Activity}
          trend={0}
          color="bg-emerald-500"
          hint={stats ? `${stats.dailyActiveUsers ?? 0} daily · ${stats.monthlyActiveUsers ?? 0} monthly active users` : undefined}
        />
        <StatCard
          label="Active Accounts"
          value={stats ? `${Number(stats.activePercentage ?? 0).toFixed(2)}%` : '—'}
          icon={TrendingUp}
          trend={0}
          color="bg-brand-pink"
          hint={stats ? `${stats.activeUsers} active · ${stats.profileCompleteUsers} profiles complete` : undefined}
        />
        <StatCard
          label="Revenue (30 days)"
          value={stats?.revenue ? inr(stats.revenue.last30Days) : stats ? inr(0) : '—'}
          icon={IndianRupee}
          trend={0}
          color="bg-amber-500"
          hint={
            stats?.revenue
              ? `${inr(stats.revenue.today)} today · ${inr(stats.revenue.total)} all time`
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-3xl border border-white/5 h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">User Growth</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-cyan"></div>
                <span className="text-xs text-white/40">New sign-ups / day (30d)</span>
              </div>
            </div>
          </div>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#45CAFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#45CAFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="users" name="New users" stroke="#45CAFF" fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/5 h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Revenue</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-pink"></div>
                <span className="text-xs text-white/40">
                  Wallet recharges / day{stats?.revenue ? ` · ${stats.revenue.transactions} total` : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [inr(Number(v)), 'Revenue']} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="revenue" fill="#FF1B6B" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
