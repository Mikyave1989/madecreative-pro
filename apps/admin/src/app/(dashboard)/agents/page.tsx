"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, XCircle, Eye, Activity } from "lucide-react";
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
import { MOCK_JOBS, MOCK_AGENT_STATS } from "@/lib/mockData";
import { formatCurrency, formatDuration, truncateId, timeAgo } from "@/lib/utils";
import type { AgentType, JobStatus, AgentJob } from "@/lib/api";

// ─── Constants ─────────────────────────────────────────────────

const AGENT_META: Record<
  AgentType,
  {
    label: string;
    color: string;
    neon: "cyan" | "violet" | "amber" | "green" | "blue" | "red" | "pink";
    description: string;
  }
> = {
  SCRAPER:  { label: "Scraper",  color: "#00f0ff", neon: "cyan",   description: "Web scraping & lead discovery" },
  ANALYZER: { label: "Analyzer", color: "#a855f7", neon: "violet", description: "AI prospect analysis & scoring" },
  BUILDER:  { label: "Builder",  color: "#f59e0b", neon: "amber",  description: "Website & content generation" },
  OUTREACH: { label: "Outreach", color: "#10b981", neon: "green",  description: "Automated email outreach" },
  CHATBOT:  { label: "Chatbot",  color: "#3b82f6", neon: "blue",   description: "Conversational AI client support" },
  QA:       { label: "QA",       color: "#ef4444", neon: "red",    description: "Quality assurance & testing" },
  SOCIAL:   { label: "Social",   color: "#ec4899", neon: "pink",   description: "Social media management" },
};

const JOB_STATUS_COLOR: Record<
  JobStatus,
  "cyan" | "violet" | "amber" | "green" | "blue" | "red" | "pink" | "gray"
> = {
  QUEUED:    "gray",
  RUNNING:   "cyan",
  COMPLETED: "green",
  FAILED:    "red",
  CANCELLED: "gray",
};

const AGENT_STATUS_COLOR: Record<
  "IDLE" | "RUNNING" | "ERROR",
  "gray" | "cyan" | "red"
> = {
  IDLE:    "gray",
  RUNNING: "cyan",
  ERROR:   "red",
};

const PAGE_SIZE = 15;

// ─── Weekly Job Chart (CSS bars) ──────────────────────────────

const WEEKLY_DATA = [
  { day: "Mon", jobs: 18 },
  { day: "Tue", jobs: 32 },
  { day: "Wed", jobs: 27 },
  { day: "Thu", jobs: 41 },
  { day: "Fri", jobs: 35 },
  { day: "Sat", jobs: 14 },
  { day: "Sun", jobs: 9 },
];

function WeeklyChart() {
  const max = Math.max(...WEEKLY_DATA.map((d) => d.jobs));

  return (
    <Card neon="subtle">
      <CardHeader>
        <CardTitle>Jobs (7 Days)</CardTitle>
        <span className="font-mono-tech text-[9px] text-slate-600 uppercase">
          {WEEKLY_DATA.reduce((a, b) => a + b.jobs, 0)} total
        </span>
      </CardHeader>
      <div className="flex items-end gap-2 h-24">
        {WEEKLY_DATA.map((d, i) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
            <span className="font-mono-tech text-[9px] text-slate-600">{d.jobs}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.jobs / max) * 72}px` }}
              transition={{ delay: i * 0.06 + 0.3, duration: 0.5, ease: "easeOut" }}
              className="w-full rounded-sm"
              style={{
                background: `linear-gradient(to top, #00f0ff30, #00f0ff)`,
                boxShadow: "0 0 6px #00f0ff40",
              }}
            />
            <span className="font-mono-tech text-[9px] text-slate-600">{d.day}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Agent Status Card ─────────────────────────────────────────

function AgentCard({
  stat,
  delay,
}: {
  stat: (typeof MOCK_AGENT_STATS)[number];
  delay: number;
}) {
  const meta = AGENT_META[stat.agentType];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35 }}
      className={`rounded-lg border bg-bg-card p-4 transition-all duration-300`}
      style={{
        borderColor: `${meta.color}30`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${meta.color}80`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 12px ${meta.color}30`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${meta.color}30`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: meta.color,
                boxShadow: `0 0 6px ${meta.color}`,
                animation: stat.status === "RUNNING" ? "pulse 1.5s infinite" : undefined,
              }}
            />
            <span
              className="font-orbitron text-sm font-bold"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
          <p className="font-mono-tech text-[9px] text-slate-600">{meta.description}</p>
        </div>
        <Badge color={AGENT_STATUS_COLOR[stat.status]} size="sm" pulse={stat.status === "RUNNING"}>
          {stat.status}
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="font-mono-tech text-[9px] uppercase text-slate-600">Jobs Today</p>
          <p className="font-orbitron text-lg font-bold text-slate-200">{stat.jobsToday}</p>
        </div>
        <div>
          <p className="font-mono-tech text-[9px] uppercase text-slate-600">Cost Today</p>
          <p className="font-orbitron text-lg font-bold text-slate-200">
            {formatCurrency(stat.costTodayEur)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-mono-tech text-[9px] text-slate-700">
          {stat.lastRunAt ? `Last: ${timeAgo(stat.lastRunAt)}` : "Never run"}
        </p>
        {["SCRAPER", "ANALYZER"].includes(stat.agentType) && (
          <Button color={meta.neon} variant="outline" size="sm">
            <Play className="h-3 w-3" />
            Run
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Job Detail Modal ──────────────────────────────────────────

function JobDetailModal({
  job,
  onClose,
}: {
  job: AgentJob | null;
  onClose: () => void;
}) {
  if (!job) return null;
  const meta = AGENT_META[job.agentType];

  return (
    <Modal open={!!job} onClose={onClose} title={`Job ${truncateId(job.id)}`} size="lg">
      <div className="space-y-4">
        {/* Meta */}
        <div className="flex flex-wrap gap-3">
          <Badge color={meta.neon}>{job.agentType}</Badge>
          <Badge color={JOB_STATUS_COLOR[job.status]}>{job.status}</Badge>
          {job.prospectName && (
            <span className="font-mono-tech text-[10px] text-slate-500">
              Prospect: {job.prospectName}
            </span>
          )}
          {job.clientName && (
            <span className="font-mono-tech text-[10px] text-slate-500">
              Client: {job.clientName}
            </span>
          )}
        </div>

        {/* Progress */}
        {job.status === "RUNNING" && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-mono-tech text-[10px] text-slate-500">Progress</span>
              <span className="font-mono-tech text-[10px] text-neon-cyan">{job.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-bg-elevated overflow-hidden">
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

        {/* Details */}
        <div className="grid grid-cols-2 gap-3">
          {job.durationMs !== null && (
            <div>
              <p className="font-mono-tech text-[9px] uppercase text-slate-600">Duration</p>
              <p className="font-mono-tech text-sm text-slate-300">{formatDuration(job.durationMs)}</p>
            </div>
          )}
          {job.costEur !== null && (
            <div>
              <p className="font-mono-tech text-[9px] uppercase text-slate-600">Cost</p>
              <p className="font-mono-tech text-sm text-slate-300">{formatCurrency(job.costEur)}</p>
            </div>
          )}
          <div>
            <p className="font-mono-tech text-[9px] uppercase text-slate-600">Created</p>
            <p className="font-mono-tech text-xs text-slate-400">{timeAgo(job.createdAt)}</p>
          </div>
          <div>
            <p className="font-mono-tech text-[9px] uppercase text-slate-600">Updated</p>
            <p className="font-mono-tech text-xs text-slate-400">{timeAgo(job.updatedAt)}</p>
          </div>
        </div>

        {/* Logs */}
        <div>
          <p className="font-mono-tech text-[9px] uppercase text-slate-600 mb-2">Logs</p>
          <div className="rounded border border-border-subtle bg-bg-base p-3 max-h-36 overflow-y-auto">
            {job.logs.map((log, i) => (
              <p key={i} className="font-mono-tech text-[10px] text-slate-500 leading-5">
                {log}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ──────────────────────────────────────────────────────

export default function AgentsPage() {
  const [filterAgent, setFilterAgent] = useState<AgentType | "">("");
  const [filterStatus, setFilterStatus] = useState<JobStatus | "">("");
  const [page, setPage] = useState(1);
  const [activeJob, setActiveJob] = useState<AgentJob | null>(null);

  const filtered = MOCK_JOBS.filter((j) => {
    if (filterAgent && j.agentType !== filterAgent) return false;
    if (filterStatus && j.status !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalCostMonth = MOCK_AGENT_STATS.reduce(
    (sum, s) => sum + s.costTodayEur,
    0
  );

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6">
        <h1
          className="font-orbitron text-2xl font-bold text-neon-amber"
          style={{ textShadow: "0 0 12px #f59e0b40" }}
        >
          Agent Monitor
        </h1>
        <p className="mt-1 font-mono-tech text-xs text-slate-500">
          7 agents — real-time job tracking
        </p>
      </div>

      {/* Agent Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        {MOCK_AGENT_STATS.map((stat, i) => (
          <AgentCard key={stat.agentType} stat={stat} delay={i * 0.05} />
        ))}
      </div>

      {/* Stats Panel + Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <WeeklyChart />
        </div>
        <div className="grid grid-rows-2 gap-3">
          <Card neon="subtle">
            <p className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600 mb-1">
              Total API Cost (Month)
            </p>
            <p className="font-orbitron text-2xl font-bold text-neon-amber">
              {formatCurrency(totalCostMonth * 30)}
            </p>
            <p className="font-mono-tech text-[9px] text-slate-700 mt-1">
              Estimate based on daily avg
            </p>
          </Card>
          <Card neon="subtle">
            <p className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600 mb-1">
              Avg Job Duration
            </p>
            <p className="font-orbitron text-2xl font-bold text-neon-blue">
              {formatDuration(
                MOCK_JOBS.filter((j) => j.durationMs !== null).reduce(
                  (sum, j) => sum + (j.durationMs ?? 0),
                  0
                ) /
                  Math.max(
                    MOCK_JOBS.filter((j) => j.durationMs !== null).length,
                    1
                  )
              )}
            </p>
            <p className="font-mono-tech text-[9px] text-slate-700 mt-1">
              Across all completed jobs
            </p>
          </Card>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="mb-4 flex items-end gap-3 flex-wrap">
        <div className="w-40">
          <Select
            label="Agent Type"
            value={filterAgent}
            onChange={(e) => { setFilterAgent(e.target.value as AgentType | ""); setPage(1); }}
          >
            <option value="">All Agents</option>
            {(Object.keys(AGENT_META) as AgentType[]).map((t) => (
              <option key={t} value={t}>{AGENT_META[t].label}</option>
            ))}
          </Select>
        </div>
        <div className="w-36">
          <Select
            label="Status"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as JobStatus | ""); setPage(1); }}
          >
            <option value="">All Status</option>
            {(["QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"] as JobStatus[]).map(
              (s) => (
                <option key={s} value={s}>{s}</option>
              )
            )}
          </Select>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Activity className="h-3.5 w-3.5 text-slate-600" />
          <span className="font-mono-tech text-[10px] text-slate-600">
            {filtered.length} jobs
          </span>
        </div>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>ID</Th>
            <Th>Agent</Th>
            <Th>Status</Th>
            <Th>Progress</Th>
            <Th>Target</Th>
            <Th>Duration</Th>
            <Th>Cost</Th>
            <Th>Actions</Th>
          </tr>
        </Thead>
        <Tbody>
          {paginated.length === 0 ? (
            <TableEmpty message="No jobs match the current filters" colSpan={8} />
          ) : (
            paginated.map((job) => {
              const meta = AGENT_META[job.agentType];
              return (
                <Tr key={job.id}>
                  <Td>
                    <span className="font-mono-tech text-[10px] text-slate-500">
                      {truncateId(job.id)}
                    </span>
                  </Td>
                  <Td>
                    <span
                      className="font-mono-tech text-xs font-bold"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </Td>
                  <Td>
                    <Badge color={JOB_STATUS_COLOR[job.status]} size="sm"
                      pulse={job.status === "RUNNING"}>
                      {job.status}
                    </Badge>
                  </Td>
                  <Td>
                    {job.status === "RUNNING" ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-bg-elevated overflow-hidden min-w-20">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full bg-neon-cyan"
                            style={{ boxShadow: "0 0 4px #00f0ff" }}
                          />
                        </div>
                        <span className="font-mono-tech text-[10px] text-neon-cyan shrink-0">
                          {job.progress}%
                        </span>
                        <Spinner size="sm" />
                      </div>
                    ) : (
                      <span className="font-mono-tech text-[10px] text-slate-600">
                        {job.status === "COMPLETED" ? "100%" : `${job.progress}%`}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className="font-mono-tech text-[10px] text-slate-400">
                      {job.prospectName ?? job.clientName ?? "—"}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-mono-tech text-[10px] text-slate-500">
                      {job.durationMs !== null ? formatDuration(job.durationMs) : "—"}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-mono-tech text-[10px] text-slate-500">
                      {job.costEur !== null ? formatCurrency(job.costEur) : "—"}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveJob(job)}
                        className="rounded border border-border-subtle p-1.5 text-slate-500 hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors"
                        aria-label="View job details"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      {(job.status === "QUEUED" || job.status === "RUNNING") && (
                        <button
                          className="rounded border border-border-subtle p-1.5 text-slate-500 hover:border-neon-red/50 hover:text-neon-red transition-colors"
                          aria-label="Cancel job"
                        >
                          <XCircle className="h-3 w-3" />
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
      <JobDetailModal job={activeJob} onClose={() => setActiveJob(null)} />
    </PageWrapper>
  );
}
