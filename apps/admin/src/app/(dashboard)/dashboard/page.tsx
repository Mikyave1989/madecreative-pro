"use client";

import { useState, useEffect } from "react";
import { Users, Euro, Target, Bot, AlertTriangle, RefreshCw } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  getMetrics,
  getProspectsFunnel,
  getAgentJobs,
} from "@/lib/api";
import { formatCurrency, timeAgo, truncateId } from "@/lib/utils";
import type {
  DashboardMetrics,
  FunnelEntry,
  AgentJob,
  AgentType,
  JobStatus,
} from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────

interface DashboardData {
  metrics: DashboardMetrics;
  funnel: FunnelEntry[];
  recentJobs: AgentJob[];
}

// ─── Skeleton Primitives ───────────────────────────────────────

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-800/60 ${className ?? ""}`}
      style={style}
      aria-hidden="true"
    />
  );
}

// ─── KPI Card ──────────────────────────────────────────────────

type NeonColor = "cyan" | "violet" | "amber" | "green";

interface KpiCardProps {
  label: string;
  value: string;
  subLabel: string;
  subValue: string;
  icon: React.ElementType;
  color: NeonColor;
}

const kpiColorMap: Record<
  NeonColor,
  { text: string; border: string; icon: string }
> = {
  cyan: {
    text: "text-neon-cyan",
    border: "border-neon-cyan/30 hover:border-neon-cyan/60 hover:shadow-neon-cyan",
    icon: "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan",
  },
  violet: {
    text: "text-neon-violet",
    border: "border-neon-violet/30 hover:border-neon-violet/60 hover:shadow-neon-violet",
    icon: "bg-neon-violet/10 border-neon-violet/30 text-neon-violet",
  },
  amber: {
    text: "text-neon-amber",
    border: "border-neon-amber/30 hover:border-neon-amber/60 hover:shadow-neon-amber",
    icon: "bg-neon-amber/10 border-neon-amber/30 text-neon-amber",
  },
  green: {
    text: "text-neon-green",
    border: "border-neon-green/30 hover:border-neon-green/60 hover:shadow-neon-green",
    icon: "bg-neon-green/10 border-neon-green/30 text-neon-green",
  },
};

function KpiCard({ label, value, subLabel, subValue, icon: Icon, color }: KpiCardProps) {
  const c = kpiColorMap[color];
  return (
    <div
      className={`rounded-lg border bg-bg-card p-5 transition-all duration-300 ${c.border}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-500 mb-3">
            {label}
          </p>
          <p
            className={`font-orbitron text-3xl font-bold ${c.text}`}
            style={color === "cyan" ? { textShadow: "0 0 12px #00f0ff60" } : undefined}
          >
            {value}
          </p>
          <p className="mt-2 font-mono-tech text-[10px] text-slate-600">
            <span className="text-slate-500">{subLabel}</span>{" "}
            <span className={c.text}>{subValue}</span>
          </p>
        </div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded border ${c.icon}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <SkeletonBlock className="h-2.5 w-24" />
          <SkeletonBlock className="h-8 w-32" />
          <SkeletonBlock className="h-2 w-28" />
        </div>
        <SkeletonBlock className="h-9 w-9 rounded" />
      </div>
    </div>
  );
}

// ─── Funnel Stage Colors ───────────────────────────────────────

const FUNNEL_COLORS: Record<string, string> = {
  SCRAPED: "#64748b",
  QUALIFIED: "#a855f7",
  PREVIEW_READY: "#00f0ff",
  CONTACTED: "#f59e0b",
  FOLLOWED_UP: "#3b82f6",
  REPLIED: "#10b981",
  CONVERTED: "#22c55e",
  LOST: "#ef4444",
  BLACKLISTED: "#6b7280",
};

function labelForStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Prospect Funnel ───────────────────────────────────────────

function ProspectFunnel({ funnel }: { funnel: FunnelEntry[] }) {
  const maxCount = funnel.reduce((max, e) => Math.max(max, e.count), 1);
  const totalBase = funnel[0]?.count ?? 1;

  return (
    <Card neon="subtle">
      <CardHeader>
        <CardTitle>Prospect Funnel</CardTitle>
        <span className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600">
          All time
        </span>
      </CardHeader>

      {funnel.length === 0 ? (
        <p className="font-mono-tech text-xs text-slate-600 py-4 text-center">
          No funnel data available
        </p>
      ) : (
        <div className="space-y-3">
          {funnel.map((entry) => {
            const color = FUNNEL_COLORS[entry.status] ?? "#64748b";
            const widthPct = Math.max((entry.count / maxCount) * 100, 4);
            const pct = ((entry.count / totalBase) * 100).toFixed(1);

            return (
              <div key={entry.status}>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="font-mono-tech text-[10px] uppercase tracking-wider"
                    style={{ color }}
                  >
                    {labelForStatus(entry.status)}
                  </span>
                  <span className="font-mono-tech text-[10px] text-slate-500">
                    {entry.count.toLocaleString("it-IT")}{" "}
                    <span className="text-slate-700">({pct}%)</span>
                  </span>
                </div>
                <div className="h-5 w-full rounded-sm bg-bg-elevated overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all duration-700"
                    style={{
                      width: `${widthPct}%`,
                      background: `linear-gradient(90deg, ${color}30, ${color})`,
                      boxShadow: `0 0 8px ${color}40`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function FunnelSkeleton() {
  return (
    <Card neon="subtle">
      <CardHeader>
        <CardTitle>Prospect Funnel</CardTitle>
      </CardHeader>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between">
              <SkeletonBlock className="h-2.5 w-20" />
              <SkeletonBlock className="h-2.5 w-12" />
            </div>
            <SkeletonBlock
              className="h-5 rounded-sm"
              style={{ width: `${90 - i * 10}%` } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Agent Color Maps ──────────────────────────────────────────

const AGENT_COLOR: Record<AgentType, string> = {
  SCRAPER: "#00f0ff",
  ANALYZER: "#a855f7",
  BUILDER: "#f59e0b",
  OUTREACH: "#10b981",
  QA: "#ef4444",
};

const JOB_STATUS_BADGE: Record<
  JobStatus,
  "cyan" | "violet" | "amber" | "green" | "red" | "gray"
> = {
  QUEUED: "gray",
  RUNNING: "cyan",
  COMPLETED: "green",
  FAILED: "red",
  CANCELLED: "gray",
};

// ─── Recent Agent Activity ─────────────────────────────────────

function AgentActivity({ jobs }: { jobs: AgentJob[] }) {
  return (
    <Card neon="subtle">
      <CardHeader>
        <CardTitle>Recent Agent Activity</CardTitle>
        <span className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600">
          Last 5 jobs
        </span>
      </CardHeader>

      {jobs.length === 0 ? (
        <p className="font-mono-tech text-xs text-slate-600 py-4 text-center">
          No agent jobs found
        </p>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const agentColor = AGENT_COLOR[job.agentType] ?? "#64748b";
            const statusColor = JOB_STATUS_BADGE[job.status] ?? "gray";
            const refId = job.prospectId ?? job.clientId;

            return (
              <div
                key={job.id}
                className="flex items-center gap-3 rounded border border-border-subtle/50 bg-bg-elevated/40 px-3 py-2"
              >
                {/* Agent type pill */}
                <span
                  className="shrink-0 rounded border px-1.5 py-0.5 font-mono-tech text-[9px] uppercase"
                  style={{
                    color: agentColor,
                    borderColor: `${agentColor}40`,
                    backgroundColor: `${agentColor}10`,
                  }}
                >
                  {job.agentType.slice(0, 3)}
                </span>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-mono-tech text-[10px] text-slate-400">
                    {refId ? truncateId(refId) : truncateId(job.id)}
                  </p>
                  <p className="font-mono-tech text-[9px] text-slate-700">
                    {timeAgo(job.updatedAt)}
                  </p>
                </div>

                {/* Status */}
                <Badge color={statusColor} size="sm">
                  {job.status}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function AgentActivitySkeleton() {
  return (
    <Card neon="subtle">
      <CardHeader>
        <CardTitle>Recent Agent Activity</CardTitle>
      </CardHeader>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded border border-border-subtle/50 bg-bg-elevated/40 px-3 py-2"
          >
            <SkeletonBlock className="h-5 w-8 rounded" />
            <div className="flex-1 space-y-1">
              <SkeletonBlock className="h-2.5 w-24" />
              <SkeletonBlock className="h-2 w-14" />
            </div>
            <SkeletonBlock className="h-5 w-16 rounded" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Error Banner ──────────────────────────────────────────────

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-neon-red/30 bg-neon-red/5 p-4">
      <AlertTriangle className="h-4 w-4 shrink-0 text-neon-red mt-0.5" />
      <div className="flex-1">
        <p className="font-mono-tech text-xs text-neon-red uppercase tracking-wider mb-1">
          Failed to load dashboard data
        </p>
        <p className="font-mono-tech text-[10px] text-slate-500">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded border border-neon-red/30 px-3 py-1 font-mono-tech text-[10px] uppercase tracking-wider text-neon-red hover:border-neon-red/60 hover:bg-neon-red/10 transition-colors"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [metrics, funnel, jobsPage] = await Promise.all([
        getMetrics(),
        getProspectsFunnel(),
        getAgentJobs({ limit: 5 }),
      ]);
      setData({ metrics, funnel, recentJobs: jobsPage.data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6">
        <h1
          className="font-orbitron text-lg sm:text-xl md:text-2xl font-bold text-neon-cyan"
          style={{ textShadow: "0 0 12px #00f0ff40" }}
        >
          Dashboard
        </h1>
        <p className="mt-1 font-mono-tech text-xs text-slate-500">
          Platform overview — live data
        </p>
      </div>

      {/* Error banner */}
      {error && !loading && (
        <div className="mb-6">
          <ErrorBanner message={error} onRetry={fetchAll} />
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {loading || !data ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              label="Total Clients"
              value={data.metrics.clients.total.toLocaleString("it-IT")}
              subLabel="Active"
              subValue={data.metrics.clients.active.toLocaleString("it-IT")}
              icon={Users}
              color="cyan"
            />
            <KpiCard
              label="MRR"
              value={formatCurrency(data.metrics.revenue.mrr)}
              subLabel="This month"
              subValue={formatCurrency(data.metrics.revenue.monthlyRevenue)}
              icon={Euro}
              color="green"
            />
            <KpiCard
              label="Total Prospects"
              value={data.metrics.prospects.total.toLocaleString("it-IT")}
              subLabel="Converted"
              subValue={`${data.metrics.prospects.conversionRate.toFixed(1)}%`}
              icon={Target}
              color="violet"
            />
            <KpiCard
              label="Agent Jobs"
              value={data.metrics.agents.running.toLocaleString("it-IT")}
              subLabel="Completed"
              subValue={data.metrics.agents.completed.toLocaleString("it-IT")}
              icon={Bot}
              color="amber"
            />
          </>
        )}
      </div>

      {/* Funnel + Activity */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading || !data ? (
            <FunnelSkeleton />
          ) : (
            <ProspectFunnel funnel={data.funnel} />
          )}
        </div>
        <div className="lg:col-span-1">
          {loading || !data ? (
            <AgentActivitySkeleton />
          ) : (
            <AgentActivity jobs={data.recentJobs} />
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
