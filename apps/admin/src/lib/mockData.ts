import type {
  Prospect,
  AgentJob,
  AgentStats,
  DashboardMetrics,
  ProspectStatus,
  AgentType,
  JobStatus,
} from "./api";

// ─── Dashboard Metrics ─────────────────────────────────────────

export const MOCK_METRICS: DashboardMetrics = {
  totalClients: 24,
  mrr: 18500,
  prospectsToday: 47,
  prospectsTrend: 12,
  activeJobs: 3,
  conversionRate: 8.4,
  pipeline: {
    SCRAPED: 312,
    ANALYZING: 87,
    QUALIFIED: 54,
    CONTACTED: 31,
    REPLIED: 12,
    CONVERTED: 8,
    REJECTED: 203,
  },
};

// ─── Prospects ─────────────────────────────────────────────────

const STATUS_LIST: ProspectStatus[] = [
  "SCRAPED",
  "ANALYZING",
  "QUALIFIED",
  "CONTACTED",
  "REPLIED",
  "CONVERTED",
  "REJECTED",
];

const SECTORS = [
  "E-commerce",
  "SaaS",
  "Healthcare",
  "Real Estate",
  "Finance",
  "Education",
  "Food & Beverage",
  "Fashion",
  "Legal",
  "Logistics",
];

const COUNTRIES = ["IT", "DE", "FR", "ES", "NL", "PL", "SE", "GB", "AT", "BE"];

function makeProspect(i: number): Prospect {
  const score = Math.floor(Math.random() * 100);
  const statusIdx = Math.floor(Math.random() * STATUS_LIST.length);
  return {
    id: `prospect-${String(i).padStart(4, "0")}`,
    companyName: [
      "Artigianato Digitale",
      "TechNord GmbH",
      "Saveur Connect",
      "ModaVera SRL",
      "LegalEdge BV",
      "HealthPlus AG",
      "EduSpark Ltd",
      "FreshMarket SPA",
      "CloudWave OÜ",
      "PrimeLaw Cabinet",
    ][i % 10] + ` ${i}`,
    website: `https://company${i}.example.com`,
    country: COUNTRIES[i % COUNTRIES.length],
    sector: SECTORS[i % SECTORS.length],
    leadScore: score,
    status: STATUS_LIST[statusIdx],
    painPoints: [
      "No digital presence",
      "Outdated website",
      "Low search ranking",
      "No social strategy",
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    suggestedServices: ["SEO", "Web Design", "Social Media", "Content"].slice(
      0,
      Math.floor(Math.random() * 3) + 1
    ),
    aiAnalysis:
      score > 60
        ? `This company shows strong potential for digital transformation. The website lacks modern UX and has minimal SEO presence. Recommended approach: full redesign + content strategy.`
        : null,
    createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
    updatedAt: new Date(Date.now() - i * 1_800_000).toISOString(),
  };
}

export const MOCK_PROSPECTS: Prospect[] = Array.from({ length: 60 }, (_, i) =>
  makeProspect(i)
);

// ─── Agent Jobs ────────────────────────────────────────────────

const AGENT_TYPES: AgentType[] = [
  "SCRAPER",
  "ANALYZER",
  "BUILDER",
  "OUTREACH",
  "CHATBOT",
  "QA",
  "SOCIAL",
];

const JOB_STATUSES: JobStatus[] = [
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];

function makeJob(i: number): AgentJob {
  const statusIdx = Math.floor(Math.random() * JOB_STATUSES.length);
  const status = JOB_STATUSES[statusIdx];
  const agentType = AGENT_TYPES[i % AGENT_TYPES.length];
  const progress =
    status === "COMPLETED"
      ? 100
      : status === "RUNNING"
        ? Math.floor(Math.random() * 80) + 10
        : status === "FAILED"
          ? Math.floor(Math.random() * 60)
          : 0;

  return {
    id: `job-${String(i).padStart(6, "0")}`,
    agentType,
    status,
    progress,
    prospectId: i % 3 === 0 ? `prospect-${String(i).padStart(4, "0")}` : null,
    prospectName: i % 3 === 0 ? `Company ${i}` : null,
    clientId: i % 3 === 1 ? `client-${String(i).padStart(4, "0")}` : null,
    clientName: i % 3 === 1 ? `Client ${i}` : null,
    durationMs:
      status === "COMPLETED" || status === "FAILED"
        ? Math.floor(Math.random() * 30000) + 2000
        : null,
    costEur:
      status === "COMPLETED"
        ? parseFloat((Math.random() * 0.5).toFixed(4))
        : null,
    logs: [
      `[${new Date().toISOString()}] Job ${String(i).padStart(6, "0")} started`,
      `[${new Date().toISOString()}] Processing...`,
      status === "COMPLETED"
        ? `[${new Date().toISOString()}] Completed successfully`
        : status === "FAILED"
          ? `[${new Date().toISOString()}] ERROR: Request timeout`
          : `[${new Date().toISOString()}] In progress...`,
    ],
    createdAt: new Date(Date.now() - i * 600_000).toISOString(),
    updatedAt: new Date(Date.now() - i * 300_000).toISOString(),
  };
}

export const MOCK_JOBS: AgentJob[] = Array.from({ length: 50 }, (_, i) =>
  makeJob(i)
);

// ─── Agent Stats ───────────────────────────────────────────────

export const MOCK_AGENT_STATS: AgentStats[] = AGENT_TYPES.map((type, i) => ({
  agentType: type,
  status: (["IDLE", "RUNNING", "IDLE", "IDLE", "IDLE", "IDLE", "IDLE"] as const)[i],
  // CHATBOT at index 4 has realistic stats
  jobsToday: [14, 8, 3, 6, 9, 2, 5][i],
  costTodayEur: [0.42, 1.87, 0.0, 0.31, 0.12, 0.05, 0.28][i],
  lastRunAt:
    i === 1
      ? new Date().toISOString()
      : i === 4
        ? new Date(Date.now() - 25 * 60 * 1000).toISOString() // 25 min ago
        : new Date(Date.now() - (i + 1) * 3_600_000).toISOString(),
}));

// ─── Recent Jobs (for live feed) ──────────────────────────────

export const MOCK_RECENT_JOBS = MOCK_JOBS.slice(0, 10);
