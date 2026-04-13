import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { API_URL } from '~/lib/api/client';

export const meta: MetaFunction = () => [
  { title: 'MadeCreative Admin' },
  { name: 'robots', content: 'noindex,nofollow' },
];

// ─── shared admin fetch helper (exported so child routes can use it) ──────────
export function adminFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mc_admin_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

// ─── Login form ───────────────────────────────────────────────────────────────
function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data?.accessToken) {
        localStorage.setItem('mc_admin_token', data.data.accessToken);
        onSuccess();
      } else {
        setError(data.error || data.message || 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
            <div className="i-ph:shield-check text-indigo-400 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="text-gray-500 text-sm mt-1">MadeCreative operations dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#111] rounded-xl p-8 border border-white/5 shadow-2xl"
        >
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <div className="i-ph:warning-circle text-base shrink-0" />
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="a-email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              id="a-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              placeholder="admin@madecreative.pro"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="a-password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="a-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating…
              </span>
            ) : (
              'Sign In to Admin'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
function SidebarLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: string;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/admin'}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-indigo-600/20 text-indigo-400 font-medium'
            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
        }`
      }
    >
      <div className={`${icon} text-base shrink-0`} />
      {label}
    </NavLink>
  );
}

// ─── Admin shell ──────────────────────────────────────────────────────────────
function AdminShell() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('mc_admin_token');
    if (!token) {
      setAuthed(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/metrics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('mc_admin_token');
        setAuthed(false);
      } else {
        setAuthed(true);
      }
    } catch {
      // network error — still allow if token present to avoid lockout on flaky connection
      setAuthed(!!token);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
    localStorage.removeItem('mc_admin_token');
    setAuthed(false);
  };

  // Checking auth
  if (authed === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Verifying access…</span>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#0d0d0d] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <div className="i-ph:sparkle text-white text-sm" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white leading-tight">MadeCreative</div>
              <div className="text-[10px] text-indigo-400 leading-tight">Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <SidebarLink to="/admin" icon="i-ph:squares-four" label="Overview" />
          <SidebarLink to="/admin/campaigns" icon="i-ph:rocket-launch" label="Campaigns" />
          <SidebarLink to="/admin/prospects" icon="i-ph:users" label="Prospects" />
          <SidebarLink to="/admin/agents" icon="i-ph:robot" label="Agents" />
          <SidebarLink to="/admin/settings" icon="i-ph:gear" label="Settings" />
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          <a
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <div className="i-ph:arrow-left text-base" />
            Back to app
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <div className="i-ph:sign-out text-base" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      {() => <AdminShell />}
    </ClientOnly>
  );
}
