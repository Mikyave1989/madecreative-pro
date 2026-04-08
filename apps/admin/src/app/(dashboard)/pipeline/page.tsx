"use client";

import { useState, useCallback } from "react";
import {
  TrendingUp,
  Mail,
  Copy,
  Check,
  ThumbsDown,
  Ban,
  Link2,
  RefreshCw,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

type PipelineStatus =
  | "PREVIEW_GENERATED"
  | "EMAIL_SENT"
  | "REPLIED"
  | "CALL_SCHEDULED"
  | "CONVERTED"
  | "LOST";

type ReplySentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "OPT_OUT";

interface PipelineProspect {
  id: string;
  companyName: string;
  country: string;
  sector: string;
  leadScore: number;
  status: PipelineStatus;
  lastContactedAt: string | null;
  repliedAt: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
  outreachEmails: Array<{
    sentAt: string | null;
    subject: string;
    status: string;
  }>;
  // Client-side only — set after analysis
  replyText?: string;
  sentiment?: ReplySentiment;
  sentimentConfidence?: number;
  paymentLink?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMN_CONFIG: Record<
  PipelineStatus,
  { label: string; color: string; neon: "cyan" | "violet" | "amber" | "green" | "blue" | "red" | "pink" }
> = {
  PREVIEW_GENERATED: { label: "Preview Ready", color: "#00f0ff", neon: "cyan" },
  EMAIL_SENT: { label: "Contacted", color: "#a855f7", neon: "violet" },
  REPLIED: { label: "Replied", color: "#f59e0b", neon: "amber" },
  CALL_SCHEDULED: { label: "Negotiating", color: "#3b82f6", neon: "blue" },
  CONVERTED: { label: "Converted", color: "#22c55e", neon: "green" },
  LOST: { label: "Lost", color: "#ef4444", neon: "red" },
};

const PIPELINE_COLUMNS: PipelineStatus[] = [
  "PREVIEW_GENERATED",
  "EMAIL_SENT",
  "REPLIED",
  "CALL_SCHEDULED",
  "CONVERTED",
  "LOST",
];

const SENTIMENT_COLORS: Record<ReplySentiment, "green" | "red" | "gray" | "amber"> = {
  POSITIVE: "green",
  NEGATIVE: "red",
  NEUTRAL: "gray",
  OPT_OUT: "amber",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_access_token");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Mock data (used when API is unavailable) ─────────────────────────────────

const MOCK_PIPELINE: Record<PipelineStatus, PipelineProspect[]> = {
  PREVIEW_GENERATED: [
    {
      id: "p1",
      companyName: "Ristorante Da Sergio",
      country: "IT",
      sector: "restaurant",
      leadScore: 78,
      status: "PREVIEW_GENERATED",
      lastContactedAt: null,
      repliedAt: null,
      convertedAt: null,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      outreachEmails: [],
    },
    {
      id: "p2",
      companyName: "Studio Medico Ferrari",
      country: "IT",
      sector: "dental",
      leadScore: 85,
      status: "PREVIEW_GENERATED",
      lastContactedAt: null,
      repliedAt: null,
      convertedAt: null,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      outreachEmails: [],
    },
  ],
  EMAIL_SENT: [
    {
      id: "p3",
      companyName: "Parrucchiere Elegance",
      country: "DE",
      sector: "beauty",
      leadScore: 62,
      status: "EMAIL_SENT",
      lastContactedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      repliedAt: null,
      convertedAt: null,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      outreachEmails: [{ sentAt: new Date(Date.now() - 86400000).toISOString(), subject: "Il tuo nuovo sito è pronto", status: "sent" }],
    },
  ],
  REPLIED: [
    {
      id: "p4",
      companyName: "Hotel Bellavista",
      country: "IT",
      sector: "hotel",
      leadScore: 90,
      status: "REPLIED",
      lastContactedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      repliedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      convertedAt: null,
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      outreachEmails: [{ sentAt: new Date(Date.now() - 2 * 86400000).toISOString(), subject: "Abbiamo creato il tuo sito", status: "replied" }],
    },
  ],
  CALL_SCHEDULED: [],
  CONVERTED: [
    {
      id: "p5",
      companyName: "Studio Legale Bianchi",
      country: "IT",
      sector: "legal",
      leadScore: 95,
      status: "CONVERTED",
      lastContactedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      repliedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      convertedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      outreachEmails: [],
    },
  ],
  LOST: [],
};

// ─── Prospect Card Component ───────────────────────────────────────────────────

function ProspectCard({
  prospect,
  onDrop,
  highlight,
}: {
  prospect: PipelineProspect;
  onDrop?: (id: string, newStatus: PipelineStatus) => void;
  highlight?: boolean;
}) {
  const config = COLUMN_CONFIG[prospect.status];
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(prospect.updatedAt).getTime()) / 86400000
  );

  const lastEmail = prospect.outreachEmails[0];

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("prospectId", prospect.id)}
      className={`rounded-lg border bg-bg-card p-3 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        highlight
          ? "border-neon-amber/60 shadow-[0_0_12px_#f59e0b30]"
          : "border-border-subtle hover:border-slate-600"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-medium text-slate-200 text-sm leading-tight">
          {prospect.companyName}
        </span>
        <Badge
          color={prospect.leadScore >= 70 ? "green" : prospect.leadScore >= 40 ? "amber" : "red"}
          size="sm"
        >
          {prospect.leadScore}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        <Badge color="gray" size="sm">{prospect.country}</Badge>
        <Badge color="gray" size="sm">{prospect.sector}</Badge>
      </div>

      {lastEmail && (
        <p className="font-mono-tech text-[10px] text-slate-600 truncate mb-1">
          <Mail className="inline h-2.5 w-2.5 mr-1" />
          {lastEmail.subject}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        <span className="font-mono-tech text-[9px] text-slate-700">
          {daysSinceUpdate}d in stage
        </span>
        {prospect.sentiment && (
          <Badge color={SENTIMENT_COLORS[prospect.sentiment]} size="sm">
            {prospect.sentiment}
          </Badge>
        )}
      </div>

      {/* Drop targets — arrows showing possible moves */}
      {onDrop && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {PIPELINE_COLUMNS.filter((s) => s !== prospect.status).map((targetStatus) => (
            <button
              key={targetStatus}
              onClick={() => onDrop(prospect.id, targetStatus)}
              className="font-mono-tech text-[8px] uppercase tracking-wider text-slate-700 hover:text-slate-400 flex items-center gap-0.5"
              title={`Move to ${COLUMN_CONFIG[targetStatus].label}`}
            >
              <ChevronRight className="h-2.5 w-2.5" />
              {COLUMN_CONFIG[targetStatus].label.split(" ")[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reply Analyzer Panel ──────────────────────────────────────────────────────

function ReplyAnalyzerPanel({
  prospects,
  onUpdate,
}: {
  prospects: PipelineProspect[];
  onUpdate: (id: string, updates: Partial<PipelineProspect>) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPaymentLink, setLoadingPaymentLink] = useState(false);
  const selectedPlan = "STANDARD";
  const [copied, setCopied] = useState(false);

  const selected = prospects.find((p) => p.id === selectedId);

  const handleAnalyze = async () => {
    if (!selectedId || !replyText.trim()) return;
    setAnalyzing(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        data: {
          sentiment: ReplySentiment;
          confidence: number;
          suggestedAction: string;
          keyPhrases: string[];
        };
      }>(`/admin/prospects/${selectedId}/analyze-reply`, {
        method: "POST",
        body: JSON.stringify({ replyText }),
      });

      if (res.success) {
        onUpdate(selectedId, {
          sentiment: res.data.sentiment,
          sentimentConfidence: res.data.confidence,
          replyText,
        });
      }
    } catch {
      // Fallback: local keyword analysis
      const text = replyText.toLowerCase();
      let sentiment: ReplySentiment = "NEUTRAL";
      if (["unsubscribe", "remove", "opt out", "stop", "rimuovi"].some((k) => text.includes(k))) sentiment = "OPT_OUT";
      else if (["not interested", "no thanks", "too expensive", "non interessato"].some((k) => text.includes(k))) sentiment = "NEGATIVE";
      else if (["interested", "yes", "proceed", "quanto", "when", "sì"].some((k) => text.includes(k))) sentiment = "POSITIVE";
      onUpdate(selectedId, { sentiment, sentimentConfidence: 0.6, replyText });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendPaymentLink = async () => {
    if (!selectedId || !selected) return;
    setLoadingPaymentLink(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        data: { checkoutUrl: string; expiresAt: string };
      }>(`/admin/prospects/${selectedId}/generate-payment-link`, {
        method: "POST",
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (res.success) {
        onUpdate(selectedId, { paymentLink: res.data.checkoutUrl });
        await navigator.clipboard.writeText(res.data.checkoutUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Mock in dev
      const mockUrl = `https://checkout.stripe.com/c/pay/mock_${selectedId}_${selectedPlan.toLowerCase()}`;
      onUpdate(selectedId, { paymentLink: mockUrl });
      await navigator.clipboard.writeText(mockUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setLoadingPaymentLink(false);
    }
  };

  const handleMarkLost = async (id: string) => {
    try {
      await apiFetch(`/admin/prospects/${id}/mark-lost`, { method: "POST" });
      onUpdate(id, { status: "LOST" });
    } catch {
      onUpdate(id, { status: "LOST" });
    }
  };

  const handleBlacklist = async (id: string) => {
    if (!confirm("Blacklist this prospect? This cannot be undone.")) return;
    try {
      await apiFetch(`/admin/prospects/${id}/blacklist`, { method: "POST" });
      onUpdate(id, { status: "LOST" });
    } catch {
      onUpdate(id, { status: "LOST" });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-orbitron text-sm font-bold text-neon-amber uppercase tracking-widest mb-1">
          Reply Analyzer
        </h3>
        <p className="font-mono-tech text-[10px] text-slate-600">
          {prospects.length} prospect{prospects.length !== 1 ? "s" : ""} with replies
        </p>
      </div>

      {/* Prospect list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {prospects.length === 0 && (
          <p className="font-mono-tech text-[11px] text-slate-600 text-center py-4">
            No replies yet
          </p>
        )}
        {prospects.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedId(p.id);
              setReplyText(p.replyText ?? "");
            }}
            className={`w-full rounded border p-3 text-left transition-all duration-200 ${
              selectedId === p.id
                ? "border-neon-amber/60 bg-neon-amber/5"
                : "border-border-subtle hover:border-slate-600 bg-bg-card"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-slate-200 text-sm">{p.companyName}</span>
              {p.sentiment && (
                <Badge color={SENTIMENT_COLORS[p.sentiment]} size="sm">
                  {p.sentiment}
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Badge color="gray" size="sm">{p.country}</Badge>
              <Badge color="gray" size="sm">{p.leadScore}</Badge>
            </div>
          </button>
        ))}
      </div>

      {/* Analysis area */}
      {selectedId && selected && (
        <div className="space-y-3 border-t border-border-subtle pt-4">
          <div>
            <label className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600 block mb-1">
              Reply Text
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Paste the prospect's reply here..."
              rows={4}
              className="w-full rounded border border-border-subtle bg-bg-elevated px-3 py-2 text-xs text-slate-300 placeholder-slate-700 focus:border-neon-amber/50 focus:outline-none resize-none"
            />
          </div>

          <Button
            color="amber"
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            loading={analyzing}
            className="w-full"
          >
            Analyze with Claude
          </Button>

          {selected.sentiment && (
            <div
              className={`rounded border p-3 ${
                selected.sentiment === "POSITIVE"
                  ? "border-neon-green/40 bg-neon-green/5"
                  : selected.sentiment === "OPT_OUT"
                  ? "border-neon-amber/40 bg-neon-amber/5"
                  : selected.sentiment === "NEGATIVE"
                  ? "border-neon-red/40 bg-neon-red/5"
                  : "border-border-subtle bg-bg-elevated"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge color={SENTIMENT_COLORS[selected.sentiment]}>
                  {selected.sentiment}
                </Badge>
                {selected.sentimentConfidence !== undefined && (
                  <span className="font-mono-tech text-[10px] text-slate-600">
                    {Math.round(selected.sentimentConfidence * 100)}% confidence
                  </span>
                )}
              </div>

              {selected.sentiment === "POSITIVE" && (
                <div className="space-y-2">
                  <div>
                    <p className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600 mb-1">
                      Piano
                    </p>
                    <p className="font-mono-tech text-xs text-neon-cyan font-bold">
                      Piano Standard — €197/mese
                    </p>
                  </div>

                  {selected.paymentLink ? (
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={selected.paymentLink}
                        className="flex-1 rounded border border-neon-green/30 bg-bg-elevated px-2 py-1.5 text-[10px] text-neon-green font-mono truncate"
                      />
                      <Button
                        color="green"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(selected.paymentLink!).catch(() => {});
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      color="green"
                      variant="solid"
                      size="sm"
                      onClick={handleSendPaymentLink}
                      loading={loadingPaymentLink}
                      leftIcon={<Link2 className="h-3 w-3" />}
                      className="w-full"
                    >
                      {copied ? "Copied!" : "Generate Payment Link"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              color="red"
              variant="outline"
              size="sm"
              onClick={() => handleMarkLost(selectedId)}
              leftIcon={<ThumbsDown className="h-3 w-3" />}
              className="flex-1"
            >
              Mark Lost
            </Button>
            <Button
              color="amber"
              variant="outline"
              size="sm"
              onClick={() => handleBlacklist(selectedId)}
              leftIcon={<Ban className="h-3 w-3" />}
              className="flex-1"
            >
              Blacklist
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pipeline Column ───────────────────────────────────────────────────────────

function PipelineColumn({
  status,
  prospects,
  onDrop,
  onMove,
}: {
  status: PipelineStatus;
  prospects: PipelineProspect[];
  onDrop: (prospectId: string, newStatus: PipelineStatus) => void;
  onMove: (prospectId: string, newStatus: PipelineStatus) => void;
}) {
  const config = COLUMN_CONFIG[status];
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const id = e.dataTransfer.getData("prospectId");
    if (id) onDrop(id, status);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col min-w-[200px] max-w-[240px] rounded-lg border transition-all duration-200 ${
        isDragOver
          ? `border-[${config.color}] bg-[${config.color}]/5`
          : "border-border-subtle bg-bg-sidebar/50"
      }`}
      style={isDragOver ? { borderColor: `${config.color}60`, backgroundColor: `${config.color}08` } : {}}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between p-3 border-b border-border-subtle"
        style={{ borderBottomColor: `${config.color}20` }}
      >
        <span
          className="font-orbitron text-[11px] font-bold uppercase tracking-widest"
          style={{ color: config.color, textShadow: `0 0 8px ${config.color}60` }}
        >
          {config.label}
        </span>
        <span
          className="flex h-5 min-w-5 items-center justify-center rounded border font-mono-tech text-[10px] font-bold px-1"
          style={{
            borderColor: `${config.color}40`,
            color: config.color,
            backgroundColor: `${config.color}15`,
          }}
        >
          {prospects.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
        {prospects.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <p className="font-mono-tech text-[10px] text-slate-800">empty</p>
          </div>
        )}
        {prospects.map((p) => (
          <ProspectCard
            key={p.id}
            prospect={p}
            onDrop={onMove}
            highlight={p.status === "REPLIED"}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [columns, setColumns] = useState<Record<PipelineStatus, PipelineProspect[]>>(MOCK_PIPELINE);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        data: {
          columns: Record<string, PipelineProspect[]>;
          counts: Record<string, number>;
        };
      }>("/admin/prospects/pipeline");

      if (res.success) {
        const newCols: Record<PipelineStatus, PipelineProspect[]> = {
          PREVIEW_GENERATED: res.data.columns["PREVIEW_GENERATED"] ?? [],
          EMAIL_SENT: res.data.columns["EMAIL_SENT"] ?? [],
          REPLIED: res.data.columns["REPLIED"] ?? [],
          CALL_SCHEDULED: res.data.columns["CALL_SCHEDULED"] ?? [],
          CONVERTED: res.data.columns["CONVERTED"] ?? [],
          LOST: res.data.columns["LOST"] ?? [],
        };
        setColumns(newCols);
        setLastFetched(new Date());
      }
    } catch {
      // Keep mock data in dev
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (prospectId: string, newStatus: PipelineStatus) => {
      // Optimistic update
      setColumns((prev) => {
        const next = { ...prev };
        let movedProspect: PipelineProspect | undefined;

        // Remove from current column
        for (const status of PIPELINE_COLUMNS) {
          const idx = next[status].findIndex((p) => p.id === prospectId);
          if (idx !== -1) {
            movedProspect = next[status][idx];
            next[status] = next[status].filter((p) => p.id !== prospectId);
            break;
          }
        }

        if (movedProspect) {
          next[newStatus] = [{ ...movedProspect, status: newStatus }, ...next[newStatus]];
        }

        return next;
      });

      // Persist via API
      try {
        await apiFetch(`/admin/prospects/${prospectId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        });
      } catch {
        // Non-critical — UI is already updated
      }
    },
    []
  );

  const handleProspectUpdate = useCallback(
    (id: string, updates: Partial<PipelineProspect>) => {
      setColumns((prev) => {
        const next = { ...prev };
        for (const status of PIPELINE_COLUMNS) {
          const idx = next[status].findIndex((p) => p.id === id);
          if (idx !== -1) {
            const updatedProspect = { ...next[status][idx]!, ...updates };
            next[status] = [...next[status]];
            next[status][idx] = updatedProspect as PipelineProspect;

            // If status changed, move to new column
            if (updates.status && updates.status !== status) {
              next[status] = next[status].filter((p) => p.id !== id);
              const newStatus = updates.status as PipelineStatus;
              if (newStatus in next) {
                next[newStatus] = [updatedProspect as PipelineProspect, ...next[newStatus]];
              }
            }
            break;
          }
        }
        return next;
      });
    },
    []
  );

  const repliedProspects = columns["REPLIED"] ?? [];
  const totalProspects = PIPELINE_COLUMNS.reduce(
    (sum, s) => sum + columns[s].length,
    0
  );

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1
            className="font-orbitron text-2xl font-bold text-neon-green"
            style={{ textShadow: "0 0 12px #22c55e40" }}
          >
            <TrendingUp className="inline h-6 w-6 mr-2 -mt-1" />
            Sales Pipeline
          </h1>
          <p className="mt-1 font-mono-tech text-xs text-slate-500">
            {totalProspects} prospects in pipeline
            {lastFetched && (
              <span className="ml-2 text-slate-700">
                — last updated {lastFetched.toLocaleTimeString()}
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
        >
          Refresh
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {PIPELINE_COLUMNS.map((status) => {
          const config = COLUMN_CONFIG[status];
          return (
            <Card key={status} neon="subtle" className="p-3 text-center">
              <div
                className="font-orbitron text-xl font-bold"
                style={{ color: config.color }}
              >
                {columns[status].length}
              </div>
              <div className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600 mt-0.5">
                {config.label}
              </div>
            </Card>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center gap-2 mb-4 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-mono-tech text-xs">Loading pipeline data...</span>
        </div>
      )}

      {/* Main layout: Kanban + Reply Analyzer */}
      <div className="flex gap-6">
        {/* Kanban board */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-3 pb-4" style={{ minWidth: `${PIPELINE_COLUMNS.length * 220}px` }}>
            {PIPELINE_COLUMNS.map((status) => (
              <PipelineColumn
                key={status}
                status={status}
                prospects={columns[status]}
                onDrop={handleDrop}
                onMove={handleDrop}
              />
            ))}
          </div>
        </div>

        {/* Reply Analyzer panel */}
        <div className="w-72 shrink-0">
          <Card neon="amber" className="p-4">
            <ReplyAnalyzerPanel
              prospects={repliedProspects}
              onUpdate={handleProspectUpdate}
            />
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
