// API client per il portale cliente
// Comunica con /portal/* endpoints del backend

const API_BASE =
  process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

// --- Types ---

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  client: {
    id: string;
    email: string;
    companyName: string;
    contactName: string;
    plan: "STARTER" | "GROWTH" | "ENTERPRISE";
    status: "ACTIVE" | "AT_RISK" | "PAUSED";
  };
}

export interface DashboardData {
  kpis: Array<{
    label: string;
    value: number;
    previousValue: number;
    unit: string;
  }>;
  chart30d: Array<{
    date: string;
    visite: number;
    lead: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface ClientWebsite {
  id: string;
  domain: string;
  status: "BUILDING" | "LIVE" | "MAINTENANCE";
  screenshotUrl: string | null;
  activatedAt: string | null;
  buildProgress: number;
  lighthouse: {
    performance: number;
    accessibility: number;
    seo: number;
    bestPractices: number;
  };
  analytics: {
    visite7d: number;
    bounceRate: number;
    sessionAvg: string;
    chart7d: Array<{ day: string; visite: number }>;
  };
  plausibleUrl: string;
}

export interface SupportTicket {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface ClientChatbot {
  id: string;
  enabled: boolean;
  stats: {
    totalConversations: number;
    avgRating: number;
    resolvedRate: number;
  };
  recentConversations: Array<{
    id: string;
    summary: string;
    timestamp: string;
  }>;
}

export interface ClientAutomation {
  id: string;
  name: string;
  enabled: boolean;
  runCount: number;
  timeSavedMinutes: number;
  lastRunAt: string | null;
}

export interface ClientInvoice {
  id: string;
  date: string;
  type: string;
  amount: number;
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  pdfUrl: string | null;
  description: string;
}

export interface BillingInfo {
  plan: "STARTER" | "GROWTH" | "ENTERPRISE";
  status: "ACTIVE" | "AT_RISK" | "PAUSED";
  nextChargeDate: string;
  nextChargeAmount: number;
  clientSince: string;
  paymentMethod: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  } | null;
}

// --- HTTP helpers ---

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_token");
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Token expired — redirect to login
    if (typeof window !== "undefined") {
      localStorage.removeItem("mc_token");
      localStorage.removeItem("mc_refresh");
      localStorage.removeItem("mc_user");
      window.location.href = "/login";
    }
    throw new Error("Sessione scaduta");
  }

  const data = (await res.json()) as { success: boolean; data?: T; error?: string };

  if (!res.ok || !data.success) {
    throw new Error(data.error ?? "Errore di rete");
  }

  return data.data as T;
}

// --- Auth ---

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/portal/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as {
    success: boolean;
    data?: AuthResponse;
    error?: string;
  };

  if (!res.ok || !data.success) {
    throw new Error(data.error ?? "Credenziali non valide");
  }

  return data.data!;
}

// --- Dashboard ---

export async function getDashboard(): Promise<DashboardData> {
  return apiFetch<DashboardData>("/portal/dashboard");
}

// --- Website ---

export async function getWebsites(): Promise<ClientWebsite[]> {
  return apiFetch<ClientWebsite[]>("/portal/websites");
}

export async function requestSiteChange(
  websiteId: string,
  description: string,
  attachments: string[] = []
): Promise<SupportTicket> {
  return apiFetch<SupportTicket>("/portal/support/tickets", {
    method: "POST",
    body: JSON.stringify({
      type: "site_change",
      websiteId,
      description,
      attachments,
    }),
  });
}

// --- Chatbot ---

export async function getChatbot(): Promise<ClientChatbot> {
  return apiFetch<ClientChatbot>("/portal/chatbot");
}

// --- Automazioni ---

export async function getAutomations(): Promise<ClientAutomation[]> {
  return apiFetch<ClientAutomation[]>("/portal/automations");
}

// --- Fatturazione ---

export async function getInvoices(): Promise<ClientInvoice[]> {
  return apiFetch<ClientInvoice[]>("/portal/billing/invoices");
}

export async function getBillingInfo(): Promise<BillingInfo> {
  return apiFetch<BillingInfo>("/portal/billing");
}

export async function getBillingPortalUrl(): Promise<string> {
  const data = await apiFetch<{ url: string }>("/portal/billing/portal");
  return data.url;
}

export async function upgradePlan(
  plan: "GROWTH" | "ENTERPRISE"
): Promise<string> {
  const data = await apiFetch<{ checkoutUrl: string }>(
    "/portal/billing/upgrade",
    {
      method: "POST",
      body: JSON.stringify({ plan }),
    }
  );
  return data.checkoutUrl;
}

// --- Files ---

export async function uploadFiles(files: File[]): Promise<string[]> {
  const token = getToken();
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const res = await fetch(`${API_BASE}/portal/files/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = (await res.json()) as { success: boolean; data?: { urls: string[] }; error?: string };

  if (!res.ok || !data.success) {
    throw new Error(data.error ?? "Upload fallito");
  }

  return data.data?.urls ?? [];
}
