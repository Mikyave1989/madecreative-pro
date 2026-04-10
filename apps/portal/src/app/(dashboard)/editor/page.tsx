"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bot,
  ChevronDown,
  Clock,
  Coins,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Phone,
  RefreshCw,
  Send,
  Smartphone,
  Sparkles,
  Tablet,
  Undo2,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  cost?: number;
}

interface Credits {
  remaining: number;
  used: number;
  total: number;
  purchased?: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
}

interface HourEntry {
  open: string;
  close: string;
  closed: boolean;
}

interface WebsiteContent {
  heroText?: string;
  heroDescription?: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsappNumber?: string;
  menuItems?: MenuItem[];
  hours?: Record<string, HourEntry>;
  [key: string]: unknown;
}

type DeviceMode = "desktop" | "tablet" | "mobile";
type MobileTab = "chat" | "preview";

// ─── API helpers ──────────────────────────────────────────────────────────────

const API_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

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

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Crea il mio sito",
  "Cambia il titolo",
  "Aggiungi menu",
  "Modifica orari",
  "Aggiungi WhatsApp",
];

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-indigo-400" />
      </div>
      <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span
            className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "1s" }}
          />
          <span
            className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
            style={{ animationDelay: "200ms", animationDuration: "1s" }}
          />
          <span
            className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
            style={{ animationDelay: "400ms", animationDuration: "1s" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────

function renderMessageContent(content: string) {
  // Support **bold** and line breaks
  const lines = content.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={lineIdx} className={lineIdx > 0 ? "mt-1.5" : ""}>
        {parts.map((part, partIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={partIdx} className="font-semibold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={partIdx}>{part}</span>;
        })}
      </p>
    );
  });
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-end gap-2 max-w-[80%]">
          <div className="bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
            {renderMessageContent(msg.content)}
          </div>
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mb-0.5">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-2.5 max-w-[85%]">
        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-zinc-200 leading-relaxed">
          {renderMessageContent(msg.content)}
        </div>
      </div>
      {msg.cost !== undefined && (
        <p className="text-[10px] text-zinc-600 pl-10">
          {msg.cost.toFixed(1)} crediti usati
        </p>
      )}
    </div>
  );
}

// ─── Preview site renderer ────────────────────────────────────────────────────

function SitePreview({ content }: { content: WebsiteContent }) {
  const hasContent =
    content.heroText ||
    content.heroDescription ||
    content.phone ||
    content.email ||
    content.address ||
    content.whatsappNumber ||
    (content.menuItems && content.menuItems.length > 0) ||
    content.hours;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16 bg-white">
        <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-sm font-medium text-zinc-400 mb-1">
          Nessun contenuto ancora
        </p>
        <p className="text-xs text-zinc-300">
          Inizia a chattare per creare il tuo sito
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-900 text-sm min-h-full">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-8 py-12 text-white">
        <h1 className="text-2xl font-bold mb-2 leading-tight">
          {content.heroText || "Il tuo sito"}
        </h1>
        {content.heroDescription && (
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
            {content.heroDescription}
          </p>
        )}
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Contact */}
        {(content.phone || content.email || content.address) && (
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Contatti
            </h2>
            <div className="space-y-2">
              {content.phone && (
                <div className="flex items-center gap-2.5 text-sm text-zinc-700">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  {content.phone}
                </div>
              )}
              {content.email && (
                <div className="flex items-center gap-2.5 text-sm text-zinc-700">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  {content.email}
                </div>
              )}
              {content.address && (
                <div className="flex items-center gap-2.5 text-sm text-zinc-700">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  {content.address}
                </div>
              )}
            </div>
          </section>
        )}

        {/* WhatsApp */}
        {content.whatsappNumber && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
            <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-green-800">
                WhatsApp attivo
              </p>
              <p className="text-[11px] text-green-600">
                {content.whatsappNumber}
              </p>
            </div>
          </div>
        )}

        {/* Menu */}
        {content.menuItems && content.menuItems.length > 0 && (
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Menu / Listino
            </h2>
            <div className="space-y-1.5">
              {content.menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 bg-zinc-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-semibold text-sm text-zinc-900 leading-tight">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    )}
                    {item.category && (
                      <span className="inline-block mt-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-indigo-600 whitespace-nowrap">
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hours */}
        {content.hours && (
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Orari
            </h2>
            <div className="space-y-1">
              {Object.entries(content.hours).map(([day, h]) => (
                <div
                  key={day}
                  className="flex items-center justify-between px-3 py-1.5 bg-zinc-50 rounded-lg text-xs"
                >
                  <span className="font-semibold uppercase text-zinc-700">
                    {day}
                  </span>
                  <span
                    className={
                      h.closed ? "text-zinc-400" : "text-zinc-700"
                    }
                  >
                    {h.closed ? "Chiuso" : `${h.open} – ${h.close}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ─── Preview panel (toolbar + frame) ─────────────────────────────────────────

function PreviewPanel({
  content,
  onRefresh,
}: {
  content: WebsiteContent;
  onRefresh: () => void;
}) {
  const [device, setDevice] = useState<DeviceMode>("desktop");

  const frameWidths: Record<DeviceMode, string> = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  };

  const deviceButtons: Array<{
    mode: DeviceMode;
    Icon: React.ComponentType<{ className?: string }>;
    label: string;
  }> = [
    { mode: "desktop", Icon: Monitor, label: "Desktop" },
    { mode: "tablet", Icon: Tablet, label: "Tablet" },
    { mode: "mobile", Icon: Smartphone, label: "Mobile" },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 flex-shrink-0">
        {/* macOS-style dots */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1 min-w-0">
          <span className="text-[11px] text-zinc-500 font-mono truncate select-none">
            tuosito.madecreative.pro
          </span>
        </div>

        {/* Device toggle */}
        <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-md overflow-hidden flex-shrink-0">
          {deviceButtons.map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setDevice(mode)}
              title={label}
              aria-label={label}
              className={`px-2.5 py-1.5 transition-colors ${
                device === mode
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          title="Aggiorna"
          aria-label="Aggiorna anteprima"
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preview frame */}
      <div className="flex-1 overflow-auto bg-zinc-950 flex justify-center">
        <div
          className={`${frameWidths[device]} h-full overflow-auto bg-white transition-all duration-300`}
          style={{ maxHeight: "100%" }}
        >
          <SitePreview content={content} />
        </div>
      </div>
    </div>
  );
}

// ─── Chat panel ───────────────────────────────────────────────────────────────

function ChatPanel({
  messages,
  loading,
  credits,
  input,
  onInputChange,
  onSend,
  onSuggestion,
  onUndo,
  undoing,
  projectName,
  textareaRef,
}: {
  messages: ChatMessage[];
  loading: boolean;
  credits: Credits;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onSuggestion: (s: string) => void;
  onUndo: () => void;
  undoing: boolean;
  projectName: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const showSuggestions = messages.length === 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  // Auto-resize textarea up to 4 rows
  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target;
    el.style.height = "auto";
    const lineHeight = 20;
    const maxHeight = lineHeight * 4 + 24; // 4 rows + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    onInputChange(el.value);
  }

  const creditsPercent =
    credits.total > 0
      ? Math.round((credits.remaining / credits.total) * 100)
      : 0;
  const creditsLow = credits.remaining <= Math.ceil(credits.total * 0.15);

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-sm font-semibold text-zinc-100 truncate">
            {projectName}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Undo button */}
          <button
            onClick={onUndo}
            disabled={undoing || messages.length === 0}
            title="Annulla ultima modifica"
            aria-label="Annulla ultima modifica"
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          {/* Credits badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
              creditsLow
                ? "bg-amber-950/40 border-amber-800/50 text-amber-400"
                : "bg-zinc-800 border-zinc-700 text-zinc-300"
            }`}
          >
            <Coins
              className={`w-3 h-3 ${creditsLow ? "text-amber-400" : "text-zinc-500"}`}
            />
            <span>{credits.remaining}</span>
            <span className="text-zinc-600 font-normal">/ {credits.total}</span>
          </div>
        </div>
      </div>

      {/* Credits progress bar */}
      <div className="h-0.5 bg-zinc-800 flex-shrink-0">
        <div
          className={`h-full transition-all duration-500 ${creditsLow ? "bg-amber-500" : "bg-indigo-500"}`}
          style={{ width: `${creditsPercent}%` }}
        />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {showSuggestions && (
          <div className="flex flex-col h-full min-h-[300px] justify-center">
            {/* Greeting */}
            <div className="flex items-end gap-2.5 mb-6">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-zinc-200 leading-relaxed">
                <p>
                  Ciao! Sono il tuo assistente AI.{" "}
                  <strong className="font-semibold">
                    Cosa vuoi fare con il tuo sito oggi?
                  </strong>
                </p>
              </div>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 pl-9">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestion(s)}
                  disabled={loading || credits.remaining <= 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300 hover:border-indigo-500 hover:text-indigo-300 hover:bg-indigo-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-3 h-3 rotate-[-90deg] text-zinc-600" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}

        {loading && <TypingIndicator />}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-zinc-800">
        {credits.remaining <= 0 ? (
          <div className="flex items-center gap-2 p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-400">
            <Coins className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Crediti esauriti. Vai su{" "}
              <a href="/billing" className="underline font-semibold">
                Account
              </a>{" "}
              per ricaricare.
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-2 bg-zinc-800 border border-zinc-700 rounded-xl p-2 focus-within:border-indigo-500/70 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Scrivi cosa vuoi cambiare..."
                disabled={loading}
                rows={1}
                aria-label="Messaggio per l'AI"
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none leading-5 py-1 px-1 disabled:opacity-50"
                style={{ minHeight: "28px", maxHeight: "104px" }}
              />
              <button
                onClick={onSend}
                disabled={!input.trim() || loading}
                aria-label="Invia messaggio"
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-zinc-700 mt-1.5 text-center">
              Haiku risponde in secondi · Opus genera qualita professionale &nbsp;·&nbsp; Invio per inviare
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<Credits>({
    remaining: 100,
    used: 0,
    total: 100,
  });
  const [content, setContent] = useState<WebsiteContent>({});
  const [undoing, setUndoing] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [refreshKey, setRefreshKey] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const projectName = user?.companyName ?? "Il tuo sito";

  // Load credits + existing content on mount
  useEffect(() => {
    fetch(`${API_URL}/portal/editor/chat/credits`, {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Credits }) => {
        if (j.success && j.data) setCredits(j.data);
      })
      .catch(() => {});

    fetch(`${API_URL}/portal/editor`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(
        (j: {
          success: boolean;
          data?: { pages?: WebsiteContent };
          error?: string;
        }) => {
          if (j.success && j.data?.pages) {
            setContent(j.data.pages as WebsiteContent);
          }
        }
      )
      .catch(() => {});
  }, []);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;

      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      setMessages((prev) => [...prev, { role: "user", content: msg }]);
      setLoading(true);

      try {
        const res = await fetch(`${API_URL}/portal/editor/chat`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            message: msg,
            history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const json = (await res.json()) as {
          success: boolean;
          data?: {
            response: string;
            contentUpdates: Record<string, unknown> | null;
            currentContent: WebsiteContent;
            credits: Credits;
            cost?: number;
          };
          error?: string;
        };

        if (!res.ok || !json.success) {
          const errText =
            json.error ??
            `Errore del server (${res.status}). Riprova tra qualche secondo.`;
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: errText },
          ]);
          return;
        }

        if (json.data) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: json.data!.response,
              cost: json.data!.cost,
            },
          ]);
          if (json.data.currentContent) {
            setContent(json.data.currentContent);
          }
          if (json.data.credits) {
            setCredits(json.data.credits);
          }
        }
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Errore di connessione";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Errore di rete: ${errMsg}. Controlla la connessione e riprova.`,
          },
        ]);
      } finally {
        setLoading(false);
        textareaRef.current?.focus();
      }
    },
    [input, loading, messages]
  );

  const handleUndo = useCallback(async () => {
    if (undoing) return;
    setUndoing(true);
    try {
      const res = await fetch(`${API_URL}/portal/editor/chat/rollback`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { content: WebsiteContent; restoredTo: string };
        error?: string;
      };
      if (json.success && json.data?.content) {
        setContent(json.data.content);
        const dateStr = new Date(json.data.restoredTo).toLocaleString("it-IT");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Versione ripristinata al ${dateStr}. Le modifiche si aggiornano in \~2 minuti.`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              json.error ?? "Impossibile annullare. Nessuna versione precedente trovata.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Errore durante il ripristino. Riprova.",
        },
      ]);
    } finally {
      setUndoing(false);
    }
  }, [undoing]);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    /*
     * Break out of the dashboard's padding using negative margins.
     * The dashboard <main> applies p-3 sm:p-4 md:p-6 lg:p-8 and max-w-7xl.
     * We undo that here so the editor stretches edge-to-edge.
     * Height: 100vh minus 64px for the sticky header.
     */
    <div
      className="
        -mx-3 -my-3
        sm:-mx-4 sm:-my-4
        md:-mx-6 md:-my-6
        lg:-mx-8 lg:-my-8
        bg-zinc-950
      "
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* ── Mobile tab bar (visible <md) ── */}
      <div className="md:hidden flex items-stretch h-10 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
            mobileTab === "chat"
              ? "text-indigo-400 border-b-2 border-indigo-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Chat AI
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
            mobileTab === "preview"
              ? "text-indigo-400 border-b-2 border-indigo-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          Anteprima
        </button>
      </div>

      {/* ── Main split layout ── */}
      <div
        className="flex overflow-hidden"
        style={{ height: "calc(100% - 0px)" }}
      >
        {/* Left: Chat */}
        <div
          className={`
            ${mobileTab === "preview" ? "hidden" : "flex"}
            md:flex flex-col
            w-full md:w-[40%]
            border-r border-zinc-800
          `}
        >
          <ChatPanel
            messages={messages}
            loading={loading}
            credits={credits}
            input={input}
            onInputChange={setInput}
            onSend={() => void sendMessage()}
            onSuggestion={(s) => void sendMessage(s)}
            onUndo={() => void handleUndo()}
            undoing={undoing}
            projectName={projectName}
            textareaRef={textareaRef}
          />
        </div>

        {/* Divider visual (desktop only) */}
        <div className="hidden md:flex items-center justify-center w-0.5 bg-zinc-800 flex-shrink-0">
          <div className="w-0.5 h-12 bg-zinc-700 rounded-full" />
        </div>

        {/* Right: Preview */}
        <div
          className={`
            ${mobileTab === "chat" ? "hidden" : "flex"}
            md:flex flex-col flex-1 min-w-0
          `}
          key={refreshKey}
        >
          <PreviewPanel content={content} onRefresh={handleRefresh} />
        </div>
      </div>
    </div>
  );
}
