"use client";

import { useState, useEffect } from "react";
import type { Translations } from "@/lib/i18n";

interface HowItWorksSectionProps {
  t: Translations;
}

const STEP_COLORS = ["#22d3ee", "#818cf8", "#6366f1"] as const;

const STEP_ICONS = [
  <svg key="scrape" viewBox="0 0 48 48" fill="none" className="w-8 h-8">
    <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.1" />
    <circle cx="22" cy="22" r="8" stroke="currentColor" strokeWidth="2" />
    <path d="M28 28l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 22h6M22 19v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>,
  <svg key="build" viewBox="0 0 48 48" fill="none" className="w-8 h-8">
    <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.1" />
    <rect x="13" y="15" width="22" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M17 20h14M17 24h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M19 29v4M29 29v4M16 33h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>,
  <svg key="launch" viewBox="0 0 48 48" fill="none" className="w-8 h-8">
    <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.1" />
    <path d="M24 34v-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M24 22l-4 4M24 22l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 14l6-3 6 3v8H18V14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>,
];

// Agent Floor data
const STATIONS = [
  { id: "SCRAPER",  x: 60,  y: 60,  color: "#22d3ee", tasks: ["Scansione...", "Found 23 results", "Data scraped", "Updated DB"] },
  { id: "ANALYZER", x: 200, y: 45,  color: "#a78bfa", tasks: ["Analyzing...", "Score: 91/100", "SEO OK", "Keywords: 12"] },
  { id: "BUILDER",  x: 330, y: 65,  color: "#6366f1", tasks: ["Building...", "Layout ready", "5 pages done", "Deploy ready"] },
  { id: "OUTREACH", x: 110, y: 195, color: "#34d399", tasks: ["Composing...", "Email sent", "Open rate: 68%", "Reply received"] },
  { id: "QA",       x: 290, y: 190, color: "#f472b6", tasks: ["Testing...", "QA: ✓ pass", "Perf: 96", "Live!"] },
] as const;

// Connection pairs between stations
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [0, 3], [1, 4], [2, 4], [3, 4],
];

function AgentFloor() {
  const [taskIndices, setTaskIndices] = useState<number[]>(STATIONS.map(() => 0));

  useEffect(() => {
    const interval = setInterval(() => {
      setTaskIndices((prev) =>
        prev.map((idx, i) => (idx + 1) % STATIONS[i].tasks.length)
      );
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "#0d1117",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span
          className="ml-3 text-xs font-mono"
          style={{ color: "rgba(248,250,252,0.3)" }}
        >
          agent-floor.live
        </span>
        <span
          className="ml-auto flex items-center gap-1.5 text-xs"
          style={{ color: "#34d399" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          5 agents active
        </span>
      </div>

      {/* SVG Floor */}
      <svg
        viewBox="0 0 400 280"
        className="w-full"
        style={{ maxHeight: 280 }}
        aria-label="Agent floor visualization"
      >
        {/* Connection lines */}
        {CONNECTIONS.map(([a, b], i) => {
          const from = STATIONS[a];
          const to = STATIONS[b];
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Animated agent — moves along a path using SMIL animateMotion */}
        {CONNECTIONS.slice(0, 3).map(([a, b], i) => {
          const from = STATIONS[a];
          const to = STATIONS[b];
          const dur = `${3 + i * 1.5}s`;
          return (
            <g key={`agent-${i}`}>
              <circle r="4" fill={STATIONS[a].color} opacity="0.85">
                <animateMotion
                  dur={dur}
                  repeatCount="indefinite"
                  begin={`${i * 0.8}s`}
                >
                  <mpath xlinkHref={`#path-${i}`} />
                </animateMotion>
              </circle>
              <path
                id={`path-${i}`}
                d={`M${from.x},${from.y} L${to.x},${to.y}`}
                fill="none"
                stroke="none"
              />
            </g>
          );
        })}

        {/* Stations */}
        {STATIONS.map((station, i) => (
          <g key={station.id}>
            {/* Outer ring */}
            <circle
              cx={station.x}
              cy={station.y}
              r="22"
              fill="none"
              stroke={station.color}
              strokeWidth="1"
              strokeOpacity="0.2"
            />
            {/* Inner circle */}
            <circle
              cx={station.x}
              cy={station.y}
              r="14"
              fill={station.color}
              fillOpacity="0.12"
            />
            {/* Center dot */}
            <circle
              cx={station.x}
              cy={station.y}
              r="4"
              fill={station.color}
            />
            {/* Station label */}
            <text
              x={station.x}
              y={station.y + 34}
              textAnchor="middle"
              fontSize="8"
              fontFamily="monospace"
              fill={station.color}
              opacity="0.9"
            >
              {station.id}
            </text>
            {/* Task bubble */}
            <g>
              <rect
                x={station.x - 32}
                y={station.y - 50}
                width="64"
                height="18"
                rx="4"
                fill="#161b27"
                stroke={station.color}
                strokeWidth="0.5"
                strokeOpacity="0.4"
              />
              <text
                x={station.x}
                y={station.y - 38}
                textAnchor="middle"
                fontSize="7"
                fontFamily="monospace"
                fill="rgba(248,250,252,0.65)"
              >
                {station.tasks[taskIndices[i] ?? 0]}
              </text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Agent Pipeline ────────────────────────────────────────────────────────────

const PIPELINE_AGENTS = [
  {
    id: "SCRAPER",
    color: "#22d3ee",
    description: "Analizza il tuo sito e le recensioni",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
        <path d="M16.5 16.5l3.5 3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M8.5 11h5M11 8.5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "ANALYZER",
    color: "#818cf8",
    description: "Studia settore e competitor",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
        <path d="M12 3c-1.2 5.4-5 7.8-5 7.8s1 6.2 5 9.2c4-3 5-9.2 5-9.2S13.2 8.4 12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 13c1 .8 2 1.2 3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="18" cy="5" r="2" stroke="currentColor" strokeWidth="1.25" />
        <path d="M17 7l-2 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "BUILDER",
    color: "#6366f1",
    description: "Costruisce il sito + chatbot",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
        <path d="M8 6l-4 6 4 6M16 6l4 6-4 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 4l-4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "OUTREACH",
    color: "#f472b6",
    description: "Sequenza email personalizzata",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "QA",
    color: "#34d399",
    description: "Verifica qualità e pubblica",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const;

/**
 * AgentPipeline — renders the 5-node horizontal pipeline with animated
 * data-flow connectors and a sequential glow/pulse cycling through agents.
 */
function AgentPipeline() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PIPELINE_AGENTS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="text-center mb-10">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: "rgba(248,250,252,0.3)" }}
        >
          Il nostro sistema AI in azione
        </p>
        <p
          className="text-base max-w-lg mx-auto"
          style={{ color: "rgba(248,250,252,0.55)" }}
        >
          5 agenti AI lavorano in sequenza automatica — da lead a sito live in{" "}
          <span style={{ color: "#22d3ee" }}>48 ore</span>
        </p>
      </div>

      {/*
        Pipeline layout:
        - Desktop: flex-row with connector lines between nodes
        - Mobile: flex-col with connector lines going down
      */}
      <div
        className="relative flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12 md:gap-0"
        role="list"
        aria-label="Pipeline degli agenti AI"
      >
        {PIPELINE_AGENTS.map((agent, i) => {
          const isActive = activeIndex === i;
          const isLast = i === PIPELINE_AGENTS.length - 1;

          return (
            <div
              key={agent.id}
              className="relative flex flex-col md:flex-row items-center"
              style={{ flex: isLast ? "0 0 auto" : "1 1 0%" }}
            >
              {/* Node */}
              <div
                role="listitem"
                className="relative flex flex-col items-center text-center z-10"
                style={{ minWidth: 96 }}
              >
                {/* Icon circle */}
                <div
                  className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 transition-all duration-500"
                  style={{
                    background: isActive
                      ? `${agent.color}20`
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isActive ? agent.color + "60" : "rgba(255,255,255,0.08)"}`,
                    boxShadow: isActive
                      ? `0 0 24px ${agent.color}40, 0 0 8px ${agent.color}20`
                      : "none",
                    color: isActive ? agent.color : "rgba(248,250,252,0.3)",
                    transform: isActive ? "scale(1.08)" : "scale(1)",
                  }}
                  aria-label={agent.id}
                >
                  {agent.icon}
                  {/* Pulse ring when active */}
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-2xl animate-ping"
                      style={{
                        border: `1px solid ${agent.color}`,
                        opacity: 0.3,
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className="text-xs font-bold font-mono tracking-wider mb-1 transition-colors duration-500"
                  style={{ color: isActive ? agent.color : "rgba(248,250,252,0.4)" }}
                >
                  {agent.id}
                </span>

                {/* Description */}
                <span
                  className="text-xs leading-snug max-w-full sm:max-w-[90px] transition-colors duration-500"
                  style={{
                    color: isActive
                      ? "rgba(248,250,252,0.75)"
                      : "rgba(248,250,252,0.3)",
                  }}
                >
                  {agent.description}
                </span>
              </div>

              {/* Connector (not on last item) */}
              {!isLast && (
                <>
                  {/* Desktop horizontal connector */}
                  <div
                    className="hidden md:block relative flex-1 h-px mx-3"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      minWidth: 24,
                    }}
                    aria-hidden="true"
                  >
                    {/* Animated flow dot */}
                    <span
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                      style={{
                        background: PIPELINE_AGENTS[i].color,
                        animation: `pipelineFlowH 1.8s linear ${i * 0.36}s infinite`,
                      }}
                    />
                  </div>

                  {/* Mobile vertical connector */}
                  <div
                    className="md:hidden relative w-px h-8 my-1"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                    aria-hidden="true"
                  >
                    <span
                      className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                      style={{
                        background: PIPELINE_AGENTS[i].color,
                        animation: `pipelineFlowV 1.8s linear ${i * 0.36}s infinite`,
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* CSS keyframes injected via style tag — no external deps needed */}
      <style>{`
        @keyframes pipelineFlowH {
          0%   { left: 0%;   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes pipelineFlowV {
          0%   { top: 0%;   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

export function HowItWorksSection({ t }: HowItWorksSectionProps) {
  return (
    <section
      id="how-it-works"
      className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "#05070f" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#818cf8",
            }}
          >
            {t.howItWorks.sectionLabel}
          </span>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: "#f8fafc" }}
          >
            {t.howItWorks.title}
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: "rgba(248,250,252,0.5)" }}
          >
            {t.howItWorks.subtitle}
          </p>
        </div>

        {/* Two-column: Steps + Agent Floor */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Steps */}
          <div className="space-y-8">
            {t.howItWorks.steps.map((step, i) => {
              const color = STEP_COLORS[i] ?? STEP_COLORS[0];
              return (
                <div key={i} className="flex gap-5">
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center relative"
                    style={{ background: `${color}14`, border: `1px solid ${color}30`, color }}
                  >
                    {STEP_ICONS[i]}
                    <div
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: color, color: "#05070f" }}
                    >
                      {i + 1}
                    </div>
                  </div>
                  {/* Text */}
                  <div>
                    <div
                      className="text-xs font-bold uppercase tracking-widest mb-1"
                      style={{ color }}
                    >
                      {step.number}
                    </div>
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: "#f8fafc" }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "rgba(248,250,252,0.5)" }}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Agent Floor */}
          <div>
            <div
              className="text-xs font-medium mb-3"
              style={{ color: "rgba(248,250,252,0.3)" }}
            >
              Live — 5 agenti al lavoro
            </div>
            <AgentFloor />
          </div>
        </div>

        {/* Agent Pipeline — full width below the two-col grid */}
        <div
          className="rounded-2xl p-8 sm:p-10"
          style={{
            background: "#0d1117",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <AgentPipeline />
        </div>
      </div>
    </section>
  );
}
