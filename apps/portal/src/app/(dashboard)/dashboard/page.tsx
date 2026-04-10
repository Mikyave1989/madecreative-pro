"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Bot,
  Pencil,
  FileText,
  CreditCard,
  ExternalLink,
  Loader2,
  AlertCircle,
  BarChart3,
  Gauge,
} from "lucide-react";

// ─── Types matching real API response ────────────────────────────────────────

interface ApiDashboard {
  client: {
    id: string;
    companyName: string;
    contactName: string | null;
    status: string;
    language: string;
    sector: string;
    createdAt: string;
  };
  stats: {
    totalRevenue: number;
    chatbotConversations: number;
    chatbotResolvedRate: number;
    monthlyVisits: number;
    lighthouseScore: number | null;
  };
  website: {
    id: string;
    domain: string;
    monthlyVisits: number;
    lighthouseScore: number | null;
    deployUrl: string | null;
  } | null;
  chatbot: {
    id: string;
    isActive: boolean;
    totalConversations: number;
    resolvedRate: number;
  } | null;
  lastReport: {
    id: string;
    month: number;
    year: number;
    pdfUrl: string | null;
    sentAt: string | null;
  } | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Main ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<ApiDashboard | null>(null);
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

      const res = await fetch(`${API_URL}/portal/dashboard`, { headers });
      const json = (await res.json()) as { success: boolean; data?: ApiDashboard; error?: string };

      if (!json.success) throw new Error(json.error ?? "Errore dashboard");
      setData(json.data!);
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

  if (error || !data) {
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

  const { client, stats, website, chatbot, lastReport } = data;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-white">
          Ciao, {client.contactName ?? client.companyName}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Panoramica di {client.companyName}
        </p>
      </div>

      {/* Site card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                  Il tuo sito
                </p>
                {website ? (
                  <a
                    href={website.deployUrl ?? `https://${website.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-base font-semibold text-white hover:text-indigo-400 transition-colors"
                  >
                    {website.domain}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">Sito non ancora generato</p>
                )}
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
              website
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${website ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {website ? "Live" : "In preparazione"}
            </span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Monthly visits */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-violet-600/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-xs text-slate-400 font-medium">Visite / mese</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {stats.monthlyVisits.toLocaleString("it-IT")}
          </p>
        </div>

        {/* Lighthouse */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center">
              <Gauge className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-slate-400 font-medium">Lighthouse</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {stats.lighthouseScore != null ? `${stats.lighthouseScore}/100` : "—"}
          </p>
        </div>

        {/* Chatbot conversations */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-xs text-slate-400 font-medium">Conversazioni</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {chatbot?.totalConversations ?? stats.chatbotConversations}
          </p>
        </div>

        {/* Chatbot resolved rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-slate-400 font-medium">Tasso risoluzione</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">
            {chatbot?.resolvedRate ?? stats.chatbotResolvedRate}%
          </p>
          <div className="mt-2">
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${chatbot?.resolvedRate ?? stats.chatbotResolvedRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reports + Account */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reports */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
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

          {!lastReport ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                Nessun report ancora. Il primo arrivera a fine mese.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {MONTH_NAMES[(lastReport.month - 1) % 12]} {lastReport.year}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lastReport.sentAt ? formatDate(lastReport.sentAt) : "In preparazione"}
                  </p>
                </div>
              </div>
              {lastReport.pdfUrl && (
                <a
                  href={lastReport.pdfUrl}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 text-indigo-400 text-xs font-medium rounded-lg hover:bg-indigo-600/40 transition-colors"
                >
                  PDF
                </a>
              )}
            </div>
          )}
        </div>

        {/* Account */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-slate-300" />
            </div>
            <span className="text-sm font-semibold text-white">Account</span>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Stato</p>
              <span className={`inline-flex items-center px-2.5 py-1 text-sm font-bold rounded-lg border ${
                client.status === "ACTIVE"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}>
                {client.status === "ACTIVE" ? "Attivo" : client.status}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Settore</p>
              <p className="text-sm font-semibold text-white capitalize">{client.sector}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Cliente dal</p>
              <p className="text-sm font-semibold text-white">{formatDate(client.createdAt)}</p>
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
