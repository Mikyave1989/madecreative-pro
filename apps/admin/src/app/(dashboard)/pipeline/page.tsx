"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Mail,
  Link2,
  Ban,
  RefreshCw,
  AlertTriangle,
  Check,
  Copy,
  Users,
  ArrowRightLeft,
  Percent,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getPipeline,
  updateProspect,
  generatePaymentLink,
  sendOutreach,
  type PipelineProspect,
  type PipelineData,
} from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PipelineStatus =
  | "PREVIEW_GENERATED"
  | "EMAIL_SENT"
  | "REPLIED"
  | "CALL_SCHEDULED"
  | "CONVERTED"
  | "LOST";

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_COLUMNS: PipelineStatus[] = [
  "PREVIEW_GENERATED",
  "EMAIL_SENT",
  "REPLIED",
  "CALL_SCHEDULED",
  "CONVERTED",
  "LOST",
];

const COLUMN_CONFIG: Record<
  PipelineStatus,
  { label: string; color: string; accentClass: string }
> = {
  PREVIEW_GENERATED: {
    label: "Preview Ready",
    color: "#00f0ff",
    accentClass: "text-neon-cyan",
  },
  EMAIL_SENT: {
    label: "Contacted",
    color: "#a855f7",
    accentClass: "text-neon-violet",
  },
  REPLIED: {
    label: "Replied",
    color: "#f59e0b",
    accentClass: "text-neon-amber",
  },
  CALL_SCHEDULED: {
    label: "Negotiating",
    color: "#3b82f6",
    accentClass: "text-neon-blue",
  },
  CONVERTED: {
    label: "Converted",
    color: "#22c55e",
    accentClass: "text-neon-green",
  },
  LOST: {
    label: "Lost",
    color: "#ef4444",
    accentClass: "text-neon-red",
  },
};

// Score badge color helper
function scoreColor(score: number): "green" | "amber" | "red" {
  if (score >= 70) return "green";
  if (score >= 40) return "amber";
  return "red";
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function ColumnSkeleton() {
  return (
    <div className="flex flex-col min-w-[210px] max-w-[230px] rounded-lg border border-border-subtle bg-bg-sidebar/50 animate-pulse">
      <div className="flex items-center justify-between p-3 border-b border-border-subtle">
        <div className="h-3 w-24 rounded bg-slate-700" />
        <div className="h-5 w-6 rounded bg-slate-700" />
      </div>
      <div className="p-2 space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border-subtle bg-bg-card p-3 space-y-2">
            <div className="h-3 w-3/4 rounded bg-slate-700" />
            <div className="flex gap-1">
              <div className="h-4 w-8 rounded bg-slate-700" />
              <div className="h-4 w-12 rounded bg-slate-700" />
            </div>
            <div className="h-3 w-1/2 rounded bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-card p-4 animate-pulse">
      <div className="h-6 w-12 rounded bg-slate-700 mx-auto mb-1" />
      <div className="h-2 w-16 rounded bg-slate-700 mx-auto" />
    </div>
  );
}

// ─── Prospect Card ─────────────────────────────────────────────────────────────

interface ProspectCardProps {
  prospect: PipelineProspect;
  onSendOutreach: (id: string) => Promise<void>;
  onGeneratePaymentLink: (id: string) => Promise<void>;
  onMarkLost: (id: string) => Promise<void>;
  paymentLinkUrl?: string;
}

function ProspectCard({
  prospect,
  onSendOutreach,
  onGeneratePaymentLink,
  onMarkLost,
  paymentLinkUrl,
}: ProspectCardProps) {
  const [loadingOutreach, setLoadingOutreach] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [loadingLost, setLoadingLost] = useState(false);
  const [copied, setCopied] = useState(false);
  const status = prospect.status as PipelineStatus;
  const isReplied = status === "REPLIED";
  const isConverted = status === "CONVERTED";
  const isLost = status === "LOST";
  const canOutreach = status === "PREVIEW_GENERATED";
  const canPaymentLink = status === "REPLIED" || status === "CALL_SCHEDULED";
  const canMarkLost = !isConverted && !isLost;

  const lastEmail = (prospect.outreachEmails as Array<{ sentAt: string | null; subject: string; status: string }>)[0];

  async function handleSendOutreach() {
    setLoadingOutreach(true);
    try {
      await onSendOutreach(prospect.id);
    } finally {
      setLoadingOutreach(false);
    }
  }

  async function handleGeneratePaymentLink() {
    setLoadingLink(true);
    try {
      await onGeneratePaymentLink(prospect.id);
    } finally {
      setLoadingLink(false);
    }
  }

  async function handleMarkLost() {
    setLoadingLost(true);
    try {
      await onMarkLost(prospect.id);
    } finally {
      setLoadingLost(false);
    }
  }

  async function handleCopyLink() {
    if (!paymentLinkUrl) return;
    await navigator.clipboard.writeText(paymentLinkUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-bg-card p-3 transition-all duration-200 space-y-2",
        isReplied
          ? "border-neon-amber/40 shadow-[0_0_10px_rgba(245,158,11,0.12)]"
          : isConverted
          ? "border-neon-green/30"
          : isLost
          ? "border-slate-700/60 opacity-60"
          : "border-border-subtle hover:border-slate-600"
      )}
    >
      {/* Company + score */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-slate-200 text-sm leading-tight">
          {prospect.companyName}
        </span>
        <Badge color={scoreColor(prospect.leadScore)} size="sm">
          {prospect.leadScore}
        </Badge>
      </div>

      {/* Contact */}
      {prospect.contactName && (
        <p className="font-mono-tech text-[10px] text-slate-500 truncate">
          {prospect.contactName}
        </p>
      )}

      {/* Country + sector tags */}
      <div className="flex flex-wrap gap-1">
        <Badge color="gray" size="sm">{prospect.country}</Badge>
        <Badge color="gray" size="sm">{prospect.sector}</Badge>
      </div>

      {/* Last email subject */}
      {lastEmail && (
        <p className="font-mono-tech text-[10px] text-slate-600 truncate flex items-center gap-1">
          <Mail className="h-2.5 w-2.5 shrink-0" />
          {lastEmail.subject}
        </p>
      )}

      {/* Timestamps */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {prospect.lastContactedAt && (
          <span className="font-mono-tech text-[9px] text-slate-700">
            contacted {timeAgo(prospect.lastContactedAt)}
          </span>
        )}
        {prospect.repliedAt && (
          <span className="font-mono-tech text-[9px] text-neon-amber">
            replied {timeAgo(prospect.repliedAt)}
          </span>
        )}
        {prospect.convertedAt && (
          <span className="font-mono-tech text-[9px] text-neon-green">
            converted {timeAgo(prospect.convertedAt)}
          </span>
        )}
      </div>

      {/* Payment link display */}
      {paymentLinkUrl && (
        <div className="flex items-center gap-1.5 rounded border border-neon-green/30 bg-neon-green/5 px-2 py-1">
          <span className="font-mono-tech text-[9px] text-neon-green truncate flex-1">
            {paymentLinkUrl}
          </span>
          <button
            onClick={handleCopyLink}
            aria-label="Copy payment link"
            className="shrink-0 text-neon-green hover:text-neon-green/80 transition-colors"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      )}

      {/* Action buttons */}
      {(canOutreach || canPaymentLink || canMarkLost) && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border-subtle">
          {canOutreach && (
            <Button
              color="cyan"
              variant="outline"
              size="sm"
              onClick={handleSendOutreach}
              loading={loadingOutreach}
              leftIcon={<Mail className="h-3 w-3" />}
              className="flex-1 min-w-0 text-[10px]"
            >
              Outreach
            </Button>
          )}
          {canPaymentLink && !paymentLinkUrl && (
            <Button
              color="green"
              variant="outline"
              size="sm"
              onClick={handleGeneratePaymentLink}
              loading={loadingLink}
              leftIcon={<Link2 className="h-3 w-3" />}
              className="flex-1 min-w-0 text-[10px]"
            >
              Pay Link
            </Button>
          )}
          {canMarkLost && (
            <Button
              color="red"
              variant="ghost"
              size="sm"
              onClick={handleMarkLost}
              loading={loadingLost}
              leftIcon={<Ban className="h-3 w-3" />}
              className="text-[10px]"
              aria-label="Mark as lost"
            >
              Lost
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pipeline Column ───────────────────────────────────────────────────────────

interface PipelineColumnProps {
  status: PipelineStatus;
  prospects: PipelineProspect[];
  count: number;
  paymentLinks: Record<string, string>;
  onSendOutreach: (id: string) => Promise<void>;
  onGeneratePaymentLink: (id: string) => Promise<void>;
  onMarkLost: (id: string) => Promise<void>;
}

function PipelineColumn({
  status,
  prospects,
  count,
  paymentLinks,
  onSendOutreach,
  onGeneratePaymentLink,
  onMarkLost,
}: PipelineColumnProps) {
  const config = COLUMN_CONFIG[status];

  return (
    <div
      className="flex flex-col min-w-[210px] max-w-[230px] rounded-lg border border-border-subtle bg-bg-sidebar/50"
      role="region"
      aria-label={`${config.label} column`}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between p-3 border-b"
        style={{ borderBottomColor: `${config.color}20` }}
      >
        <span
          className="font-orbitron text-[11px] font-bold uppercase tracking-widest"
          style={{ color: config.color, textShadow: `0 0 8px ${config.color}50` }}
        >
          {config.label}
        </span>
        <span
          className="flex h-5 min-w-[20px] items-center justify-center rounded border font-mono-tech text-[10px] font-bold px-1"
          style={{
            borderColor: `${config.color}40`,
            color: config.color,
            backgroundColor: `${config.color}15`,
          }}
        >
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-320px)]">
        {prospects.length === 0 ? (
          <div className="flex items-center justify-center h-20">
            <p className="font-mono-tech text-[10px] text-slate-800">empty</p>
          </div>
        ) : (
          prospects.map((p) => (
            <ProspectCard
              key={p.id}
              prospect={p}
              paymentLinkUrl={paymentLinks[p.id]}
              onSendOutreach={onSendOutreach}
              onGeneratePaymentLink={onGeneratePaymentLink}
              onMarkLost={onMarkLost}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Summary Stats Bar ─────────────────────────────────────────────────────────

function SummaryStats({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const converted = counts["CONVERTED"] ?? 0;
  const conversionRate = total > 0 ? (converted / total) * 100 : 0;
  const stats = [
    {
      label: "Total in Pipeline",
      value: total,
      icon: Users,
      color: "text-neon-cyan" as const,
    },
    {
      label: "Converted",
      value: converted,
      icon: ArrowRightLeft,
      color: "text-neon-green" as const,
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate.toFixed(1)}%`,
      icon: Percent,
      color: "text-neon-violet" as const,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <Card key={label} neon="subtle" className="p-4">
          <div className="flex items-center gap-3">
            <Icon className={cn("h-5 w-5 shrink-0", color)} />
            <div>
              <p className={cn("font-orbitron text-xl font-bold", color)}>
                {value}
              </p>
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 mt-0.5">
                {label}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Per-Column Count Bar ──────────────────────────────────────────────────────

function ColumnCountBar({
  data,
}: {
  data: PipelineData;
}) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
      {PIPELINE_COLUMNS.map((status) => {
        const config = COLUMN_CONFIG[status];
        const count = data.counts[status] ?? (data.columns[status]?.length ?? 0);
        return (
          <Card key={status} neon="subtle" className="p-3 text-center">
            <div
              className="font-orbitron text-lg font-bold"
              style={{ color: config.color }}
            >
              {count}
            </div>
            <div className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600 mt-0.5">
              {config.label}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Error State ───────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertTriangle className="h-10 w-10 text-neon-red" aria-hidden="true" />
      <div className="text-center">
        <p className="font-orbitron text-sm font-bold text-neon-red uppercase tracking-widest mb-1">
          Failed to load pipeline
        </p>
        <p className="font-mono-tech text-xs text-slate-600 max-w-sm">{message}</p>
      </div>
      <Button
        color="cyan"
        variant="outline"
        size="sm"
        onClick={onRetry}
        leftIcon={<RefreshCw className="h-3 w-3" />}
      >
        Retry
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  // Map of prospectId -> checkoutUrl generated this session
  const [paymentLinks, setPaymentLinks] = useState<Record<string, string>>({});

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPipeline();
      setData(result);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // ─── Card Actions ──────────────────────────────────────────────

  const handleSendOutreach = useCallback(async (id: string) => {
    await sendOutreach(id);
    // Move prospect to EMAIL_SENT in local state optimistically
    setData((prev) => {
      if (!prev) return prev;
      return moveProspect(prev, id, "EMAIL_SENT");
    });
  }, []);

  const handleGeneratePaymentLink = useCallback(async (id: string) => {
    const result = await generatePaymentLink(id);
    setPaymentLinks((prev) => ({ ...prev, [id]: result.checkoutUrl }));
  }, []);

  const handleMarkLost = useCallback(async (id: string) => {
    await updateProspect(id, { status: "LOST" } as Parameters<typeof updateProspect>[1]);
    setData((prev) => {
      if (!prev) return prev;
      return moveProspect(prev, id, "LOST");
    });
  }, []);

  // ─── Render ────────────────────────────────────────────────────

  return (
    <PageWrapper>
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1
            className="font-orbitron text-2xl font-bold text-neon-green"
            style={{ textShadow: "0 0 12px rgba(34,197,94,0.35)" }}
          >
            <TrendingUp className="inline h-6 w-6 mr-2 -mt-1" aria-hidden="true" />
            Sales Pipeline
          </h1>
          <p className="mt-1 font-mono-tech text-xs text-slate-500">
            {data
              ? `${Object.values(data.counts).reduce((a, b) => a + b, 0)} prospects tracked`
              : "Loading pipeline..."}
            {lastFetched && (
              <span className="ml-2 text-slate-700">
                — refreshed {timeAgo(lastFetched.toISOString())}
              </span>
            )}
          </p>
        </div>
        <Button
          color="cyan"
          variant="outline"
          size="sm"
          onClick={fetchPipeline}
          loading={loading}
          leftIcon={<RefreshCw className="h-3 w-3" />}
          aria-label="Refresh pipeline data"
        >
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && !loading && (
        <ErrorState message={error} onRetry={fetchPipeline} />
      )}

      {/* Loading: skeleton */}
      {loading && !data && (
        <>
          {/* Summary stats skeleton */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3].map((i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
          {/* Column count bar skeleton */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
            {PIPELINE_COLUMNS.map((s) => (
              <StatSkeleton key={s} />
            ))}
          </div>
          {/* Board skeleton */}
          <div className="flex gap-3 overflow-x-auto pb-4">
            {PIPELINE_COLUMNS.map((s) => (
              <ColumnSkeleton key={s} />
            ))}
          </div>
        </>
      )}

      {/* Loaded state */}
      {data && !error && (
        <>
          {/* Summary stats */}
          <SummaryStats counts={data.counts} />

          {/* Per-column count strip */}
          <ColumnCountBar data={data} />

          {/* Kanban board */}
          <div
            className="overflow-x-auto pb-4"
            role="list"
            aria-label="Pipeline kanban board"
          >
            <div
              className="flex gap-3"
              style={{ minWidth: `${PIPELINE_COLUMNS.length * 230}px` }}
            >
              {PIPELINE_COLUMNS.map((status) => {
                const prospects = data.columns[status] ?? [];
                const count = data.counts[status] ?? prospects.length;
                return (
                  <PipelineColumn
                    key={status}
                    status={status}
                    prospects={prospects}
                    count={count}
                    paymentLinks={paymentLinks}
                    onSendOutreach={handleSendOutreach}
                    onGeneratePaymentLink={handleGeneratePaymentLink}
                    onMarkLost={handleMarkLost}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function moveProspect(
  data: PipelineData,
  id: string,
  targetStatus: PipelineStatus
): PipelineData {
  const next: PipelineData = {
    counts: { ...data.counts },
    columns: Object.fromEntries(
      Object.entries(data.columns).map(([k, v]) => [k, [...v]])
    ),
  };

  let moved: PipelineProspect | undefined;

  for (const status of PIPELINE_COLUMNS) {
    const col = next.columns[status];
    if (!col) continue;
    const idx = col.findIndex((p) => p.id === id);
    if (idx !== -1) {
      moved = col[idx];
      col.splice(idx, 1);
      next.counts[status] = Math.max(0, (next.counts[status] ?? 0) - 1);
      break;
    }
  }

  if (moved) {
    if (!next.columns[targetStatus]) next.columns[targetStatus] = [];
    next.columns[targetStatus] = [{ ...moved, status: targetStatus }, ...next.columns[targetStatus]];
    next.counts[targetStatus] = (next.counts[targetStatus] ?? 0) + 1;
  }

  return next;
}
