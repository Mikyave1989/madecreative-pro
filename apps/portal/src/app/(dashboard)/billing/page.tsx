"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillingInfo {
  plan: string;
  status: "ACTIVE" | "AT_RISK" | "PAUSED";
  nextChargeDate: string | null;
  nextChargeAmount: number;
  clientSince: string;
  isEligibleForRefund: boolean;
  daysSinceCreation: number;
  refundDeadlineDays: number;
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
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  pdfUrl: string | null;
}

interface InvoicesResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ACTIVE: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    label: "Abbonamento attivo",
    description: "Il tuo abbonamento e attivo e tutti i servizi sono operativi.",
  },
  AT_RISK: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    label: "Pagamento a rischio",
    description: "Aggiorna il metodo di pagamento per evitare interruzioni.",
  },
  PAUSED: {
    icon: PauseCircle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    label: "Abbonamento sospeso",
    description: "Il tuo abbonamento e sospeso. Contatta il supporto.",
  },
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PAID: "bg-emerald-500/15 text-emerald-400",
  PENDING: "bg-amber-500/15 text-amber-400",
  FAILED: "bg-red-500/15 text-red-400",
  REFUNDED: "bg-slate-500/15 text-slate-400",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  PAID: "Pagata",
  PENDING: "In attesa",
  FAILED: "Fallita",
  REFUNDED: "Rimborsata",
};

// ─── Cancel modal ─────────────────────────────────────────────────────────────

function CancelModal({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-red-500/10 rounded-full mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Vuoi davvero annullare?</h3>
          <p className="text-sm text-slate-400 mt-2">Perderesti immediatamente accesso a:</p>
        </div>

        <ul className="space-y-2 mb-6">
          {[
            "Il tuo sito web professionale",
            "Il chatbot che gestisce i lead",
            "I report mensili automatici",
            "Il supporto del team madecreative",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-indigo-400 mb-1">Offerta speciale per te</p>
          <p className="text-sm text-indigo-300">
            Rimani e ottieni <strong>1 mese gratuito</strong> sul tuo piano. Contatta il supporto.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-600 transition-colors"
          >
            Rimani abbonato
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Annullamento..." : "Annulla abbonamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Refund modal ─────────────────────────────────────────────────────────────

function RefundModal({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-emerald-500/10 rounded-full mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Richiesta rimborso</h3>
          <p className="text-sm text-slate-400 mt-2">
            Sei nel periodo di garanzia. Il rimborso sara elaborato entro 5-10 giorni lavorativi.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-600 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Elaborazione..." : "Conferma rimborso"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [showCancel, setShowCancel] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [billingRes, invoicesRes] = await Promise.all([
        fetch(`${API_URL}/portal/billing`, { headers: authHeaders() }),
        fetch(`${API_URL}/portal/billing/invoices`, { headers: authHeaders() }),
      ]);

      const billingJson = (await billingRes.json()) as {
        success: boolean;
        data?: BillingInfo;
        error?: string;
      };
      const invoicesJson = (await invoicesRes.json()) as {
        success: boolean;
        data?: InvoicesResponse;
        error?: string;
      };

      if (!billingJson.success) throw new Error(billingJson.error ?? "Errore fatturazione");
      setBilling(billingJson.data!);

      if (invoicesJson.success && invoicesJson.data?.data) {
        setInvoices(invoicesJson.data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  }

  async function handleBillingPortal() {
    try {
      const res = await fetch(`${API_URL}/portal/billing/portal`, { headers: authHeaders() });
      const json = (await res.json()) as { success: boolean; data?: { url: string }; error?: string };
      if (json.success && json.data?.url) {
        window.open(json.data.url, "_blank");
      }
    } catch {
      // silently fail
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`${API_URL}/portal/billing/cancel`, {
        method: "POST",
        headers: authHeaders(),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error);
      setShowCancel(false);
      setActionStatus("Abbonamento annullato. Rimarrai attivo fino alla fine del periodo.");
      void loadData();
    } catch (err) {
      setActionStatus(err instanceof Error ? err.message : "Errore nell'annullamento");
    } finally {
      setCancelling(false);
    }
  }

  async function handleRefund() {
    setRefunding(true);
    try {
      const res = await fetch(`${API_URL}/portal/billing/refund`, {
        method: "POST",
        headers: authHeaders(),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error);
      setShowRefund(false);
      setActionStatus("Rimborso confermato. Riceverai il pagamento entro 5-10 giorni lavorativi.");
      void loadData();
    } catch (err) {
      setActionStatus(err instanceof Error ? err.message : "Errore nel rimborso");
    } finally {
      setRefunding(false);
    }
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

  const statusInfo = STATUS_CONFIG[billing.status];
  const StatusIcon = statusInfo.icon;
  const clientDays = daysSince(billing.clientSince);
  const isNew = clientDays <= 30;

  const totalPages = Math.ceil(invoices.length / INVOICES_PER_PAGE);
  const pageInvoices = invoices.slice(
    page * INVOICES_PER_PAGE,
    (page + 1) * INVOICES_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Account</h2>
        <p className="text-sm text-slate-400 mt-1">Gestisci il tuo piano e le fatture</p>
      </div>

      {/* Action status banner */}
      {actionStatus && (
        <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-emerald-300">{actionStatus}</p>
          </div>
          <button onClick={() => setActionStatus(null)} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 14-day guarantee */}
      {isNew && billing.isEligibleForRefund && (
        <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4">
          <div className="p-2 bg-emerald-500/20 rounded-full flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-emerald-400">Garanzia soddisfatti o rimborsati 14 giorni</p>
            <p className="text-sm text-emerald-300/80 mt-0.5">
              Sei cliente da {clientDays} giorni — sei ancora nel periodo di garanzia.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: plan + invoices */}
        <div className="lg:col-span-2 space-y-5">
          {/* Plan card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Piano attuale</h3>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center px-3 py-1 bg-indigo-600/20 text-indigo-400 text-base font-bold rounded-lg border border-indigo-600/30">
                    {billing.plan}
                  </span>
                  <span className="text-2xl font-bold text-white tabular-nums">
                    €{billing.nextChargeAmount}/mese
                  </span>
                </div>

                <div className={`flex items-start gap-3 rounded-xl p-4 border ${statusInfo.bg}`}>
                  <StatusIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${statusInfo.color}`} />
                  <div>
                    <p className={`font-semibold text-sm ${statusInfo.color}`}>{statusInfo.label}</p>
                    <p className={`text-sm mt-0.5 ${statusInfo.color} opacity-80`}>{statusInfo.description}</p>
                  </div>
                </div>
              </div>

              {/* Next charge */}
              <div className="bg-slate-800 rounded-xl p-4 text-center sm:min-w-[160px]">
                <p className="text-xs text-slate-500 mb-1">Prossimo addebito</p>
                <p className="text-2xl font-bold text-white tabular-nums">€{billing.nextChargeAmount}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {billing.nextChargeDate ? formatShortDate(billing.nextChargeDate) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Storico fatture</h3>
              <p className="text-sm text-slate-500 mt-0.5">{invoices.length} fatture totali</p>
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
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Data
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Descrizione
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Importo
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="px-6 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {pageInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 text-slate-400 whitespace-nowrap tabular-nums">
                            {formatShortDate(invoice.date)}
                          </td>
                          <td className="px-6 py-4 text-white">{invoice.description}</td>
                          <td className="px-6 py-4 text-right font-semibold text-white tabular-nums whitespace-nowrap">
                            €{invoice.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${INVOICE_STATUS_COLORS[invoice.status] ?? "bg-slate-700 text-slate-300"}`}>
                              {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {invoice.pdfUrl ? (
                              <a
                                href={invoice.pdfUrl}
                                download
                                className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                                aria-label="Scarica PDF"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="text-slate-700">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-500">Pagina {page + 1} di {totalPages}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Pagina precedente"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page === totalPages - 1}
                        className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Pagina successiva"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: payment + actions */}
        <div className="space-y-5">
          {/* Payment method */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Metodo di pagamento</h3>

            {billing.paymentMethod ? (
              <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-xl mb-4">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <CreditCard className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {billing.paymentMethod.brand} •••• {billing.paymentMethod.last4}
                  </p>
                  <p className="text-xs text-slate-500">
                    Scadenza {billing.paymentMethod.expiryMonth}/{billing.paymentMethod.expiryYear}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Nessun metodo di pagamento
              </div>
            )}

            <button
              onClick={() => void handleBillingPortal()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Gestisci abbonamento
            </button>
          </div>

          {/* Danger zone */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Azioni account</h3>
            <div className="space-y-3">
              {/* Refund — only if eligible */}
              {billing.isEligibleForRefund && (
                <button
                  onClick={() => setShowRefund(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold rounded-xl hover:bg-emerald-600/30 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Richiedi rimborso
                </button>
              )}

              <button
                onClick={() => setShowCancel(true)}
                className="w-full text-sm text-slate-500 hover:text-red-400 transition-colors text-center py-2"
              >
                Cancella abbonamento
              </button>
            </div>
          </div>

          {/* Account info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Dettagli account</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Cliente dal</p>
                <p className="text-sm text-white">{formatDate(billing.clientSince)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Prossima scadenza</p>
                <p className="text-sm text-white">
                  {billing.nextChargeDate ? formatDate(billing.nextChargeDate) : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCancel && (
        <CancelModal
          onClose={() => setShowCancel(false)}
          onConfirm={() => void handleCancel()}
          loading={cancelling}
        />
      )}
      {showRefund && (
        <RefundModal
          onClose={() => setShowRefund(false)}
          onConfirm={() => void handleRefund()}
          loading={refunding}
        />
      )}
    </div>
  );
}
