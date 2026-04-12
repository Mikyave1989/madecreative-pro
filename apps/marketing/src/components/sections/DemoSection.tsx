"use client";

import { useState, useEffect, useRef } from "react";
import type { Translations } from "@/lib/i18n";
import { generateSitePreview } from "@madecreative/shared";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface DemoSectionProps {
  t: Translations;
  locale: string;
}

type AnimPhase =
  | "idle"
  | "typing"
  | "thinking"
  | "tools"
  | "responding"
  | "preview"
  | "done";

interface ToolBadge {
  label: string;
  icon: string;
}

/* ── Constants ──────────────────────────────────────────────────────────── */

const USER_MESSAGE =
  "Create a modern website for an Italian restaurant in Munich called Trattoria da Luigi";

const TOOL_BADGES: ToolBadge[] = [
  { label: "write_file app/globals.css", icon: "css" },
  { label: "write_file components/Hero.tsx", icon: "tsx" },
  { label: "write_file components/Nav.tsx", icon: "tsx" },
  { label: "write_file app/page.tsx", icon: "tsx" },
  { label: "search_photos italian restaurant", icon: "img" },
];

const AI_RESPONSE =
  "Done! I've created a modern restaurant website with a hero section, navigation, gallery, and contact form.";

const PREVIEW_URL = "trattoria-da-luigi.madecreative.pro";

/* ── Timeline (ms) ─────────────────────────────────────────────────────── */
//  0.5s  → start typing user message
//  2.0s  → typing done, show thinking dots
//  3.0s  → first tool badge
//  3.5s  → second tool badge
//  4.0s  → third
//  4.5s  → fourth
//  5.0s  → fifth
//  5.5s  → AI response text
//  6.0s  → preview live
//  12.0s → loop restart

const TIMELINE: Array<{ at: number; phase: AnimPhase; toolIdx?: number }> = [
  { at: 500, phase: "typing" },
  { at: 2000, phase: "thinking" },
  { at: 3000, phase: "tools", toolIdx: 0 },
  { at: 3500, phase: "tools", toolIdx: 1 },
  { at: 4000, phase: "tools", toolIdx: 2 },
  { at: 4500, phase: "tools", toolIdx: 3 },
  { at: 5000, phase: "tools", toolIdx: 4 },
  { at: 5500, phase: "responding" },
  { at: 6000, phase: "preview" },
  { at: 8000, phase: "done" },
];

/* ── Helpers ────────────────────────────────────────────────────────────── */

function useTypewriter(text: string, active: boolean, speed = 22): string {
  const [output, setOutput] = useState("");
  const frame = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) {
      setOutput("");
      return;
    }
    let i = 0;
    function tick() {
      i += 1;
      setOutput(text.slice(0, i));
      if (i < text.length) {
        frame.current = setTimeout(tick, speed);
      }
    }
    frame.current = setTimeout(tick, speed);
    return () => {
      if (frame.current) clearTimeout(frame.current);
    };
  }, [active, text, speed]);

  return output;
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 rounded-xl w-fit"
      style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-1.5 h-1.5 rounded-full"
          style={{
            background: "#6366f1",
            animation: `demoDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function ToolBadgeItem({ badge, visible }: { badge: ToolBadge; visible: boolean }) {
  const colorMap: Record<string, string> = {
    css: "#06b6d4",
    tsx: "#818cf8",
    img: "#34d399",
  };
  const color = colorMap[badge.icon] ?? "#818cf8";

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono w-fit transition-all duration-300"
      style={{
        background: visible ? "rgba(255,255,255,0.05)" : "transparent",
        border: `1px solid ${visible ? "rgba(255,255,255,0.1)" : "transparent"}`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-8px)",
        color: "rgba(248,250,252,0.75)",
      }}
    >
      <span style={{ color, fontWeight: 700 }}>{badge.icon}</span>
      <span>{badge.label}</span>
      {visible && (
        <span
          style={{
            color: "#34d399",
            fontWeight: 700,
            fontFamily: "monospace",
          }}
        >
          ✓
        </span>
      )}
    </div>
  );
}

function BrowserChrome({ url, loading }: { url: string; loading: boolean }) {
  return (
    <div
      className="flex flex-col rounded-t-xl overflow-hidden flex-shrink-0"
      style={{ background: "#1a1d2e", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Traffic lights */}
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#ffbd2e" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#28ca41" }} />
        {/* URL bar */}
        <div
          className="flex-1 ml-2 flex items-center gap-2 px-3 py-1 rounded-md text-xs"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(248,250,252,0.5)",
          }}
        >
          {loading ? (
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: "rgba(248,250,252,0.15)", animation: "demoPulse 1s ease-in-out infinite" }}
            />
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0" style={{ color: "#34d399" }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          )}
          <span className="truncate">{url}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */

export function DemoSection({ t, locale }: DemoSectionProps) {
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [visibleTools, setVisibleTools] = useState<number>(-1);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loopKey, setLoopKey] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const userTyping = useTypewriter(USER_MESSAGE, phase === "typing");
  const aiTyping = useTypewriter(AI_RESPONSE, phase === "responding" || phase === "preview" || phase === "done");

  const userMessageText =
    phase === "typing"
      ? userTyping
      : phase !== "idle"
      ? USER_MESSAGE
      : "";

  const aiMessageText =
    phase === "responding" || phase === "preview" || phase === "done"
      ? aiTyping
      : "";

  /* Generate HTML once on mount (and each loop) */
  useEffect(() => {
    const html = generateSitePreview({
      name: "Trattoria da Luigi",
      sector: "restaurant",
      city: "Munich",
      phone: "+49 89 1234 5678",
    });
    setPreviewHtml(html);
  }, [loopKey]);

  /* Animation loop */
  useEffect(() => {
    // Clear any existing timers
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setPhase("idle");
    setVisibleTools(-1);

    TIMELINE.forEach(({ at, phase: p, toolIdx }) => {
      const id = setTimeout(() => {
        if (p === "tools" && typeof toolIdx === "number") {
          setVisibleTools(toolIdx);
          setPhase("tools");
        } else {
          setPhase(p);
        }
      }, at);
      timers.current.push(id);
    });

    // Restart loop after 12 s
    const loopTimer = setTimeout(() => {
      setLoopKey((k) => k + 1);
    }, 12000);
    timers.current.push(loopTimer);

    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, [loopKey]);

  const showPreview = phase === "preview" || phase === "done";
  const showThinking = phase === "thinking" || phase === "tools";
  const showTools = phase === "tools" || phase === "responding" || phase === "preview" || phase === "done";
  const showAiResponse = phase === "responding" || phase === "preview" || phase === "done";

  return (
    <>
      {/* Keyframe styles injected once */}
      <style>{`
        @keyframes demoDot {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes demoPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.9; }
        }
        @keyframes demoFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section
        id="demo"
        className="py-24 px-4 sm:px-6 lg:px-8"
        style={{ background: "#05070f" }}
      >
        <div className="max-w-6xl mx-auto">

          {/* ── Section header ───────────────────────────────────────────── */}
          <div className="flex justify-center mb-5">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.28)",
                color: "#818cf8",
              }}
            >
              See it in action
            </span>
          </div>

          <h2
            className="text-4xl sm:text-5xl font-bold text-center mb-4 tracking-tight"
            style={{ color: "#f8fafc", letterSpacing: "-0.02em" }}
          >
            Watch AI build a website
          </h2>

          <p
            className="text-lg text-center max-w-lg mx-auto mb-14"
            style={{ color: "rgba(248,250,252,0.45)" }}
          >
            Type a prompt, watch the AI write every file, and see your site appear — live.
          </p>

          {/* ── Editor shell ─────────────────────────────────────────────── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 0 0 1px rgba(99,102,241,0.08), 0 32px 80px rgba(0,0,0,0.6)",
            }}
          >
            {/* Window chrome */}
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{
                background: "#161b27",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#ffbd2e" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#28ca41" }} />
              <span
                className="ml-3 text-xs font-medium"
                style={{ color: "rgba(248,250,252,0.3)" }}
              >
                MadeCreative — AI Website Builder
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#34d399",
                    animation: showPreview ? "none" : "demoPulse 2s ease-in-out infinite",
                    opacity: showPreview ? 1 : undefined,
                  }}
                />
                <span
                  className="text-xs"
                  style={{ color: "rgba(248,250,252,0.3)" }}
                >
                  {showPreview ? "Ready" : "Building…"}
                </span>
              </div>
            </div>

            {/* ── Two-panel layout ─────────────────────────────────────── */}
            <div className="flex min-h-[520px]" style={{ height: "clamp(420px, 55vw, 580px)" }}>

              {/* ── LEFT: Chat panel (40%) ─────────────────────────────── */}
              <div
                className="flex flex-col w-2/5 flex-shrink-0"
                style={{
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  background: "#0d1117",
                }}
              >
                {/* Chat header */}
                <div
                  className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "#f8fafc" }}>
                      AI Agent
                    </div>
                    <div className="text-xs" style={{ color: "rgba(248,250,252,0.35)" }}>
                      madecreative.pro
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-hidden px-4 py-4 flex flex-col gap-3 min-h-0">

                  {/* User message */}
                  {userMessageText && (
                    <div
                      className="flex justify-end"
                      style={{ animation: "demoFadeIn 0.3s ease-out" }}
                    >
                      <div
                        className="text-xs px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed"
                        style={{
                          background: "#6366f1",
                          color: "#fff",
                        }}
                      >
                        {userMessageText}
                        {phase === "typing" && (
                          <span
                            className="inline-block w-0.5 h-3 ml-0.5 align-middle"
                            style={{
                              background: "rgba(255,255,255,0.8)",
                              animation: "demoPulse 0.8s ease-in-out infinite",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI thinking / tools */}
                  {(showThinking || showTools || showAiResponse) && (
                    <div
                      className="flex flex-col gap-2"
                      style={{ animation: "demoFadeIn 0.3s ease-out" }}
                    >
                      {/* AI avatar row */}
                      <div className="flex items-start gap-2">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                          </svg>
                        </div>

                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          {/* Thinking dots */}
                          {showThinking && !showTools && <ThinkingDots />}

                          {/* Tool badges */}
                          {showTools && (
                            <div className="flex flex-col gap-1">
                              {TOOL_BADGES.map((badge, i) => (
                                <ToolBadgeItem
                                  key={badge.label}
                                  badge={badge}
                                  visible={visibleTools >= i}
                                />
                              ))}
                            </div>
                          )}

                          {/* AI response text */}
                          {showAiResponse && aiMessageText && (
                            <div
                              className="text-xs px-3 py-2 rounded-2xl rounded-tl-sm leading-relaxed mt-1"
                              style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "rgba(248,250,252,0.85)",
                              }}
                            >
                              {aiMessageText}
                              {phase === "responding" && (
                                <span
                                  className="inline-block w-0.5 h-3 ml-0.5 align-middle"
                                  style={{
                                    background: "rgba(248,250,252,0.6)",
                                    animation: "demoPulse 0.8s ease-in-out infinite",
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input bar */}
                <div
                  className="px-4 py-3 flex-shrink-0"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span className="flex-1 text-xs" style={{ color: "rgba(248,250,252,0.2)" }}>
                      Ask the AI anything…
                    </span>
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(99,102,241,0.3)" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Preview panel (60%) ────────────────────────── */}
              <div className="flex-1 flex flex-col min-w-0">
                <BrowserChrome url={PREVIEW_URL} loading={!showPreview} />

                {/* Iframe area */}
                <div className="flex-1 relative overflow-hidden" style={{ background: "#05070f" }}>

                  {/* Loading state */}
                  {!showPreview && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      {/* Skeleton lines */}
                      <div className="w-full px-8 flex flex-col gap-3">
                        <div
                          className="h-32 rounded-lg w-full"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            animation: "demoPulse 1.5s ease-in-out infinite",
                          }}
                        />
                        <div className="flex gap-3">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-16 rounded-lg flex-1"
                              style={{
                                background: "rgba(255,255,255,0.04)",
                                animation: `demoPulse 1.5s ease-in-out ${i * 0.2}s infinite`,
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-3">
                          {[1, 2].map((i) => (
                            <div
                              key={i}
                              className="h-10 rounded-lg flex-1"
                              style={{
                                background: "rgba(255,255,255,0.04)",
                                animation: `demoPulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                              }}
                            />
                          ))}
                        </div>
                        <div
                          className="h-6 rounded-lg w-3/4"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            animation: "demoPulse 1.5s ease-in-out 0.5s infinite",
                          }}
                        />
                      </div>
                      {phase === "idle" && (
                        <p
                          className="text-xs absolute bottom-6"
                          style={{ color: "rgba(248,250,252,0.2)" }}
                        >
                          Waiting for prompt…
                        </p>
                      )}
                      {(phase === "thinking" || phase === "tools") && (
                        <p
                          className="text-xs absolute bottom-6"
                          style={{ color: "rgba(248,250,252,0.2)", animation: "demoPulse 2s ease-in-out infinite" }}
                        >
                          Building your site…
                        </p>
                      )}
                    </div>
                  )}

                  {/* Live preview iframe */}
                  {showPreview && previewHtml && (
                    <iframe
                      key={loopKey}
                      srcDoc={previewHtml}
                      title="Generated site preview"
                      className="w-full h-full border-0"
                      style={{
                        animation: "demoFadeIn 0.6s ease-out",
                        transform: "scale(0.65) translateY(-27%)",
                        transformOrigin: "top center",
                        width: "154%",
                        marginLeft: "-27%",
                        height: "154%",
                        pointerEvents: "none",
                      }}
                      sandbox="allow-same-origin"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── CTA below ────────────────────────────────────────────────── */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <a
              href="/signup"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
              }}
            >
              Start building your website
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
            <p
              className="text-xs flex items-center gap-1.5"
              style={{ color: "rgba(248,250,252,0.3)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              No credit card required
            </p>
          </div>

        </div>
      </section>
    </>
  );
}
