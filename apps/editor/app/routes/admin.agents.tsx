import { useState, useEffect, useCallback } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { toast } from 'react-toastify';
import { API_URL } from '~/lib/api/client';

export const meta: MetaFunction = () => [{ title: 'Agents — Admin' }];

function adminFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mc_admin_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

interface AgentJob {
  id: string;
  type: string;
  status: string;
  progress: number;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
}

interface AgentStats {
  running: number;
  queued: number;
  completed: number;
  failed: number;
  totalToday: number;
}

export default function AdminAgents() {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/admin/agents/jobs');
      if (res.ok) {
        const d = await res.json();
        const list = d.data?.jobs ?? d.data ?? d.jobs ?? [];
        setJobs(Array.isArray(list) ? list : []);
        const s = d.data?.stats ?? d.stats;
        if (s) setStats(s);
      }
    } catch {
      // silent — endpoint may not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [load]);

  const cancelJob = async (id: string) => {
    try {
      const res = await adminFetch(`/admin/agents/jobs/${id}/cancel`, { method: 'POST' });
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

  const STATUS_COLORS: Record<string, string> = {
    running: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    queued: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    completed: 'bg-green-500/15 text-green-400 border-green-500/25',
    failed: 'bg-red-500/15 text-red-400 border-red-500/25',
    cancelled: 'bg-gray-500/15 text-gray-500 border-gray-500/25',
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor active scraping and outreach agent jobs</p>
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

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Running', value: stats.running, color: 'text-blue-400' },
            { label: 'Queued', value: stats.queued, color: 'text-amber-400' },
            { label: 'Completed', value: stats.completed, color: 'text-green-400' },
            { label: 'Failed', value: stats.failed, color: 'text-red-400' },
            { label: 'Total today', value: stats.totalToday, color: 'text-gray-300' },
          ].map((s) => (
            <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
              <div className="text-xs text-gray-500 mb-2">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Jobs table */}
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Active & Recent Jobs</h2>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="i-ph:robot text-4xl text-gray-700 mb-3 mx-auto" />
            <p className="text-sm text-gray-600">No agent jobs found</p>
            <p className="text-xs text-gray-700 mt-1">Launch a campaign to see agents in action</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Job ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Started</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Error</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-500">{job.id.slice(0, 8)}…</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-300 capitalize">{job.type.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          STATUS_COLORS[job.status] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/25'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${job.progress ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 tabular-nums">{job.progress ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {new Date(job.startedAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {job.error ? (
                        <span className="text-xs text-red-400 truncate max-w-[200px] block" title={job.error}>
                          {job.error}
                        </span>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(job.status === 'running' || job.status === 'queued') && (
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
