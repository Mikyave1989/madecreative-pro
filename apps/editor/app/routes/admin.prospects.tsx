import { useState, useEffect, useCallback, useRef } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { toast } from 'react-toastify';
import { API_URL } from '~/lib/api/client';

export const meta: MetaFunction = () => [{ title: 'Prospects — Admin' }];

// ─── types ────────────────────────────────────────────────────────────────────
interface Prospect {
  id: string;
  companyName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  city: string | null;
  country: string | null;
  sector: string | null;
  leadScore: number;
  status: string;
  previewSiteUrl: string | null;
  website: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  firstContactedAt: string | null;
  repliedAt: string | null;
  convertedAt: string | null;
  createdAt?: string;
  aiAnalysis: string | null;
  painPoints?: unknown;
}

// painPoints can be: string, string[], or Array<{category, severity, description}>
// depending on when/how it was written. Render defensively.
function renderPainPoints(raw: unknown): React.ReactNode {
  if (raw == null) return null;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return (
      <ul className="space-y-1.5">
        {raw.map((item, i) => {
          if (item == null) return null;
          if (typeof item === 'string') return <li key={i}>• {item}</li>;
          if (typeof item === 'object') {
            const o = item as { category?: unknown; severity?: unknown; description?: unknown };
            const category = typeof o.category === 'string' ? o.category : '';
            const severity = typeof o.severity === 'string' ? o.severity : '';
            const description = typeof o.description === 'string' ? o.description : JSON.stringify(item);
            return (
              <li key={i} className="flex gap-2">
                <span className="text-[#52525b]">•</span>
                <div>
                  {(category || severity) && (
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#52525b] mb-0.5">
                      {[category, severity].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  <div>{description}</div>
                </div>
              </li>
            );
          }
          return <li key={i}>• {String(item)}</li>;
        })}
      </ul>
    );
  }
  if (typeof raw === 'object') return JSON.stringify(raw);
  return String(raw);
}

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

function buildQs(params: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  scraped:      { label: 'Scraped',      cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  analyzed:     { label: 'Analyzed',     cls: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
  preview:      { label: 'Preview',      cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  preview_ready:{ label: 'Preview',      cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  contacted:    { label: 'Contacted',    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  replied:      { label: 'Replied',      cls: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
  converted:    { label: 'Converted',    cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
  unsubscribed: { label: 'Unsub',        cls: 'bg-gray-500/15 text-gray-500 border-gray-500/25' },
  bounced:      { label: 'Bounced',      cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
};

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/-/g, '_');
  const cfg = STATUS_CONFIG[key] ?? { label: status, cls: 'bg-gray-500/15 text-gray-400 border-gray-500/25' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[#a1a1aa] tabular-nums w-6">{score}</span>
    </div>
  );
}

// ─── Prospect detail panel ─────────────────────────────────────────────────────
function ProspectDetail({
  p,
  onBuild,
  onSend,
  onDelete,
}: {
  p: Prospect;
  onBuild: (id: string) => void;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="px-5 py-4 bg-[#0a0a0f] border-t border-white/[0.06]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">Contact</div>
          <div className="text-xs text-[#a1a1aa] space-y-0.5">
            <div>{p.contactEmail || '—'}</div>
            <div>{p.contactPhone || '—'}</div>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">Location</div>
          <div className="text-xs text-[#a1a1aa]">
            {[p.city, p.country].filter(Boolean).join(', ') || '—'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">Google Rating</div>
          <div className="text-xs text-[#a1a1aa]">
            {p.googleRating ? `${p.googleRating} ★ (${p.reviewCount ?? 0} reviews)` : '—'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">Outreach Timeline</div>
          <div className="text-xs text-[#52525b] space-y-0.5">
            {p.firstContactedAt && <div>Contacted {fmtDate(p.firstContactedAt)}</div>}
            {p.repliedAt && <div>Replied {fmtDate(p.repliedAt)}</div>}
            {p.convertedAt && <div className="text-emerald-400">Converted {fmtDate(p.convertedAt)}</div>}
            {!p.firstContactedAt && !p.repliedAt && !p.convertedAt && <div>No outreach yet</div>}
          </div>
        </div>
        {p.aiAnalysis && (
          <div className="col-span-2 md:col-span-4">
            <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">AI Analysis</div>
            <div className="text-xs text-[#71717a] bg-white/[0.02] rounded-xl px-3 py-2.5 border border-white/[0.06] leading-relaxed">
              {p.aiAnalysis}
            </div>
          </div>
        )}
        {p.painPoints != null && (Array.isArray(p.painPoints) ? p.painPoints.length > 0 : true) && (
          <div className="col-span-2 md:col-span-4">
            <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">Pain Points</div>
            <div className="text-xs text-[#71717a] bg-white/[0.02] rounded-xl px-3 py-2.5 border border-white/[0.06] leading-relaxed">
              {renderPainPoints(p.painPoints)}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {p.previewSiteUrl && (
          <a
            href={p.previewSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 text-xs font-medium hover:bg-indigo-600/25 transition-all"
          >
            👁 View Preview
          </a>
        )}
        {p.website && (
          <a
            href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#a1a1aa] text-xs font-medium hover:bg-white/[0.08] transition-all"
          >
            🌐 Current Site
          </a>
        )}
        {!p.previewSiteUrl && (
          <button
            onClick={() => onBuild(p.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-all"
          >
            🏗 Build Preview
          </button>
        )}
        <button
          onClick={() => onSend(p.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-all"
        >
          📧 Send Email
        </button>
        <button
          onClick={() => onDelete(p.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all ml-auto"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

// ─── filter constants ─────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['', 'scraped', 'analyzed', 'preview', 'contacted', 'replied', 'converted', 'unsubscribed', 'bounced'];

const SECTORS = [
  '', 'restaurant', 'hotel', 'retail', 'medical', 'dental', 'gym', 'beauty',
  'automotive', 'real estate', 'law firm', 'accounting', 'architecture',
  'photography', 'events', 'construction', 'other',
];

const COUNTRIES = [
  { value: '', label: 'All countries' },
  { value: 'DE', label: 'Germany' },
  { value: 'AT', label: 'Austria' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'IT', label: 'Italy' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'BE', label: 'Belgium' },
  { value: 'PL', label: 'Poland' },
  { value: 'PT', label: 'Portugal' },
  { value: 'GB', label: 'UK' },
  { value: 'US', label: 'US' },
];

// ─── main component ───────────────────────────────────────────────────────────
export default function AdminProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<'leadScore' | 'companyName' | 'createdAt'>('leadScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 50;

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQs({
        limit,
        page,
        sortBy: sortField,
        sortOrder,
        country: filterCountry || undefined,
        sector: filterSector || undefined,
        status: filterStatus || undefined,
        search: search.trim() || undefined,
      });

      const res = await adminFetch(`/admin/prospects${qs}`);
      if (!res.ok) {
        toast.error('Failed to load prospects');
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await res.json() as any;
      const inner = data.data ?? {};
      const list = inner.data ?? inner.prospects ?? data.prospects ?? [];
      const t = inner.total ?? data.total ?? (Array.isArray(list) ? list.length : 0);
      setProspects(Array.isArray(list) ? list : []);
      setTotal(t);
      setSelected(new Set());
    } catch {
      toast.error('Network error loading prospects');
    } finally {
      setLoading(false);
    }
  }, [page, sortField, sortOrder, filterCountry, filterSector, filterStatus, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === prospects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(prospects.map((p) => p.id)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prospect?')) return;
    try {
      const res = await adminFetch(`/admin/prospects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Prospect deleted');
        load();
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleBuild = async (id: string) => {
    try {
      const res = await adminFetch(`/admin/prospects/${id}/build-preview`, { method: 'POST' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = await res.json() as any;
      if (res.ok && d.success !== false) {
        toast.success('Preview build started');
        load();
      } else {
        toast.error(d.error ?? 'Build failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Send outreach email to this prospect?')) return;
    try {
      const res = await adminFetch(`/admin/prospects/${id}/send-outreach`, { method: 'POST' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = await res.json() as any;
      if (res.ok && d.success !== false) {
        toast.success('Outreach email queued');
        load();
      } else {
        toast.error(d.error ?? 'Send failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} prospect${selected.size !== 1 ? 's' : ''}?`)) return;
    let ok = 0;
    for (const id of selected) {
      try {
        const res = await adminFetch(`/admin/prospects/${id}`, { method: 'DELETE' });
        if (res.ok) ok++;
      } catch { /* continue */ }
    }
    toast.success(`Deleted ${ok} prospect${ok !== 1 ? 's' : ''}`);
    load();
  };

  const handleBulkBuild = async () => {
    if (selected.size === 0) return;
    let ok = 0;
    for (const id of selected) {
      try {
        const res = await adminFetch(`/admin/prospects/${id}/build-preview`, { method: 'POST' });
        if (res.ok) ok++;
      } catch { /* continue */ }
    }
    toast.success(`Build started for ${ok} prospect${ok !== 1 ? 's' : ''}`);
    load();
  };

  const handleBulkSend = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Send outreach to ${selected.size} prospect${selected.size !== 1 ? 's' : ''}?`)) return;
    let ok = 0;
    for (const id of selected) {
      try {
        const res = await adminFetch(`/admin/prospects/${id}/send-outreach`, { method: 'POST' });
        if (res.ok) ok++;
      } catch { /* continue */ }
    }
    toast.success(`Queued outreach for ${ok} prospect${ok !== 1 ? 's' : ''}`);
    load();
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <span className="text-[#3f3f46] text-[10px]">↕</span>;
    return <span className="text-indigo-400 text-[10px]">{sortOrder === 'desc' ? '↓' : '↑'}</span>;
  };

  const totalPages = Math.ceil(total / limit);
  const allSelected = prospects.length > 0 && selected.size === prospects.length;

  return (
    <div className="p-6 md:p-8 bg-[#0a0a0f] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Prospects</h1>
          <p className="text-sm text-[#71717a] mt-0.5">
            {total.toLocaleString('en-US')} total prospect{total !== 1 ? 's' : ''}
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

      {/* Filters */}
      <div className="bg-[#111118] rounded-xl p-4 border border-white/[0.08] mb-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b] text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search company, email…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1a1a24] border border-white/[0.08] text-white text-sm placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Country */}
          <select
            value={filterCountry}
            onChange={(e) => { setFilterCountry(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-[#1a1a24] border border-white/[0.08] text-sm text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[130px]"
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Sector */}
          <select
            value={filterSector}
            onChange={(e) => { setFilterSector(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-[#1a1a24] border border-white/[0.08] text-sm text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[130px]"
          >
            <option value="">All sectors</option>
            {SECTORS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-[#1a1a24] border border-white/[0.08] text-sm text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[130px]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === '' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* Clear */}
          {(filterCountry || filterSector || filterStatus || search) && (
            <button
              onClick={() => { setFilterCountry(''); setFilterSector(''); setFilterStatus(''); setSearch(''); setPage(1); }}
              className="px-3 py-2 rounded-xl text-xs text-[#71717a] hover:text-[#a1a1aa] hover:bg-white/[0.04] transition-all"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
          <span className="text-sm font-semibold text-indigo-400">{selected.size} selected</span>
          <div className="flex gap-2 ml-2">
            <button
              onClick={handleBulkBuild}
              className="px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/25 text-violet-400 text-xs font-semibold hover:bg-violet-500/25 transition-all"
            >
              🏗 Build Preview
            </button>
            <button
              onClick={handleBulkSend}
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-all"
            >
              📧 Send Email
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-semibold hover:bg-red-500/25 transition-all"
            >
              🗑 Delete
            </button>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-[#52525b] hover:text-[#a1a1aa] transition-all"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#111118] rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {/* Select all */}
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={selectAll}
                    className="w-3.5 h-3.5 rounded accent-indigo-500"
                  />
                </th>
                <th
                  className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider cursor-pointer hover:text-[#a1a1aa] transition-colors"
                  onClick={() => toggleSort('companyName')}
                >
                  <span className="flex items-center gap-1.5">Company <SortIcon field="companyName" /></span>
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">City</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Country</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Sector</th>
                <th
                  className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider cursor-pointer hover:text-[#a1a1aa] transition-colors"
                  onClick={() => toggleSort('leadScore')}
                >
                  <span className="flex items-center gap-1.5">Score <SortIcon field="leadScore" /></span>
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Preview</th>
                <th
                  className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider cursor-pointer hover:text-[#a1a1aa] transition-colors"
                  onClick={() => toggleSort('createdAt')}
                >
                  <span className="flex items-center gap-1.5">Created <SortIcon field="createdAt" /></span>
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Actions</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {loading && prospects.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-white/[0.05] rounded animate-pulse" style={{ width: `${50 + j * 4}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : prospects.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <div className="text-3xl mb-3">👥</div>
                    <p className="text-sm text-[#52525b]">No prospects found</p>
                  </td>
                </tr>
              ) : (
                prospects.map((p) => (
                  <>
                    <tr
                      key={p.id}
                      className={`border-b border-white/[0.04] cursor-pointer transition-colors group ${
                        expanded === p.id ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'
                      } ${selected.has(p.id) ? 'bg-indigo-600/[0.05]' : ''}`}
                      onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="w-3.5 h-3.5 rounded accent-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-white text-sm">{p.companyName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#71717a]">{p.city || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#71717a]">{p.country || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {p.sector ? (
                          <span className="text-xs text-[#71717a] capitalize">{p.sector}</span>
                        ) : (
                          <span className="text-[#3f3f46] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBar score={p.leadScore ?? 0} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {p.previewSiteUrl ? (
                          <a
                            href={p.previewSiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            👁 View
                          </a>
                        ) : (
                          <span className="text-[#3f3f46] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#52525b]">{fmtDate(p.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!p.previewSiteUrl && (
                            <button
                              onClick={() => handleBuild(p.id)}
                              title="Build preview"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-all text-xs"
                            >
                              🏗
                            </button>
                          )}
                          <button
                            onClick={() => handleSend(p.id)}
                            title="Send email"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all text-xs"
                          >
                            📧
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            title="Delete"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all text-xs"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <span className={`text-[#52525b] text-xs inline-block transition-transform ${expanded === p.id ? 'rotate-180' : ''}`}>▼</span>
                      </td>
                    </tr>
                    {expanded === p.id && (
                      <tr key={`${p.id}-detail`}>
                        <td colSpan={11} className="p-0">
                          <ProspectDetail
                            p={p}
                            onBuild={handleBuild}
                            onSend={handleSend}
                            onDelete={handleDelete}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-[#52525b]">
              Page {page} of {totalPages} — {total.toLocaleString('en-US')} total
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[#a1a1aa] hover:bg-white/[0.08] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pn = start + i;
                return (
                  <button
                    key={pn}
                    onClick={() => setPage(pn)}
                    className={`w-8 h-7 rounded-xl text-xs transition-all ${
                      pn === page
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-white/[0.04] border border-white/[0.08] text-[#a1a1aa] hover:bg-white/[0.08]'
                    }`}
                  >
                    {pn}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[#a1a1aa] hover:bg-white/[0.08] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
