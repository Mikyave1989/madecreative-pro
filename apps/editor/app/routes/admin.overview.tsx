import { useState, useEffect, useCallback } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { API_URL } from '~/lib/api/client';

export const meta: MetaFunction = () => [{ title: 'Overview — Admin' }];

// ─── types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  pipeline: {
    scraped: number;
    analyzed: number;
    highScore: number;
    avgLeadScore: number;
    previewsBuilt: number;
    emailQueued: number;
    contacted: number;
    followedUp: number;
    replied: number;
    converted: number;
    lost: number;
    total: number;
  };
  emails: {
    totalSent: number;
    sentToday: number;
    sent7d: number;
    sent30d: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
    bounceRate: number;
  };
  previews: {
    built: number;
    viewed: number;
    viewRate: number;
  };
  agents: {
    active: number;
    failed30d: number;
    breakdown: Record<string, Record<string, number>>;
  };
  business: {
    totalClients: number;
    activeClients: number;
    newClientsMonth: number;
    monthlyRevenue: number;
    mrr: number;
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function adminFetch(path: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mc_admin_token') : null;
  return fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

function fmt(n: number | undefined | null): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

// ─── sub-components ───────────────────────────────────────────────────────────

function BigStat({ label, value, sub, color = '#fff', icon }: {
  label: string; value: string; sub?: string; color?: string; icon?: string;
}) {
  return (
    <div style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,.06)', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
        {icon && <span style={{ fontSize: '16px', opacity: 0.4 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>{sub}</div>}
    </div>
  );
}

function PipelineStep({ label, value, total, color, arrow = true }: {
  label: string; value: number; total: number; color: string; arrow?: boolean;
}) {
  const pct = total > 0 ? (value / total * 100).toFixed(1) : '0';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
      <div style={{ textAlign: 'center', minWidth: '80px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color }}>{fmt(value)}</div>
        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{label}</div>
        <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '1px' }}>{pct}%</div>
      </div>
      {arrow && <div style={{ color: '#374151', fontSize: '20px', margin: '0 4px' }}>→</div>}
    </div>
  );
}

function EmailRate({ label, value, rate, color }: {
  label: string; value: number; rate: number; color: string;
}) {
  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: '80px' }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color }}>{fmt(value)}</div>
      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{label}</div>
      <div style={{
        display: 'inline-block', marginTop: '4px', padding: '1px 8px', borderRadius: '999px',
        fontSize: '10px', fontWeight: 600, backgroundColor: `${color}20`, color, border: `1px solid ${color}40`,
      }}>{rate}%</div>
    </div>
  );
}

function AgentRow({ type, data }: { type: string; data: Record<string, number> }) {
  const completed = data['COMPLETED'] ?? 0;
  const running = data['RUNNING'] ?? 0;
  const queued = data['QUEUED'] ?? 0;
  const failed = data['FAILED'] ?? 0;
  const total = completed + running + queued + failed;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
      <div style={{ width: '90px', fontSize: '12px', fontWeight: 600, color: '#fff' }}>{type}</div>
      <div style={{ flex: 1, height: '6px', backgroundColor: '#1a1a1a', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
        {total > 0 && <>
          <div style={{ width: `${completed / total * 100}%`, backgroundColor: '#10b981', height: '100%' }} />
          <div style={{ width: `${running / total * 100}%`, backgroundColor: '#6366f1', height: '100%' }} />
          <div style={{ width: `${queued / total * 100}%`, backgroundColor: '#f59e0b', height: '100%' }} />
          <div style={{ width: `${failed / total * 100}%`, backgroundColor: '#ef4444', height: '100%' }} />
        </>}
      </div>
      <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
        <span style={{ color: '#10b981' }}>{completed}</span>
        <span style={{ color: '#6366f1' }}>{running}</span>
        <span style={{ color: '#f59e0b' }}>{queued}</span>
        <span style={{ color: '#ef4444' }}>{failed}</span>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function AdminOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/admin/metrics/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json.data ?? json);
      }
      setLastRefresh(new Date());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const p = data?.pipeline ?? { scraped: 0, analyzed: 0, highScore: 0, avgLeadScore: 0, previewsBuilt: 0, emailQueued: 0, contacted: 0, followedUp: 0, replied: 0, converted: 0, lost: 0, total: 0 };
  const e = data?.emails ?? { totalSent: 0, sentToday: 0, sent7d: 0, sent30d: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, openRate: 0, clickRate: 0, replyRate: 0, bounceRate: 0 };
  const pr = data?.previews ?? { built: 0, viewed: 0, viewRate: 0 };
  const ag = data?.agents ?? { active: 0, failed30d: 0, breakdown: {} };
  const biz = data?.business ?? { totalClients: 0, activeClients: 0, newClientsMonth: 0, monthlyRevenue: 0, mrr: 0 };

  const S = {
    page: { backgroundColor: '#0a0a0a', minHeight: '100vh', padding: '2rem 2.5rem', fontFamily: 'inherit' } as React.CSSProperties,
    card: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,.06)', borderRadius: '12px', padding: '20px' } as React.CSSProperties,
    sectionTitle: { fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: '14px' },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' } as React.CSSProperties,
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' } as React.CSSProperties,
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' } as React.CSSProperties,
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()} — auto-refresh 30s` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.1)', color: '#9ca3af', fontSize: '13px', cursor: 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* ── Row 1: Key numbers ── */}
      <div style={{ ...S.grid4, marginBottom: '20px' }}>
        <BigStat label="Total Prospects" value={fmt(p.total)} icon="🔍" sub={`${fmt(p.scraped)} scraped this run`} />
        <BigStat label="Previews Built" value={fmt(pr.built)} icon="🏗️" color="#8b5cf6" sub={`${fmt(pr.viewed)} viewed (${pr.viewRate}%)`} />
        <BigStat label="Emails Sent" value={fmt(e.totalSent)} icon="📧" color="#f59e0b" sub={`${fmt(e.sentToday)} today · ${fmt(e.sent7d)} last 7d`} />
        <BigStat label="Converted" value={fmt(p.converted)} icon="💰" color="#10b981" sub={`MRR: €${fmt(biz.mrr)}`} />
      </div>

      {/* ── Row 2: Full Pipeline Flow ── */}
      <div style={{ ...S.card, marginBottom: '20px' }}>
        <div style={S.sectionTitle}>Pipeline Flow</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '4px', padding: '10px 0' }}>
          <PipelineStep label="Scraped" value={p.scraped} total={p.total} color="#6366f1" />
          <PipelineStep label="Analyzed" value={p.analyzed} total={p.total} color="#8b5cf6" />
          <PipelineStep label="High Score" value={p.highScore} total={p.total} color="#a855f7" />
          <PipelineStep label="Previews Built" value={pr.built} total={p.total} color="#ec4899" />
          <PipelineStep label="Contacted" value={p.contacted} total={p.total} color="#f59e0b" />
          <PipelineStep label="Replied" value={p.replied} total={p.total} color="#f97316" />
          <PipelineStep label="Converted" value={p.converted} total={p.total} color="#10b981" arrow={false} />
        </div>
        {p.total > 0 && (
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,.04)', fontSize: '11px', color: '#6b7280' }}>
            <span>Avg Lead Score: <strong style={{ color: '#fff' }}>{p.avgLeadScore}</strong></span>
            <span>Contact Rate: <strong style={{ color: '#f59e0b' }}>{p.total > 0 ? (p.contacted / p.total * 100).toFixed(1) : 0}%</strong></span>
            <span>Reply Rate: <strong style={{ color: '#f97316' }}>{p.contacted > 0 ? (p.replied / p.contacted * 100).toFixed(1) : 0}%</strong></span>
            <span>Close Rate: <strong style={{ color: '#10b981' }}>{p.replied > 0 ? (p.converted / p.replied * 100).toFixed(1) : 0}%</strong></span>
            <span>Lost: <strong style={{ color: '#ef4444' }}>{fmt(p.lost)}</strong></span>
          </div>
        )}
      </div>

      {/* ── Row 3: Email Performance + Preview Stats ── */}
      <div style={{ ...S.grid2, marginBottom: '20px' }}>
        {/* Email performance */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Email Performance</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <EmailRate label="Sent" value={e.totalSent} rate={100} color="#6366f1" />
            <EmailRate label="Opened" value={e.opened} rate={e.openRate} color="#10b981" />
            <EmailRate label="Clicked" value={e.clicked} rate={e.clickRate} color="#8b5cf6" />
            <EmailRate label="Replied" value={e.replied} rate={e.replyRate} color="#f59e0b" />
            <EmailRate label="Bounced" value={e.bounced} rate={e.bounceRate} color="#ef4444" />
          </div>
          <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,.04)', fontSize: '11px', color: '#6b7280' }}>
            <span>Today: <strong style={{ color: '#fff' }}>{e.sentToday}</strong></span>
            <span>7 days: <strong style={{ color: '#fff' }}>{e.sent7d}</strong></span>
            <span>30 days: <strong style={{ color: '#fff' }}>{e.sent30d}</strong></span>
          </div>
        </div>

        {/* Preview sites */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Preview Sites</div>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#8b5cf6' }}>{fmt(pr.built)}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Sites Built</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>{fmt(pr.viewed)}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Viewed by Prospects</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>{pr.viewRate}%</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>View Rate</div>
            </div>
          </div>
          {pr.built > 0 && (
            <div style={{ height: '8px', backgroundColor: '#1a1a1a', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pr.viewRate}%`, backgroundColor: '#10b981', borderRadius: '4px', transition: 'width .5s' }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Agent Jobs + Business ── */}
      <div style={{ ...S.grid2, marginBottom: '20px' }}>
        {/* Agent jobs */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={S.sectionTitle}>Agent Jobs</div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '10px' }}>
              <span style={{ color: '#10b981' }}>● Done</span>
              <span style={{ color: '#6366f1' }}>● Running</span>
              <span style={{ color: '#f59e0b' }}>● Queued</span>
              <span style={{ color: '#ef4444' }}>● Failed</span>
            </div>
          </div>
          {['SCRAPER', 'ANALYZER', 'BUILDER', 'OUTREACH', 'QA'].map(type => (
            <AgentRow key={type} type={type} data={ag.breakdown[type] ?? {}} />
          ))}
          <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', fontSize: '11px', color: '#6b7280' }}>
            <span>Active now: <strong style={{ color: '#6366f1' }}>{ag.active}</strong></span>
            <span>Failed (30d): <strong style={{ color: '#ef4444' }}>{ag.failed30d}</strong></span>
          </div>
        </div>

        {/* Business */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Business</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>MRR</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>€{fmt(biz.mrr)}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>Revenue (Month)</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>€{fmt(biz.monthlyRevenue)}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>Total Clients</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>{fmt(biz.totalClients)}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>{fmt(biz.activeClients)} active</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>New This Month</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#6366f1' }}>{fmt(biz.newClientsMonth)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
