"use client";

import { useState } from "react";
import {
  Bot,
  MessageSquare,
  CheckCircle2,
  Clock,
  ThumbsUp,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  X,
  Palette,
  Power,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// ─── Mock data ────────────────────────────────────────────────────────────────

type ChatbotStatus = "ACTIVE" | "INACTIVE" | "TRAINING";

interface FAQ {
  question: string;
  answer: string;
  category?: string;
}

interface Conversation {
  id: string;
  startedAt: string;
  messageCount: number;
  firstMessage: string;
  durationMin: number;
  resolved: boolean;
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
}

interface WidgetConfig {
  position: "bottom-right" | "bottom-left";
  primaryColor: string;
  title: string;
  subtitle?: string;
  avatarEmoji?: string;
}

const MOCK_STATUS: ChatbotStatus = "ACTIVE";
const MOCK_CHATBOT_ID = "cj8k2m3n4p5q6r7s8t9u0v1w";
const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

const MOCK_STATS = {
  totalConversations: 248,
  resolvedRate: 84,
  avgResponseMs: 820,
  satisfiedUsers: 91,
};

const MOCK_FAQS: FAQ[] = [
  {
    question: "Siete aperti la domenica?",
    answer: "Siamo aperti dal lunedi al sabato dalle 8:00 alle 18:00. La domenica siamo chiusi.",
    category: "orari",
  },
  {
    question: "Come posso richiedere un preventivo?",
    answer: "Puoi richiedere un preventivo chiamando il nostro numero o compilando il form di contatto sul sito. Risponderemo entro 24 ore.",
    category: "preventivi",
  },
  {
    question: "Quali metodi di pagamento accettate?",
    answer: "Accettiamo contanti, bonifico bancario e carte di credito/debito. Per lavori superiori a €2.000 offriamo anche rateizzazione.",
    category: "pagamenti",
  },
  {
    question: "Offrite garanzia sui lavori eseguiti?",
    answer: "Si, garantiamo tutti i nostri interventi per 2 anni. In caso di problemi, interverremo gratuitamente.",
    category: "garanzie",
  },
  {
    question: "Intervenite anche in caso di emergenza?",
    answer: "Si, offriamo un servizio di pronto intervento disponibile 7 giorni su 7, anche nei festivi. Chiamate il numero di emergenza.",
    category: "emergenze",
  },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_01",
    startedAt: "2026-04-07T14:32:00Z",
    messageCount: 6,
    firstMessage: "Siete aperti sabato pomeriggio?",
    durationMin: 4,
    resolved: true,
    messages: [
      { role: "user", content: "Siete aperti sabato pomeriggio?", timestamp: "2026-04-07T14:32:00Z" },
      { role: "assistant", content: "Certo! Siamo aperti il sabato dalle 8:00 alle 18:00. Posso aiutarti con altro?", timestamp: "2026-04-07T14:32:02Z" },
      { role: "user", content: "Quanto costa una riparazione caldaia?", timestamp: "2026-04-07T14:33:00Z" },
      { role: "assistant", content: "Il costo dipende dal tipo di intervento. Per una diagnosi base partiamo da €50. Per un preventivo preciso ti consiglio di chiamarci al +39 02 1234567.", timestamp: "2026-04-07T14:33:03Z" },
    ],
  },
  {
    id: "conv_02",
    startedAt: "2026-04-07T11:15:00Z",
    messageCount: 4,
    firstMessage: "Avete disponibilita questa settimana per un sopralluogo?",
    durationMin: 3,
    resolved: true,
    messages: [
      { role: "user", content: "Avete disponibilita questa settimana per un sopralluogo?", timestamp: "2026-04-07T11:15:00Z" },
      { role: "assistant", content: "Per verificare la disponibilita, ti consiglio di chiamarci direttamente al +39 02 1234567 o di compilare il form di contatto. Posso aiutarti con altro?", timestamp: "2026-04-07T11:15:02Z" },
    ],
  },
  {
    id: "conv_03",
    startedAt: "2026-04-06T16:45:00Z",
    messageCount: 8,
    firstMessage: "Come funziona la garanzia sui lavori?",
    durationMin: 7,
    resolved: true,
    messages: [
      { role: "user", content: "Come funziona la garanzia sui lavori?", timestamp: "2026-04-06T16:45:00Z" },
      { role: "assistant", content: "Garantiamo tutti gli interventi per 2 anni dalla data di esecuzione. In caso di problemi legati al nostro lavoro, interverremo gratuitamente entro 48 ore!", timestamp: "2026-04-06T16:45:03Z" },
    ],
  },
  {
    id: "conv_04",
    startedAt: "2026-04-06T09:22:00Z",
    messageCount: 3,
    firstMessage: "Accettate pagamento rateale?",
    durationMin: 2,
    resolved: true,
    messages: [
      { role: "user", content: "Accettate pagamento rateale?", timestamp: "2026-04-06T09:22:00Z" },
      { role: "assistant", content: "Si! Per lavori superiori a €2.000 offriamo rateizzazione. Contattaci per i dettagli.", timestamp: "2026-04-06T09:22:02Z" },
    ],
  },
  {
    id: "conv_05",
    startedAt: "2026-04-05T19:10:00Z",
    messageCount: 5,
    firstMessage: "Siete disponibili anche per piccoli lavori di manutenzione?",
    durationMin: 5,
    resolved: false,
    messages: [
      { role: "user", content: "Siete disponibili anche per piccoli lavori di manutenzione?", timestamp: "2026-04-05T19:10:00Z" },
      { role: "assistant", content: "Assolutamente si! Offriamo servizi di manutenzione ordinaria e straordinaria per impianti idraulici, termici e di condizionamento.", timestamp: "2026-04-05T19:10:02Z" },
    ],
  },
];

const MOCK_WIDGET_CONFIG: WidgetConfig = {
  position: "bottom-right",
  primaryColor: "#6366f1",
  title: "Assistente Rossi",
  subtitle: "Online - risposta in pochi secondi",
  avatarEmoji: "🔧",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h fa`;
  return `${Math.floor(hours / 24)}g fa`;
}

// ─── Status Card ──────────────────────────────────────────────────────────────

function StatusCard({
  status,
  onToggle,
  toggling,
  embedCode,
}: {
  status: ChatbotStatus;
  onToggle: () => void;
  toggling: boolean;
  embedCode: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast.success("Snippet copiato!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossibile copiare");
    }
  }

  const isActive = status === "ACTIVE";
  const isTraining = status === "TRAINING";

  return (
    <Card padding="md">
      <CardHeader title="Stato Chatbot" />

      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggle}
            disabled={toggling || isTraining}
            className={`relative inline-flex h-8 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isActive ? "bg-green-500" : "bg-gray-200"
            }`}
            aria-checked={isActive}
            role="switch"
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isActive ? "translate-x-8" : "translate-x-0"
              }`}
            />
          </button>

          <div>
            {isTraining ? (
              <Badge label="In addestramento" variant="yellow" dot />
            ) : isActive ? (
              <Badge label="Attivo" variant="green" dot />
            ) : (
              <Badge label="Inattivo" variant="gray" dot />
            )}
            <p className="text-xs text-gray-500 mt-1">
              {isTraining
                ? "Il chatbot sta imparando..."
                : isActive
                ? "Il chatbot risponde ai visitatori"
                : "Il chatbot non risponde"}
            </p>
          </div>

          {toggling && (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          )}
        </div>

        {/* Snippet */}
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 mb-2">
            Snippet di installazione (incolla nel tuo sito):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 truncate font-mono">
              {embedCode}
            </code>
            <button
              onClick={copyCode}
              className="flex-shrink-0 p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
              aria-label="Copia snippet"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow() {
  const stats = [
    {
      label: "Conversazioni totali",
      value: MOCK_STATS.totalConversations.toLocaleString("it-IT"),
      icon: <MessageSquare className="w-5 h-5 text-indigo-500" />,
      color: "bg-indigo-50",
    },
    {
      label: "Tasso di risoluzione",
      value: `${MOCK_STATS.resolvedRate}%`,
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      color: "bg-green-50",
    },
    {
      label: "Tempo risposta medio",
      value: `${(MOCK_STATS.avgResponseMs / 1000).toFixed(1)}s`,
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      color: "bg-amber-50",
    },
    {
      label: "Utenti soddisfatti",
      value: `${MOCK_STATS.satisfiedUsers}%`,
      icon: <ThumbsUp className="w-5 h-5 text-violet-500" />,
      color: "bg-violet-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} padding="md">
          <div className={`inline-flex p-2 rounded-lg ${s.color} mb-3`}>
            {s.icon}
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{s.value}</p>
          <p className="text-xs text-gray-500 mt-1">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}

// ─── Conversations Table ──────────────────────────────────────────────────────

function ConversationsTable() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Card padding="none">
      <div className="p-6 pb-4 border-b border-gray-100">
        <CardHeader title="Ultime conversazioni" subtitle="Le ultime 20 conversazioni dei visitatori" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                Data/ora
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                Prima domanda
              </th>
              <th className="hidden sm:table-cell text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                Messaggi
              </th>
              <th className="hidden sm:table-cell text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                Durata
              </th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                Esito
              </th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MOCK_CONVERSATIONS.map((conv) => (
              <>
                <tr
                  key={conv.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === conv.id ? null : conv.id)
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900 font-medium">
                      {formatDate(conv.startedAt)}
                    </p>
                    <p className="text-xs text-gray-400">{timeAgo(conv.startedAt)}</p>
                  </td>
                  <td className="px-4 py-4 max-w-xs">
                    <p className="text-sm text-gray-700 truncate">{conv.firstMessage}</p>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {conv.messageCount}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 text-center">
                    <span className="text-sm text-gray-600">{conv.durationMin}m</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {conv.resolved ? (
                      <Badge label="Risolto" variant="green" dot />
                    ) : (
                      <Badge label="In sospeso" variant="yellow" dot />
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {expandedId === conv.id ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </td>
                </tr>

                {expandedId === conv.id && (
                  <tr key={`${conv.id}-detail`} className="bg-gray-50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                        {conv.messages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-sm px-3 py-2 rounded-xl text-sm ${
                                msg.role === "user"
                                  ? "bg-indigo-600 text-white rounded-br-sm"
                                  : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── FAQ Manager ─────────────────────────────────────────────────────────────

function FAQManager() {
  const [faqs, setFaqs] = useState<FAQ[]>(MOCK_FAQS);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  function startEdit(i: number): void {
    setEditIndex(i);
    setEditQ(faqs[i]?.question ?? "");
    setEditA(faqs[i]?.answer ?? "");
  }

  function cancelEdit(): void {
    setEditIndex(null);
    setEditQ("");
    setEditA("");
  }

  async function saveEdit(i: number): Promise<void> {
    if (!editQ.trim() || !editA.trim()) {
      toast.error("Compila domanda e risposta");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setFaqs((prev) =>
      prev.map((f, idx) =>
        idx === i ? { ...f, question: editQ.trim(), answer: editA.trim() } : f
      )
    );
    setEditIndex(null);
    setSaving(false);
    toast.success("FAQ aggiornata");
  }

  async function deleteFaq(i: number): Promise<void> {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setFaqs((prev) => prev.filter((_, idx) => idx !== i));
    setSaving(false);
    toast.success("FAQ eliminata");
  }

  async function addFaq(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!newQ.trim() || !newA.trim()) {
      toast.error("Compila domanda e risposta");
      return;
    }
    setAdding(true);
    await new Promise((r) => setTimeout(r, 800));
    setFaqs((prev) => [...prev, { question: newQ.trim(), answer: newA.trim(), category: "custom" }]);
    setNewQ("");
    setNewA("");
    setAdding(false);
    toast.success("FAQ aggiunta. Il chatbot si stara aggiornando...");
  }

  return (
    <Card padding="md">
      <CardHeader
        title="Gestione FAQ"
        subtitle={`${faqs.length} domande nel database del chatbot`}
      />

      {/* FAQ List */}
      <div className="space-y-3 mb-6">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
          >
            {editIndex === i ? (
              <div className="space-y-3">
                <input
                  value={editQ}
                  onChange={(e) => setEditQ(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Domanda"
                />
                <textarea
                  value={editA}
                  onChange={(e) => setEditA(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Risposta"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => void saveEdit(i)}
                    loading={saving}
                  >
                    Salva
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    Annulla
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{faq.question}</p>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{faq.answer}</p>
                  {faq.category && (
                    <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                      {faq.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(i)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    aria-label="Modifica FAQ"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => void deleteFaq(i)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Elimina FAQ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add FAQ Form */}
      <div className="border border-dashed border-indigo-200 rounded-xl p-5 bg-indigo-50/40">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-indigo-800">Aggiungi nuova FAQ</h3>
        </div>

        <form onSubmit={(e) => void addFaq(e)} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Domanda <span className="text-red-500">*</span>
            </label>
            <input
              value={newQ}
              onChange={(e) => setNewQ(e.target.value)}
              placeholder="Es: Quali sono i vostri orari di apertura?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Risposta <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newA}
              onChange={(e) => setNewA(e.target.value)}
              placeholder="Scrivi la risposta completa che il chatbot dovra dare..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <Button type="submit" size="sm" loading={adding} icon={<Plus className="w-3.5 h-3.5" />}>
            Aggiungi FAQ
          </Button>
        </form>
      </div>
    </Card>
  );
}

// ─── Widget Preview ───────────────────────────────────────────────────────────

function WidgetPreview({ config, onCustomize }: { config: WidgetConfig; onCustomize: () => void }) {
  return (
    <Card padding="md">
      <CardHeader
        title="Anteprima Widget"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={onCustomize}
            icon={<Palette className="w-3.5 h-3.5" />}
          >
            Personalizza
          </Button>
        }
      />

      {/* Mock browser preview */}
      <div className="bg-gray-100 rounded-xl p-4 relative min-h-64 overflow-hidden">
        {/* Fake browser bar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200">
            https://tuosito.it
          </div>
        </div>

        {/* Page content placeholder */}
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-5/6" />
          <div className="h-2 bg-gray-200 rounded w-2/3" />
        </div>

        {/* Widget bubble */}
        <div
          className={`absolute bottom-4 ${
            config.position === "bottom-left" ? "left-4" : "right-4"
          }`}
        >
          {/* Fake chat panel */}
          <div
            className="mb-2 rounded-2xl shadow-xl border border-white/20 overflow-hidden"
            style={{ width: 220, background: "#fff" }}
          >
            <div
              className="px-3 py-2 flex items-center gap-2"
              style={{ background: config.primaryColor }}
            >
              <span className="text-base">{config.avatarEmoji ?? "💬"}</span>
              <div>
                <p className="text-white text-xs font-bold leading-tight">{config.title}</p>
                <p className="text-white/80 text-[10px]">{config.subtitle ?? "Online"}</p>
              </div>
            </div>
            <div className="p-2.5 space-y-2">
              <div
                className="text-xs text-gray-700 bg-gray-100 rounded-xl rounded-bl-sm px-2.5 py-1.5 max-w-[90%]"
              >
                Ciao! Come posso aiutarti oggi?
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-2 border-t border-gray-100 bg-gray-50">
              <div className="flex-1 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-[10px] text-gray-400">
                Scrivi...
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: config.primaryColor }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Bubble button */}
          <div className="flex justify-end">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: config.primaryColor }}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Customize Modal ──────────────────────────────────────────────────────────

function CustomizeModal({
  config,
  onClose,
  onSave,
}: {
  config: WidgetConfig;
  onClose: () => void;
  onSave: (cfg: WidgetConfig) => void;
}) {
  const [form, setForm] = useState({ ...config });
  const [saving, setSaving] = useState(false);

  const presetColors = [
    "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
    "#ef4444", "#ec4899", "#8b5cf6", "#1e293b",
  ];

  async function handleSave(): Promise<void> {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onSave(form);
    setSaving(false);
    toast.success("Widget personalizzato");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Personalizza Widget</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome assistente
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={40}
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sottotitolo
            </label>
            <input
              value={form.subtitle ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Es: Online - risposta immediata"
              maxLength={60}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colore principale
            </label>
            <div className="flex items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((p) => ({ ...p, primaryColor: c }))}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      form.primaryColor === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                    }`}
                    style={{ background: c }}
                    aria-label={`Colore ${c}`}
                  />
                ))}
              </div>
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                aria-label="Scegli colore personalizzato"
              />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Posizione
            </label>
            <div className="flex gap-3">
              {(["bottom-right", "bottom-left"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setForm((p) => ({ ...p, position: pos }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    form.position === pos
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {pos === "bottom-right" ? "Basso destra" : "Basso sinistra"}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emoji avatar
            </label>
            <div className="flex gap-2 flex-wrap">
              {["💬", "🤖", "👋", "🔧", "⚕️", "⚖️", "💄", "🏋️", "🏨", "🛍️"].map((e) => (
                <button
                  key={e}
                  onClick={() => setForm((p) => ({ ...p, avatarEmoji: e }))}
                  className={`w-9 h-9 rounded-xl text-lg border transition-colors ${
                    form.avatarEmoji === e
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Annulla
          </Button>
          <Button fullWidth loading={saving} onClick={() => void handleSave()}>
            Salva modifiche
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChatbotPage() {
  const [status, setStatus] = useState<ChatbotStatus>(MOCK_STATUS);
  const [toggling, setToggling] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(MOCK_WIDGET_CONFIG);
  const [showCustomize, setShowCustomize] = useState(false);

  const embedCode = `<script>window.MadeCreativeConfig={chatbotId:"${MOCK_CHATBOT_ID}",apiUrl:"${API_URL}"};</script><script src="${API_URL}/public/chatbot-widget.js" async defer></script>`;

  async function handleToggle(): Promise<void> {
    setToggling(true);
    await new Promise((r) => setTimeout(r, 800));
    setStatus((prev) => (prev === "ACTIVE" ? "INACTIVE" : "ACTIVE"));
    setToggling(false);
    toast.success(
      status === "ACTIVE" ? "Chatbot disattivato" : "Chatbot attivato"
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-600" />
            Chatbot AI
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Il tuo assistente virtuale risponde ai clienti 24/7
          </p>
        </div>

        {status === "INACTIVE" && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-700">
              Il chatbot e disattivato
            </span>
          </div>
        )}

        {status === "ACTIVE" && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2">
            <Power className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-700">
              Chatbot attivo e funzionante
            </span>
          </div>
        )}
      </div>

      {/* Status Card */}
      <StatusCard
        status={status}
        onToggle={() => void handleToggle()}
        toggling={toggling}
        embedCode={embedCode}
      />

      {/* Stats Row */}
      <StatsRow />

      {/* Conversations + Widget Preview in 2 cols */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ConversationsTable />
        </div>
        <div>
          <WidgetPreview
            config={widgetConfig}
            onCustomize={() => setShowCustomize(true)}
          />
        </div>
      </div>

      {/* FAQ Manager */}
      <FAQManager />

      {/* Customize Modal */}
      {showCustomize && (
        <CustomizeModal
          config={widgetConfig}
          onClose={() => setShowCustomize(false)}
          onSave={(cfg) => setWidgetConfig(cfg)}
        />
      )}
    </div>
  );
}
