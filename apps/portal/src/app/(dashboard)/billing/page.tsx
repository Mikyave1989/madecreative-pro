"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertCircle,
  Coins,
  Sparkles,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillingInfo {
  plan: string;
  status: "ACTIVE" | "CHURNED" | "REFUNDED";
  nextChargeDate: string | null;
  nextChargeAmount: number;
  clientSince: string;
  paymentMethod: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  } | null;
}

interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "PAID" | "PENDING" | "FAILED";
  pdfUrl: string | null;
}

interface Credits {
  remaining: number;
  used: number;
  total: number;
  purchased: number;
  topUpOptions: { credits: number; price: string; priceId: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";
const INVOICES_PER_PAGE = 10;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PAID: "bg-emerald-500/15 text-emerald-400",
  PENDING: "bg-amber-500/15 text-amber-400",
  FAILED: "bg-red-500/15 text-red-400",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  PAID: "Pagata",
  PENDING: "In attesa",
  FAILED: "Fallita",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [billingRes, invoicesRes, creditsRes] = await Promise.all([
        fetch(`${API_URL}/portal/billing`, { headers: authHeaders() }),
        fetch(`${API_URL}/portal/billing/invoices`, { headers: authHeaders() }),
        fetch(`${API_URL}/portal/editor/chat/credits`, { headers: authHeaders() }),
      ]);

      const billingJson = (await billingRes.json()) as { success: boolean; data?: BillingInfo; error?: string };
      const invoicesJson = (await invoicesRes.json()) as { success: boolean; data?: { data: Invoice[]; total: number }; error?: string };
      const creditsJson = (await creditsRes.json()) as { success: boolean; data?: Credits; error?: string };

      if (!billingJson.success) throw new Error(billingJson.error ?? "Errore fatturazione");
      setBilling(billingJson.data!);

      if (invoicesJson.success && invoicesJson.data?.data) {
        setInvoices(invoicesJson.data.data);
      }

      if (creditsJson.success && creditsJson.data) {
        setCredits(creditsJson.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyCredits(pack: string) {
    setBuyingPack(pack);
    try {
      const res = await fetch(`${API_URL}/portal/editor/chat/buy-credits`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ pack }),
      });
      const json = (await res.json()) as { success: boolean; data?: { checkoutUrl?: string; credits?: Credits; added?: number }; error?: string };
      if (json.success && json.data) {
        if (json.data.checkoutUrl) {
          window.open(json.data.checkoutUrl, "_blank");
        } else if (json.data.credits) {
          setCredits(json.data.credits);
          setActionStatus(`${json.data.added ?? 0} crediti aggiunti con successo!`);
        }
      }
    } catch {
      setActionStatus("Errore nell'acquisto dei crediti");
    } finally {
      setBuyingPack(null);
    }
  }

  async function handleBillingPortal() {
    try {
      const res = await fetch(`${API_URL}/portal/billing/portal`, {
        method: "POST",
        headers: authHeaders(),
      });
      const json = (await res.json()) as { success: boolean; data?: { url: string } };
      if (json.success && json.data?.url) {
        window.open(json.data.url, "_blank");
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !billing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-400">{error ?? "Dati non disponibili"}</p>
        <button
          onClick={() => void loadData()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Riprova
        </button>
      </div>
    );
  }

  const totalPages = Math.ceil(invoices.length / INVOICES_PER_PAGE);
  const pageInvoices = invoices.slice(page * INVOICES_PER_PAGE, (page + 1) * INVOICES_PER_PAGE);
  const creditPercent = credits ? Math.round((credits.remaining / credits.total) * 100) : 0;
  const creditLow = credits ? credits.remaining < credits.total * 0.15 : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Account & Crediti</h2>
        <p className="text-sm text-slate-400 mt-1">Gestisci piano, crediti AI e fatture</p>
      </div>

      {/* Action status */}
      {actionStatus && (
        <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-emerald-300 flex-1">{actionStatus}</p>
          <button onClick={() => setActionStatus(null)} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Credits section ─── */}
      {credits && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Crediti AI</h3>
          </div>

          {/* Credits bar */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <p className={`text-3xl font-bold tabular-nums ${creditLow ? "text-amber-400" : "text-white"}`}>
                {credits.remaining.toFixed(0)}
                <span className="text-base font-normal text-slate-500 ml-1">/ {credits.total}</span>
              </p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                creditLow ? "bg-amber-500/20 text-amber-400" : "bg-indigo-500/20 text-indigo-400"
              }`}>
                {creditPercent}% rimanente
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${creditLow ? "bg-amber-500" : "bg-indigo-500"}`}
                style={{ width: `${Math.max(2, creditPercent)}%` }}
              />
            </div>
            {credits.purchased > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                Include {credits.purchased} crediti extra acquistati
              </p>
            )}
          </div>

          {/* Cost info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Chat", cost: "0.5", icon: "💬" },
              { label: "Edit semplice", cost: "1.0", icon: "✏️" },
              { label: "Edit complesso", cost: "1.5", icon: "🔧" },
              { label: "Opus (premium)", cost: "2.0", icon: "🚀" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-800 rounded-lg px-3 py-2 text-center">
                <p className="text-lg mb-0.5">{item.icon}</p>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm font-semibold text-white">{item.cost} crediti</p>
              </div>
            ))}
          </div>

          {/* Buy credits */}
          <div>
            <p className="text-sm font-semibold text-white mb-3">
              <Sparkles className="w-4 h-4 inline text-indigo-400 mr-1" />
              Acquista crediti extra
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(credits.topUpOptions ?? [
                { credits: 50, price: "€9.90", priceId: "50" },
                { credits: 150, price: "€24.90", priceId: "150" },
                { credits: 500, price: "€69.90", priceId: "500" },
              ]).map((opt) => (
                <button
                  key={opt.priceId}
                  onClick={() => void handleBuyCredits(String(opt.credits))}
                  disabled={buyingPack === String(opt.credits)}
                  className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all disabled:opacity-50 group"
                >
                  <div className="text-left">
                    <p className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {opt.credits} crediti
                    </p>
                    <p className="text-xs text-slate-500">{opt.price}</p>
                  </div>
                  {buyingPack === String(opt.credits) ? (
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                  ) : (
                    <Zap className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plan + Invoices */}
        <div className="md:col-span-2 space-y-5">
          {/* Plan card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Piano attuale</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center px-3 py-1 bg-indigo-600/20 text-indigo-400 text-base font-bold rounded-lg border border-indigo-600/30">
                    {billing.plan}
                  </span>
                  <span className="text-2xl font-bold text-white tabular-nums">
                    €{billing.nextChargeAmount}/mese
                  </span>
                </div>
                <div className={`flex items-center gap-2 rounded-lg p-3 ${
                  billing.status === "ACTIVE"
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${billing.status === "ACTIVE" ? "text-emerald-400" : "text-red-400"}`} />
                  <p className={`text-sm font-medium ${billing.status === "ACTIVE" ? "text-emerald-400" : "text-red-400"}`}>
                    {billing.status === "ACTIVE" ? "Abbonamento attivo" : billing.status}
                  </p>
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 text-center sm:min-w-[140px]">
                <p className="text-xs text-slate-500 mb-1">Prossimo addebito</p>
                <p className="text-xl font-bold text-white tabular-nums">€{billing.nextChargeAmount}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {billing.nextChargeDate ? formatShortDate(billing.nextChargeDate) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Storico fatture</h3>
            </div>
            {invoices.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <CreditCard className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Nessuna fattura ancora</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
                        <th className="hidden sm:table-cell text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Descrizione</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Importo</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Stato</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {pageInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-800/40">
                          <td className="px-5 py-3 text-slate-400 tabular-nums">{formatShortDate(inv.date)}</td>
                          <td className="hidden sm:table-cell px-5 py-3 text-white">{inv.description}</td>
                          <td className="px-5 py-3 text-right font-semibold text-white tabular-nums">€{inv.amount.toFixed(2)}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${INVOICE_STATUS_COLORS[inv.status] ?? "bg-slate-700 text-slate-300"}`}>
                              {INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {inv.pdfUrl ? (
                              <a href={inv.pdfUrl} download className="text-indigo-400 hover:text-indigo-300"><Download className="w-4 h-4" /></a>
                            ) : <span className="text-slate-700">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-500">Pagina {page + 1} di {totalPages}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="p-1.5 rounded border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: payment + info */}
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Metodo di pagamento</h3>
            {billing.paymentMethod ? (
              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl mb-4">
                <CreditCard className="w-5 h-5 text-slate-300" />
                <div>
                  <p className="text-sm font-medium text-white">{billing.paymentMethod.brand} •••• {billing.paymentMethod.last4}</p>
                  <p className="text-xs text-slate-500">Scade {billing.paymentMethod.expiryMonth}/{billing.paymentMethod.expiryYear}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Nessun metodo
              </div>
            )}
            <button
              onClick={() => void handleBillingPortal()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Gestisci su Stripe
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Info account</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-0.5">Cliente dal</p>
                <p className="text-sm text-white">{formatDate(billing.clientSince)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-0.5">Piano</p>
                <p className="text-sm text-white">{billing.plan} — €{billing.nextChargeAmount}/mese</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
