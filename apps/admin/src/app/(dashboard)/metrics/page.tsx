"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  TrendingUp,
  Bot,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getMetrics, getRevenueChart, getProspectsFunnel } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardMetrics, RevenueChartEntry, FunnelEntry } from "@/lib/api";

// ─── Counter animation hook ────────────────────────────────────

function useCounter(target: number, duration = 1000): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frame.current = requestAnimationFrame(animate);
      }
    };
    frame.current = requestAnimationFrame(animate);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}

// ─── KPI Card ──────────────────────────────────────────────────

type NeonColor = "cyan" | "violet" | "amber" | "green";

interface KpiCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  sub: string;
  icon: React.ElementType;
  color: NeonColor;
  loading?: boolean;
  delay?: number;
}

const COLOR_MAP: Record<NeonColor, { text: string; border: string; icon: string }> = {
  cyan: {
    text: "text-neon-cyan",
    border: "border-neon-cyan/30 hover:border-neon-cyan/60",
    icon: "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan",
  },
  violet: {
    text: "text-neon-violet",
    border: "border-neon-violet/30 hover:border-neon-violet/60",
    icon: "bg-neon-violet/10 border-neon-violet/30 text-neon-violet",
  },
  amber: {
    text: "text-neon-amber",
    border: "border-neon-amber/30 hover:border-neon-amber/60",
    icon: "bg-neon-amber/10 border-neon-amber/30 text-neon-amber",
  },
  green: {
    text: "text-neon-green",
    border: "border-neon-green/30 hover:border-neon-green/60",
    icon: "bg-neon-green/10 border-neon-green/30 text-neon-green",
  },
};

function KpiCard({
  label,
  value,
  prefix = "",
  suffix = "",
  sub,
  icon: Icon,
  color,
  loading = false,
  delay = 0,
}: KpiCardProps) {
  const count = useCounter(loading ? 0 : value);
  const c = COLOR_MAP[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={cn(
        "rounded-lg border bg-bg-card p-5 transition-all duration-300",
        c.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-500 mb-3">
            {label}
          </p>
          {loading ? (
            <div className="h-9 flex items-center">
              <Spinner size="md" />
            </div>
          ) : (
            <p
              className={cn("font-orbitron text-3xl font-bold", c.text)}
              style={{ textShadow: color === "cyan" ? "0 0 12px #00f0ff60" : undefined }}
            >
              {prefix}
              {count.toLocaleString("it-IT")}
              {suffix}
            </p>
          )}
          <p className="mt-2 font-mono-tech text-[10px] text-slate-600">{sub}</p>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded border",
            c.icon
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Revenue Bar Chart (div-based) ────────────────────────────

function RevenueChart({
  data,
  loading,
}: {
  data: RevenueChartEntry[];
  loading: boolean;
}) {
  const max = data.length > 0 ? Math.max(...data.map((d) => d.revenue), 1) : 1;

  return (
    <Card neon="subtle">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <span className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600">
          {data.length > 0
            ? `${data.length} months`
            : ""}
        </span>
      </CardHeader>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size="md" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="font-mono-tech text-xs text-slate-600">No revenue data</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Bars */}
          <div className="flex items-end gap-1.5 h-36">
            {data.map((entry, i) => {
              const heightPct = (entry.revenue / max) * 100;
              return (
                <div
                  key={entry.month}
                  className="group relative flex flex-1 flex-col items-center gap-1"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                    <div className="rounded border border-neon-cyan/30 bg-bg-card px-2 py-1 text-center">
                      <p className="font-mono-tech text-[9px] text-neon-cyan whitespace-nowrap">
                        {formatCurrency(entry.revenue)}
                      </p>
                      <p className="font-mono-tech text-[9px] text-slate-500">
                        {entry.clients} clients
                      </p>
                    </div>
                    <span className="h-1.5 w-1.5 rotate-45 border-b border-r border-neon-cyan/30 bg-bg-card" />
                  </div>

                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPct, 4)}%` }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.6, ease: "easeOut" }}
                    className="w-full rounded-sm cursor-default"
                    style={{
                      background: `linear-gradient(to top, #00f0ff20, #00f0ff)`,
                      boxShadow: "0 0 6px #00f0ff40",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-1.5">
            {data.map((entry) => (
              <div key={entry.month} className="flex-1 text-center">
                <span className="font-mono-tech text-[9px] text-slate-600">
                  {entry.month.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Prospects Funnel ──────────────────────────────────────────

const FUNNEL_COLORS: Record<string, string> = {
  SCRAPED:       "#64748b",
  QUALIFIED:     "#a855f7",
  PREVIEW_READY: "#00f0ff",
  CONTACTED:     "#f59e0b",
  FOLLOWED_UP:   "#3b82f6",
  REPLIED:       "#10b981",
  CONVERTED:     "#22c55e",
  LOST:          "#ef4444",
  BLACKLISTED:   "#dc2626",
};

function ProspectFunnel({
  data,
  loading,
}: {
  data: FunnelEntry[];
  loading: boolean;
}) {
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count), 1) : 1;
  const totalScraped = data.find((d) => d.status === "SCRAPED")?.count ?? maxCount;

  return (
    <Card neon="subtle">
      <CardHeader>
        <CardTitle>Prospects Funnel</CardTitle>
        <span className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600">
          {data.length > 0 ? `${data.reduce((s, d) => s + d.count, 0)} total` : ""}
        </span>
      </CardHeader>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size="md" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="font-mono-tech text-xs text-slate-600">No funnel data</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((entry, i) => {
            const color = FUNNEL_COLORS[entry.status] ?? "#64748b";
            const widthPct = Math.max((entry.count / maxCount) * 100, 2);
            const convPct = totalScraped > 0
              ? ((entry.count / totalScraped) * 100).toFixed(1)
              : "0.0";

            return (
              <motion.div
                key={entry.status}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 + 0.2 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="font-mono-tech text-[10px] uppercase tracking-wider"
                    style={{ color }}
                  >
                    {entry.status.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono-tech text-[10px] text-slate-500">
                    {entry.count.toLocaleString("it-IT")}{" "}
                    <span className="text-slate-700">({convPct}%)</span>
                  </span>
                </div>
                <div className="h-5 w-full rounded-sm bg-bg-elevated overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.7, delay: i * 0.06 + 0.3, ease: "easeOut" }}
                    className="h-full rounded-sm"
                    style={{
                      background: `linear-gradient(90deg, ${color}30, ${color})`,
                      boxShadow: `0 0 8px ${color}40`,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Agent Status Mini-cards ───────────────────────────────────

function AgentStatusRow({
  metrics,
  loading,
}: {
  metrics: DashboardMetrics | null;
  loading: boolean;
}) {
  const stats = [
    { label: "Queued",    value: metrics?.agents.queued    ?? 0, color: "text-slate-400" },
    { label: "Running",   value: metrics?.agents.running   ?? 0, color: "text-neon-cyan" },
    { label: "Completed", value: metrics?.agents.completed ?? 0, color: "text-neon-green" },
    { label: "Failed",    value: metrics?.agents.failed    ?? 0, color: "text-neon-red" },
  ];

  return (
    <Card neon="subtle">
      <CardHeader>
        <CardTitle>Agent Jobs</CardTitle>
        <Bot className="h-4 w-4 text-neon-amber" />
      </CardHeader>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            {loading ? (
              <div className="mx-auto h-6 w-12 animate-pulse rounded bg-bg-elevated" />
            ) : (
              <p className={cn("font-orbitron text-xl font-bold", s.color)}>
                {s.value}
              </p>
            )}
            <p className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600 mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Error Banner ──────────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mb-4 rounded border border-neon-red/30 bg-neon-red/5 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-neon-red shrink-0" />
        <p className="font-mono-tech text-xs text-neon-red">{message}</p>
      </div>
      <Button color="red" variant="ghost" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueChartEntry[]>([]);
  const [funnel, setFunnel] = useState<FunnelEntry[]>([]);

  const [metricsLoading, setMetricsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [funnelLoading, setFunnelLoading] = useState(true);

  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [funnelError, setFunnelError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const data = await getMetrics();
      setMetrics(data);
    } catch (err) {
      setMetricsError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const loadChart = useCallback(async () => {
    setChartLoading(true);
    setChartError(null);
    try {
      const data = await getRevenueChart();
      setRevenueChart(data);
    } catch (err) {
      setChartError(err instanceof Error ? err.message : "Failed to load revenue chart");
    } finally {
      setChartLoading(false);
    }
  }, []);

  const loadFunnel = useCallback(async () => {
    setFunnelLoading(true);
    setFunnelError(null);
    try {
      const data = await getProspectsFunnel();
      setFunnel(data);
    } catch (err) {
      setFunnelError(err instanceof Error ? err.message : "Failed to load funnel");
    } finally {
      setFunnelLoading(false);
    }
  }, []);

  const loadAll = useCallback(() => {
    loadMetrics();
    loadChart();
    loadFunnel();
  }, [loadMetrics, loadChart, loadFunnel]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const anyLoading = metricsLoading || chartLoading || funnelLoading;

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1
            className="font-orbitron text-lg sm:text-xl md:text-2xl font-bold text-neon-blue"
            style={{ textShadow: "0 0 12px #3b82f640" }}
          >
            Metrics
          </h1>
          <p className="mt-1 font-mono-tech text-xs text-slate-500">
            Platform analytics — revenue, growth, conversion
          </p>
        </div>
        <Button
          color="cyan"
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={cn("h-3 w-3", anyLoading && "animate-spin")} />}
          onClick={loadAll}
          disabled={anyLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Error banners */}
      {metricsError && <ErrorBanner message={metricsError} onRetry={loadMetrics} />}

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <KpiCard
          label="Total Clients"
          value={metrics?.clients.total ?? 0}
          sub={`${metrics?.clients.active ?? 0} active`}
          icon={Users}
          color="cyan"
          loading={metricsLoading}
          delay={0}
        />
        <KpiCard
          label="MRR"
          prefix="€"
          value={metrics?.revenue.mrr ?? 0}
          sub={`Monthly rev: €${(metrics?.revenue.monthlyRevenue ?? 0).toLocaleString("it-IT")}`}
          icon={DollarSign}
          color="green"
          loading={metricsLoading}
          delay={0.08}
        />
        <KpiCard
          label="Conversion Rate"
          value={
            metrics?.prospects.conversionRate != null
              ? Math.round(metrics.prospects.conversionRate * 10) / 10
              : 0
          }
          suffix="%"
          sub={`${metrics?.prospects.converted ?? 0} converted`}
          icon={TrendingUp}
          color="violet"
          loading={metricsLoading}
          delay={0.16}
        />
        <KpiCard
          label="Agent Jobs"
          value={(metrics?.agents.queued ?? 0) + (metrics?.agents.running ?? 0)}
          sub={`${metrics?.agents.completed ?? 0} completed, ${metrics?.agents.failed ?? 0} failed`}
          icon={Bot}
          color="amber"
          loading={metricsLoading}
          delay={0.24}
        />
      </div>

      {/* Growth sub-row */}
      {!metricsLoading && metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card neon="subtle" className="flex items-center gap-4">
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-1">
                New This Month
              </p>
              <p className="font-orbitron text-2xl font-bold text-neon-cyan">
                {metrics.clients.newThisMonth}
              </p>
            </div>
            <div className="border-l border-border-subtle pl-4">
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-1">
                Growth
              </p>
              <p
                className={cn(
                  "font-orbitron text-lg font-bold",
                  metrics.clients.growth >= 0 ? "text-neon-green" : "text-neon-red"
                )}
              >
                {metrics.clients.growth >= 0 ? "+" : ""}
                {metrics.clients.growth.toFixed(1)}%
              </p>
            </div>
          </Card>

          <Card neon="subtle">
            <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-1">
              Prospects This Month
            </p>
            <p className="font-orbitron text-2xl font-bold text-neon-violet">
              {metrics.prospects.newThisMonth}
            </p>
            <p className="font-mono-tech text-[10px] text-slate-600 mt-1">
              Total: {metrics.prospects.total.toLocaleString("it-IT")}
            </p>
          </Card>

          <Card neon="subtle">
            <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mb-1">
              Clients Last Month
            </p>
            <p className="font-orbitron text-2xl font-bold text-slate-300">
              {metrics.clients.newLastMonth}
            </p>
            <p className="font-mono-tech text-[10px] text-slate-600 mt-1">
              vs {metrics.clients.newThisMonth} this month
            </p>
          </Card>
        </div>
      )}

      {/* Chart + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {chartError ? (
          <div className="rounded border border-neon-red/20 bg-bg-card p-4 flex items-center justify-between">
            <p className="font-mono-tech text-xs text-neon-red">{chartError}</p>
            <Button color="red" variant="ghost" size="sm" onClick={loadChart}>Retry</Button>
          </div>
        ) : (
          <RevenueChart data={revenueChart} loading={chartLoading} />
        )}

        {funnelError ? (
          <div className="rounded border border-neon-red/20 bg-bg-card p-4 flex items-center justify-between">
            <p className="font-mono-tech text-xs text-neon-red">{funnelError}</p>
            <Button color="red" variant="ghost" size="sm" onClick={loadFunnel}>Retry</Button>
          </div>
        ) : (
          <ProspectFunnel data={funnel} loading={funnelLoading} />
        )}
      </div>

      {/* Agent status */}
      <AgentStatusRow metrics={metrics} loading={metricsLoading} />
    </PageWrapper>
  );
}
