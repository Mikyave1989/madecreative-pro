import { useState, useEffect, useCallback } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { API_URL } from '~/lib/api/client';

export const meta: MetaFunction = () => [{ title: 'Overview — Admin' }];

// ─── types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  pipeline: {
    scraped: number;
    analyzed: number;
    highScore: number;
    avgLeadScore: number;
    previewsBuilt: number;
    emailQueued: number;
    contacted: number;
    followedUp: number;
    replied: number;
    converted: number;
    lost: number;
    total: number;
  };
  emails: {
    totalSent: number;
    sentToday: number;
    sent7d: number;
    sent30d: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
    bounceRate: number;
  };
  previews: {
    built: number;
    viewed: number;
    viewRate: number;
  };
  agents: {
    active: number;
    failed30d: number;
    breakdown: Record<string, Record<string, number>>;
  };
  business: {
    totalClients: number;
    activeClients: number;
    newClientsMonth: number;
    monthlyRevenue: number;
    mrr: number;
  };
  campaigns?: {
    total: number;
    active: number;
  };
  recentActivity?: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
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
  return n.toLocaleString('en-US');
}

function fmtEur(n: number | undefined | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  accent = '#6366f1',
  loading = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-[#111118] rounded-xl p-5 border border-white/[0.08] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">{label}</span>
        <span className="text-base opacity-50">{icon}</span>
      </div>
      {loading ? (
        <div className="h-8 bg-white/[0.06] rounded-lg animate-pulse" />
      ) : (
        <div className="text-3xl font-extrabold leading-none" style={{ color: accent }}>{value}</div>
      )}
      {sub && !loading && <div className="text-[11px] text-[#52525b]">{sub}</div>}
    </div>
  );
}

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round(value / total * 100) : 0;
  const barWidth = total > 0 ? `${Math.max(2, pct)}%` : '2%';
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-[11px] text-[#71717a] text-right shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: barWidth, backgroundColor: color }}
        />
      </div>
      <div className="w-12 text-right">
        <span className="text-sm font-bold text-white">{fmt(value)}</span>
      </div>
      <div className="w-10 text-right">
        <span className="text-[11px] text-[#52525b]">{pct}%</span>
      </div>
    </div>
  );
}

function EmailStatItem({ label, value, rate, color }: { label: string; value: number; rate: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xl font-extrabold" style={{ color }}>{fmt(value)}</div>
      <div className="text-[11px] text-[#71717a]">{label}</div>
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}30` }}
      >
        {rate}%
      </span>
    </div>
  );
}

function AgentTypeRow({ type, data }: { type: string; data: Record<string, number> }) {
  const completed = data['COMPLETED'] ?? 0;
  const running = data['RUNNING'] ?? 0;
  const queued = data['QUEUED'] ?? 0;
  const failed = data['FAILED'] ?? 0;
  const total = completed + running + queued + failed;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="w-20 text-xs font-semibold text-white shrink-0">{type}</div>
      <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden flex">
        {total > 0 && (
          <>
            <div style={{ width: `${completed / total * 100}%`, backgroundColor: '#10b981' }} className="h-full" />
            <div style={{ width: `${running / total * 100}%`, backgroundColor: '#6366f1' }} className="h-full" />
            <div style={{ width: `${queued / total * 100}%`, backgroundColor: '#f59e0b' }} className="h-full" />
            <div style={{ width: `${failed / total * 100}%`, backgroundColor: '#ef4444' }} className="h-full" />
          </>
        )}
      </div>
      <div className="flex gap-2 text-[11px] shrink-0">
        <span className="text-emerald-400 w-5 text-right">{completed}</span>
        <span className="text-indigo-400 w-5 text-right">{running}</span>
        <span className="text-amber-400 w-5 text-right">{queued}</span>
        <span className="text-red-400 w-5 text-right">{failed}</span>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function AdminOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/admin/metrics/dashboard');
      if (!res.ok) {
        setError(`API returned ${res.status}`);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = await res.json() as any;
      setData(json.data ?? json);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Network error — could not reach API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const p = data?.pipeline ?? { scraped: 0, analyzed: 0, highScore: 0, avgLeadScore: 0, previewsBuilt: 0, emailQueued: 0, contacted: 0, followedUp: 0, replied: 0, converted: 0, lost: 0, total: 0 };
  const e = data?.emails ?? { totalSent: 0, sentToday: 0, sent7d: 0, sent30d: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, openRate: 0, clickRate: 0, replyRate: 0, bounceRate: 0 };
  const pr = data?.previews ?? { built: 0, viewed: 0, viewRate: 0 };
  const ag = data?.agents ?? { active: 0, failed30d: 0, breakdown: {} };
  const biz = data?.business ?? { totalClients: 0, activeClients: 0, newClientsMonth: 0, monthlyRevenue: 0, mrr: 0 };
  const camps = data?.campaigns ?? { total: 0, active: 0 };
  const activity = data?.recentActivity ?? [];

  return (
    <div className="p-6 md:p-8 bg-[#0a0a0f] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-[#52525b] mt-0.5">
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()} · auto-refresh 30s` : 'Loading…'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[#a1a1aa] hover:bg-white/[0.08] transition-all disabled:opacity-40"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between gap-4">
          <span>⚠ {error}</span>
          <button onClick={load} className="text-xs underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* ── ROI / Sales Dashboard ── */}
      <div className="mb-6 p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
        <h3 className="text-sm font-semibold text-indigo-400 mb-4 uppercase tracking-wider">Sales & ROI</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{fmt(e.totalSent)}</div>
            <div className="text-[11px] text-[#71717a]">Emails Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{fmt(e.opened)}</div>
            <div className="text-[11px] text-[#71717a]">Opened ({e.openRate ? (e.openRate * 100).toFixed(1) : 0}%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{fmt(e.clicked)}</div>
            <div className="text-[11px] text-[#71717a]">Clicked ({e.clickRate ? (e.clickRate * 100).toFixed(1) : 0}%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{fmt(e.replied)}</div>
            <div className="text-[11px] text-[#71717a]">Replied ({e.replyRate ? (e.replyRate * 100).toFixed(1) : 0}%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{fmt(p.converted)}</div>
            <div className="text-[11px] text-[#71717a]">Converted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{b.mrr ? `€${fmt(b.mrr)}` : '€0'}</div>
            <div className="text-[11px] text-[#71717a]">Monthly Revenue</div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-indigo-500/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <div><span className="text-[#71717a]">Preview Sites Built:</span> <span className="text-white font-medium">{fmt(d?.previews?.built)}</span></div>
          <div><span className="text-[#71717a]">Previews Viewed:</span> <span className="text-white font-medium">{fmt(d?.previews?.viewed)}</span></div>
          <div><span className="text-[#71717a]">View Rate:</span> <span className="text-white font-medium">{d?.previews?.viewRate ? (d.previews.viewRate * 100).toFixed(1) + '%' : '0%'}</span></div>
          <div><span className="text-[#71717a]">Bounced:</span> <span className="text-red-400 font-medium">{fmt(e.bounced)}</span></div>
        </div>
      </div>

      {/* ── Row 1: KPI cards (4 cols) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Prospects"
          value={fmt(p.total)}
          icon="🔍"
          accent="#6366f1"
          sub={`${fmt(p.scraped)} scraped`}
          loading={loading && !data}
        />
        <StatCard
          label="Active Campaigns"
          value={fmt(camps.active)}
          icon="🚀"
          accent="#8b5cf6"
          sub={`${fmt(camps.total)} total`}
          loading={loading && !data}
        />
        <StatCard
          label="Emails Sent"
          value={fmt(e.totalSent)}
          icon="📧"
          accent="#f59e0b"
          sub={`${fmt(e.sentToday)} today · ${fmt(e.sent7d)} last 7d`}
          loading={loading && !data}
        />
        <StatCard
          label="MRR"
          value={fmtEur(biz.mrr)}
          icon="💰"
          accent="#10b981"
          sub={`${fmt(p.converted)} converted · ${fmtEur(biz.monthlyRevenue)} revenue`}
          loading={loading && !data}
        />
      </div>

      {/* ── Row 2: Secondary stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Previews Built"
          value={fmt(pr.built)}
          icon="🏗"
          accent="#ec4899"
          sub={`${fmt(pr.viewed)} viewed (${pr.viewRate}%)`}
          loading={loading && !data}
        />
        <StatCard
          label="Converted"
          value={fmt(p.converted)}
          icon="✅"
          accent="#10b981"
          sub={`${p.total > 0 ? (p.converted / p.total * 100).toFixed(1) : 0}% of total`}
          loading={loading && !data}
        />
        <StatCard
          label="Active Jobs"
          value={fmt(ag.active)}
          icon="⚡"
          accent="#6366f1"
          sub="currently running"
          loading={loading && !data}
        />
        <StatCard
          label="Failed Jobs (30d)"
          value={fmt(ag.failed30d)}
          icon="🔴"
          accent="#ef4444"
          sub="last 30 days"
          loading={loading && !data}
        />
      </div>

      {/* ── Row 3: Pipeline funnel + Email stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Pipeline funnel */}
        <div className="bg-[#111118] rounded-xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-[#71717a] uppercase tracking-wider">Pipeline Funnel</h3>
            <span className="text-xs text-[#52525b]">{fmt(p.total)} total</span>
          </div>
          <div className="space-y-3">
            <FunnelBar label="Scraped" value={p.scraped} total={p.total} color="#6366f1" />
            <FunnelBar label="Analyzed" value={p.analyzed} total={p.total} color="#8b5cf6" />
            <FunnelBar label="High Score" value={p.highScore} total={p.total} color="#a855f7" />
            <FunnelBar label="Previews Built" value={pr.built} total={p.total} color="#ec4899" />
            <FunnelBar label="Contacted" value={p.contacted} total={p.total} color="#f59e0b" />
            <FunnelBar label="Replied" value={p.replied} total={p.total} color="#f97316" />
            <FunnelBar label="Converted" value={p.converted} total={p.total} color="#10b981" />
          </div>
          {p.total > 0 && (
            <div className="mt-4 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px]">
              <span className="text-[#52525b]">Avg Lead Score: <strong className="text-white">{p.avgLeadScore}</strong></span>
              <span className="text-[#52525b]">Contact Rate: <strong className="text-amber-400">{p.total > 0 ? (p.contacted / p.total * 100).toFixed(1) : 0}%</strong></span>
              <span className="text-[#52525b]">Reply Rate: <strong className="text-orange-400">{p.contacted > 0 ? (p.replied / p.contacted * 100).toFixed(1) : 0}%</strong></span>
              <span className="text-[#52525b]">Close Rate: <strong className="text-emerald-400">{p.replied > 0 ? (p.converted / p.replied * 100).toFixed(1) : 0}%</strong></span>
            </div>
          )}
        </div>

        {/* Email performance */}
        <div className="bg-[#111118] rounded-xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-[#71717a] uppercase tracking-wider">Email Performance</h3>
          </div>
          <div className="flex justify-around py-2">
            <EmailStatItem label="Sent" value={e.totalSent} rate={100} color="#6366f1" />
            <EmailStatItem label="Opened" value={e.opened} rate={e.openRate} color="#10b981" />
            <EmailStatItem label="Clicked" value={e.clicked} rate={e.clickRate} color="#8b5cf6" />
            <EmailStatItem label="Replied" value={e.replied} rate={e.replyRate} color="#f59e0b" />
            <EmailStatItem label="Bounced" value={e.bounced} rate={e.bounceRate} color="#ef4444" />
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex gap-4 text-[11px] text-[#52525b]">
            <span>Today: <strong className="text-white">{fmt(e.sentToday)}</strong></span>
            <span>7 days: <strong className="text-white">{fmt(e.sent7d)}</strong></span>
            <span>30 days: <strong className="text-white">{fmt(e.sent30d)}</strong></span>
          </div>

          {/* Business metrics below email */}
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <div className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Business</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-[#52525b] uppercase tracking-wide mb-1">MRR</div>
                <div className="text-lg font-extrabold text-emerald-400">{fmtEur(biz.mrr)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#52525b] uppercase tracking-wide mb-1">Monthly Revenue</div>
                <div className="text-lg font-extrabold text-white">{fmtEur(biz.monthlyRevenue)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#52525b] uppercase tracking-wide mb-1">Total Clients</div>
                <div className="text-base font-bold text-white">{fmt(biz.totalClients)}</div>
                <div className="text-[11px] text-[#52525b]">{fmt(biz.activeClients)} active</div>
              </div>
              <div>
                <div className="text-[10px] text-[#52525b] uppercase tracking-wide mb-1">New This Month</div>
                <div className="text-base font-bold text-indigo-400">{fmt(biz.newClientsMonth)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Agent jobs + Recent activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent breakdown */}
        <div className="bg-[#111118] rounded-xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[#71717a] uppercase tracking-wider">Agent Jobs</h3>
            <div className="flex gap-3 text-[10px]">
              <span className="text-emerald-400">● Done</span>
              <span className="text-indigo-400">● Running</span>
              <span className="text-amber-400">● Queued</span>
              <span className="text-red-400">● Failed</span>
            </div>
          </div>
          {['SCRAPER', 'ANALYZER', 'BUILDER', 'OUTREACH', 'QA'].map((type) => (
            <AgentTypeRow key={type} type={type} data={ag.breakdown[type] ?? {}} />
          ))}
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex gap-4 text-[11px] text-[#52525b]">
            <span>Active now: <strong className="text-indigo-400">{ag.active}</strong></span>
            <span>Failed (30d): <strong className="text-red-400">{ag.failed30d}</strong></span>
          </div>
        </div>

        {/* Recent activity feed */}
        <div className="bg-[#111118] rounded-xl p-5 border border-white/[0.08]">
          <h3 className="text-xs font-semibold text-[#71717a] uppercase tracking-wider mb-3">Recent Activity</h3>
          {activity.length === 0 ? (
            <div className="text-center py-8 text-[#3f3f46] text-sm">
              <div className="text-3xl mb-2">📋</div>
              No recent activity
            </div>
          ) : (
            <div className="space-y-2">
              {activity.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#a1a1aa] truncate">{item.description}</div>
                    <div className="text-[10px] text-[#52525b] mt-0.5 flex items-center gap-1.5">
                      <span className="text-[#3f3f46]">{item.type}</span>
                      <span>·</span>
                      <span>{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Preview sites mini widget */}
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <div className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2">Preview Sites</div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-4">
                <div>
                  <div className="text-lg font-extrabold text-violet-400">{fmt(pr.built)}</div>
                  <div className="text-[10px] text-[#52525b]">Built</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold text-emerald-400">{fmt(pr.viewed)}</div>
                  <div className="text-[10px] text-[#52525b]">Viewed</div>
                </div>
              </div>
              <div className="flex-1 max-w-[120px]">
                <div className="text-[10px] text-[#52525b] mb-1 text-right">{pr.viewRate}% view rate</div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, pr.viewRate)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
