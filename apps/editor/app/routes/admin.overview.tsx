import { useState, useEffect, useCallback } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { API_URL } from '~/lib/api/client';

export const meta: MetaFunction = () => [{ title: 'Overview — Admin' }];

// ─── types ────────────────────────────────────────────────────────────────────
interface LaunchStatus {
  totalProspects: number;
  byStage: {
    scraped: number;
    analyzed: number;
    preview: number;
    contacted: number;
    replied: number;
    converted: number;
  };
  activeJobs: number;
  lastRun: string | null;
}

interface WarmingStatus {
  initialized: boolean;
  day: number;
  limit: number;
  sentToday: number;
  totalSent: number;
  accounts: number;
  status: string;
}

interface DashboardMetrics {
  mrr: number;
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  conversionRate: number;
  churnRate: number;
  newUsersToday: number;
  revenueToday: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function adminFetch(path: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mc_admin_token') : null;
  return fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

function fmt(n: number | undefined | null): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtMoney(n: number | undefined | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

// ─── sub-components ───────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  accent = false,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  icon?: string;
}) {
  return (
    <div
      className={`rounded-xl p-5 border ${accent ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-[#111] border-white/5'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {icon && <div className={`${icon} text-lg ${accent ? 'text-indigo-400' : 'text-gray-600'}`} />}
      </div>
      <div className={`text-3xl font-bold ${accent ? 'text-indigo-300' : 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400 capitalize">{label}</span>
        <span className="text-xs font-semibold text-white">{fmt(value)}</span>
      </div>
      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function AdminOverview() {
  const [launchStatus, setLaunchStatus] = useState<LaunchStatus | null>(null);
  const [warming, setWarming] = useState<WarmingStatus | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statusRes, warmingRes, metricsRes] = await Promise.allSettled([
        adminFetch('/admin/launch/status'),
        adminFetch('/admin/launch/warming/status'),
        adminFetch('/admin/metrics/dashboard'),
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
        const d = await statusRes.value.json();
        setLaunchStatus(d.data ?? d);
      }

      if (warmingRes.status === 'fulfilled' && warmingRes.value.ok) {
        const d = await warmingRes.value.json();
        setWarming(d.data ?? d);
      }

      if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        const d = await metricsRes.value.json();
        setMetrics(d.data ?? d);
      }

      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 30s
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const stages = launchStatus?.byStage ?? {
    scraped: 0,
    analyzed: 0,
    preview: 0,
    contacted: 0,
    replied: 0,
    converted: 0,
  };
  const totalScraped = stages.scraped || launchStatus?.totalProspects || 0;

  const stageColors: Record<string, string> = {
    scraped: 'bg-blue-500',
    analyzed: 'bg-cyan-500',
    preview: 'bg-violet-500',
    contacted: 'bg-amber-500',
    replied: 'bg-orange-500',
    converted: 'bg-green-500',
  };

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString()}` : 'Loading…'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <div className={`i-ph:arrows-clockwise text-base ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <div className="i-ph:warning-circle text-base" />
          {error}
        </div>
      )}

      {/* Business metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="MRR"
          value={fmtMoney(metrics?.mrr)}
          sub="Monthly recurring revenue"
          accent
          icon="i-ph:currency-eur"
        />
        <StatCard
          label="Total Users"
          value={fmt(metrics?.totalUsers)}
          sub={`${fmt(metrics?.activeUsers)} active`}
          icon="i-ph:users"
        />
        <StatCard
          label="New Today"
          value={fmt(metrics?.newUsersToday)}
          sub={`Revenue today: ${fmtMoney(metrics?.revenueToday)}`}
          icon="i-ph:trend-up"
        />
        <StatCard
          label="Conversion"
          value={metrics?.conversionRate != null ? `${metrics.conversionRate.toFixed(1)}%` : '—'}
          sub={`Churn: ${metrics?.churnRate != null ? `${metrics.churnRate.toFixed(1)}%` : '—'}`}
          icon="i-ph:chart-line"
        />
      </div>

      {/* Pipeline + warming row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Funnel */}
        <div className="lg:col-span-2 bg-[#111] rounded-xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white">Prospect Funnel</h2>
            <span className="text-xs text-gray-500">
              {fmt(launchStatus?.totalProspects)} total — {launchStatus?.activeJobs ?? 0} active job{launchStatus?.activeJobs !== 1 ? 's' : ''}
            </span>
          </div>
          {loading && !launchStatus ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-2 bg-white/5 rounded-full animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(Object.keys(stages) as (keyof typeof stages)[]).map((stage) => (
                <FunnelBar
                  key={stage}
                  label={stage}
                  value={stages[stage]}
                  max={totalScraped}
                  color={stageColors[stage] || 'bg-indigo-500'}
                />
              ))}
            </div>
          )}

          {/* Funnel conversion summary */}
          {launchStatus && stages.converted > 0 && (
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-6 text-xs text-gray-500">
              <span>
                Contact rate:{' '}
                <span className="text-amber-400 font-medium">
                  {stages.scraped > 0 ? ((stages.contacted / stages.scraped) * 100).toFixed(1) : 0}%
                </span>
              </span>
              <span>
                Reply rate:{' '}
                <span className="text-orange-400 font-medium">
                  {stages.contacted > 0 ? ((stages.replied / stages.contacted) * 100).toFixed(1) : 0}%
                </span>
              </span>
              <span>
                Close rate:{' '}
                <span className="text-green-400 font-medium">
                  {stages.replied > 0 ? ((stages.converted / stages.replied) * 100).toFixed(1) : 0}%
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Warming status */}
        <div className="bg-[#111] rounded-xl p-6 border border-white/5">
          <h2 className="text-sm font-semibold text-white mb-5">Email Warming</h2>

          {loading && !warming ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : warming ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    warming.status === 'active'
                      ? 'bg-green-500/15 text-green-400'
                      : warming.initialized
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-gray-500/15 text-gray-400'
                  }`}
                >
                  {warming.status || (warming.initialized ? 'Initialized' : 'Not started')}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Warming day</span>
                  <span className="text-white font-medium">{warming.day ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Daily limit</span>
                  <span className="text-white font-medium">{warming.limit ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Sent today</span>
                  <span className="text-white font-medium">{warming.sentToday ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total sent</span>
                  <span className="text-white font-medium">{fmt(warming.totalSent)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Accounts</span>
                  <span className="text-white font-medium">{warming.accounts ?? 0}</span>
                </div>
              </div>

              {warming.limit > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Today's progress</span>
                    <span className="text-gray-400">
                      {warming.sentToday}/{warming.limit}
                    </span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (warming.sentToday / warming.limit) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-600">Warming data unavailable</p>
          )}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Scraped"
          value={fmt(stages.scraped)}
          icon="i-ph:magnifying-glass"
        />
        <StatCard
          label="Contacted"
          value={fmt(stages.contacted)}
          icon="i-ph:envelope"
        />
        <StatCard
          label="Replied"
          value={fmt(stages.replied)}
          icon="i-ph:chat-dots"
        />
        <StatCard
          label="Converted"
          value={fmt(stages.converted)}
          accent
          icon="i-ph:check-circle"
        />
      </div>
    </div>
  );
}
