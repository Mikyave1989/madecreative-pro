import { useState } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { toast } from 'react-toastify';
import { API_URL } from '~/lib/api/client';

export const meta: MetaFunction = () => [{ title: 'Settings — Admin' }];

function adminFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mc_admin_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

export default function AdminSettings() {
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error('Enter an email address');
      return;
    }
    setTestLoading(true);
    try {
      const res = await adminFetch('/admin/settings/test-email', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail }),
      });
      const d = await res.json();
      if (res.ok && d.success !== false) {
        toast.success(`Test email sent to ${testEmail}`);
      } else {
        toast.error(d.error || d.message || 'Failed to send test email');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setTestLoading(false);
    }
  };

  const runHealthCheck = async () => {
    try {
      const res = await adminFetch('/admin/health');
      const d = await res.json();
      if (res.ok) {
        toast.success(`Health check passed — ${JSON.stringify(d.data ?? d)}`);
      } else {
        toast.error('Health check failed');
      }
    } catch {
      toast.error('Network error during health check');
    }
  };

  const flushCache = async () => {
    if (!confirm('Flush all server-side caches? This cannot be undone.')) return;
    try {
      const res = await adminFetch('/admin/settings/flush-cache', { method: 'POST' });
      const d = await res.json();
      if (res.ok && d.success !== false) {
        toast.success('Cache flushed');
      } else {
        toast.error(d.error || 'Failed to flush cache');
      }
    } catch {
      toast.error('Network error');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Admin configuration and system controls</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Email test */}
        <div className="bg-[#111] rounded-xl p-6 border border-white/5">
          <h2 className="text-sm font-semibold text-white mb-1">Test Email Delivery</h2>
          <p className="text-xs text-gray-500 mb-4">Send a test email to verify SMTP / SendGrid is working</p>
          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={sendTestEmail}
              disabled={testLoading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {testLoading ? 'Sending…' : 'Send test'}
            </button>
          </div>
        </div>

        {/* Health check */}
        <div className="bg-[#111] rounded-xl p-6 border border-white/5">
          <h2 className="text-sm font-semibold text-white mb-1">System Health</h2>
          <p className="text-xs text-gray-500 mb-4">
            Verify all services (DB, Redis, email, scraper) are reachable
          </p>
          <button
            onClick={runHealthCheck}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            Run health check
          </button>
        </div>

        {/* Cache */}
        <div className="bg-[#111] rounded-xl p-6 border border-red-500/15">
          <h2 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Flush server cache</p>
              <p className="text-xs text-gray-600 mt-0.5">Clears all cached responses and rate-limit counters</p>
            </div>
            <button
              onClick={flushCache}
              className="px-4 py-2 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 text-sm transition-colors"
            >
              Flush cache
            </button>
          </div>
        </div>

        {/* API URL info */}
        <div className="bg-[#111] rounded-xl p-6 border border-white/5">
          <h2 className="text-sm font-semibold text-white mb-3">Environment</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">API URL</span>
              <code className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-mono">
                {API_URL}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Admin token</span>
              <code className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded font-mono">
                {typeof window !== 'undefined' && localStorage.getItem('mc_admin_token')
                  ? '••••••••' + (localStorage.getItem('mc_admin_token') ?? '').slice(-6)
                  : 'not set'}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
