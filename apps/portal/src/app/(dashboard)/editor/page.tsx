"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Bot, Check, ChevronDown, ChevronRight, Code2, Copy, Eye, ExternalLink,
  File, FileCode2, FileJson, FileText, FolderClosed, FolderOpen, Loader2,
  MessageSquare, Monitor, PanelLeftClose, PanelLeftOpen, Play, Plus,
  RefreshCw, Search, Send, Share2, Smartphone, Sparkles, Tablet, Undo2, User, Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

// ─── Sandpack (dynamic) ─────────────────────────────────────────────────────

const SandpackPreview = dynamic(
  () => import("@codesandbox/sandpack-react").then((mod) => {
    const { SandpackProvider, SandpackPreview: Frame } = mod;
    return function SandpackWrapper({ files, theme }: { files: Record<string, string>; theme?: string }) {
      return (
        <SandpackProvider template="react" files={files} theme={theme as "dark"} options={{ autorun: true, recompileMode: "delayed", recompileDelay: 400 }}>
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Frame style={{ flex: 1, border: "none" }} />
          </div>
        </SandpackProvider>
      );
    };
  }),
  { ssr: false, loading: () => <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#52525b" }}>Loading preview...</div> }
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  tools?: Array<{ name: string; status: "running" | "done" | "error"; path?: string }>;
}

interface Credits { remaining: number; used: number; total: number }
type Panel = "preview" | "code";
type Device = "desktop" | "tablet" | "mobile";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.madecreative.pro";

async function apiFetch(path: string, token: string, opts?: RequestInit) {
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...opts?.headers },
  });
}

function fileIcon(path: string) {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return <FileCode2 className="w-3.5 h-3.5 text-blue-400" />;
  if (path.endsWith(".css")) return <FileText className="w-3.5 h-3.5 text-purple-400" />;
  if (path.endsWith(".json")) return <FileJson className="w-3.5 h-3.5 text-yellow-400" />;
  if (path.endsWith(".mjs") || path.endsWith(".js")) return <FileCode2 className="w-3.5 h-3.5 text-yellow-300" />;
  return <File className="w-3.5 h-3.5 text-zinc-500" />;
}

// Group files into folders
function buildTree(paths: string[]): Record<string, string[]> {
  const tree: Record<string, string[]> = {};
  for (const p of paths) {
    const parts = p.split("/");
    if (parts.length === 1) {
      (tree[""] ??= []).push(p);
    } else {
      const folder = parts.slice(0, -1).join("/");
      (tree[folder] ??= []).push(p);
    }
  }
  return tree;
}

// Convert project files → Sandpack-compatible format
function toSandpack(files: Record<string, string>): Record<string, string> {
  const pageTsx = files["app/page.tsx"] ?? "";
  const globalsCss = files["app/globals.css"] ?? "";

  const components: string[] = [];
  const libs: string[] = [];

  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith("components/") && path.endsWith(".tsx")) components.push(`// ── ${path} ──\n${content}`);
    if (path.startsWith("lib/") && (path.endsWith(".ts") || path.endsWith(".tsx"))) libs.push(`// ── ${path} ──\n${content}`);
  }

  function strip(code: string): string {
    return code
      .replace(/^"use client";\s*/gm, "")
      .replace(/import\s+type\s+.*?;\s*/g, "")
      .replace(/import\s+.*?\s+from\s+["']next\/.*?["'];\s*/g, "")
      .replace(/import\s+.*?\s+from\s+["']@\/lib\/.*?["'];\s*/g, "")
      .replace(/import\s+.*?\s+from\s+["']@\/components\/.*?["'];\s*/g, "")
      .replace(/import\s+\{[^}]*Metadata[^}]*\}\s+from\s+["']next["'];\s*/g, "")
      .replace(/export\s+const\s+metadata\s*:\s*Metadata\s*=\s*\{[\s\S]*?\};\s*/g, "")
      .replace(/:\s*\w+(\[\])?\s*(?=[,)={])/g, "")
      .replace(/<\w+>/g, "")
      .replace(/as\s+\w+/g, "")
      .replace(/!\./g, ".");
  }

  const code = [
    `import React, { useState, useEffect, useRef, useCallback } from "react";`,
    `import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";`,
    `import "./styles.css";`,
    "", ...libs.map(strip), "", ...components.map(c => strip(c).replace(/^export\s+(default\s+)?function/gm, "function").replace(/^export\s+/gm, "")),
    "", strip(pageTsx).replace(/^export\s+default\s+function\s+\w+/m, "function PageContent").replace(/^export\s+default\s+/m, "const PageContent = "),
    "", "export default function App() { return <PageContent />; }",
  ].join("\n");

  return {
    "/App.js": code,
    "/styles.css": `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');\n${strip(globalsCss).replace(/@tailwind\s+\w+;\s*/g, "")}`,
  };
}

// ─── Editor Page ─────────────────────────────────────────────────────────────

export default function EditorPage() {
  const { token } = useAuth();

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("preview");
  const [device, setDevice] = useState<Device>("desktop");
  const [credits, setCredits] = useState<Credits>({ remaining: 200, used: 0, total: 200 });
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [mobileView, setMobileView] = useState<"chat" | "right">("chat");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["app", "components", "lib"]));
  const [copied, setCopied] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load files + credits on mount
  useEffect(() => {
    if (!token) return;
    apiFetch("/portal/editor/chat/files", token).then(r => r.json()).then(d => {
      if (d.success && d.data?.files) {
        setFiles(d.data.files);
        if (d.data.deployUrl) setDeployUrl(d.data.deployUrl);
        const keys = Object.keys(d.data.files);
        if (keys.length > 0) setSelectedFile(keys.find(k => k === "app/page.tsx") ?? keys[0]!);
      }
    }).catch(() => {});
    apiFetch("/portal/editor/chat/credits", token).then(r => r.json()).then(d => {
      if (d.success && d.data) setCredits(d.data);
    }).catch(() => {});
  }, [token]);

  // Auto-scroll
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Send message (streaming)
  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming || !token) return;
    const msg = input.trim();
    setInput("");
    setStreaming(true);

    const userMsg: ChatMessage = { role: "user", content: msg };
    const botMsg: ChatMessage = { role: "assistant", content: "", tools: [] };
    setMessages(prev => [...prev, userMsg, botMsg]);

    try {
      const history = messages.slice(-30).map(m => ({ role: m.role, content: m.content }));
      const res = await apiFetch("/portal/editor/chat/stream", token, {
        method: "POST",
        body: JSON.stringify({ message: msg, history }),
      });

      if (!res.ok || !res.body) {
        const fb = await apiFetch("/portal/editor/chat", token, { method: "POST", body: JSON.stringify({ message: msg, history }) });
        const data = await fb.json();
        if (data.success) {
          setMessages(prev => { const c = [...prev]; c[c.length - 1] = { ...botMsg, content: data.data.response }; return c; });
          if (data.data.files) setFiles(data.data.files);
          if (data.data.deployUrl) setDeployUrl(data.data.deployUrl);
          if (data.data.credits) setCredits(data.data.credits);
        }
        setStreaming(false);
        return;
      }

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
            const ev = JSON.parse(raw);
            if (ev.type === "text_delta") {
              setMessages(prev => { const c = [...prev]; const l = c[c.length - 1]!; c[c.length - 1] = { ...l, content: l.content + ev.text }; return c; });
            } else if (ev.type === "tool_start") {
              setMessages(prev => { const c = [...prev]; const l = c[c.length - 1]!; c[c.length - 1] = { ...l, tools: [...(l.tools ?? []), { name: ev.toolName, status: "running", path: ev.input?.path }] }; return c; });
            } else if (ev.type === "tool_done") {
              setMessages(prev => { const c = [...prev]; const l = c[c.length - 1]!; c[c.length - 1] = { ...l, tools: (l.tools ?? []).map(t => t.name === ev.toolName && t.status === "running" ? { ...t, status: "done" } : t) }; return c; });
            } else if (ev.type === "file_update") {
              setFiles(prev => ({ ...prev, [ev.path]: ev.content }));
              if (!selectedFile) setSelectedFile(ev.path);
            } else if (ev.type === "complete") {
              if (ev.deployUrl) setDeployUrl(ev.deployUrl);
              if (ev.credits) setCredits(ev.credits);
            } else if (ev.type === "error") {
              setMessages(prev => { const c = [...prev]; c[c.length - 1] = { ...botMsg, content: ev.message ?? "Errore. Riprova." }; return c; });
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages(prev => { const c = [...prev]; c[c.length - 1] = { ...botMsg, content: "Errore di connessione. Riprova." }; return c; });
    }
    setStreaming(false);
  }, [input, streaming, token, messages, selectedFile]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => { const s = new Set(prev); s.has(folder) ? s.delete(folder) : s.add(folder); return s; });
  };

  const copyUrl = () => {
    if (deployUrl) { navigator.clipboard.writeText(deployUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  // Derived
  const sandpackFiles = Object.keys(files).length > 0 ? toSandpack(files) : {
    "/App.js": `export default function App() {\n  return (\n    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#09090b",color:"#fff",fontFamily:"system-ui",flexDirection:"column",gap:"16px"}}>\n      <div style={{width:48,height:48,borderRadius:16,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>✨</div>\n      <h1 style={{fontSize:"1.5rem",fontWeight:600}}>MadeCreative</h1>\n      <p style={{color:"#71717a",fontSize:"0.875rem"}}>Descrivi nella chat il sito che vuoi costruire</p>\n    </div>\n  );\n}`,
    "/styles.css": "body{margin:0}",
  };

  const fileList = Object.keys(files).sort();
  const tree = buildTree(fileList);
  const deviceW = device === "desktop" ? "100%" : device === "tablet" ? "768px" : "375px";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#09090b", color: "#fafafa", overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ TOP BAR ═══ */}
      <div style={{ height: 48, borderBottom: "1px solid #1c1c22", display: "flex", alignItems: "center", padding: "0 12px", gap: 8, flexShrink: 0, background: "#0c0c10" }}>
        {/* Left: Logo + project name */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 200 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles style={{ width: 14, height: 14, color: "#fff" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>MadeCreative</span>
          <span style={{ fontSize: 11, color: "#3f3f46", margin: "0 4px" }}>/</span>
          <span style={{ fontSize: 13, color: "#a1a1aa" }}>Editor</span>
        </div>

        {/* Center: Panel tabs */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", background: "#18181b", borderRadius: 8, padding: 2, gap: 2 }}>
            <button onClick={() => setPanel("code")}
              style={{ padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                background: panel === "code" ? "#27272a" : "transparent", color: panel === "code" ? "#fff" : "#71717a" }}>
              <Code2 style={{ width: 13, height: 13 }} />Code
            </button>
            <button onClick={() => setPanel("preview")}
              style={{ padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                background: panel === "preview" ? "#27272a" : "transparent", color: panel === "preview" ? "#fff" : "#71717a" }}>
              <Eye style={{ width: 13, height: 13 }} />Preview
            </button>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 200, justifyContent: "flex-end" }}>
          {/* Credits */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#18181b", borderRadius: 6, fontSize: 11, color: "#a1a1aa" }}>
            <Zap style={{ width: 12, height: 12, color: "#eab308" }} />
            {Math.round(credits.remaining)}
          </div>

          {/* Device toggles */}
          {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
            <button key={d} onClick={() => setDevice(d)}
              style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", cursor: "pointer",
                background: device === d ? "#27272a" : "transparent", color: device === d ? "#fff" : "#52525b" }}>
              <Icon style={{ width: 14, height: 14 }} />
            </button>
          ))}

          {/* Share */}
          {deployUrl && (
            <button onClick={copyUrl}
              style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #27272a", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#a1a1aa", display: "flex", alignItems: "center", gap: 5 }}>
              {copied ? <Check style={{ width: 12, height: 12, color: "#22c55e" }} /> : <Share2 style={{ width: 12, height: 12 }} />}
              {copied ? "Copiato" : "Share"}
            </button>
          )}

          {/* Publish */}
          {deployUrl && (
            <a href={deployUrl} target="_blank" rel="noopener noreferrer"
              style={{ padding: "5px 14px", borderRadius: 6, background: "#6366f1", color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
              <Play style={{ width: 12, height: 12 }} />Publish
            </a>
          )}
        </div>
      </div>

      {/* ═══ MAIN AREA ═══ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ═══ CHAT PANEL ═══ */}
        <div style={{ width: chatOpen ? 380 : 0, minWidth: chatOpen ? 380 : 0, display: "flex", flexDirection: "column", borderRight: chatOpen ? "1px solid #1c1c22" : "none", background: "#0c0c10", transition: "width 0.2s, min-width 0.2s", overflow: "hidden" }}>
          {/* Chat header */}
          <div style={{ height: 44, borderBottom: "1px solid #1c1c22", display: "flex", alignItems: "center", padding: "0 14px", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare style={{ width: 14, height: 14, color: "#6366f1" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#d4d4d8" }}>Chat</span>
            </div>
            <button onClick={() => setChatOpen(false)}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", cursor: "pointer", background: "transparent", color: "#52525b" }}>
              <PanelLeftClose style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "0 20px" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Sparkles style={{ width: 24, height: 24, color: "#818cf8" }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#e4e4e7" }}>Cosa vuoi costruire?</h2>
                <p style={{ fontSize: 13, color: "#52525b", lineHeight: 1.6, marginBottom: 24 }}>
                  Descrivi il sito che vuoi. Posso creare landing page, e-commerce, portfolio, blog, qualsiasi cosa.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                  {[
                    "Crea un sito per il mio ristorante italiano",
                    "Build me a modern e-commerce store",
                    "Fammi una landing page SaaS",
                    "Crea un portfolio fotografico minimalista",
                  ].map(s => (
                    <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      style={{ textAlign: "left", padding: "10px 14px", background: "#18181b", border: "1px solid #27272a", borderRadius: 10, fontSize: 12, color: "#a1a1aa", cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#3f3f46"; e.currentTarget.style.color = "#e4e4e7"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#27272a"; e.currentTarget.style.color = "#a1a1aa"; }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                {/* Avatar */}
                <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2,
                  background: msg.role === "assistant" ? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))" : "#27272a" }}>
                  {msg.role === "assistant" ? <Bot style={{ width: 14, height: 14, color: "#818cf8" }} /> : <User style={{ width: 14, height: 14, color: "#71717a" }} />}
                </div>

                <div style={{ maxWidth: "85%", display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Tool badges */}
                  {msg.tools && msg.tools.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {msg.tools.map((t, j) => (
                        <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          background: t.status === "running" ? "rgba(234,179,8,0.1)" : "rgba(34,197,94,0.1)",
                          color: t.status === "running" ? "#eab308" : "#22c55e" }}>
                          {t.status === "running" ? <Loader2 style={{ width: 10, height: 10, animation: "spin 1s linear infinite" }} /> : <Check style={{ width: 10, height: 10 }} />}
                          {t.name === "write_file" ? "write" : t.name === "edit_file" ? "edit" : t.name === "read_file" ? "read" : t.name === "search_photos" ? "photos" : t.name}
                          {t.path && <span style={{ color: t.status === "running" ? "#a16207" : "#16a34a" }}>{t.path.split("/").pop()}</span>}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div style={{ padding: msg.role === "user" ? "10px 14px" : "0", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : 0,
                    background: msg.role === "user" ? "#6366f1" : "transparent" }}>
                    <p style={{ fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", color: msg.role === "user" ? "#fff" : "#d4d4d8", margin: 0 }}>
                      {msg.content}
                      {msg.role === "assistant" && streaming && i === messages.length - 1 && !msg.content && (
                        <span style={{ display: "inline-flex", gap: 3 }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1", animation: "pulse 1.4s ease-in-out infinite" }} />
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1", animation: "pulse 1.4s ease-in-out 0.2s infinite" }} />
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1", animation: "pulse 1.4s ease-in-out 0.4s infinite" }} />
                        </span>
                      )}
                      {msg.role === "assistant" && streaming && i === messages.length - 1 && msg.content && (
                        <span style={{ display: "inline-block", width: 2, height: 16, background: "#6366f1", marginLeft: 2, animation: "blink 1s step-end infinite", verticalAlign: "text-bottom" }} />
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div style={{ padding: 12, borderTop: "1px solid #1c1c22" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "#18181b", borderRadius: 12, border: "1px solid #27272a", padding: 8, transition: "border-color 0.15s" }}
              onFocus={e => e.currentTarget.style.borderColor = "#4f46e5"}
              onBlur={e => e.currentTarget.style.borderColor = "#27272a"}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Descrivi cosa vuoi costruire..."
                rows={1}
                style={{ flex: 1, background: "transparent", fontSize: 13, color: "#e4e4e7", resize: "none", outline: "none", border: "none", padding: "4px 6px", maxHeight: 120, minHeight: 22, fontFamily: "inherit", lineHeight: 1.5 }}
              />
              <button onClick={sendMessage} disabled={!input.trim() || streaming}
                style={{ width: 32, height: 32, borderRadius: 8, border: "none", cursor: input.trim() && !streaming ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: input.trim() && !streaming ? "#6366f1" : "#27272a", color: input.trim() && !streaming ? "#fff" : "#52525b", transition: "all 0.15s" }}>
                {streaming ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 14, height: 14 }} />}
              </button>
            </div>
          </div>
        </div>

        {/* Chat toggle (when closed) */}
        {!chatOpen && (
          <button onClick={() => setChatOpen(true)}
            style={{ width: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #1c1c22", background: "#0c0c10", border: "none", cursor: "pointer", color: "#52525b", flexShrink: 0 }}>
            <PanelLeftOpen style={{ width: 16, height: 16 }} />
          </button>
        )}

        {/* ═══ RIGHT PANEL ═══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#09090b" }}>

          {panel === "code" ? (
            /* ─── CODE PANEL ─── */
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* File tree */}
              <div style={{ width: 220, borderRight: "1px solid #1c1c22", overflowY: "auto", background: "#0c0c10", flexShrink: 0 }}>
                <div style={{ padding: "10px 12px", borderBottom: "1px solid #1c1c22", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#52525b", letterSpacing: "0.05em", textTransform: "uppercase" }}>Explorer</span>
                  <span style={{ fontSize: 10, color: "#3f3f46" }}>{fileList.length}</span>
                </div>
                <div style={{ padding: 4 }}>
                  {/* Root files */}
                  {(tree[""] ?? []).map(path => (
                    <button key={path} onClick={() => setSelectedFile(path)}
                      style={{ width: "100%", textAlign: "left", padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", display: "flex", alignItems: "center", gap: 6,
                        background: selectedFile === path ? "rgba(99,102,241,0.1)" : "transparent", color: selectedFile === path ? "#818cf8" : "#71717a" }}>
                      {fileIcon(path)}{path}
                    </button>
                  ))}
                  {/* Folders */}
                  {Object.entries(tree).filter(([k]) => k !== "").sort(([a], [b]) => a.localeCompare(b)).map(([folder, paths]) => (
                    <div key={folder}>
                      <button onClick={() => toggleFolder(folder)}
                        style={{ width: "100%", textAlign: "left", padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4, background: "transparent", color: "#a1a1aa", fontWeight: 500 }}>
                        {expandedFolders.has(folder) ? <ChevronDown style={{ width: 12, height: 12 }} /> : <ChevronRight style={{ width: 12, height: 12 }} />}
                        {expandedFolders.has(folder) ? <FolderOpen style={{ width: 13, height: 13, color: "#6366f1" }} /> : <FolderClosed style={{ width: 13, height: 13, color: "#6366f1" }} />}
                        {folder}
                      </button>
                      {expandedFolders.has(folder) && paths.map(path => (
                        <button key={path} onClick={() => setSelectedFile(path)}
                          style={{ width: "100%", textAlign: "left", padding: "5px 10px 5px 28px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            background: selectedFile === path ? "rgba(99,102,241,0.1)" : "transparent", color: selectedFile === path ? "#818cf8" : "#52525b" }}>
                          {fileIcon(path)}{path.split("/").pop()}
                        </button>
                      ))}
                    </div>
                  ))}
                  {fileList.length === 0 && (
                    <p style={{ padding: "24px 12px", fontSize: 12, color: "#3f3f46", textAlign: "center" }}>
                      Nessun file. Chiedi all&apos;AI di costruire qualcosa!
                    </p>
                  )}
                </div>
              </div>

              {/* Code editor area */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* File tabs */}
                {selectedFile && (
                  <div style={{ height: 36, borderBottom: "1px solid #1c1c22", display: "flex", alignItems: "center", background: "#0c0c10", flexShrink: 0 }}>
                    <div style={{ padding: "0 14px", height: "100%", display: "flex", alignItems: "center", gap: 6, borderBottom: "2px solid #6366f1", fontSize: 12, color: "#d4d4d8" }}>
                      {fileIcon(selectedFile)}
                      <span style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>{selectedFile}</span>
                    </div>
                  </div>
                )}
                {/* Code content with line numbers */}
                <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", background: "#0c0c10" }}>
                  {selectedFile && files[selectedFile] ? (
                    <div style={{ display: "flex", minHeight: "100%" }}>
                      {/* Line numbers */}
                      <div style={{ padding: "12px 0", minWidth: 48, textAlign: "right", paddingRight: 12, borderRight: "1px solid #1c1c22", userSelect: "none", flexShrink: 0 }}>
                        {files[selectedFile]!.split("\n").map((_, i) => (
                          <div key={i} style={{ fontSize: 12, lineHeight: "20px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: "#3f3f46" }}>{i + 1}</div>
                        ))}
                      </div>
                      {/* Code */}
                      <pre style={{ padding: "12px 16px", margin: 0, fontSize: 12, lineHeight: "20px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: "#d4d4d8", whiteSpace: "pre", flex: 1 }}>
                        <code>{files[selectedFile]}</code>
                      </pre>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#3f3f46", fontSize: 13 }}>
                      Seleziona un file per visualizzare il codice
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ─── PREVIEW PANEL ─── */
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              {/* Browser chrome */}
              <div style={{ height: 40, borderBottom: "1px solid #1c1c22", display: "flex", alignItems: "center", padding: "0 12px", gap: 10, flexShrink: 0, background: "#0c0c10" }}>
                {/* Traffic lights */}
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#eab308", opacity: 0.7 }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", opacity: 0.7 }} />
                </div>
                {/* URL bar */}
                <div style={{ flex: 1, maxWidth: 500, margin: "0 auto" }}>
                  <div style={{ background: "#18181b", borderRadius: 8, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid #3f3f46", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#22c55e" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#71717a", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {deployUrl ? deployUrl.replace("https://", "") : "preview.madecreative.pro"}
                    </span>
                  </div>
                </div>
                {/* Refresh */}
                <button onClick={() => setFiles({ ...files })}
                  style={{ width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#52525b" }}>
                  <RefreshCw style={{ width: 13, height: 13 }} />
                </button>
                {/* Open in new tab */}
                {deployUrl && (
                  <a href={deployUrl} target="_blank" rel="noopener noreferrer"
                    style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#52525b" }}>
                    <ExternalLink style={{ width: 13, height: 13 }} />
                  </a>
                )}
              </div>

              {/* Preview iframe — full height */}
              <div style={{ flex: 1, display: "flex", justifyContent: "center", background: "#18181b", overflow: "hidden" }}>
                <div style={{ width: deviceW, height: "100%", background: "#fff", transition: "width 0.3s ease", display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0 }}>
                      <SandpackPreview files={sandpackFiles} theme="dark" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes blink { 50% { opacity: 0; } }
        * { scrollbar-width: thin; scrollbar-color: #27272a transparent; }
        *::-webkit-scrollbar { width: 6px; height: 6px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
        *::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
        textarea::placeholder { color: #52525b; }
        /* Force Sandpack to fill container */
        .sp-wrapper, .sp-layout, .sp-preview-container, .sp-preview-iframe,
        .sp-stack { height: 100% !important; }
        .sp-preview-container { border: none !important; }
        .sp-preview-iframe { border: none !important; border-radius: 0 !important; }
        .sp-layout { border: none !important; border-radius: 0 !important; }
      `}</style>
    </div>
  );
}
