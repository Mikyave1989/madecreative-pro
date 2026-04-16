import { useState, useEffect, useCallback } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { toast } from 'react-toastify';
import { API_URL } from '~/lib/api/client';

export const meta: MetaFunction = () => [{ title: 'Settings — Admin' }];

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

// ─── types ────────────────────────────────────────────────────────────────────

interface HealthStatus {
  status: 'ok' | 'error' | 'unknown';
  latency?: number;
  message?: string;
}

interface HealthData {
  overall: 'ok' | 'degraded' | 'down';
  services: {
    database?: HealthStatus;
    redis?: HealthStatus;
    email?: HealthStatus;
    api?: HealthStatus;
    scraper?: HealthStatus;
  };
  uptime?: number;
  version?: string;
  checkedAt?: string;
}

// ─── Status indicator ─────────────────────────────────────────────────────────

function ServiceStatus({
  name,
  status,
  latency,
  message,
}: {
  name: string;
  status: 'ok' | 'error' | 'unknown' | 'checking';
  latency?: number;
  message?: string;
}) {
  const configs = {
    ok:       { dot: 'bg-emerald-400', label: 'Operational', cls: 'text-emerald-400' },
    error:    { dot: 'bg-red-400',     label: 'Error',       cls: 'text-red-400' },
    unknown:  { dot: 'bg-gray-500',    label: 'Unknown',     cls: 'text-gray-500' },
    checking: { dot: 'bg-amber-400 animate-pulse', label: 'Checking…', cls: 'text-amber-400' },
  };
  const cfg = configs[status];
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
        <div>
          <div className="text-sm font-medium text-white">{name}</div>
          {message && <div className="text-[11px] text-[#52525b] mt-0.5">{message}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {latency != null && (
          <span className="text-[11px] text-[#52525b]">{latency}ms</span>
        )}
        <span className={`text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('mc_admin_token') ?? '';
      setToken(t ? '••••••••' + t.slice(-6) : 'not set');
    }
  }, []);

  const runHealthCheck = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const res = await adminFetch('/admin/health');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = await res.json() as any;
      if (res.ok) {
        const data = d.data ?? d;
        setHealth(data);
        toast.success('Health check completed');
      } else {
        setHealthError(d.error ?? d.message ?? 'Health check failed');
        toast.error('Health check failed');
      }
    } catch {
      setHealthError('Network error — could not reach API');
      toast.error('Network error');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Auto-run health check on mount
  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  const sendTestEmail = async () => {
    const target = testEmail.trim() || adminEmail.trim();
    if (!target) {
      toast.error('Enter an email address');
      return;
    }
    setTestLoading(true);
    try {
      const res = await adminFetch('/admin/settings/test-email', {
        method: 'POST',
        body: JSON.stringify({ email: target }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = await res.json() as any;
      if (res.ok && d.success !== false) {
        toast.success(`Test email sent to ${target}`);
      } else {
        toast.error(d.error || d.message || 'Failed to send test email');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setTestLoading(false);
    }
  };

  const flushCache = async () => {
    if (!confirm('Flush all server-side caches? This cannot be undone.')) return;
    try {
      const res = await adminFetch('/admin/settings/flush-cache', { method: 'POST' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = await res.json() as any;
      if (res.ok && d.success !== false) {
        toast.success('Cache flushed');
      } else {
        toast.error(d.error || 'Failed to flush cache');
      }
    } catch {
      toast.error('Network error');
    }
  };

  // Normalise health data into consistent service list
  const services = health?.services ?? {};
  const overallOk = health?.overall === 'ok';

  return (
    <div className="p-6 md:p-8 bg-[#0a0a0f] min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#71717a] mt-0.5">Admin configuration and system controls</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* ── System Health ── */}
        <div className="bg-[#111118] rounded-xl border border-white/[0.08] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-sm font-semibold text-white">System Health</h2>
              <p className="text-xs text-[#71717a] mt-0.5">Verify all services are reachable</p>
            </div>
            <div className="flex items-center gap-3">
              {health && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  overallOk
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                    : health.overall === 'degraded'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                    : 'bg-red-500/15 text-red-400 border-red-500/25'
                }`}>
                  {health.overall === 'ok' ? 'All systems go' : health.overall === 'degraded' ? 'Degraded' : 'Down'}
                </span>
              )}
              <button
                onClick={runHealthCheck}
                disabled={healthLoading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[#a1a1aa] hover:bg-white/[0.08] transition-all disabled:opacity-40"
              >
                <span className={healthLoading ? 'animate-spin inline-block' : ''}>↻</span>
                {healthLoading ? 'Checking…' : 'Re-check'}
              </button>
            </div>
          </div>

          <div className="px-5">
            {healthError ? (
              <div className="py-4 flex items-center gap-2 text-sm text-red-400">
                <span>⚠</span>
                {healthError}
              </div>
            ) : healthLoading && !health ? (
              <div className="py-4 flex items-center gap-2 text-sm text-[#52525b]">
                <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Running health check…
              </div>
            ) : (
              <>
                <ServiceStatus
                  name="Database (PostgreSQL)"
                  status={healthLoading ? 'checking' : (services.database?.status ?? 'unknown')}
                  latency={services.database?.latency}
                  message={services.database?.message}
                />
                <ServiceStatus
                  name="Redis / Cache"
                  status={healthLoading ? 'checking' : (services.redis?.status ?? 'unknown')}
                  latency={services.redis?.latency}
                  message={services.redis?.message}
                />
                <ServiceStatus
                  name="Email Service"
                  status={healthLoading ? 'checking' : (services.email?.status ?? 'unknown')}
                  latency={services.email?.latency}
                  message={services.email?.message}
                />
                <ServiceStatus
                  name="API Server"
                  status={healthLoading ? 'checking' : (services.api?.status ?? 'ok')}
                  latency={services.api?.latency}
                  message={services.api?.message}
                />
                {services.scraper && (
                  <ServiceStatus
                    name="Scraper"
                    status={healthLoading ? 'checking' : services.scraper.status}
                    latency={services.scraper.latency}
                    message={services.scraper.message}
                  />
                )}
                {health?.uptime != null && (
                  <div className="py-3 flex items-center justify-between text-xs text-[#52525b]">
                    <span>Uptime</span>
                    <span className="text-[#a1a1aa]">
                      {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                    </span>
                  </div>
                )}
                {health?.version && (
                  <div className="py-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#52525b]">
                    <span>Version</span>
                    <code className="text-[#a1a1aa] font-mono">{health.version}</code>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Test Email ── */}
        <div className="bg-[#111118] rounded-xl p-5 border border-white/[0.08]">
          <h2 className="text-sm font-semibold text-white mb-1">Test Email Delivery</h2>
          <p className="text-xs text-[#71717a] mb-4">Send a test email to verify SMTP / SendGrid is working correctly</p>
          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 px-3 py-2.5 rounded-xl bg-[#1a1a24] border border-white/[0.08] text-white text-sm placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && sendTestEmail()}
            />
            <button
              onClick={sendTestEmail}
              disabled={testLoading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 whitespace-nowrap"
            >
              {testLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending…
                </span>
              ) : 'Send test'}
            </button>
          </div>
        </div>

        {/* ── Environment info ── */}
        <div className="bg-[#111118] rounded-xl p-5 border border-white/[0.08]">
          <h2 className="text-sm font-semibold text-white mb-4">Environment</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-[#71717a]">API URL</span>
              <code className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg font-mono border border-indigo-500/15 truncate max-w-[280px]">
                {API_URL}
              </code>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-[#71717a]">Admin token</span>
              <code className="text-xs text-[#71717a] bg-white/[0.04] px-2.5 py-1 rounded-lg font-mono border border-white/[0.06]">
                {token}
              </code>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-[#71717a]">Environment</span>
              <code className="text-xs text-[#a1a1aa] bg-white/[0.04] px-2.5 py-1 rounded-lg font-mono border border-white/[0.06]">
                {typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'development' : 'production'}
              </code>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-[#71717a]">Host</span>
              <code className="text-xs text-[#a1a1aa] bg-white/[0.04] px-2.5 py-1 rounded-lg font-mono border border-white/[0.06]">
                {typeof window !== 'undefined' ? window.location.hostname : '—'}
              </code>
            </div>
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div className="bg-[#111118] rounded-xl p-5 border border-red-500/15">
          <h2 className="text-sm font-semibold text-red-400 mb-4">Danger Zone</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Flush server cache</p>
                <p className="text-xs text-[#52525b] mt-0.5">Clears all cached responses and rate-limit counters</p>
              </div>
              <button
                onClick={flushCache}
                className="px-4 py-2 rounded-xl border border-red-500/25 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all whitespace-nowrap"
              >
                Flush cache
              </button>
            </div>
            <div className="pt-4 border-t border-red-500/10 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Sign out all sessions</p>
                <p className="text-xs text-[#52525b] mt-0.5">Invalidates the current admin token</p>
              </div>
              <button
                onClick={() => {
                  if (!confirm('Sign out? You will need to log in again.')) return;
                  localStorage.removeItem('mc_admin_token');
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-xl border border-red-500/25 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all whitespace-nowrap"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
