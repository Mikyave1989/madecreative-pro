const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

// ─── Token Management ──────────────────────────────────────────

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_access_token");
}

function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem("mc_access_token", accessToken);
  localStorage.setItem("mc_refresh_token", refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem("mc_access_token");
  localStorage.removeItem("mc_refresh_token");
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("mc_refresh_token");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

// ─── Fetch Wrapper ─────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Types ─────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminUser;
}

export type ProspectStatus =
  | "SCRAPED"
  | "QUALIFIED"
  | "PREVIEW_READY"
  | "CONTACTED"
  | "FOLLOWED_UP"
  | "REPLIED"
  | "CONVERTED"
  | "LOST"
  | "BLACKLISTED";

export interface Prospect {
  id: string;
  companyName: string;
  website: string;
  country: string;
  sector: string;
  leadScore: number;
  status: ProspectStatus;
  painPoints: string[];
  suggestedServices: string[];
  aiAnalysis: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProspectFilters {
  search?: string;
  country?: string;
  sector?: string;
  status?: ProspectStatus[];
  minScore?: number;
  maxScore?: number;
  sortBy?: "score" | "createdAt" | "country";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProspectStats {
  total: number;
  today: number;
  byStatus: Record<ProspectStatus, number>;
  conversionRate: number;
}

export type AgentType =
  | "SCRAPER"
  | "ANALYZER"
  | "BUILDER"
  | "OUTREACH"
  | "QA";

export type JobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface AgentJob {
  id: string;
  agentType: AgentType;
  status: JobStatus;
  progress: number;
  prospectId: string | null;
  prospectName: string | null;
  clientId: string | null;
  clientName: string | null;
  durationMs: number | null;
  costEur: number | null;
  logs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentJobFilters {
  agentType?: AgentType;
  status?: JobStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AgentStats {
  agentType: AgentType;
  status: "IDLE" | "RUNNING" | "ERROR";
  jobsToday: number;
  costTodayEur: number;
  lastRunAt: string | null;
}

export interface DashboardMetrics {
  totalClients: number;
  mrr: number;
  prospectsToday: number;
  prospectsTrend: number;
  activeJobs: number;
  conversionRate: number;
  pipeline: Record<ProspectStatus, number>;
}

// ─── Auth ──────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export function logout(): void {
  clearTokens();
}

// ─── Prospects ─────────────────────────────────────────────────

export async function getProspects(
  filters: ProspectFilters = {}
): Promise<PaginatedResponse<Prospect>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      if (Array.isArray(v)) {
        v.forEach((item: string) => params.append(k, item));
      } else {
        params.set(k, String(v));
      }
    }
  });
  return apiFetch<PaginatedResponse<Prospect>>(
    `/prospects?${params.toString()}`
  );
}

export async function getProspectStats(): Promise<ProspectStats> {
  return apiFetch<ProspectStats>("/prospects/stats");
}

// ─── Agent Jobs ────────────────────────────────────────────────

export async function getAgentJobs(
  filters: AgentJobFilters = {}
): Promise<PaginatedResponse<AgentJob>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.set(k, String(v));
  });
  return apiFetch<PaginatedResponse<AgentJob>>(
    `/agent-jobs?${params.toString()}`
  );
}

export async function getAgentStats(): Promise<AgentStats[]> {
  return apiFetch<AgentStats[]>("/agent-jobs/stats");
}

export async function cancelJob(jobId: string): Promise<void> {
  await apiFetch(`/agent-jobs/${jobId}/cancel`, { method: "POST" });
}

// ─── Actions ──────────────────────────────────────────────────

export async function bulkAnalyze(prospectIds: string[]): Promise<void> {
  await apiFetch("/prospects/bulk-analyze", {
    method: "POST",
    body: JSON.stringify({ prospectIds }),
  });
}

export async function startScrape(config: {
  sector?: string;
  country?: string;
  limit?: number;
}): Promise<AgentJob> {
  return apiFetch<AgentJob>("/scraper/start", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

// ─── Metrics ──────────────────────────────────────────────────

export async function getMetrics(): Promise<DashboardMetrics> {
  return apiFetch<DashboardMetrics>("/metrics/dashboard");
}
