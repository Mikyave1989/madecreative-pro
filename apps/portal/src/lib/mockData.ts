// Mock data realistici per sviluppo del portale cliente

export type Plan = "FREE" | "STARTER" | "GROWTH" | "PRO";
export type ClientStatus = "ACTIVE" | "CHURNED" | "REFUNDED";
export type WebsiteStatus = "BUILDING" | "LIVE" | "MAINTENANCE";
export type InvoiceStatus = "PAID" | "PENDING" | "FAILED" | "REFUNDED";
export type ActivityType =
  | "nuovo_lead"
  | "conversazione_chatbot"
  | "modifica_sito"
  | "fattura_pagata"
  | "report_disponibile";

export interface MockUser {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  plan: Plan;
  status: ClientStatus;
  createdAt: string;
  avatarInitials: string;
}

export interface KpiData {
  label: string;
  value: number;
  previousValue: number;
  unit?: string;
  prefix?: string;
}

export interface ChartPoint {
  date: string;
  visite: number;
  lead: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  meta?: Record<string, string | number>;
}

export interface LighthouseScores {
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
}

export interface WebsiteAnalytics {
  visite7d: number;
  bounceRate: number;
  sessionAvg: string;
  chart7d: Array<{ day: string; visite: number }>;
}

export interface MockWebsite {
  id: string;
  domain: string;
  status: WebsiteStatus;
  screenshotUrl: string | null;
  activatedAt: string | null;
  buildProgress: number;
  lighthouse: LighthouseScores;
  analytics: WebsiteAnalytics;
  plausibleUrl: string;
}

export interface MockInvoice {
  id: string;
  date: string;
  type: "Setup fee" | "Mensile" | "Annuale";
  amount: number;
  status: InvoiceStatus;
  pdfUrl: string | null;
  description: string;
}

export interface BillingInfo {
  plan: Plan;
  status: ClientStatus;
  nextChargeDate: string;
  nextChargeAmount: number;
  trialEndsAt: string | null;
  clientSince: string;
  paymentMethod: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  } | null;
}

// --- User mock ---
export const mockUser: MockUser = {
  id: "client_01",
  email: "marco.rossi@example.it",
  companyName: "Rossi Impianti S.r.l.",
  contactName: "Marco Rossi",
  plan: "GROWTH",
  status: "ACTIVE",
  createdAt: "2025-10-15T09:00:00Z",
  avatarInitials: "MR",
};

// --- Dashboard KPIs ---
export const mockKpis: KpiData[] = [
  {
    label: "Visite sito",
    value: 1842,
    previousValue: 1534,
    unit: "visite",
  },
  {
    label: "Lead ricevuti",
    value: 23,
    previousValue: 18,
    unit: "lead",
  },
  {
    label: "Conversazioni chatbot",
    value: 67,
    previousValue: 71,
    unit: "chat",
  },
  {
    label: "Ore risparmiate",
    value: 12,
    previousValue: 9,
    unit: "ore",
  },
];

// --- Chart 30 giorni ---
function generateChart30d(): ChartPoint[] {
  const points: ChartPoint[] = [];
  const today = new Date(2026, 3, 7); // April 7, 2026
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const day = d.toISOString().split("T")[0]!;
    points.push({
      date: day,
      visite: Math.floor(40 + Math.random() * 80 + (i < 10 ? 20 : 0)),
      lead: Math.floor(0 + Math.random() * 4),
    });
  }
  return points;
}

export const mockChart30d: ChartPoint[] = generateChart30d();

// --- Recent activities ---
export const mockActivities: Activity[] = [
  {
    id: "act_01",
    type: "nuovo_lead",
    description: "Nuovo lead da Mario Bianchi — Ristrutturazione bagno",
    timestamp: "2026-04-07T08:32:00Z",
  },
  {
    id: "act_02",
    type: "conversazione_chatbot",
    description: "Il chatbot ha gestito una richiesta di preventivo",
    timestamp: "2026-04-07T07:15:00Z",
  },
  {
    id: "act_03",
    type: "modifica_sito",
    description: "Modifica completata: aggiornati orari di apertura",
    timestamp: "2026-04-06T16:45:00Z",
  },
  {
    id: "act_04",
    type: "nuovo_lead",
    description: "Nuovo lead da Giulia Verdi — Impianto riscaldamento",
    timestamp: "2026-04-06T14:20:00Z",
  },
  {
    id: "act_05",
    type: "fattura_pagata",
    description: "Pagamento mensile confermato — Aprile 2026 €149",
    timestamp: "2026-04-05T10:00:00Z",
  },
  {
    id: "act_06",
    type: "conversazione_chatbot",
    description: "Il chatbot ha risposto a 4 domande sulle tariffe",
    timestamp: "2026-04-04T19:30:00Z",
  },
  {
    id: "act_07",
    type: "report_disponibile",
    description: "Report mensile Marzo 2026 disponibile",
    timestamp: "2026-04-03T08:00:00Z",
  },
  {
    id: "act_08",
    type: "nuovo_lead",
    description: "Nuovo lead da Luca Ferrari — Manutenzione caldaia",
    timestamp: "2026-04-02T11:45:00Z",
  },
  {
    id: "act_09",
    type: "conversazione_chatbot",
    description: "Il chatbot ha gestito una richiesta di appuntamento",
    timestamp: "2026-04-01T15:10:00Z",
  },
  {
    id: "act_10",
    type: "modifica_sito",
    description: "Modifica completata: aggiunte 3 foto di lavori recenti",
    timestamp: "2026-03-31T13:00:00Z",
  },
];

// --- Website ---
export const mockWebsite: MockWebsite = {
  id: "site_01",
  domain: "rossiimpianti.it",
  status: "LIVE",
  screenshotUrl: null, // In produzione sarebbe un URL R2
  activatedAt: "2025-11-02T10:00:00Z",
  buildProgress: 100,
  lighthouse: {
    performance: 94,
    accessibility: 98,
    seo: 100,
    bestPractices: 96,
  },
  analytics: {
    visite7d: 412,
    bounceRate: 38.2,
    sessionAvg: "2m 47s",
    chart7d: [
      { day: "Lun", visite: 55 },
      { day: "Mar", visite: 72 },
      { day: "Mer", visite: 48 },
      { day: "Gio", visite: 91 },
      { day: "Ven", visite: 67 },
      { day: "Sab", visite: 43 },
      { day: "Dom", visite: 36 },
    ],
  },
  plausibleUrl: "https://plausible.io/rossiimpianti.it",
};

// --- Invoices ---
export const mockInvoices: MockInvoice[] = [
  {
    id: "inv_01",
    date: "2026-04-05",
    type: "Mensile",
    amount: 149,
    status: "PAID",
    pdfUrl: "#",
    description: "Piano GROWTH — Aprile 2026",
  },
  {
    id: "inv_02",
    date: "2026-03-05",
    type: "Mensile",
    amount: 149,
    status: "PAID",
    pdfUrl: "#",
    description: "Piano GROWTH — Marzo 2026",
  },
  {
    id: "inv_03",
    date: "2026-02-05",
    type: "Mensile",
    amount: 149,
    status: "PAID",
    pdfUrl: "#",
    description: "Piano GROWTH — Febbraio 2026",
  },
  {
    id: "inv_04",
    date: "2026-01-05",
    type: "Mensile",
    amount: 149,
    status: "PAID",
    pdfUrl: "#",
    description: "Piano GROWTH — Gennaio 2026",
  },
  {
    id: "inv_05",
    date: "2025-12-05",
    type: "Mensile",
    amount: 149,
    status: "PAID",
    pdfUrl: "#",
    description: "Piano GROWTH — Dicembre 2025",
  },
  {
    id: "inv_06",
    date: "2025-11-05",
    type: "Mensile",
    amount: 149,
    status: "PAID",
    pdfUrl: "#",
    description: "Piano GROWTH — Novembre 2025",
  },
  {
    id: "inv_07",
    date: "2025-10-15",
    type: "Setup fee",
    amount: 299,
    status: "PAID",
    pdfUrl: "#",
    description: "Setup iniziale sito web + chatbot",
  },
];

// --- Billing ---
export const mockBilling: BillingInfo = {
  plan: "GROWTH",
  status: "ACTIVE",
  nextChargeDate: "2026-05-05",
  nextChargeAmount: 149,
  trialEndsAt: null,
  clientSince: "2025-10-15",
  paymentMethod: {
    brand: "Visa",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2027,
  },
};

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    color: "gray",
    features: [
      "1 sito web",
      "Sottodominio madecreative",
      "Chatbot base",
      "Report mensile",
    ],
  },
  STARTER: {
    name: "Starter",
    price: 25,
    color: "indigo",
    features: [
      "Sito web 5 pagine",
      "Dominio personalizzato",
      "Chatbot base",
      "1 automazione",
      "Report mensile",
    ],
  },
  GROWTH: {
    name: "Growth",
    price: 50,
    color: "violet",
    features: [
      "Sito web illimitato",
      "Chatbot avanzato",
      "5 automazioni",
      "Social media",
      "Report settimanale",
      "Supporto prioritario",
    ],
  },
  PRO: {
    name: "Pro",
    price: 99,
    color: "amber",
    features: [
      "Tutto di Growth",
      "Automazioni illimitate",
      "Account manager dedicato",
      "SLA 99.9%",
      "Integrazioni custom",
      "Onboarding dedicato",
    ],
  },
} as const;
