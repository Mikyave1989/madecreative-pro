"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  MessageSquare,
  Share2,
  Zap,
  DollarSign,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportMetrics {
  websiteVisits: number;
  bounceRate?: number;
  leadsGenerated: number;
  leadsConverted: number;
  conversionRate: number;
  revenueAttributed: number;
  timeSavedHours: number;
  socialReach: number;
  socialEngagement: number;
  socialPostsPublished?: number;
  chatbotConversations: number;
  chatbotResolved: number;
  automationRuns?: number;
}

interface ReportData {
  metrics: ReportMetrics;
  insights: string[];
  recommendations: string[];
  nextMonthGoals: string[];
}

interface MonthlyReport {
  id: string;
  month: number;
  year: number;
  pdfUrl: string | null;
  sentAt: string | null;
  createdAt: string;
  data: ReportData;
}

interface ReportsData {
  reports: MonthlyReport[];
  canGenerateNow: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const API_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

const MONTH_NAMES = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_token");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "indigo",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color?: "indigo" | "green" | "blue" | "purple" | "orange";
}) {
  const colorMap = {
    indigo: "bg-indigo-100 text-indigo-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}
      >
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function ReportSummary({ report }: { report: MonthlyReport }) {
  const m = report.data.metrics;
  const monthName = MONTH_NAMES[(report.month - 1) % 12] ?? String(report.month);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-gray-900">
          {monthName} {report.year}
        </h3>
        {report.pdfUrl && (
          <Badge variant="success" className="ml-auto text-xs">
            PDF disponibile
          </Badge>
        )}
      </div>

      {/* Executive summary */}
      {report.data.insights.length > 0 && (
        <div className="bg-indigo-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">
            Executive Summary
          </p>
          <ul className="space-y-1">
            {report.data.insights.slice(0, 4).map((insight, i) => (
              <li
                key={i}
                className="text-sm text-indigo-800 flex items-start gap-2"
              >
                <span className="text-indigo-400 mt-0.5">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          icon={TrendingUp}
          label="Visite sito"
          value={m.websiteVisits.toLocaleString("it-IT")}
          sub={m.bounceRate ? `Bounce rate: ${m.bounceRate}%` : undefined}
          color="blue"
        />
        <MetricCard
          icon={Users}
          label="Lead generati"
          value={String(m.leadsGenerated)}
          sub={`${m.leadsConverted} convertiti (${m.conversionRate}%)`}
          color="green"
        />
        <MetricCard
          icon={MessageSquare}
          label="Conversazioni chatbot"
          value={String(m.chatbotConversations)}
          sub={`${m.chatbotResolved}% risolte`}
          color="purple"
        />
        <MetricCard
          icon={Clock}
          label="Ore risparmiate"
          value={`${m.timeSavedHours}h`}
          sub={m.automationRuns ? `${m.automationRuns} esecuzioni` : undefined}
          color="orange"
        />
        {(m.socialPostsPublished ?? 0) > 0 && (
          <MetricCard
            icon={Share2}
            label="Post social"
            value={String(m.socialPostsPublished ?? 0)}
            sub={`Reach: ${m.socialReach.toLocaleString("it-IT")}`}
            color="indigo"
          />
        )}
        {m.revenueAttributed > 0 && (
          <MetricCard
            icon={DollarSign}
            label="Valore attribuito"
            value={`€${m.revenueAttributed.toLocaleString("it-IT")}`}
            color="green"
          />
        )}
      </div>

      {/* Recommendations */}
      {report.data.recommendations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Raccomandazioni
          </p>
          <ul className="space-y-1.5">
            {report.data.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-indigo-500 font-bold mt-0.5">
                  {i + 1}.
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ROI */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4" />
          <p className="text-sm font-semibold">ROI stimato</p>
        </div>
        <p className="text-2xl font-bold">
          {m.revenueAttributed > 0
            ? `${Math.round((m.revenueAttributed / 297) * 10) / 10}x`
            : `${Math.round((m.leadsGenerated * 150) / 297 * 10) / 10}x`}
        </p>
        <p className="text-xs text-indigo-200 mt-0.5">
          Valore stimato vs costo abbonamento
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(
    null
  );
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/portal/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: ReportsData;
        error?: string;
      };
      if (!json.success) throw new Error(json.error ?? "Errore");
      setData(json.data!);
      if (json.data?.reports[0]) {
        setSelectedReport(json.data.reports[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    void loadData();
  });

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/portal/reports/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { message: string };
        error?: string;
      };
      if (!json.success) throw new Error(json.error);
      toast.success(json.data?.message ?? "Generazione avviata");
      setTimeout(() => void loadData(), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore nella generazione");
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600">{error}</p>
        <Button onClick={() => void loadData()}>Riprova</Button>
      </div>
    );
  }

  const reports = data?.reports ?? [];
  const canGenerateNow = data?.canGenerateNow ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report mensili</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {reports.length} report disponibili
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void loadData()}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Aggiorna
          </Button>
          {canGenerateNow && (
            <Button onClick={() => void handleGenerate()} disabled={generating}>
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Genera ora
            </Button>
          )}
        </div>
      </div>

      {reports.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">
            Nessun report disponibile. I report vengono generati automaticamente
            il primo giorno di ogni mese.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report list (sidebar) */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              Seleziona report
            </p>
            {reports.map((report) => {
              const monthName =
                MONTH_NAMES[(report.month - 1) % 12] ?? String(report.month);
              const isSelected = selectedReport?.id === report.id;

              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? "border-indigo-300 bg-indigo-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm font-semibold ${isSelected ? "text-indigo-700" : "text-gray-900"}`}
                      >
                        {monthName} {report.year}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Generato il{" "}
                        {new Date(report.createdAt).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {report.pdfUrl && (
                        <Badge variant="success" className="text-xs">
                          PDF
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Report detail */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <Card className="p-6">
                {/* Actions */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm font-semibold text-gray-900">
                      Dettaglio report
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedReport.pdfUrl ? (
                      <a
                        href={selectedReport.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Scarica PDF
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        PDF in generazione
                      </span>
                    )}
                  </div>
                </div>

                <ReportSummary report={selectedReport} />
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-400 text-sm">
                  Seleziona un report dalla lista
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
