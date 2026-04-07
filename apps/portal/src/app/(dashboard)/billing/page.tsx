"use client";

import { useState } from "react";
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
  ArrowUpRight,
  Zap,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, InvoiceStatusBadge, PlanBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  mockBilling,
  mockInvoices,
  PLANS,
  type MockInvoice,
} from "@/lib/mockData";
import type { Plan } from "@/lib/mockData";

const INVOICES_PER_PAGE = 10;

// --- Status info ---
const statusConfig = {
  ACTIVE: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Abbonamento attivo",
    description: "Il tuo abbonamento e attivo e tutti i servizi sono operativi.",
  },
  AT_RISK: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "Pagamento a rischio",
    description:
      "Aggiorna il metodo di pagamento per evitare l'interruzione del servizio.",
  },
  PAUSED: {
    icon: PauseCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    label: "Abbonamento sospeso",
    description:
      "Il tuo abbonamento e sospeso. Contatta il supporto per ripristinarlo.",
  },
};

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

// --- Upgrade plan cards ---
const upgradePlans: Array<{ plan: Plan; label: string; price: number; features: string[]; recommended?: boolean }> = [
  {
    plan: "STARTER",
    label: "Starter",
    price: 79,
    features: PLANS.STARTER.features as unknown as string[],
  },
  {
    plan: "GROWTH",
    label: "Growth",
    price: 149,
    features: PLANS.GROWTH.features as unknown as string[],
    recommended: true,
  },
  {
    plan: "ENTERPRISE",
    label: "Enterprise",
    price: 299,
    features: PLANS.ENTERPRISE.features as unknown as string[],
  },
];

// --- Cancel modal ---
function CancelModal({ onClose }: { onClose: () => void }) {
  const [confirming, setConfirming] = useState(false);

  async function handleCancel() {
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success("Richiesta ricevuta. Il nostro team ti contatterà a breve.");
    setConfirming(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-red-50 rounded-full mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Vuoi davvero annullare?
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Perderesti immediatamente accesso a:
          </p>
        </div>

        <ul className="space-y-2 mb-6">
          {[
            "Il tuo sito web professionale",
            "Il chatbot che gestisce i lead",
            "Le automazioni attive",
            "Il supporto prioritario",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        {/* Retention offer */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-indigo-700 mb-1">
            Offerta speciale per te
          </p>
          <p className="text-sm text-indigo-600">
            Rimani e ottieni <strong>1 mese gratuito</strong> sul tuo piano
            attuale. Contatta il supporto per approfittarne.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Rimani abbonato
          </Button>
          <Button
            variant="danger"
            fullWidth
            loading={confirming}
            onClick={handleCancel}
          >
            Annulla abbonamento
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const billing = mockBilling;
  const invoices = mockInvoices;

  const [page, setPage] = useState(0);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);

  const totalPages = Math.ceil(invoices.length / INVOICES_PER_PAGE);
  const pageInvoices = invoices.slice(
    page * INVOICES_PER_PAGE,
    (page + 1) * INVOICES_PER_PAGE
  );

  const statusInfo = statusConfig[billing.status];
  const StatusIcon = statusInfo.icon;
  const clientDays = daysSince(billing.clientSince);
  const isNew = clientDays <= 30;

  async function handleUpgrade(plan: Plan) {
    if (plan === billing.plan) return;
    setUpgrading(plan);
    try {
      // In produzione: const url = await upgradePlan(plan); window.location.href = url;
      await new Promise((r) => setTimeout(r, 1500));
      toast.success(`Reindirizzamento a Stripe per l'upgrade a ${plan}...`);
    } catch {
      toast.error("Errore durante il reindirizzamento. Riprova.");
    } finally {
      setUpgrading(null);
    }
  }

  async function handleBillingPortal() {
    toast.info("Apertura portale Stripe...");
    // In produzione: const url = await getBillingPortalUrl(); window.open(url, '_blank');
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Fatturazione</h2>
        <p className="text-sm text-gray-500 mt-1">
          Gestisci il tuo piano, pagamenti e storico fatture
        </p>
      </div>

      {/* 30-day guarantee banner */}
      {isNew && (
        <div className="flex items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-5 py-4">
          <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-green-800">
              Garanzia soddisfatti o rimborsati 30 giorni
            </p>
            <p className="text-sm text-green-600 mt-0.5">
              Sei cliente da {clientDays} giorni — sei ancora nel periodo di
              garanzia. Contattaci se non sei soddisfatto.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current plan */}
        <div className="lg:col-span-2 space-y-5">
          {/* Plan card */}
          <Card padding="md">
            <CardHeader title="Piano attuale" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <PlanBadge plan={billing.plan} size="md" />
                  <StatusBadge billing={billing} />
                </div>
                <div
                  className={`flex items-start gap-3 rounded-xl p-4 ${statusInfo.bg}`}
                >
                  <StatusIcon
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${statusInfo.color}`}
                  />
                  <div>
                    <p className={`font-semibold text-sm ${statusInfo.color}`}>
                      {statusInfo.label}
                    </p>
                    <p className={`text-sm mt-0.5 ${statusInfo.color} opacity-80`}>
                      {statusInfo.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next charge */}
              <div className="bg-gray-50 rounded-xl p-4 text-center sm:min-w-[160px]">
                <p className="text-xs text-gray-500 mb-1">Prossimo addebito</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">
                  €{billing.nextChargeAmount}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatShortDate(billing.nextChargeDate)}
                </p>
              </div>
            </div>
          </Card>

          {/* Invoices */}
          <Card padding="none">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Storico fatture
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {invoices.length} fatture totali
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Data
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Descrizione
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Importo
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageInvoices.map((invoice) => (
                    <InvoiceRow key={invoice.id} invoice={invoice} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Pagina {page + 1} di {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Pagina precedente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page === totalPages - 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Pagina successiva"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Payment method */}
          <Card padding="md">
            <CardHeader title="Metodo di pagamento" />
            {billing.paymentMethod ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {billing.paymentMethod.brand} ••••{" "}
                    {billing.paymentMethod.last4}
                  </p>
                  <p className="text-xs text-gray-400">
                    Scadenza {billing.paymentMethod.expiryMonth}/
                    {billing.paymentMethod.expiryYear}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-xl p-3 mb-4">
                <AlertTriangle className="w-4 h-4" />
                Nessun metodo di pagamento
              </div>
            )}
            <Button
              variant="secondary"
              fullWidth
              onClick={handleBillingPortal}
              icon={<ExternalLink className="w-4 h-4" />}
            >
              Gestisci su Stripe
            </Button>
            <button
              onClick={() => setShowCancel(true)}
              className="mt-3 w-full text-sm text-gray-400 hover:text-red-500 transition-colors text-center py-2"
            >
              Annulla abbonamento
            </button>
          </Card>

          {/* Upgrade */}
          {billing.plan !== "ENTERPRISE" && (
            <Card padding="md">
              <CardHeader
                title="Upgrade piano"
                subtitle="Sblocca funzionalita avanzate"
              />
              <div className="space-y-3">
                {upgradePlans
                  .filter((p) => p.plan !== billing.plan)
                  .map((planOpt) => {
                    const isCurrent = planOpt.plan === billing.plan;
                    const isUpgrade =
                      upgradePlans.findIndex((p) => p.plan === billing.plan) <
                      upgradePlans.findIndex((p) => p.plan === planOpt.plan);

                    return (
                      <div
                        key={planOpt.plan}
                        className={`border rounded-xl p-4 ${
                          planOpt.recommended
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <PlanBadge plan={planOpt.plan} />
                            {planOpt.recommended && (
                              <span className="text-xs text-indigo-600 font-medium">
                                Consigliato
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-gray-900 tabular-nums">
                            €{planOpt.price}/mese
                          </span>
                        </div>
                        <ul className="space-y-1 mb-3">
                          {planOpt.features.slice(0, 3).map((f) => (
                            <li
                              key={f}
                              className="flex items-center gap-1.5 text-xs text-gray-600"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        {isUpgrade && (
                          <Button
                            size="sm"
                            fullWidth
                            loading={upgrading === planOpt.plan}
                            onClick={() => handleUpgrade(planOpt.plan)}
                            icon={<ArrowUpRight className="w-4 h-4" />}
                          >
                            Upgrade a {planOpt.label}
                          </Button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <CancelModal onClose={() => setShowCancel(false)} />
      )}
    </div>
  );
}

// --- Helper components ---

function StatusBadge({ billing }: { billing: typeof mockBilling }) {
  const map = {
    ACTIVE: { label: "Attivo", variant: "green" as const },
    AT_RISK: { label: "A rischio", variant: "yellow" as const },
    PAUSED: { label: "Sospeso", variant: "red" as const },
  };
  const { label, variant } = map[billing.status];
  return <Badge label={label} variant={variant} dot />;
}

function InvoiceRow({ invoice }: { invoice: MockInvoice }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-gray-600 whitespace-nowrap tabular-nums">
        {formatShortDate(invoice.date)}
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="text-gray-900 font-medium">{invoice.description}</p>
          <p className="text-xs text-gray-400 mt-0.5">{invoice.type}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-right font-semibold text-gray-900 tabular-nums whitespace-nowrap">
        €{invoice.amount.toFixed(2)}
      </td>
      <td className="px-6 py-4 text-center">
        <InvoiceStatusBadge status={invoice.status} />
      </td>
      <td className="px-6 py-4 text-right">
        {invoice.pdfUrl ? (
          <a
            href={invoice.pdfUrl}
            download
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
            aria-label="Scarica PDF"
          >
            <Download className="w-4 h-4" />
          </a>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
    </tr>
  );
}
