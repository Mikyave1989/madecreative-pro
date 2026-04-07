"use client";

import { useState } from "react";
import {
  Zap,
  Mail,
  Bell,
  Newspaper,
  Star,
  Play,
  Clock,
  Plus,
  X,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Automation {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isActive: boolean;
  runCount: number;
  timeSaved: number;
  createdAt: string;
  trigger: Record<string, unknown>;
  actions: Record<string, unknown>[];
}

interface AutomationsData {
  automations: Automation[];
  plan: string;
  limit: number;
  canCreate: boolean;
  stats?: {
    totalActive: number;
    totalRuns: number;
    timeSavedHours: number;
    nextExecution: string;
  };
}

interface NewAutomationForm {
  name: string;
  type: string;
  description: string;
  triggerEvent: string;
  actionTemplate: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const API_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_token");
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> =
  {
    email_reply: Mail,
    reminder: Bell,
    newsletter: Newspaper,
    review_request: Star,
  };

const TYPE_LABELS: Record<string, string> = {
  email_reply: "Risposta Email",
  reminder: "Promemoria",
  newsletter: "Newsletter",
  review_request: "Richiesta Recensione",
};

const TRIGGER_OPTIONS = [
  { value: "new_lead", label: "Nuovo lead dal sito" },
  { value: "no_reply_3d", label: "Nessuna risposta dopo 3 giorni" },
  { value: "service_completed", label: "Servizio completato" },
  { value: "invoice_paid", label: "Fattura pagata" },
  { value: "form_submitted", label: "Form compilato" },
];

const ACTION_TEMPLATES = [
  { value: "lead_welcome", label: "Email benvenuto lead" },
  { value: "quote_followup", label: "Follow-up preventivo" },
  { value: "review_request", label: "Richiesta recensione Google" },
  { value: "newsletter_monthly", label: "Newsletter mensile" },
  { value: "reminder_appointment", label: "Promemoria appuntamento" },
];

const SECTOR_TEMPLATES: Record<
  string,
  Array<{ name: string; type: string; description: string }>
> = {
  restaurant: [
    {
      name: "Recensione post-visita",
      type: "review_request",
      description: "Chiedi una recensione 48h dopo la prenotazione",
    },
    {
      name: "Newsletter mensile",
      type: "newsletter",
      description: "Invia il menu del mese ai clienti fidelizzati",
    },
  ],
  dental: [
    {
      name: "Promemoria appuntamento",
      type: "reminder",
      description: "Ricorda l'appuntamento 24h prima",
    },
    {
      name: "Recensione post-visita",
      type: "review_request",
      description: "Chiedi una recensione 3 giorni dopo la visita",
    },
  ],
  fitness: [
    {
      name: "Benvenuto nuovo iscritto",
      type: "email_reply",
      description: "Invia una guida di benvenuto ai nuovi iscritti",
    },
    {
      name: "Promemoria rinnovo",
      type: "reminder",
      description: "Ricorda il rinnovo 7 giorni prima della scadenza",
    },
  ],
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [data, setData] = useState<AutomationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<NewAutomationForm>({
    name: "",
    type: "email_reply",
    description: "",
    triggerEvent: "new_lead",
    actionTemplate: "lead_welcome",
  });

  // Load data on mount
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/portal/automations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: AutomationsData;
        error?: string;
      };
      if (!json.success) throw new Error(json.error ?? "Errore di caricamento");
      setData(json.data!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  };

  // Load on first render
  useState(() => {
    void loadData();
  });

  const handleToggle = async (automation: Automation) => {
    if (togglingId) return;
    setTogglingId(automation.id);
    try {
      const token = getToken();
      const res = await fetch(
        `${API_URL}/portal/automations/${automation.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !automation.isActive }),
        }
      );
      const json = (await res.json()) as {
        success: boolean;
        data?: Automation;
        error?: string;
      };
      if (!json.success) throw new Error(json.error);

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          automations: prev.automations.map((a) =>
            a.id === automation.id ? { ...a, isActive: !a.isActive } : a
          ),
        };
      });
      toast.success(
        automation.isActive ? "Automazione disattivata" : "Automazione attivata"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Errore nel toggle"
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async () => {
    if (creating) return;
    if (!form.name.trim()) {
      toast.error("Inserisci un nome per l'automazione");
      return;
    }
    setCreating(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/portal/automations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          type: form.type,
          trigger: { event: form.triggerEvent },
          actions: [{ type: "send_email", template: form.actionTemplate }],
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: Automation;
        error?: string;
      };
      if (!json.success) throw new Error(json.error);

      setData((prev) => {
        if (!prev || !json.data) return prev;
        return {
          ...prev,
          automations: [...prev.automations, json.data],
        };
      });

      toast.success("Automazione creata con successo");
      setShowAddModal(false);
      setForm({
        name: "",
        type: "email_reply",
        description: "",
        triggerEvent: "new_lead",
        actionTemplate: "lead_welcome",
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Errore nella creazione"
      );
    } finally {
      setCreating(false);
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

  const automations = data?.automations ?? [];
  const stats = data?.stats;
  const canCreate = data?.canCreate ?? false;
  const limit = data?.limit ?? 3;
  const plan = data?.plan ?? "STARTER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automazioni</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {automations.length}/{limit} automazioni attive
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuova automazione
          </Button>
        )}
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Automazioni attive</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalActive}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Esecuzioni totali</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalRuns}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Ore risparmiate / mese</p>
            <p className="text-2xl font-bold text-indigo-600">
              {stats.timeSavedHours}h
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Prossima esecuzione</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(stats.nextExecution).toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </Card>
        </div>
      )}

      {/* Upgrade banner for STARTER */}
      {plan === "STARTER" && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-800">
              Piano Starter: {limit} automazioni incluse
            </p>
            <p className="text-sm text-indigo-600 mt-0.5">
              Passa al piano Growth per creare automazioni personalizzate e
              avere fino a 15 automazioni attive.
            </p>
          </div>
        </div>
      )}

      {/* Automation cards grid */}
      {automations.length === 0 ? (
        <Card className="p-8 text-center">
          <Zap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            Nessuna automazione configurata. Le automazioni di default saranno
            create automaticamente al primo caricamento.
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => void loadData()}
          >
            Carica automazioni
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {automations.map((automation) => {
            const Icon = TYPE_ICONS[automation.type] ?? Zap;
            const isToggling = togglingId === automation.id;

            return (
              <Card
                key={automation.id}
                className={`p-5 transition-opacity ${!automation.isActive ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {automation.name}
                      </p>
                      <Badge variant="default" className="mt-0.5 text-xs">
                        {TYPE_LABELS[automation.type] ?? automation.type}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => void handleToggle(automation)}
                    disabled={isToggling}
                    className="flex-shrink-0 text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                    aria-label={
                      automation.isActive
                        ? "Disattiva automazione"
                        : "Attiva automazione"
                    }
                  >
                    {isToggling ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : automation.isActive ? (
                      <ToggleRight className="w-6 h-6 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                {automation.description && (
                  <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                    {automation.description}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Play className="w-3.5 h-3.5" />
                    <span>{automation.runCount} esecuzioni</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {Math.round(automation.timeSaved / 60 * 10) / 10}h
                      risparmiate
                    </span>
                  </div>
                  <Badge
                    variant={automation.isActive ? "success" : "default"}
                    className="text-xs"
                  >
                    {automation.isActive ? "Attiva" : "Inattiva"}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Automation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Nuova automazione
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Sector templates */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Template rapido
                </label>
                <div className="flex flex-wrap gap-2">
                  {(SECTOR_TEMPLATES["restaurant"] ?? []).map((tpl) => (
                    <button
                      key={tpl.name}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          name: tpl.name,
                          type: tpl.type,
                          description: tpl.description,
                        }))
                      }
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-full hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome automazione *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="es. Risposta benvenuto lead"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="email_reply">Risposta Email</option>
                    <option value="reminder">Promemoria</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="review_request">Richiesta Recensione</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger
                </label>
                <div className="relative">
                  <select
                    value={form.triggerEvent}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, triggerEvent: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TRIGGER_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Azione
                </label>
                <div className="relative">
                  <select
                    value={form.actionTemplate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        actionTemplate: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {ACTION_TEMPLATES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione (opzionale)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                  placeholder="Descrivi brevemente l'automazione..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
                Annulla
              </Button>
              <Button onClick={() => void handleCreate()} disabled={creating}>
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Crea automazione
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
