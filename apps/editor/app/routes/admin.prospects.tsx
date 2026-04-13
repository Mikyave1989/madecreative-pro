import { useState, useEffect, useCallback, useRef } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { toast } from 'react-toastify';
import { API_URL } from '~/lib/api/client';

export const meta: MetaFunction = () => [{ title: 'Prospects — Admin' }];

// ─── types ────────────────────────────────────────────────────────────────────
interface Prospect {
  id: string;
  companyName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  sector: string | null;
  leadScore: number;
  status: string;
  previewUrl: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  contactedAt: string | null;
  repliedAt: string | null;
  convertedAt: string | null;
  notes: string | null;
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

// ─── status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  scraped: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  analyzed: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  preview: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  contacted: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  replied: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  converted: 'bg-green-500/15 text-green-400 border-green-500/25',
  unsubscribed: 'bg-gray-500/15 text-gray-500 border-gray-500/25',
  bounced: 'bg-red-500/15 text-red-400 border-red-500/25',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status.toLowerCase()] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/25';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 tabular-nums w-7">{score}</span>
    </div>
  );
}

// ─── expanded row detail ──────────────────────────────────────────────────────
function ProspectDetail({ p }: { p: Prospect }) {
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="px-6 py-4 bg-[#0d0d0d] border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Contact</div>
        <div className="text-xs text-gray-300 space-y-1">
          <div>{p.email || '—'}</div>
          <div>{p.phone || '—'}</div>
        </div>
      </div>
      <div>
        <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Location</div>
        <div className="text-xs text-gray-300">
          {[p.city, p.country].filter(Boolean).join(', ') || '—'}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Rating</div>
        <div className="text-xs text-gray-300">
          {p.rating ? `${p.rating} ★ (${p.reviewCount ?? 0} reviews)` : '—'}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Timeline</div>
        <div className="text-xs text-gray-500 space-y-0.5">
          {p.contactedAt && <div>Contacted {fmtDate(p.contactedAt)}</div>}
          {p.repliedAt && <div>Replied {fmtDate(p.repliedAt)}</div>}
          {p.convertedAt && <div className="text-green-400">Converted {fmtDate(p.convertedAt)}</div>}
        </div>
      </div>
      {p.notes && (
        <div className="col-span-2 md:col-span-4">
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Notes</div>
          <div className="text-xs text-gray-400 bg-white/3 rounded px-3 py-2 border border-white/5">
            {p.notes}
          </div>
        </div>
      )}
      <div className="col-span-2 md:col-span-4 flex gap-3">
        {p.previewUrl && (
          <a
            href={p.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 text-xs hover:bg-indigo-600/25 transition-colors"
          >
            <div className="i-ph:eye text-sm" />
            View preview
          </a>
        )}
        {p.website && (
          <a
            href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs hover:bg-white/10 transition-colors"
          >
            <div className="i-ph:globe text-sm" />
            Current site
          </a>
        )}
      </div>
    </div>
  );
}

// ─── filter controls ──────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  '',
  'scraped',
  'analyzed',
  'preview',
  'contacted',
  'replied',
  'converted',
  'unsubscribed',
  'bounced',
];

const SECTORS = [
  '',
  'restaurant',
  'hotel',
  'retail',
  'medical',
  'dental',
  'gym',
  'beauty',
  'automotive',
  'real estate',
  'law firm',
  'accounting',
  'architecture',
  'photography',
  'events',
  'construction',
  'other',
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

  // Filters
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<'leadScore' | 'companyName' | 'contactedAt'>('leadScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 50;

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQs({
        limit,
        offset: (page - 1) * limit,
        sort: sortField,
        order: sortOrder,
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
      const data = await res.json();
      const list = data.data?.prospects ?? data.data ?? data.prospects ?? data;
      const t = data.data?.total ?? data.total ?? list.length;
      setProspects(Array.isArray(list) ? list : []);
      setTotal(t);
    } catch {
      toast.error('Network error loading prospects');
    } finally {
      setLoading(false);
    }
  }, [page, sortField, sortOrder, filterCountry, filterSector, filterStatus, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {}, 0); // load fires via deps
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

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <div className="i-ph:arrows-down-up text-gray-600 text-xs" />;
    return sortOrder === 'desc' ? (
      <div className="i-ph:arrow-down text-indigo-400 text-xs" />
    ) : (
      <div className="i-ph:arrow-up text-indigo-400 text-xs" />
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Prospects</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total.toLocaleString()} total prospect{total !== 1 ? 's' : ''}
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

      {/* Filters */}
      <div className="bg-[#111] rounded-xl p-4 border border-white/5 mb-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 i-ph:magnifying-glass text-gray-600 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search company, email…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Country */}
          <select
            value={filterCountry}
            onChange={(e) => { setFilterCountry(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[130px]"
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Sector */}
          <select
            value={filterSector}
            onChange={(e) => { setFilterSector(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[130px]"
          >
            <option value="">All sectors</option>
            {SECTORS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[130px]"
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
              onClick={() => {
                setFilterCountry('');
                setFilterSector('');
                setFilterStatus('');
                setSearch('');
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => toggleSort('companyName')}
                >
                  <span className="flex items-center gap-1.5">
                    Company <SortIcon field="companyName" />
                  </span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Location</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Sector</th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => toggleSort('leadScore')}
                >
                  <span className="flex items-center gap-1.5">
                    Score <SortIcon field="leadScore" />
                  </span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Preview</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {loading && prospects.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-white/5 rounded animate-pulse" style={{ width: `${60 + j * 5}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : prospects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-600 text-sm">
                    No prospects found
                  </td>
                </tr>
              ) : (
                prospects.map((p) => (
                  <>
                    <tr
                      key={p.id}
                      className={`border-b border-white/5 cursor-pointer transition-colors ${
                        expanded === p.id ? 'bg-white/3' : 'hover:bg-white/3'
                      }`}
                      onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-white">{p.companyName}</span>
                      </td>
                      <td className="px-4 py-3">
                        {p.email ? (
                          <span className="text-gray-400 text-xs font-mono">{p.email}</span>
                        ) : (
                          <span className="text-gray-700 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-400 text-xs">
                          {[p.city, p.country].filter(Boolean).join(', ') || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.sector ? (
                          <span className="text-gray-400 text-xs capitalize">{p.sector}</span>
                        ) : (
                          <span className="text-gray-700 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBar score={p.leadScore ?? 0} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        {p.previewUrl ? (
                          <a
                            href={p.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <div className="i-ph:eye text-sm" />
                            View
                          </a>
                        ) : (
                          <span className="text-gray-700 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <div
                          className={`i-ph:caret-down text-gray-600 text-sm transition-transform ${
                            expanded === p.id ? 'rotate-180' : ''
                          }`}
                        />
                      </td>
                    </tr>
                    {expanded === p.id && (
                      <tr key={`${p.id}-detail`}>
                        <td colSpan={8} className="p-0">
                          <ProspectDetail p={p} />
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-gray-600">
              Page {page} of {totalPages} — {total.toLocaleString()} total
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {/* Page numbers — show up to 5 around current */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pn = start + i;
                return (
                  <button
                    key={pn}
                    onClick={() => setPage(pn)}
                    className={`w-8 h-7 rounded-lg text-xs transition-colors ${
                      pn === page
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {pn}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
