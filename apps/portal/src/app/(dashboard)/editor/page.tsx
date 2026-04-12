"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowRight, Bot, ChevronRight, Code2, Coins, Eye, ExternalLink,
  FileCode, FolderOpen, MessageSquare, Monitor, RefreshCw, Send,
  Smartphone, Sparkles, Tablet, Undo2, User, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

// Dynamic Sandpack import
const SandpackPreview = dynamic(
  () => import("@codesandbox/sandpack-react").then((mod) => {
    const { SandpackProvider, SandpackPreview: Frame } = mod;
    return function SandpackWrapper({ files, theme }: { files: Record<string, string>; theme?: string }) {
      return (
        <SandpackProvider template="react" files={files} theme={theme as "dark"} options={{ autorun: true, recompileMode: "delayed", recompileDelay: 400 }}>
          <Frame style={{ height: "100%", border: "none" }} />
        </SandpackProvider>
      );
    };
  }),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-zinc-500">Loading preview...</div> }
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  tools?: Array<{ name: string; status: "running" | "done" | "error"; path?: string }>;
  timestamp?: number;
}

interface Credits {
  remaining: number;
  used: number;
  total: number;
}

type RightPanel = "preview" | "code";
type DeviceMode = "desktop" | "tablet" | "mobile";

// ─── API helpers ─────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.madecreative.pro";

async function fetchWithAuth(path: string, token: string, opts?: RequestInit) {
  return fetch(`${API}${path}`, { ...opts, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...opts?.headers } });
}

// ─── Convert project files to Sandpack format ────────────────────────────────

function projectToSandpack(files: Record<string, string>): Record<string, string> {
  const sp: Record<string, string> = {};

  // Find the main page content
  const pageTsx = files["app/page.tsx"] ?? "";
  const globalsCss = files["app/globals.css"] ?? "";
  const layoutTsx = files["app/layout.tsx"] ?? "";

  // Collect all component files
  const components: string[] = [];
  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith("components/") && path.endsWith(".tsx")) {
      const name = path.replace("components/", "").replace(".tsx", "");
      components.push(`// === ${name} ===\n${content}`);
    }
  }

  // Collect lib files
  const libs: string[] = [];
  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith("lib/") && (path.endsWith(".ts") || path.endsWith(".tsx"))) {
      libs.push(`// === ${path} ===\n${content}`);
    }
  }

  // Build a single App.js that includes everything
  // Strip TypeScript, "use client", Next.js-specific imports
  function stripForSandpack(code: string): string {
    return code
      .replace(/^"use client";\s*/gm, "")
      .replace(/import\s+type\s+.*?;\s*/g, "")
      .replace(/import\s+.*?\s+from\s+["']next\/.*?["'];\s*/g, "")
      .replace(/import\s+.*?\s+from\s+["']@\/lib\/.*?["'];\s*/g, "")
      .replace(/import\s+.*?\s+from\s+["']@\/components\/.*?["'];\s*/g, "")
      .replace(/import\s+\{[^}]*Metadata[^}]*\}\s+from\s+["']next["'];\s*/g, "")
      .replace(/export\s+const\s+metadata\s*:\s*Metadata\s*=\s*\{[^}]*\};\s*/g, "")
      .replace(/:\s*\w+(\[\])?\s*(?=[,\)=\{])/g, "") // strip simple type annotations
      .replace(/<\w+>/g, "") // strip generic params
      .replace(/as\s+\w+/g, "") // strip "as Type"
      .replace(/!\./g, ".") // strip non-null assertions
      ;
  }

  const allCode = [
    `import React, { useState, useEffect, useRef, useCallback } from "react";`,
    `import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";`,
    `import "./styles.css";`,
    "",
    "// ── Lib Data ──",
    ...libs.map(stripForSandpack),
    "",
    "// ── Components ──",
    ...components.map(c => stripForSandpack(c).replace(/^export\s+(default\s+)?function/gm, "function").replace(/^export\s+/gm, "")),
    "",
    "// ── Page ──",
    stripForSandpack(pageTsx)
      .replace(/^export\s+default\s+function\s+\w+/m, "function PageContent")
      .replace(/^export\s+default\s+/m, "const PageContent = "),
    "",
    "export default function App() { return <PageContent />; }",
  ].join("\n");

  sp["/App.js"] = allCode;
  sp["/styles.css"] = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');\n${stripForSandpack(globalsCss).replace(/@tailwind\s+\w+;\s*/g, "").replace(/@import\s+.*?;\s*/g, "")}`;

  return sp;
}

// ─── Main Editor Component ───────────────────────────────────────────────────

export default function EditorPage() {
  const { token } = useAuth();

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Project files
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // UI state
  const [rightPanel, setRightPanel] = useState<RightPanel>("preview");
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [credits, setCredits] = useState<Credits>({ remaining: 200, used: 0, total: 200 });
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "right">("chat");

  // Load initial files + credits
  useEffect(() => {
    if (!token) return;
    fetchWithAuth("/portal/editor/chat/files", token).then(r => r.json()).then(d => {
      if (d.success && d.data?.files) {
        const f = d.data.files as Record<string, string>;
        setFiles(f);
        if (d.data.deployUrl) setDeployUrl(d.data.deployUrl);
        if (Object.keys(f).length > 0) {
          setSelectedFile(Object.keys(f).find(k => k === "app/page.tsx") ?? Object.keys(f)[0] ?? null);
        }
      }
    }).catch(() => {});
    fetchWithAuth("/portal/editor/chat/credits", token).then(r => r.json()).then(d => {
      if (d.success && d.data) setCredits(d.data);
    }).catch(() => {});
  }, [token]);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming || !token) return;
    const msg = input.trim();
    setInput("");
    setStreaming(true);

    const userMsg: ChatMessage = { role: "user", content: msg, timestamp: Date.now() };
    const assistantMsg: ChatMessage = { role: "assistant", content: "", tools: [], timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg, assistantMsg]);

    try {
      const history = messages.slice(-30).map(m => ({ role: m.role, content: m.content }));
      const res = await fetchWithAuth("/portal/editor/chat/stream", token, {
        method: "POST",
        body: JSON.stringify({ message: msg, history }),
      });

      if (!res.ok || !res.body) {
        // Fallback to non-streaming
        const fallback = await fetchWithAuth("/portal/editor/chat", token, {
          method: "POST",
          body: JSON.stringify({ message: msg, history }),
        });
        const data = await fallback.json();
        if (data.success) {
          setMessages(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = { ...assistantMsg, content: data.data.response };
            return copy;
          });
          if (data.data.files) setFiles(data.data.files);
          if (data.data.deployUrl) setDeployUrl(data.data.deployUrl);
          if (data.data.credits) setCredits(data.data.credits);
        }
        setStreaming(false);
        return;
      }

      // SSE streaming
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;

          try {
            const event = JSON.parse(raw);

            if (event.type === "text_delta") {
              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1]!;
                copy[copy.length - 1] = { ...last, content: last.content + event.text };
                return copy;
              });
            } else if (event.type === "tool_start") {
              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1]!;
                const tools = [...(last.tools ?? []), { name: event.toolName, status: "running" as const, path: event.input?.path }];
                copy[copy.length - 1] = { ...last, tools };
                return copy;
              });
            } else if (event.type === "tool_done") {
              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1]!;
                const tools = (last.tools ?? []).map(t => t.name === event.toolName && t.status === "running" ? { ...t, status: "done" as const } : t);
                copy[copy.length - 1] = { ...last, tools };
                return copy;
              });
            } else if (event.type === "file_update") {
              // Real-time file update for Sandpack
              setFiles(prev => ({ ...prev, [event.path]: event.content }));
              if (!selectedFile) setSelectedFile(event.path);
            } else if (event.type === "complete") {
              if (event.deployUrl) setDeployUrl(event.deployUrl);
              if (event.credits) setCredits(event.credits);
            } else if (event.type === "error") {
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { ...assistantMsg, content: event.message ?? "Errore. Riprova." };
                return copy;
              });
            }
          } catch { /* skip malformed JSON */ }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { ...assistantMsg, content: "Errore di connessione. Riprova." };
        return copy;
      });
    }

    setStreaming(false);
  }, [input, streaming, token, messages, selectedFile]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Sandpack files
  const sandpackFiles = Object.keys(files).length > 0 ? projectToSandpack(files) : {
    "/App.js": `export default function App() { return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0a0a",color:"#fff",fontFamily:"system-ui"}}><div style={{textAlign:"center"}}><h1 style={{fontSize:"2rem",marginBottom:"1rem"}}>Benvenuto in MadeCreative</h1><p style={{color:"#666"}}>Scrivi nella chat cosa vuoi costruire</p></div></div>; }`,
    "/styles.css": "body{margin:0}",
  };

  const fileList = Object.keys(files).sort();
  const deviceWidth = device === "desktop" ? "100%" : device === "tablet" ? "768px" : "375px";

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="h-12 border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm">MadeCreative</span>
        </div>

        {/* Mobile tabs */}
        <div className="flex md:hidden ml-auto gap-1">
          <button onClick={() => setMobileTab("chat")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${mobileTab === "chat" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}>
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setMobileTab("right")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${mobileTab === "right" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}>
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop right panel tabs */}
        <div className="hidden md:flex items-center gap-1 ml-auto bg-zinc-900 rounded-lg p-0.5">
          <button onClick={() => setRightPanel("code")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${rightPanel === "code" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            <Code2 className="w-3.5 h-3.5 inline mr-1.5" />Code
          </button>
          <button onClick={() => setRightPanel("preview")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${rightPanel === "preview" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            <Eye className="w-3.5 h-3.5 inline mr-1.5" />Preview
          </button>
        </div>

        {/* Device toggles */}
        <div className="hidden md:flex items-center gap-1">
          {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
            <button key={d} onClick={() => setDevice(d)} className={`p-1.5 rounded ${device === d ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}>
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Credits */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-zinc-400">{Math.round(credits.remaining)}</span>
        </div>

        {/* Deploy URL */}
        {deployUrl && (
          <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
            <ExternalLink className="w-3 h-3" />
            <span className="max-w-[140px] truncate">{deployUrl.replace("https://", "")}</span>
          </a>
        )}
      </div>

      {/* ── Main Area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Chat Panel ── */}
        <div className={`${mobileTab === "chat" ? "flex" : "hidden"} md:flex flex-col w-full md:w-[400px] md:min-w-[360px] md:max-w-[480px] border-r border-zinc-800 bg-zinc-950`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Cosa vuoi costruire?</h2>
                <p className="text-sm text-zinc-500 mb-6">Descrivi il sito che vuoi e lo costruisco per te. Posso creare qualsiasi cosa: landing page, e-commerce, portfolio, blog...</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["Crea un sito per il mio ristorante", "Build me an e-commerce", "Crea una landing page moderna", "Fammi un portfolio minimalista"].map((s) => (
                    <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === "user" ? "bg-indigo-600 rounded-2xl rounded-br-md px-4 py-2.5" : ""}`}>
                  {/* Tool badges */}
                  {msg.tools && msg.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {msg.tools.map((t, j) => (
                        <span key={j} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          t.status === "running" ? "bg-amber-500/10 text-amber-400" :
                          t.status === "done" ? "bg-emerald-500/10 text-emerald-400" :
                          "bg-red-500/10 text-red-400"
                        }`}>
                          <FileCode className="w-3 h-3" />
                          {t.name === "write_file" ? `write ${t.path ?? ""}` :
                           t.name === "edit_file" ? `edit ${t.path ?? ""}` :
                           t.name === "read_file" ? `read ${t.path ?? ""}` :
                           t.name === "search_photos" ? "searching photos" :
                           t.name}
                          {t.status === "done" && " ✓"}
                          {t.status === "running" && "..."}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "text-white" : "text-zinc-300"}`}>
                    {msg.content}
                    {msg.role === "assistant" && streaming && i === messages.length - 1 && (
                      <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-0.5" />
                    )}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-800">
            <div className="flex items-end gap-2 bg-zinc-900 rounded-xl border border-zinc-800 focus-within:border-indigo-500/50 transition-colors p-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Descrivi cosa vuoi costruire..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 resize-none outline-none max-h-32 py-1 px-1"
                style={{ minHeight: 24 }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || streaming}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {streaming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Panel (Code / Preview) ── */}
        <div className={`${mobileTab === "right" ? "flex" : "hidden"} md:flex flex-col flex-1 bg-zinc-900 overflow-hidden`}>
          {rightPanel === "code" ? (
            /* ── Code Panel ── */
            <div className="flex flex-1 overflow-hidden">
              {/* File tree */}
              <div className="w-56 border-r border-zinc-800 overflow-y-auto bg-zinc-950 shrink-0">
                <div className="p-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                    <FolderOpen className="w-3.5 h-3.5" />
                    FILES ({fileList.length})
                  </div>
                </div>
                <div className="p-1">
                  {fileList.map((path) => (
                    <button
                      key={path}
                      onClick={() => setSelectedFile(path)}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-mono truncate transition-colors ${
                        selectedFile === path ? "bg-indigo-500/10 text-indigo-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                    >
                      <FileCode className="w-3 h-3 inline mr-2" />
                      {path}
                    </button>
                  ))}
                  {fileList.length === 0 && (
                    <p className="px-3 py-4 text-xs text-zinc-600 text-center">No files yet. Ask the AI to build something!</p>
                  )}
                </div>
              </div>

              {/* Code viewer */}
              <div className="flex-1 overflow-auto">
                {selectedFile && files[selectedFile] ? (
                  <pre className="p-4 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    <code>{files[selectedFile]}</code>
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                    Select a file to view its code
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Preview Panel ── */
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Preview toolbar */}
              <div className="h-10 border-b border-zinc-800 flex items-center px-3 gap-2 shrink-0 bg-zinc-950">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-zinc-900 rounded-md px-3 py-1 text-xs text-zinc-500 font-mono truncate">
                    {deployUrl ? deployUrl.replace("https://", "") : "preview.madecreative.pro"}
                  </div>
                </div>
                <button onClick={() => setFiles({ ...files })} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sandpack preview */}
              <div className="flex-1 flex items-start justify-center bg-zinc-800 overflow-auto p-0">
                <div style={{ width: deviceWidth, height: "100%", transition: "width 0.3s" }} className="bg-white">
                  <SandpackPreview files={sandpackFiles} theme="dark" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
