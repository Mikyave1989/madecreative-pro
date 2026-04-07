"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  Bot,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { MOCK_METRICS, MOCK_RECENT_JOBS } from "@/lib/mockData";
import { formatCurrency, timeAgo } from "@/lib/utils";
import type { AgentType, JobStatus, ProspectStatus } from "@/lib/api";

// ─── Counter Animation ─────────────────────────────────────────

function useCounter(target: number, duration = 1200): number {
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
  subLabel: string;
  subValue: string;
  icon: React.ElementType;
  color: NeonColor;
  loading?: boolean;
  delay?: number;
}

function KpiCard({
  label,
  value,
  prefix = "",
  suffix = "",
  subLabel,
  subValue,
  icon: Icon,
  color,
  loading = false,
  delay = 0,
}: KpiCardProps) {
  const count = useCounter(value);

  const colorMap: Record<NeonColor, { text: string; border: string; icon: string }> = {
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

  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={`rounded-lg border bg-bg-card p-5 transition-all duration-300 ${c.border}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-500 mb-3">
            {label}
          </p>
          {loading ? (
            <Spinner size="md" />
          ) : (
            <p className={`font-orbitron text-3xl font-bold ${c.text}`}
              style={{ textShadow: color === "cyan" ? "0 0 12px #00f0ff60" : undefined }}>
              {prefix}{count.toLocaleString("it-IT")}{suffix}
            </p>
          )}
          <p className="mt-2 font-mono-tech text-[10px] text-slate-600">
            <span className="text-slate-500">{subLabel}</span>{" "}
            <span className={c.text}>{subValue}</span>
          </p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded border ${c.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Pipeline Funnel ───────────────────────────────────────────

const PIPELINE_STAGES: { key: ProspectStatus; label: string; color: string }[] = [
  { key: "SCRAPED", label: "Scraped", color: "#64748b" },
  { key: "ANALYZING", label: "Analyzing", color: "#3b82f6" },
  { key: "QUALIFIED", label: "Qualified", color: "#a855f7" },
  { key: "CONTACTED", label: "Contacted", color: "#f59e0b" },
  { key: "REPLIED", label: "Replied", color: "#10b981" },
  { key: "CONVERTED", label: "Converted", color: "#00f0ff" },
];

function PipelineFunnel({ pipeline }: { pipeline: Record<ProspectStatus, number> }) {
  const maxCount = PIPELINE_STAGES.reduce(
    (max, s) => Math.max(max, pipeline[s.key] ?? 0),
    1
  );

  return (
    <Card neon="subtle" className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Prospect Pipeline</CardTitle>
        <span className="font-mono-tech text-[9px] text-slate-600 uppercase tracking-widest">
          Funnel
        </span>
      </CardHeader>
      <div className="space-y-3">
        {PIPELINE_STAGES.map((stage, i) => {
          const count = pipeline[stage.key] ?? 0;
          const widthPct = Math.max((count / maxCount) * 100, 4);
          const total = pipeline.SCRAPED ?? 1;
          const pct = ((count / total) * 100).toFixed(1);

          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 + 0.3 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="font-mono-tech text-[10px] uppercase tracking-wider"
                  style={{ color: stage.color }}
                >
                  {stage.label}
                </span>
                <span className="font-mono-tech text-[10px] text-slate-500">
                  {count} <span className="text-slate-700">({pct}%)</span>
                </span>
              </div>
              <div className="h-5 w-full rounded-sm bg-bg-elevated overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.07 + 0.4, ease: "easeOut" }}
                  className="h-full rounded-sm"
                  style={{
                    background: `linear-gradient(90deg, ${stage.color}30, ${stage.color})`,
                    boxShadow: `0 0 8px ${stage.color}40`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Agent Color Map ───────────────────────────────────────────

const AGENT_COLOR: Record<AgentType, { color: string; name: "cyan" | "violet" | "amber" | "green" | "blue" | "red" | "pink" }> = {
  SCRAPER:  { color: "#00f0ff", name: "cyan" },
  ANALYZER: { color: "#a855f7", name: "violet" },
  BUILDER:  { color: "#f59e0b", name: "amber" },
  OUTREACH: { color: "#10b981", name: "green" },
  CHATBOT:  { color: "#3b82f6", name: "blue" },
  QA:       { color: "#ef4444", name: "red" },
  SOCIAL:   { color: "#ec4899", name: "pink" },
};

const JOB_STATUS_COLOR: Record<JobStatus, "cyan" | "violet" | "amber" | "green" | "blue" | "red" | "pink" | "gray"> = {
  QUEUED:    "gray",
  RUNNING:   "cyan",
  COMPLETED: "green",
  FAILED:    "red",
  CANCELLED: "gray",
};

// ─── Live Agent Feed ───────────────────────────────────────────

function LiveAgentFeed() {
  const [jobs, setJobs] = useState(MOCK_RECENT_JOBS);

  // Simulate auto-refresh every 5s
  useEffect(() => {
    const id = setInterval(() => {
      setJobs((prev) => {
        // Shuffle slightly to simulate live updates
        return [...prev].sort(() => Math.random() - 0.5).slice(0, 10);
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card neon="subtle" className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Live Agent Feed</CardTitle>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
          <span className="font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan/60">
            Live
          </span>
        </div>
      </CardHeader>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {jobs.map((job, i) => {
          const agent = AGENT_COLOR[job.agentType];
          const statusColor = JOB_STATUS_COLOR[job.status];

          return (
            <motion.div
              key={`${job.id}-${i}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 rounded border border-border-subtle/50 bg-bg-elevated/40 px-3 py-2"
            >
              {/* Agent type pill */}
              <span
                className="shrink-0 rounded border px-1.5 py-0.5 font-mono-tech text-[9px] uppercase"
                style={{
                  color: agent.color,
                  borderColor: `${agent.color}40`,
                  backgroundColor: `${agent.color}10`,
                }}
              >
                {job.agentType.slice(0, 3)}
              </span>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="truncate font-mono-tech text-[10px] text-slate-400">
                  {job.prospectName ?? job.clientName ?? "System"}
                </p>
                <p className="font-mono-tech text-[9px] text-slate-700">
                  {timeAgo(job.updatedAt)}
                </p>
              </div>

              {/* Status */}
              <Badge color={statusColor} size="sm">
                {job.status}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const metrics = MOCK_METRICS;

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="font-orbitron text-2xl font-bold text-neon-cyan"
          style={{ textShadow: "0 0 12px #00f0ff40" }}>
          Dashboard
        </h1>
        <p className="mt-1 font-mono-tech text-xs text-slate-500">
          Platform overview — real-time metrics
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <KpiCard
          label="Total Clients"
          value={metrics.totalClients}
          subLabel="MRR"
          subValue={formatCurrency(metrics.mrr)}
          icon={Users}
          color="cyan"
          delay={0}
        />
        <KpiCard
          label="Prospects Today"
          value={metrics.prospectsToday}
          subLabel="Trend"
          subValue={`+${metrics.prospectsTrend} vs yesterday`}
          icon={metrics.prospectsTrend >= 0 ? TrendingUp : TrendingDown}
          color="violet"
          delay={0.08}
        />
        <KpiCard
          label="Active Jobs"
          value={metrics.activeJobs}
          subLabel="Status"
          subValue={metrics.activeJobs > 0 ? "Running" : "All Idle"}
          icon={Bot}
          color="amber"
          delay={0.16}
          loading={metrics.activeJobs > 0}
        />
        <KpiCard
          label="Conversion Rate"
          value={Math.round(metrics.conversionRate * 10) / 10}
          suffix="%"
          subLabel="Avg"
          subValue="Last 30 days"
          icon={ArrowUpRight}
          color="green"
          delay={0.24}
        />
      </div>

      {/* Pipeline + Feed */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PipelineFunnel pipeline={metrics.pipeline} />
        </div>
        <div className="lg:col-span-1">
          <LiveAgentFeed />
        </div>
      </div>
    </PageWrapper>
  );
}
