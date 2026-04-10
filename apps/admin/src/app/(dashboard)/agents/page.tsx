"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { XCircle, Eye, Activity, RefreshCw, AlertTriangle } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableEmpty,
  Pagination,
} from "@/components/ui/Table";
import { Spinner } from "@/components/ui/Spinner";
import { getAgentJobs, cancelJob } from "@/lib/api";
import { cn, formatCurrency, formatDuration, truncateId, timeAgo } from "@/lib/utils";
import type { AgentType, JobStatus, AgentJob } from "@/lib/api";

// ─── Constants ─────────────────────────────────────────────────

const AGENT_META: Record<
  AgentType,
  { label: string; color: string; badgeColor: "cyan" | "violet" | "amber" | "green" | "blue" }
> = {
  SCRAPER:  { label: "Scraper",  color: "#a855f7", badgeColor: "violet" },
  ANALYZER: { label: "Analyzer", color: "#06b6d4", badgeColor: "cyan"   },
  BUILDER:  { label: "Builder",  color: "#f59e0b", badgeColor: "amber"  },
  OUTREACH: { label: "Outreach", color: "#10b981", badgeColor: "green"  },
  QA:       { label: "QA",       color: "#3b82f6", badgeColor: "blue"   },
};

const JOB_STATUS_BADGE: Record<
  JobStatus,
  "cyan" | "violet" | "amber" | "green" | "blue" | "red" | "gray"
> = {
  QUEUED:    "amber",
  RUNNING:   "blue",
  COMPLETED: "green",
  FAILED:    "red",
  CANCELLED: "gray",
};

const ALL_AGENT_TYPES: AgentType[] = ["SCRAPER", "ANALYZER", "BUILDER", "OUTREACH", "QA"];
const ALL_JOB_STATUSES: JobStatus[] = ["QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"];
const PAGE_SIZE = 15;

// ─── Job Detail Modal ──────────────────────────────────────────

function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="font-mono-tech text-[10px] text-slate-600">—</span>;
  }
  const text =
    typeof value === "string"
      ? value
      : JSON.stringify(value, null, 2);
  return (
    <pre className="whitespace-pre-wrap break-all font-mono-tech text-[10px] leading-5 text-slate-400">
      {text}
    </pre>
  );
}

function JobDetailModal({
  job,
  onClose,
  onCancel,
  cancelling,
}: {
  job: AgentJob | null;
  onClose: () => void;
  onCancel: (id: string) => void;
  cancelling: boolean;
}) {
  if (!job) return null;
  const meta = AGENT_META[job.agentType];
  const canCancel = job.status === "QUEUED" || job.status === "RUNNING";

  return (
    <Modal open={!!job} onClose={onClose} title={`Job ${truncateId(job.id)}`} size="lg">
      <div className="space-y-5">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={meta.badgeColor}>{job.agentType}</Badge>
          <Badge color={JOB_STATUS_BADGE[job.status]} pulse={job.status === "RUNNING"}>
            {job.status}
          </Badge>
          {canCancel && (
            <button
              onClick={() => onCancel(job.id)}
              disabled={cancelling}
              className="ml-auto flex items-center gap-1.5 rounded border border-neon-red/40 px-3 py-1 font-mono-tech text-[10px] uppercase text-neon-red transition-colors hover:bg-neon-red/10 disabled:opacity-50"
              aria-label="Cancel job"
            >
              {cancelling ? (
                <Spinner size="sm" color="text-neon-red" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              Cancel
            </button>
          )}
        </div>

        {/* Progress bar (running only) */}
        {job.status === "RUNNING" && job.progress !== null && (
          <div>
            <div className="mb-1 flex justify-between">
              <span className="font-mono-tech text-[10px] text-slate-500">Progress</span>
              <span className="font-mono-tech text-[10px] text-neon-cyan">{job.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${job.progress}%` }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full bg-neon-cyan"
                style={{ boxShadow: "0 0 8px #00f0ff" }}
              />
            </div>
          </div>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="font-mono-tech text-[9px] uppercase text-slate-600">Duration</p>
            <p className="font-mono-tech text-sm text-slate-300">
              {job.durationMs !== null ? formatDuration(job.durationMs) : "—"}
            </p>
          </div>
          <div>
            <p className="font-mono-tech text-[9px] uppercase text-slate-600">Cost</p>
            <p className="font-mono-tech text-sm text-slate-300">
              {job.costEur !== null ? formatCurrency(job.costEur) : "—"}
            </p>
          </div>
          <div>
            <p className="font-mono-tech text-[9px] uppercase text-slate-600">Created</p>
            <p className="font-mono-tech text-xs text-slate-400">{timeAgo(job.createdAt)}</p>
          </div>
          <div>
            <p className="font-mono-tech text-[9px] uppercase text-slate-600">Updated</p>
            <p className="font-mono-tech text-xs text-slate-400">{timeAgo(job.updatedAt)}</p>
          </div>
          {job.prospectId && (
            <div className="col-span-2">
              <p className="font-mono-tech text-[9px] uppercase text-slate-600">Prospect ID</p>
              <p className="font-mono-tech text-xs text-slate-400 break-all">{job.prospectId}</p>
            </div>
          )}
          {job.clientId && (
            <div className="col-span-2">
              <p className="font-mono-tech text-[9px] uppercase text-slate-600">Client ID</p>
              <p className="font-mono-tech text-xs text-slate-400 break-all">{job.clientId}</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div>
          <p className="mb-2 font-mono-tech text-[9px] uppercase text-slate-600">Input</p>
          <div className="max-h-36 overflow-y-auto rounded border border-border-subtle bg-bg-base p-3">
            <JsonBlock value={job.input} />
          </div>
        </div>

        {/* Output */}
        <div>
          <p className="mb-2 font-mono-tech text-[9px] uppercase text-slate-600">Output</p>
          <div className="max-h-36 overflow-y-auto rounded border border-border-subtle bg-bg-base p-3">
            <JsonBlock value={job.output} />
          </div>
        </div>

        {/* Error */}
        {job.error && (
          <div>
            <p className="mb-2 font-mono-tech text-[9px] uppercase text-neon-red">Error</p>
            <div className="max-h-28 overflow-y-auto rounded border border-neon-red/30 bg-neon-red/5 p-3">
              <p className="font-mono-tech text-[10px] leading-5 text-neon-red">{job.error}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Summary Stat Cards ────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  delay,
}: {
  label: string;
  value: number | string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card neon="subtle">
        <p className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600 mb-1">
          {label}
        </p>
        <p
          className="font-orbitron text-xl font-bold"
          style={{ color, textShadow: `0 0 10px ${color}40` }}
        >
          {value}
        </p>
      </Card>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────

export default function AgentsPage() {
  // ── Filter state ──────────────────────────────────────────────
  const [filterAgent, setFilterAgent] = useState<AgentType | "">("");
  const [filterStatus, setFilterStatus] = useState<JobStatus | "">("");
  const [page, setPage] = useState(1);

  // ── Data state ────────────────────────────────────────────────
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI state ──────────────────────────────────────────────────
  const [activeJob, setActiveJob] = useState<AgentJob | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAgentJobs({
        agentType: filterAgent || undefined,
        status: filterStatus || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setJobs(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agent jobs");
    } finally {
      setLoading(false);
    }
  }, [filterAgent, filterStatus, page]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  // ── Cancel ────────────────────────────────────────────────────
  const handleCancel = useCallback(
    async (jobId: string) => {
      setCancellingId(jobId);
      try {
        await cancelJob(jobId);
        // Reflect cancellation optimistically then refetch
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: "CANCELLED" as JobStatus } : j))
        );
        if (activeJob?.id === jobId) {
          setActiveJob((prev) =>
            prev ? { ...prev, status: "CANCELLED" as JobStatus } : prev
          );
        }
        // Refetch to get the server-accurate state
        void fetchJobs();
      } catch {
        // Non-blocking: failure just clears the loading state
      } finally {
        setCancellingId(null);
      }
    },
    [activeJob, fetchJobs]
  );

  // ── Filter change helpers ─────────────────────────────────────
  const handleAgentFilter = (value: string) => {
    setFilterAgent(value as AgentType | "");
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setFilterStatus(value as JobStatus | "");
    setPage(1);
  };

  // ── Derived counts from current page (used for stat cards when loaded) ─
  const statusCounts = jobs.reduce<Partial<Record<JobStatus, number>>>((acc, j) => {
    acc[j.status] = (acc[j.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1
            className="font-orbitron text-lg sm:text-xl md:text-2xl font-bold text-neon-amber"
            style={{ textShadow: "0 0 12px #f59e0b40" }}
          >
            Agent Monitor
          </h1>
          <p className="mt-1 font-mono-tech text-xs text-slate-500">
            Real-time job tracking across all agent types
          </p>
        </div>
        <button
          onClick={() => void fetchJobs()}
          disabled={loading}
          className={cn(
            "flex items-center gap-1.5 rounded border border-border-subtle px-3 py-1.5",
            "font-mono-tech text-[10px] uppercase text-slate-400 transition-colors",
            "hover:border-neon-cyan/50 hover:text-neon-cyan disabled:opacity-40"
          )}
          aria-label="Refresh jobs"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stat summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total (page)" value={total} color="#00f0ff" delay={0} />
        <StatCard label="Queued" value={statusCounts.QUEUED ?? 0} color="#f59e0b" delay={0.05} />
        <StatCard label="Running" value={statusCounts.RUNNING ?? 0} color="#3b82f6" delay={0.1} />
        <StatCard label="Completed" value={statusCounts.COMPLETED ?? 0} color="#10b981" delay={0.15} />
        <StatCard label="Failed" value={statusCounts.FAILED ?? 0} color="#ef4444" delay={0.2} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-end gap-3 flex-wrap">
        <div className="w-44">
          <Select
            label="Agent Type"
            value={filterAgent}
            onChange={(e) => handleAgentFilter(e.target.value)}
          >
            <option value="">All Agents</option>
            {ALL_AGENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {AGENT_META[t].label}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select
            label="Status"
            value={filterStatus}
            onChange={(e) => handleStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {ALL_JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Activity className="h-3.5 w-3.5 text-slate-600" />
          <span className="font-mono-tech text-[10px] text-slate-600">
            {loading ? "Loading..." : `${total} jobs`}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded border border-neon-red/30 bg-neon-red/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-neon-red" />
          <p className="font-mono-tech text-xs text-neon-red">{error}</p>
          <button
            onClick={() => void fetchJobs()}
            className="ml-auto font-mono-tech text-[10px] uppercase text-neon-red underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <Table>
        <Thead>
          <tr>
            <Th className="hidden md:table-cell">ID</Th>
            <Th>Agent</Th>
            <Th>Status</Th>
            <Th>Progress</Th>
            <Th className="hidden md:table-cell">Duration</Th>
            <Th className="hidden md:table-cell">Cost</Th>
            <Th className="hidden md:table-cell">Created</Th>
            <Th>Actions</Th>
          </tr>
        </Thead>
        <Tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="md" />
                  <span className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
                    Loading jobs...
                  </span>
                </div>
              </td>
            </tr>
          ) : jobs.length === 0 ? (
            <TableEmpty message="No jobs match the current filters" colSpan={8} />
          ) : (
            jobs.map((job) => {
              const meta = AGENT_META[job.agentType];
              const isCancelling = cancellingId === job.id;
              const canCancel = job.status === "QUEUED" || job.status === "RUNNING";

              return (
                <Tr
                  key={job.id}
                  onClick={() => setActiveJob(job)}
                  selected={activeJob?.id === job.id}
                >
                  <Td className="hidden md:table-cell">
                    <span className="font-mono-tech text-[10px] text-slate-500">
                      {truncateId(job.id)}
                    </span>
                  </Td>
                  <Td>
                    <Badge color={meta.badgeColor} size="sm">
                      {meta.label}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge
                      color={JOB_STATUS_BADGE[job.status]}
                      size="sm"
                      pulse={job.status === "RUNNING"}
                    >
                      {job.status}
                    </Badge>
                  </Td>
                  <Td>
                    {job.status === "RUNNING" && job.progress !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 min-w-[60px] flex-1 overflow-hidden rounded-full bg-bg-elevated">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full bg-neon-cyan"
                            style={{ boxShadow: "0 0 4px #00f0ff" }}
                          />
                        </div>
                        <span className="shrink-0 font-mono-tech text-[10px] text-neon-cyan">
                          {job.progress}%
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono-tech text-[10px] text-slate-600">
                        {job.status === "COMPLETED"
                          ? "100%"
                          : job.progress !== null
                          ? `${job.progress}%`
                          : "—"}
                      </span>
                    )}
                  </Td>
                  <Td className="hidden md:table-cell">
                    <span className="font-mono-tech text-[10px] text-slate-500">
                      {job.durationMs !== null ? formatDuration(job.durationMs) : "—"}
                    </span>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <span className="font-mono-tech text-[10px] text-slate-500">
                      {job.costEur !== null ? formatCurrency(job.costEur) : "—"}
                    </span>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <span className="font-mono-tech text-[10px] text-slate-500">
                      {timeAgo(job.createdAt)}
                    </span>
                  </Td>
                  <Td>
                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setActiveJob(job)}
                        className="rounded border border-border-subtle p-1.5 text-slate-500 transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan"
                        aria-label="View job details"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      {canCancel && (
                        <button
                          onClick={() => void handleCancel(job.id)}
                          disabled={isCancelling}
                          className="rounded border border-border-subtle p-1.5 text-slate-500 transition-colors hover:border-neon-red/50 hover:text-neon-red disabled:opacity-40"
                          aria-label="Cancel job"
                        >
                          {isCancelling ? (
                            <Spinner size="sm" color="text-neon-red" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })
          )}
        </Tbody>
      </Table>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Job Detail Modal */}
      <JobDetailModal
        job={activeJob}
        onClose={() => setActiveJob(null)}
        onCancel={handleCancel}
        cancelling={cancellingId === activeJob?.id}
      />
    </PageWrapper>
  );
}
