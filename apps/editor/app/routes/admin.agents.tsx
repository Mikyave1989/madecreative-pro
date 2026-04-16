import { useState, useEffect, useCallback } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { toast } from 'react-toastify';
import { API_URL } from '~/lib/api/client';

export const meta: MetaFunction = () => [{ title: 'Agents — Admin' }];

// ─── helpers ──────────────────────────────────────────────────────────────────

function adminFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mc_admin_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtDuration(start: string | null, end: string | null): string {
  if (!start) return '—';
  const endDate = end ? new Date(end) : new Date();
  const diff = endDate.getTime() - new Date(start).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ${secs % 60}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ─── types ────────────────────────────────────────────────────────────────────

interface AgentJob {
  id: string;
  agentType: string;
  status: string;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  input: Record<string, unknown>;
  output?: Record<string, unknown> | null;
  cost?: number | null;
  createdAt: string;
}

interface AgentStats {
  byStatus: { status: string; count: number }[];
  byType: { agentType: string; count: number; totalCost: number }[];
  last30Days: { completedJobs: number; totalApiCost: number };
}

// ─── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { cls: string; dot?: boolean }> = {
  running:   { cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25', dot: true },
  queued:    { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  completed: { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  failed:    { cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
  cancelled: { cls: 'bg-gray-500/15 text-gray-500 border-gray-500/25' },
};

function JobStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const cfg = STATUS_CONFIG[key] ?? { cls: 'bg-gray-500/15 text-gray-400 border-gray-500/25' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.cls}`}>
      {cfg.dot && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  SCRAPER:   'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  ANALYZER:  'text-violet-400 bg-violet-500/10 border-violet-500/20',
  BUILDER:   'text-pink-400 bg-pink-500/10 border-pink-500/20',
  OUTREACH:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  QA:        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_COLORS[type.toUpperCase()] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${cls}`}>
      {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, ' ')}
    </span>
  );
}

// ─── Job detail panel ─────────────────────────────────────────────────────────

function JobDetail({ job }: { job: AgentJob }) {
  const hasInput = job.input && Object.keys(job.input).length > 0;
  const hasOutput = job.output && Object.keys(job.output).length > 0;

  return (
    <div className="px-5 py-4 bg-[#0a0a0f] border-t border-white/[0.06]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hasInput && (
          <div>
            <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-2">Input</div>
            <pre className="text-[11px] text-[#71717a] bg-white/[0.02] rounded-xl p-3 border border-white/[0.06] overflow-auto max-h-32 font-mono">
              {JSON.stringify(job.input, null, 2)}
            </pre>
          </div>
        )}
        {hasOutput && (
          <div>
            <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-2">Output</div>
            <pre className="text-[11px] text-[#71717a] bg-white/[0.02] rounded-xl p-3 border border-white/[0.06] overflow-auto max-h-32 font-mono">
              {JSON.stringify(job.output, null, 2)}
            </pre>
          </div>
        )}
        {job.error && (
          <div className="md:col-span-2">
            <div className="text-[10px] text-red-400 uppercase tracking-wider mb-2">Error</div>
            <div className="text-xs text-red-400 bg-red-500/10 rounded-xl p-3 border border-red-500/20 font-mono break-all">
              {job.error}
            </div>
          </div>
        )}
        <div className="flex gap-6 text-xs text-[#52525b] md:col-span-2">
          <span>Created: <strong className="text-[#a1a1aa]">{fmtDate(job.createdAt)}</strong></span>
          <span>Started: <strong className="text-[#a1a1aa]">{fmtDate(job.startedAt)}</strong></span>
          <span>Completed: <strong className="text-[#a1a1aa]">{fmtDate(job.completedAt)}</strong></span>
          {job.cost != null && (
            <span>Cost: <strong className="text-emerald-400">${job.cost.toFixed(4)}</strong></span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

const JOB_TYPES = ['', 'SCRAPER', 'ANALYZER', 'BUILDER', 'OUTREACH', 'QA'] as const;
const JOB_STATUSES = ['', 'RUNNING', 'QUEUED', 'COMPLETED', 'FAILED', 'CANCELLED'] as const;

export default function AdminAgents() {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: '50', sortBy: 'createdAt', sortOrder: 'desc' });
      if (filterType) qs.set('agentType', filterType);
      if (filterStatus) qs.set('status', filterStatus);

      const [jobsRes, statsRes] = await Promise.all([
        adminFetch(`/admin/agents/jobs?${qs.toString()}`),
        adminFetch('/admin/agents/stats'),
      ]);

      if (jobsRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = await jobsRes.json() as any;
        const inner = d.data ?? {};
        const list = inner.data ?? inner.jobs ?? d.jobs ?? [];
        setJobs(Array.isArray(list) ? list : []);
      }

      if (statsRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = await statsRes.json() as any;
        const statsData = s.data ?? s;
        if (statsData) setStats(statsData);
      }
    } catch {
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [load]);

  const cancelJob = async (id: string) => {
    try {
      const res = await adminFetch(`/admin/agents/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Job cancelled');
        load();
      } else {
        toast.error('Failed to cancel job');
      }
    } catch {
      toast.error('Network error');
    }
  };

  // Build status counts from stats
  const statusMap: Record<string, number> = {};
  if (stats) {
    for (const s of stats.byStatus) statusMap[s.status.toUpperCase()] = s.count;
  }

  // Running jobs count
  const runningCount = jobs.filter((j) => j.status.toLowerCase() === 'running').length;

  return (
    <div className="p-6 md:p-8 bg-[#0a0a0f] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Agent Jobs</h1>
          <p className="text-sm text-[#71717a] mt-0.5">
            Auto-refreshes every 10 seconds
            {runningCount > 0 && (
              <span className="ml-2 text-blue-400 font-medium">· {runningCount} running</span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[#a1a1aa] hover:bg-white/[0.08] transition-all disabled:opacity-40"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Running',   key: 'RUNNING',   color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20', dot: true },
          { label: 'Queued',    key: 'QUEUED',     color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20', dot: false },
          { label: 'Completed', key: 'COMPLETED',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: false },
          { label: 'Failed',    key: 'FAILED',     color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20', dot: false },
          { label: 'Cancelled', key: 'CANCELLED',  color: 'text-gray-500',    bg: 'bg-gray-500/10',    border: 'border-gray-500/20', dot: false },
        ].map(({ label, key, color, bg, border, dot }) => (
          <div key={key} className={`rounded-xl p-4 border ${bg} ${border}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              {dot && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
              <span className="text-xs text-[#71717a] font-medium">{label}</span>
            </div>
            <div className={`text-2xl font-extrabold ${color}`}>
              {loading && !stats ? (
                <div className="h-7 w-10 bg-white/[0.06] rounded animate-pulse" />
              ) : (
                (statusMap[key] ?? 0).toLocaleString()
              )}
            </div>
          </div>
        ))}
      </div>

      {/* By-type breakdown */}
      {stats && stats.byType.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {stats.byType.map((t) => (
            <div key={t.agentType} className="bg-[#111118] rounded-xl p-3 border border-white/[0.08]">
              <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">{t.agentType}</div>
              <div className="text-sm font-bold text-white">{t.count.toLocaleString()} jobs</div>
              {t.totalCost > 0 && (
                <div className="text-[10px] text-[#52525b] mt-0.5">${t.totalCost.toFixed(3)} cost</div>
              )}
            </div>
          ))}
          {stats.last30Days && (
            <div className="bg-[#111118] rounded-xl p-3 border border-white/[0.08]">
              <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">30-Day Total</div>
              <div className="text-sm font-bold text-white">{stats.last30Days.completedJobs.toLocaleString()} done</div>
              {stats.last30Days.totalApiCost > 0 && (
                <div className="text-[10px] text-[#52525b] mt-0.5">${stats.last30Days.totalApiCost.toFixed(2)} cost</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#111118] border border-white/[0.08] text-sm text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
        >
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>{t === '' ? 'All types' : t.charAt(0) + t.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#111118] border border-white/[0.08] text-sm text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
        >
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>{s === '' ? 'All statuses' : s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
        {(filterType || filterStatus) && (
          <button
            onClick={() => { setFilterType(''); setFilterStatus(''); }}
            className="text-xs text-[#71717a] hover:text-[#a1a1aa] transition-all"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-[#3f3f46]">{jobs.length} jobs shown</span>
      </div>

      {/* Jobs table */}
      <div className="bg-[#111118] rounded-xl border border-white/[0.08] overflow-hidden">
        {loading && jobs.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#52525b]">Loading jobs…</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-sm text-[#52525b]">No agent jobs found</p>
            <p className="text-xs text-[#3f3f46] mt-1">Launch a campaign to see agents in action</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Prospect / Input</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Progress</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Cost</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Duration</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Created</th>
                  <th className="w-24" />
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const statusLower = job.status.toLowerCase();
                  const isActive = statusLower === 'running' || statusLower === 'queued';
                  const prospectName =
                    (job.input?.companyName as string | undefined) ??
                    (job.input?.city ? `${job.input.city}, ${job.input.country ?? ''}` : null) ??
                    (job.input?.prospectId ? `ID: ${String(job.input.prospectId).slice(0, 8)}` : null);
                  return (
                    <>
                      <tr
                        key={job.id}
                        className={`border-b border-white/[0.04] cursor-pointer transition-colors group ${
                          expanded === job.id ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'
                        }`}
                        onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                      >
                        <td className="px-4 py-3">
                          <TypeBadge type={job.agentType} />
                        </td>
                        <td className="px-4 py-3">
                          <JobStatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-3">
                          {prospectName ? (
                            <span className="text-xs text-[#a1a1aa]">{prospectName}</span>
                          ) : (
                            <span className="text-xs font-mono text-[#52525b]">{job.id.slice(0, 8)}…</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  statusLower === 'completed' ? 'bg-emerald-500' :
                                  statusLower === 'failed' ? 'bg-red-500' :
                                  statusLower === 'running' ? 'bg-blue-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${statusLower === 'completed' ? 100 : job.progress ?? 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#52525b] tabular-nums">
                              {statusLower === 'completed' ? '100' : job.progress ?? 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {job.cost != null ? (
                            <span className="text-xs text-[#71717a]">${job.cost.toFixed(4)}</span>
                          ) : (
                            <span className="text-[#3f3f46] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#71717a]">
                            {fmtDuration(job.startedAt, job.completedAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#52525b]">{timeAgo(job.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {isActive && (
                            <button
                              onClick={() => cancelJob(job.id)}
                              className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <span className={`text-[#52525b] text-xs inline-block transition-transform ${expanded === job.id ? 'rotate-180' : ''}`}>▼</span>
                        </td>
                      </tr>
                      {expanded === job.id && (
                        <tr key={`${job.id}-detail`}>
                          <td colSpan={9} className="p-0">
                            <JobDetail job={job} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
