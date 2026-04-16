import { useState, useEffect, useCallback } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { toast } from 'react-toastify';
import { API_URL } from '~/lib/api/client';

export const meta: MetaFunction = () => [{ title: 'Campaigns — Admin' }];

// ─── helpers ──────────────────────────────────────────────────────────────────

function adminFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mc_admin_token') : null;
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}

function fmtNum(n: number | undefined | null) {
  if (n == null) return '—';
  return n.toLocaleString('en-US');
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── types ────────────────────────────────────────────────────────────────────

interface ActiveCampaign {
  id: string;
  name: string;
  sector: string;
  countries: string[];
  cities: string[] | null;
  maxResults: number;
  isActive: boolean;
  lastRunAt: string | null;
  totalFound: number;
  createdAt: string;
  activeJobs: number;
  prospectsFound: number;
  analyzed: number;
  sitesBuilt: number;
  emailsSent: number;
}

interface WarmingStatus {
  warmingDay: number;
  currentLimit: number;
  sentToday: number;
  remaining: number;
  initialized: boolean;
  phase: number;
}

// ─── constants ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { value: 'DE', label: 'Germany' },
  { value: 'AT', label: 'Austria' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'IT', label: 'Italy' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'BE', label: 'Belgium' },
  { value: 'PT', label: 'Portugal' },
];

const SECTORS = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'retail', label: 'Retail' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'medical', label: 'Medical' },
  { value: 'legal', label: 'Legal' },
  { value: 'tech', label: 'Tech' },
  { value: 'construction', label: 'Construction' },
  { value: 'other', label: 'Other' },
];

const STATUS_FILTERS = ['all', 'active', 'paused', 'completed'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// ─── Status badge ──────────────────────────────────────────────────────────────

function CampaignStatusBadge({ campaign: c }: { campaign: ActiveCampaign }) {
  const running = c.activeJobs > 0;
  if (running) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Running</span>;
  if (c.isActive) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />Active</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Paused</span>;
}

// ─── Create campaign modal ────────────────────────────────────────────────────

function CreateCampaignModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('DE');
  const [sector, setSector] = useState('restaurant');
  const [keywords, setKeywords] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [minRating, setMinRating] = useState(3.5);
  const [launching, setLaunching] = useState(false);

  const handleLaunch = async () => {
    if (!city.trim()) {
      toast.error('City is required');
      return;
    }
    setLaunching(true);
    try {
      const res = await adminFetch('/admin/launch/campaign', {
        method: 'POST',
        body: JSON.stringify({
          city: city.trim(),
          country,
          sector,
          keywords: keywords.trim() || undefined,
          maxResults,
          minRating,
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await res.json() as any;
      if (res.ok && data.success !== false) {
        toast.success(data.data?.message ?? `Campaign launched for ${city}`);
        onCreated();
        onClose();
      } else {
        toast.error(data.error ?? data.message ?? 'Launch failed');
      }
    } catch {
      toast.error('Network error — launch failed');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#111118] rounded-2xl border border-white/[0.08] shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-semibold text-white">New Campaign</h2>
            <p className="text-xs text-[#71717a] mt-0.5">Full pipeline: scrape → analyze → build → email</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#71717a] hover:text-white hover:bg-white/[0.06] transition-all text-lg"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Pipeline steps indicator */}
          <div className="flex items-center gap-1 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {[
              { step: '1', label: 'SCRAPE', color: '#6366f1' },
              { step: '2', label: 'ANALYZE', color: '#8b5cf6' },
              { step: '3', label: 'BUILD', color: '#ec4899' },
              { step: '4', label: 'EMAIL', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center gap-1 flex-1 min-w-0">
                <div
                  className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}
                >
                  {s.step}
                </div>
                <span className="text-[10px] font-semibold truncate" style={{ color: s.color }}>{s.label}</span>
                {i < 3 && <span className="text-[#3f3f46] ml-auto">›</span>}
              </div>
            ))}
          </div>

          {/* City + Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-1.5">City *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. München"
                className="w-full px-3 py-2.5 rounded-xl bg-[#1a1a24] border border-white/[0.08] text-white text-sm placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleLaunch()}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-1.5">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1a1a24] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sector + Keywords */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-1.5">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1a1a24] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
              >
                {SECTORS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-1.5">Keywords</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. sushi, vegan"
                className="w-full px-3 py-2.5 rounded-xl bg-[#1a1a24] border border-white/[0.08] text-white text-sm placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Max results + Min rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-1.5">Max Results</label>
              <input
                type="number"
                value={maxResults}
                min={1}
                max={5000}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1a1a24] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-1.5">Min Google Rating</label>
              <input
                type="number"
                value={minRating}
                min={1}
                max={5}
                step={0.1}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1a1a24] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-[#71717a] hover:text-white hover:bg-white/[0.04] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            disabled={launching || !city.trim()}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
          >
            {launching ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Launching…
              </span>
            ) : (
              `Launch — ${city ? `${city}, ${country}` : 'Enter city'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  campaign,
  onClose,
  onDeleted,
}: {
  campaign: ActiveCampaign;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await adminFetch(`/admin/launch/campaigns/${campaign.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Campaign deleted');
        onDeleted();
        onClose();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = await res.json() as any;
        toast.error(d.error ?? 'Delete failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#111118] rounded-2xl border border-red-500/20 shadow-2xl p-6">
        <div className="text-center mb-5">
          <div className="text-3xl mb-3">🗑</div>
          <h2 className="text-base font-semibold text-white mb-1">Delete Campaign?</h2>
          <p className="text-sm text-[#71717a]">
            <strong className="text-white">{campaign.name}</strong> will be permanently deleted. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-[#71717a] hover:text-white hover:bg-white/[0.04] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Campaign row ──────────────────────────────────────────────────────────────

function CampaignRow({
  campaign: c,
  onToggle,
  onDelete,
  onSelect,
}: {
  campaign: ActiveCampaign;
  onToggle: (id: string) => void;
  onDelete: (c: ActiveCampaign) => void;
  onSelect: (c: ActiveCampaign) => void;
}) {
  return (
    <tr
      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer group"
      onClick={() => onSelect(c)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <CampaignStatusBadge campaign={c} />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-white text-sm">{c.name}</div>
        <div className="text-[11px] text-[#71717a] mt-0.5">
          {(c.cities?.join(', ') ?? (c.countries ?? []).join(', '))} · {c.sector}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-white tabular-nums">{fmtNum(c.prospectsFound)}</td>
      <td className="px-4 py-3 text-sm text-[#a1a1aa] tabular-nums">{fmtNum(c.analyzed ?? 0)}</td>
      <td className="px-4 py-3 text-sm text-[#a1a1aa] tabular-nums">{fmtNum(c.sitesBuilt ?? 0)}</td>
      <td className="px-4 py-3 text-sm text-[#a1a1aa] tabular-nums">{fmtNum(c.emailsSent ?? 0)}</td>
      <td className="px-4 py-3 text-xs text-[#52525b]">{fmtDate(c.createdAt)}</td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggle(c.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              c.isActive
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {c.isActive ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => onDelete(c)}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function AdminCampaigns() {
  const [warming, setWarming] = useState<WarmingStatus | null>(null);
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ActiveCampaign | null>(null);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');

  const loadWarming = useCallback(async () => {
    try {
      const res = await adminFetch('/admin/launch/warming/status');
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = await res.json() as any;
        setWarming(d.data ?? d);
      }
    } catch { /* silent */ }
  }, []);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/admin/launch/campaigns');
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = await res.json() as any;
        setCampaigns(d.data ?? []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadWarming();
    loadCampaigns();
  }, [loadWarming, loadCampaigns]);

  const handleToggle = async (id: string) => {
    try {
      const res = await adminFetch(`/admin/launch/campaigns/${id}/toggle`, { method: 'PATCH' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await res.json() as any;
      if (res.ok) {
        toast.success(data.data?.message ?? 'Campaign toggled');
        await loadCampaigns();
      } else {
        toast.error(data.error ?? 'Toggle failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return c.isActive && c.activeJobs === 0;
    if (filterStatus === 'paused') return !c.isActive;
    if (filterStatus === 'completed') return !c.isActive && c.emailsSent > 0;
    return true;
  });

  return (
    <div className="p-6 md:p-8 bg-[#0a0a0f] min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Campaigns</h1>
          <p className="text-sm text-[#71717a] mt-0.5">
            Full-pipeline: scrape businesses, score leads, build preview sites, send personalised emails
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Warming card */}
          {warming && (
            <div className="flex items-center gap-4 px-4 py-2.5 bg-[#111118] rounded-xl border border-white/[0.08]">
              <div>
                <div className="text-[10px] text-[#52525b] uppercase tracking-wide mb-0.5">Warming Day</div>
                <div className="text-base font-bold text-white">{warming.warmingDay}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#52525b] uppercase tracking-wide mb-0.5">Sent Today</div>
                <div className="text-base font-bold text-white">
                  {warming.sentToday}
                  <span className="text-[#52525b] font-normal text-xs">/{warming.currentLimit}</span>
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${warming.initialized ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-gray-500/15 text-gray-400 border-gray-500/25'}`}>
                {warming.initialized ? 'Warmed' : 'Not init'}
              </span>
            </div>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            <span>+</span>
            New Campaign
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              filterStatus === f
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/25'
                : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            {f}
            {f !== 'all' && (
              <span className="ml-1.5 text-[10px] opacity-60">
                {campaigns.filter((c) => {
                  if (f === 'active') return c.isActive && c.activeJobs === 0;
                  if (f === 'paused') return !c.isActive;
                  if (f === 'completed') return !c.isActive && c.emailsSent > 0;
                  return true;
                }).length}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={loadCampaigns}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#71717a] hover:text-[#a1a1aa] hover:bg-white/[0.04] transition-all border border-white/[0.06]"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
          Refresh
        </button>
      </div>

      {/* Campaigns table */}
      <div className="bg-[#111118] rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Prospects</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Analyzed</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Sites Built</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Emails Sent</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Created</th>
                <th className="w-36" />
              </tr>
            </thead>
            <tbody>
              {loading && campaigns.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/[0.05] rounded animate-pulse" style={{ width: `${50 + j * 6}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="text-3xl mb-3">🚀</div>
                    <p className="text-sm text-[#52525b]">
                      {filterStatus !== 'all' ? `No ${filterStatus} campaigns` : 'No campaigns yet. Create your first campaign.'}
                    </p>
                    {filterStatus === 'all' && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/25 text-indigo-400 text-sm hover:bg-indigo-600/30 transition-all"
                      >
                        + Create campaign
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c) => (
                  <CampaignRow
                    key={c.id}
                    campaign={c}
                    onToggle={handleToggle}
                    onDelete={setDeleteTarget}
                    onSelect={() => {
                      // Future: navigate to campaign detail
                      toast.info(`Campaign: ${c.name} — ${c.prospectsFound} prospects`);
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredCampaigns.length > 0 && (
          <div className="px-4 py-2.5 border-t border-white/[0.06] text-xs text-[#52525b]">
            {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''} shown
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadCampaigns}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          campaign={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={loadCampaigns}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
