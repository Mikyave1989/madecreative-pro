"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Eye,
  MessageSquare,
  Coins,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ImageIcon,
  Upload,
  Check,
  X,
  Pencil,
  Info,
  Rocket,
  MessageCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Credits {
  remaining: number;
  used: number;
  total: number;
}

interface WebsiteContent {
  heroText?: string;
  heroDescription?: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsappNumber?: string;
  menuItems?: Array<{ id: string; name: string; description: string; price: string; category: string }>;
  hours?: Record<string, { open: string; close: string; closed: boolean }>;
  [key: string]: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("portal_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-indigo-600" : "bg-slate-700"}`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-indigo-400" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-indigo-600 text-white rounded-tr-md"
          : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-md"
      }`}>
        {msg.content.split("\n").map((line, i) => (
          <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
        ))}
      </div>
    </div>
  );
}

// ─── Preview panel ────────────────────────────────────────────────────────────

function PreviewPanel({ content }: { content: WebsiteContent }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden text-gray-900 text-sm h-full">
      {/* Mini browser bar */}
      <div className="bg-slate-100 px-4 py-2 flex items-center gap-2 border-b">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-400 font-mono">
          tuosito.madecreative.pro
        </div>
      </div>

      {/* Preview content */}
      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-280px)]">
        {/* Hero */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 text-white">
          <h1 className="text-2xl font-bold mb-2">{content.heroText || "Il tuo titolo"}</h1>
          <p className="text-sm text-gray-300">{content.heroDescription || "La tua descrizione"}</p>
        </div>

        {/* Contact */}
        {(content.phone || content.email || content.address) && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wide">Contatti</h3>
            {content.phone && <p className="text-sm flex items-center gap-2"><Phone className="w-3 h-3 text-gray-400" /> {content.phone}</p>}
            {content.email && <p className="text-sm flex items-center gap-2"><Mail className="w-3 h-3 text-gray-400" /> {content.email}</p>}
            {content.address && <p className="text-sm flex items-center gap-2"><MapPin className="w-3 h-3 text-gray-400" /> {content.address}</p>}
          </div>
        )}

        {/* Menu */}
        {content.menuItems && content.menuItems.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wide mb-3">Menu / Listino</h3>
            <div className="space-y-2">
              {content.menuItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    {item.category && <span className="text-[10px] text-gray-400 uppercase">{item.category}</span>}
                  </div>
                  <span className="font-bold text-sm text-indigo-600">{item.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hours */}
        {content.hours && (
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wide mb-2">Orari</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(content.hours).map(([day, h]) => (
                <div key={day} className="flex justify-between px-2 py-1 bg-gray-50 rounded">
                  <span className="font-medium uppercase">{day}</span>
                  <span className="text-gray-500">{(h as { closed: boolean; open: string; close: string }).closed ? "Chiuso" : `${(h as { open: string }).open}-${(h as { close: string }).close}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp indicator */}
        {content.whatsappNumber && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-green-700">WhatsApp attivo</p>
              <p className="text-[10px] text-green-600">{content.whatsappNumber}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Suggestions ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Cambia il titolo del sito",
  "Aggiungi 5 piatti al menu",
  "Imposta il numero WhatsApp",
  "Aggiorna gli orari di apertura",
  "Migliora la descrizione del sito",
  "Aggiungi i contatti",
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<Credits>({ remaining: 100, used: 0, total: 100 });
  const [content, setContent] = useState<WebsiteContent>({});
  const [view, setView] = useState<"chat" | "preview" | "split">("split");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load credits
    fetch(`${API_URL}/portal/editor/chat/credits`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Credits }) => {
        if (j.success && j.data) setCredits(j.data);
      })
      .catch(() => {});

    // Load current content
    fetch(`${API_URL}/portal/website/content`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j: { success: boolean; data?: WebsiteContent }) => {
        if (j.success && j.data) setContent(j.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/portal/editor/chat`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          message: msg,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const json = await res.json() as {
        success: boolean;
        data?: {
          response: string;
          contentUpdates: Record<string, unknown> | null;
          currentContent: WebsiteContent;
          credits: Credits;
        };
        error?: string;
      };

      if (json.success && json.data) {
        setMessages((prev) => [...prev, { role: "assistant", content: json.data!.response }]);
        if (json.data.currentContent) setContent(json.data.currentContent);
        if (json.data.credits) setCredits(json.data.credits);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: json.error ?? "Errore. Riprova." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Errore di connessione. Riprova." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const showChat = view === "chat" || view === "split";
  const showPreview = view === "preview" || view === "split";

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI Editor
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Parla con l&apos;AI per modificare il tuo sito in tempo reale</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Credits */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-white">{credits.remaining}</span>
            <span className="text-xs text-slate-500">/ {credits.total}</span>
          </div>

          {/* View toggle */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <button onClick={() => setView("chat")} className={`px-3 py-1.5 text-xs font-medium ${view === "chat" ? "bg-indigo-600 text-white" : "text-slate-400"}`}>
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setView("split")} className={`px-3 py-1.5 text-xs font-medium ${view === "split" ? "bg-indigo-600 text-white" : "text-slate-400"}`}>
              Split
            </button>
            <button onClick={() => setView("preview")} className={`px-3 py-1.5 text-xs font-medium ${view === "preview" ? "bg-indigo-600 text-white" : "text-slate-400"}`}>
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main split area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Chat panel */}
        {showChat && (
          <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden ${showPreview ? "w-1/2" : "w-full"}`}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Benvenuto nell&apos;AI Editor</h3>
                  <p className="text-sm text-slate-400 mb-6 max-w-sm">
                    Dimmi cosa vuoi cambiare sul tuo sito. Posso aggiornare testi, menu, contatti, orari e altro in tempo reale.
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => void sendMessage(s)}
                        className="text-left px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 hover:border-indigo-500 hover:text-indigo-300 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} />
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-800">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                  placeholder="Scrivi cosa vuoi cambiare..."
                  disabled={loading || credits.remaining <= 0}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={!input.trim() || loading || credits.remaining <= 0}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {credits.remaining <= 0 && (
                <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                  <Coins className="w-3 h-3" /> Crediti esauriti — acquista altri crediti per continuare.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Preview panel */}
        {showPreview && (
          <div className={`${showChat ? "w-1/2" : "w-full"}`}>
            <PreviewPanel content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
