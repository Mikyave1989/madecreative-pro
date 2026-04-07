"use client";

import { useState } from "react";
import {
  HeadphonesIcon,
  Plus,
  X,
  ChevronDown,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Bot,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  type: string;
  status: string;
  priority: string;
  aiResponse: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface NewTicketForm {
  subject: string;
  message: string;
  type: string;
  priority: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const API_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_token");
}

const TYPE_LABELS: Record<string, string> = {
  general: "Generale",
  technical: "Tecnico",
  billing: "Fatturazione",
  website: "Sito Web",
  social: "Social Media",
  chatbot: "Chatbot",
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  low: { label: "Bassa", color: "bg-gray-100 text-gray-600" },
  normal: { label: "Normale", color: "bg-blue-100 text-blue-600" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgente", color: "bg-red-100 text-red-700" },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  open: { label: "Aperto", icon: Clock, color: "text-blue-600" },
  in_progress: { label: "In lavorazione", icon: Loader2, color: "text-yellow-600" },
  resolved: { label: "Risolto", icon: CheckCircle, color: "text-green-600" },
  closed: { label: "Chiuso", icon: CheckCircle, color: "text-gray-400" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TicketCard({
  ticket,
  isSelected,
  onClick,
}: {
  ticket: SupportTicket;
  isSelected: boolean;
  onClick: () => void;
}) {
  const status = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG["open"];
  const StatusIcon = status.icon;
  const priority = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG["normal"];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isSelected
          ? "border-indigo-300 bg-indigo-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p
          className={`text-sm font-semibold line-clamp-1 ${
            isSelected ? "text-indigo-700" : "text-gray-900"
          }`}
        >
          {ticket.subject}
        </p>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${priority.color}`}
        >
          {priority.label}
        </span>
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{ticket.message}</p>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${status.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </div>
        <span className="text-xs text-gray-400">
          {new Date(ticket.createdAt).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
    </button>
  );
}

function TicketDetail({
  ticket,
  onClose,
  closing,
}: {
  ticket: SupportTicket;
  onClose: (id: string) => void;
  closing: string | null;
}) {
  const status = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG["open"];
  const StatusIcon = status.icon;
  const priority = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG["normal"];
  const isClosing = closing === ticket.id;
  const canClose = ["open", "in_progress", "resolved"].includes(ticket.status);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base leading-snug">
            {ticket.subject}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="default" className="text-xs">
              {TYPE_LABELS[ticket.type] ?? ticket.type}
            </Badge>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.color}`}
            >
              {priority.label}
            </span>
            <div className={`flex items-center gap-1 text-xs font-medium ${status.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label}
            </div>
          </div>
        </div>
        {canClose && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onClose(ticket.id)}
            disabled={isClosing}
            className="flex-shrink-0"
          >
            {isClosing ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-1.5" />
            )}
            Chiudi
          </Button>
        )}
      </div>

      {/* Message */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Il tuo messaggio
          </span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {ticket.message}
        </p>
        <p className="text-xs text-gray-400 mt-3">
          Inviato il{" "}
          {new Date(ticket.createdAt).toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* AI response */}
      {ticket.aiResponse && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              Risposta automatica
            </span>
          </div>
          <p className="text-sm text-indigo-800 whitespace-pre-wrap leading-relaxed">
            {ticket.aiResponse}
          </p>
        </div>
      )}

      {/* Resolved at */}
      {ticket.resolvedAt && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          Risolto il{" "}
          {new Date(ticket.resolvedAt).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [form, setForm] = useState<NewTicketForm>({
    subject: "",
    message: "",
    type: "general",
    priority: "normal",
  });

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const res = await fetch(`${API_URL}/portal/support/tickets${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { data: SupportTicket[] };
        error?: string;
      };
      if (!json.success) throw new Error(json.error ?? "Errore");
      const list = json.data?.data ?? [];
      setTickets(list);
      if (list.length > 0 && !selectedTicket) {
        setSelectedTicket(list[0] ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useState(() => {
    void loadTickets();
  });

  const handleCreate = async () => {
    if (creating) return;
    if (!form.subject.trim() || form.subject.length < 5) {
      toast.error("L'oggetto deve essere di almeno 5 caratteri");
      return;
    }
    if (!form.message.trim() || form.message.length < 10) {
      toast.error("Il messaggio deve essere di almeno 10 caratteri");
      return;
    }
    setCreating(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/portal/support/tickets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: form.subject,
          message: form.message,
          type: form.type,
          priority: form.priority,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: SupportTicket;
        error?: string;
      };
      if (!json.success) throw new Error(json.error);

      if (json.data) {
        setTickets((prev) => [json.data!, ...prev]);
        setSelectedTicket(json.data);
      }

      toast.success("Ticket aperto con successo. Ti risponderemo presto.");
      setShowNewModal(false);
      setForm({ subject: "", message: "", type: "general", priority: "normal" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore nella creazione");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = async (ticketId: string) => {
    if (closing) return;
    setClosing(ticketId);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/portal/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "closed" }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: SupportTicket;
        error?: string;
      };
      if (!json.success) throw new Error(json.error);

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: "closed" } : t))
      );
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: "closed" } : prev));
      }
      toast.success("Ticket chiuso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore nella chiusura");
    } finally {
      setClosing(null);
    }
  };

  const openCount = tickets.filter((t) => ["open", "in_progress"].includes(t.status)).length;

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600">{error}</p>
        <Button onClick={() => void loadTickets()}>Riprova</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supporto</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {openCount > 0
              ? `${openCount} ticket aperti`
              : "Nessun ticket aperto"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void loadTickets()}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Aggiorna
          </Button>
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuovo ticket
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(
          [
            { key: "all", label: "Tutti" },
            { key: "open", label: "Aperti" },
            { key: "in_progress", label: "In lavorazione" },
            { key: "closed", label: "Chiusi" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilterStatus(tab.key);
              setTimeout(() => void loadTickets(), 0);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filterStatus === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <HeadphonesIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Nessun ticket</p>
          <p className="text-gray-400 text-sm mt-1">
            Hai bisogno di aiuto? Apri un nuovo ticket e ti risponderemo entro 24h.
          </p>
          <Button className="mt-4" onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Apri un ticket
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket list */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              I tuoi ticket
            </p>
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                isSelected={selectedTicket?.id === ticket.id}
                onClick={() => setSelectedTicket(ticket)}
              />
            ))}
          </div>

          {/* Ticket detail */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <Card className="p-6">
                <TicketDetail
                  ticket={selectedTicket}
                  onClose={handleClose}
                  closing={closing}
                />
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-400 text-sm">
                  Seleziona un ticket dalla lista
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* New ticket modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nuovo ticket</h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Oggetto *
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  placeholder="es. Il chatbot non risponde alle domande sui prezzi"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Type & Priority row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, type: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="general">Generale</option>
                      <option value="technical">Tecnico</option>
                      <option value="billing">Fatturazione</option>
                      <option value="website">Sito Web</option>
                      <option value="social">Social Media</option>
                      <option value="chatbot">Chatbot</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorità
                  </label>
                  <div className="relative">
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, priority: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="low">Bassa</option>
                      <option value="normal">Normale</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrivi il problema *
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                  rows={5}
                  placeholder="Spiega il problema nel dettaglio. Più informazioni fornisci, più velocemente possiamo aiutarti."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {form.message.length}/5000 caratteri
                </p>
              </div>

              {/* SLA note */}
              <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Tempo di risposta medio: <strong>entro 24 ore</strong> per
                  priorità normale, <strong>4 ore</strong> per urgente.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={() => setShowNewModal(false)}
              >
                Annulla
              </Button>
              <Button onClick={() => void handleCreate()} disabled={creating}>
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Apri ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
