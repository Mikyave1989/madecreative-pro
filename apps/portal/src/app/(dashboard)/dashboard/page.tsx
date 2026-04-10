"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  Bot,
  Pencil,
  Download,
  FileText,
  CreditCard,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  domain: string;
  siteStatus: "LIVE" | "BUILDING" | "MAINTENANCE";
  visitsThisMonth: number;
  visitsTrend: number; // percent vs last month
  chatbot: {
    conversationsThisMonth: number;
    resolvedRate: number; // 0-100
  };
  plan: string;
  nextChargeDate: string;
  nextChargeAmount: number;
  clientSince: string;
}

interface ReportItem {
  id: string;
  month: number;
  year: number;
  pdfUrl: string | null;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_token");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Trend badge ──────────────────────────────────────────────────────────────

function TrendBadge({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
        <TrendingUp className="w-3 h-3" />
        +{value}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
        <TrendingDown className="w-3 h-3" />
        {value}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" />
      0%
    </span>
  );
}

// ─── Site status pill ─────────────────────────────────────────────────────────

function SiteStatusPill({ status }: { status: DashboardData["siteStatus"] }) {
  const map = {
    LIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    BUILDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    MAINTENANCE: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  const labels = { LIVE: "Live", BUILDING: "In costruzione", MAINTENANCE: "Manutenzione" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "LIVE" ? "bg-emerald-400 animate-pulse" : status === "BUILDING" ? "bg-amber-400" : "bg-slate-400"}`} />
      {labels[status]}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [dashRes, reportsRes] = await Promise.all([
        fetch(`${API_URL}/portal/dashboard`, { headers }),
        fetch(`${API_URL}/portal/reports`, { headers }),
      ]);

      const dashJson = (await dashRes.json()) as { success: boolean; data?: DashboardData; error?: string };
      const reportsJson = (await reportsRes.json()) as {
        success: boolean;
        data?: { reports: ReportItem[] };
        error?: string;
      };

      if (!dashJson.success) throw new Error(dashJson.error ?? "Errore dashboard");
      setDashboard(dashJson.data!);

      if (reportsJson.success && reportsJson.data) {
        setReports(reportsJson.data.reports.slice(0, 3));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-400">{error ?? "Dati non disponibili"}</p>
        <button
          onClick={() => void load()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-white">Il tuo sito</h2>
        <p className="text-sm text-slate-400 mt-1">Panoramica del mese corrente</p>
      </div>

      {/* Site card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Sito live</p>
                <a
                  href={`https://${dashboard.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-base font-semibold text-white hover:text-indigo-400 transition-colors"
                >
                  {dashboard.domain}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <SiteStatusPill status={dashboard.siteStatus} />
          </div>

          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-colors self-start"
          >
            <Pencil className="w-4 h-4" />
            Modifica il tuo sito
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Visits */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-600/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-sm text-slate-400 font-medium">Visite questo mese</span>
            </div>
            <TrendBadge value={dashboard.visitsTrend} />
          </div>
          <p className="text-4xl font-bold text-white tabular-nums">
            {dashboard.visitsThisMonth.toLocaleString("it-IT")}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {dashboard.visitsTrend > 0
              ? `+${Math.round(Math.abs(dashboard.visitsTrend) * dashboard.visitsThisMonth / (100 + dashboard.visitsTrend))} rispetto al mese scorso`
              : dashboard.visitsTrend < 0
              ? `${Math.round(Math.abs(dashboard.visitsTrend) * dashboard.visitsThisMonth / (100 - Math.abs(dashboard.visitsTrend)))} in meno rispetto al mese scorso`
              : "In linea con il mese scorso"}
          </p>
        </div>

        {/* Chatbot */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-sm text-slate-400 font-medium">Chatbot</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold text-white tabular-nums">
                {dashboard.chatbot.conversationsThisMonth}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Conversazioni</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-400 tabular-nums">
                {dashboard.chatbot.resolvedRate}%
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Tasso risoluzione</p>
            </div>
          </div>
          {/* Resolution bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${dashboard.chatbot.resolvedRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reports + Account row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Reports */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-slate-300" />
              </div>
              <span className="text-sm font-semibold text-white">Report mensili</span>
            </div>
            <Link
              href="/reports"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Vedi tutti
            </Link>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                Nessun report ancora. Il primo arrivera a fine mese.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => {
                const monthName = MONTH_NAMES[(report.month - 1) % 12] ?? String(report.month);
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {monthName} {report.year}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(report.createdAt).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                    </div>
                    {report.pdfUrl ? (
                      <a
                        href={report.pdfUrl}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 text-indigo-400 text-xs font-medium rounded-lg hover:bg-indigo-600/40 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600">In generazione</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Account quick */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-slate-300" />
            </div>
            <span className="text-sm font-semibold text-white">Account</span>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Piano</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 bg-indigo-600/20 text-indigo-400 text-sm font-bold rounded-lg border border-indigo-600/30">
                  {dashboard.plan}
                </span>
                <span className="text-sm font-bold text-white">€{dashboard.nextChargeAmount}/mese</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Prossimo addebito</p>
              <p className="text-sm font-semibold text-white">{formatDate(dashboard.nextChargeDate)}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Cliente dal</p>
              <p className="text-sm font-semibold text-white">{formatDate(dashboard.clientSince)}</p>
            </div>
          </div>

          <Link
            href="/billing"
            className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-700 hover:text-white transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Gestisci account
          </Link>
        </div>
      </div>
    </div>
  );
}
