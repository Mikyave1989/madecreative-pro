import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from '@remix-run/react';
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await res.json() as any;

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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-5">
            <span className="text-2xl">🛡</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Access</h1>
          <p className="text-[#71717a] text-sm mt-2">MadeCreative operations dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#111118] rounded-2xl p-8 border border-white/[0.08] shadow-2xl"
        >
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <span className="text-base shrink-0">⚠</span>
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="a-email" className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              id="a-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-2.5 rounded-xl bg-[#1a1a24] border border-white/10 text-white placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
              placeholder="admin@madecreative.pro"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="a-password" className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="a-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-xl bg-[#1a1a24] border border-white/10 text-white placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-indigo-600/20"
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

// ─── Nav items config ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/admin', icon: '⬛', label: 'Overview', end: true },
  { to: '/admin/campaigns', icon: '🚀', label: 'Campaigns', end: false },
  { to: '/admin/prospects', icon: '👥', label: 'Prospects', end: false },
  { to: '/admin/agents', icon: '🤖', label: 'Agents', end: false },
  { to: '/admin/settings', icon: '⚙', label: 'Settings', end: false },
];

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/campaigns': 'Campaigns',
  '/admin/prospects': 'Prospects',
  '/admin/agents': 'Agents',
  '/admin/settings': 'Settings',
};

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
function SidebarLink({
  to,
  icon,
  label,
  end,
  collapsed,
}: {
  to: string;
  icon: string;
  label: string;
  end: boolean;
  collapsed: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
          isActive
            ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
            : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-white/[0.04] border border-transparent'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      <span className="text-base shrink-0 leading-none">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
function Breadcrumbs({ pathname }: { pathname: string }) {
  const current = BREADCRUMB_MAP[pathname] ?? 'Admin';
  return (
    <nav className="flex items-center gap-1.5 text-xs text-[#52525b]">
      <span>Admin</span>
      {current !== 'Overview' && (
        <>
          <span>/</span>
          <span className="text-[#a1a1aa] font-medium">{current}</span>
        </>
      )}
    </nav>
  );
}

// ─── Admin shell ──────────────────────────────────────────────────────────────
function AdminShell() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
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
      setAuthed(!!token);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('mc_admin_token');
    setAuthed(false);
  };

  if (authed === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[#52525b] text-sm">Verifying access…</span>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  const currentPageLabel = BREADCRUMB_MAP[location.pathname] ?? 'Admin';

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`px-4 py-5 border-b border-white/[0.06] ${sidebarCollapsed ? 'px-3' : ''}`}>
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/30">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          {!sidebarCollapsed && (
            <div>
              <div className="text-sm font-bold text-white leading-tight">MadeCreative</div>
              <div className="text-[10px] text-indigo-400 leading-tight font-medium">Admin Panel</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            end={item.end}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className={`py-3 border-t border-white/[0.06] space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
        <a
          href="/"
          title={sidebarCollapsed ? 'Back to app' : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#52525b] hover:text-[#a1a1aa] hover:bg-white/[0.04] transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <span className="text-sm">←</span>
          {!sidebarCollapsed && <span>Back to app</span>}
        </a>
        <button
          onClick={handleLogout}
          title={sidebarCollapsed ? 'Sign out' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#52525b] hover:text-red-400 hover:bg-red-500/[0.06] transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <span className="text-sm">↪</span>
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>
        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setSidebarCollapsed((c) => !c)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-full hidden md:flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#3f3f46] hover:text-[#71717a] hover:bg-white/[0.04] transition-all mt-1 ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <span className="text-sm">{sidebarCollapsed ? '▶' : '◀'}</span>
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex font-sans">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside
        className={`hidden md:flex shrink-0 bg-[#0d0d14] border-r border-white/[0.06] flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'w-[60px]' : 'w-56'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-[#0d0d14] border-r border-white/[0.06] flex flex-col z-50 md:hidden transition-transform duration-200 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/[0.06] px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileSidebarOpen((o) => !o)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-[#71717a] hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <span className="text-lg">{mobileSidebarOpen ? '✕' : '☰'}</span>
            </button>
            <div>
              <h2 className="text-sm font-semibold text-white leading-tight">{currentPageLabel}</h2>
              <Breadcrumbs pathname={location.pathname} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User info */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <div className="w-5 h-5 rounded-full bg-indigo-600/60 flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">A</span>
              </div>
              <span className="text-xs text-[#a1a1aa] font-medium">Admin</span>
            </div>
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#71717a] hover:text-red-400 hover:bg-red-500/[0.06] border border-white/[0.06] hover:border-red-500/20 transition-all"
            >
              <span>↪</span>
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 0.7s linear infinite; }
      `}</style>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      {() => <AdminShell />}
    </ClientOnly>
  );
}
