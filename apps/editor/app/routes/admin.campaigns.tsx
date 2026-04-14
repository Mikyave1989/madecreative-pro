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

// ─── types ────────────────────────────────────────────────────────────────────

interface WarmingStatus {
  warmingDay: number;
  currentLimit: number;
  sentToday: number;
  remaining: number;
  initialized: boolean;
  phase: number;
}

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

// ─── inline-style tokens ──────────────────────────────────────────────────────

const S = {
  page: {
    backgroundColor: '#0a0a0a',
    minHeight: '100vh',
    padding: '2rem 2.5rem',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  card: {
    backgroundColor: '#111',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: '12px',
    padding: '1.5rem',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '6px',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '.04em',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    backgroundColor: '#1a1a1a',
    border: '1px solid rgba(255,255,255,.1)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    backgroundColor: '#1a1a1a',
    border: '1px solid rgba(255,255,255,.1)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    appearance: 'none' as const,
    cursor: 'pointer',
  },
  launchBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: '#6366f1',
    border: '1px solid rgba(99,102,241,.5)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '.01em',
    transition: 'background .15s',
  } as React.CSSProperties,
  launchBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  } as React.CSSProperties,
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '.08em',
    marginBottom: '12px',
  },
  badge: (color: string) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 500,
    backgroundColor: `${color}22`,
    color: color,
    border: `1px solid ${color}44`,
  }),
} as const;

// ─── main ─────────────────────────────────────────────────────────────────────

export default function AdminCampaigns() {
  // Form state
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('DE');
  const [sector, setSector] = useState('restaurant');
  const [maxProspects, setMaxProspects] = useState(50);
  const [minRating, setMinRating] = useState(3.5);
  const [launching, setLaunching] = useState(false);

  // Data state
  const [warming, setWarming] = useState<WarmingStatus | null>(null);
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // ── data fetchers ────────────────────────────────────────────────────────────

  const loadWarming = useCallback(async () => {
    try {
      const res = await adminFetch('/admin/launch/warming/status');
      if (res.ok) {
        const d = await res.json();
        setWarming(d.data ?? d);
      }
    } catch {
      // silent — warming card just won't show data
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const res = await adminFetch('/admin/launch/campaigns');
      if (res.ok) {
        const d = await res.json();
        setCampaigns(d.data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  useEffect(() => {
    loadWarming();
    loadCampaigns();
  }, [loadWarming, loadCampaigns]);

  // ── launch handler ───────────────────────────────────────────────────────────

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
          maxResults: maxProspects,
          minRating,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        toast.success(
          data.data?.message ?? `Campaign launched for ${city} — pipeline starting`
        );
        setCity('');
        await loadCampaigns();
      } else {
        toast.error(data.error ?? data.message ?? 'Launch failed');
      }
    } catch {
      toast.error('Network error — launch failed');
    } finally {
      setLaunching(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>
            Campaigns
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            One-click full pipeline: scrape businesses, score them, build preview sites, send personalised emails
          </p>
        </div>

        {/* Warming status mini-card */}
        {warming && (
          <div
            style={{
              ...S.card,
              padding: '10px 16px',
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Warming Day
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                {warming.warmingDay}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Sent Today
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                {warming.sentToday}
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>
                  /{warming.currentLimit}
                </span>
              </div>
            </div>
            <div>
              <span style={S.badge(warming.initialized ? '#10b981' : '#6b7280')}>
                {warming.initialized ? 'Warmed' : 'Not initialized'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pipeline diagram */}
      <div
        style={{
          ...S.card,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          flexWrap: 'wrap',
          padding: '14px 20px',
        }}
      >
        {[
          { step: '1', label: 'SCRAPER', desc: 'Finds businesses', color: '#6366f1' },
          { step: '2', label: 'ANALYZER', desc: 'Scores leads', color: '#8b5cf6' },
          { step: '3', label: 'BUILDER', desc: 'Builds preview site', color: '#ec4899' },
          { step: '4', label: 'OUTREACH', desc: 'Sends email', color: '#f59e0b' },
          { step: '5', label: 'QA', desc: 'Quality check', color: '#10b981' },
        ].map((s, i) => (
          <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: `${s.color}22`,
                  border: `1px solid ${s.color}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: s.color,
                  flexShrink: 0,
                }}
              >
                {s.step}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>{s.desc}</div>
              </div>
            </div>
            {i < 4 && (
              <div style={{ color: '#374151', fontSize: '16px', padding: '0 2px' }}>›</div>
            )}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#4b5563', fontStyle: 'italic' }}>
          Auto-chained by orchestrator
        </div>
      </div>

      {/* Campaign launcher card */}
      <div style={{ ...S.card, marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'rgba(99,102,241,.15)',
              border: '1px solid rgba(99,102,241,.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            &#9654;
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
              Launch Campaign
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '1px' }}>
              Fill in the target details and hit Launch — the full pipeline runs automatically
            </div>
          </div>
        </div>

        {/* Row 1: City + Country */}
        <div style={{ ...S.grid2, marginBottom: '12px' }}>
          <div>
            <label style={S.label}>City *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. München"
              style={S.input}
              onKeyDown={(e) => e.key === 'Enter' && handleLaunch()}
            />
          </div>
          <div>
            <label style={S.label}>Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={S.select}
            >
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Sector + Max prospects + Min rating */}
        <div style={{ ...S.grid3, marginBottom: '20px' }}>
          <div>
            <label style={S.label}>Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              style={S.select}
            >
              {SECTORS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={S.label}>Max prospects</label>
            <input
              type="number"
              value={maxProspects}
              min={1}
              max={5000}
              onChange={(e) => setMaxProspects(Number(e.target.value))}
              style={S.input}
            />
          </div>
          <div>
            <label style={S.label}>Min Google rating</label>
            <input
              type="number"
              value={minRating}
              min={1}
              max={5}
              step={0.1}
              onChange={(e) => setMinRating(Number(e.target.value))}
              style={S.input}
            />
          </div>
        </div>

        {/* Launch button */}
        <button
          onClick={handleLaunch}
          disabled={launching}
          style={{
            ...S.launchBtn,
            ...(launching ? S.launchBtnDisabled : {}),
          }}
        >
          {launching ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                  display: 'inline-block',
                }}
              />
              Launching pipeline...
            </span>
          ) : (
            `Launch Campaign — ${city ? `${city}, ${country}` : 'Enter a city above'}`
          )}
        </button>
      </div>

      {/* Active campaigns */}
      <div>
        <div style={S.sectionTitle}>Active Campaigns</div>

        {loadingCampaigns ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: '64px',
                  borderRadius: '8px',
                  backgroundColor: '#111',
                  border: '1px solid rgba(255,255,255,.04)',
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div
            style={{
              ...S.card,
              textAlign: 'center',
              padding: '2.5rem 1rem',
              color: '#4b5563',
              fontSize: '13px',
            }}
          >
            No campaigns yet. Launch your first one above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {campaigns.map((c) => (
              <CampaignRow key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Campaign row ─────────────────────────────────────────────────────────────

function CampaignRow({ campaign: c }: { campaign: ActiveCampaign }) {
  const cities = c.cities?.join(', ') ?? (c.countries ?? []).join(', ');
  const hasJobs = c.activeJobs > 0;

  return (
    <div
      style={{
        ...S.card,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '14px 18px',
        flexWrap: 'wrap',
      }}
    >
      {/* Status dot */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: hasJobs ? '#10b981' : c.isActive ? '#6366f1' : '#374151',
          boxShadow: hasJobs ? '0 0 6px #10b981' : 'none',
          flexShrink: 0,
        }}
      />

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: '160px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
          {c.name}
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280' }}>
          {cities} &middot; {c.sector}
        </div>
      </div>

      {/* Pipeline progress */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Stat label="Scraped" value={c.prospectsFound} color="#6366f1" />
        <PipelineArrow />
        <Stat label="Analyzed" value={c.analyzed ?? 0} color="#8b5cf6" />
        <PipelineArrow />
        <Stat label="Sites built" value={c.sitesBuilt ?? 0} color="#ec4899" />
        <PipelineArrow />
        <Stat label="Emails sent" value={c.emailsSent ?? 0} color="#f59e0b" />
        <div style={{ borderLeft: '1px solid rgba(255,255,255,.06)', paddingLeft: '16px', marginLeft: '4px' }}>
          <Stat label="Active jobs" value={c.activeJobs} highlight={hasJobs} />
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Last run</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            {c.lastRunAt ? new Date(c.lastRunAt).toLocaleDateString() : '—'}
          </div>
        </div>
      </div>

      {/* Badge */}
      <span style={S.badge(hasJobs ? '#10b981' : c.isActive ? '#6366f1' : '#6b7280')}>
        {hasJobs ? 'Running' : c.isActive ? 'Active' : 'Idle'}
      </span>
    </div>
  );
}

function PipelineArrow() {
  return (
    <div style={{ color: '#374151', fontSize: '14px', lineHeight: 1 }}>
      ›
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
  color,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>{label}</div>
      <div
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: color ?? (highlight ? '#10b981' : '#fff'),
        }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}
