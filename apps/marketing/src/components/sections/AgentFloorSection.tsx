"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { Translations } from "@/lib/i18n";

interface AgentFloorSectionProps {
  t: Translations;
}

interface Workstation {
  id: string;
  label: string;
  x: number; // % of SVG width
  y: number; // % of SVG height
  color: string;
  taskIndex: number;
}

const WORKSTATIONS: Workstation[] = [
  { id: "scraper",   label: "SCRAPER",     x: 15, y: 22, color: "#00f0ff", taskIndex: 0 },
  { id: "analyzer",  label: "ANALYZER",    x: 38, y: 18, color: "#a855f7", taskIndex: 1 },
  { id: "builder",   label: "BUILDER",     x: 62, y: 24, color: "#f59e0b", taskIndex: 2 },
  { id: "social",    label: "SOCIAL",      x: 50, y: 48, color: "#ec4899", taskIndex: 3 },
  { id: "chat",      label: "CHAT SUPPORT",x: 18, y: 72, color: "#3b82f6", taskIndex: 4 },
  { id: "qa",        label: "QA STATION",  x: 48, y: 72, color: "#ef4444", taskIndex: 5 },
  { id: "outreach",  label: "OUTREACH OPS",x: 78, y: 68, color: "#10b981", taskIndex: 6 },
];

// Each agent loops through a different set of waypoints
const AGENT_PATHS: Array<Array<[number, number]>> = [
  [[15, 22], [38, 18], [50, 48], [15, 22]],            // Agent 0
  [[38, 18], [62, 24], [48, 72], [38, 18]],            // Agent 1
  [[62, 24], [50, 48], [78, 68], [62, 24]],            // Agent 2
  [[50, 48], [18, 72], [48, 72], [50, 48]],            // Agent 3
  [[18, 72], [38, 18], [15, 22], [18, 72]],            // Agent 4
  [[48, 72], [62, 24], [38, 18], [48, 72]],            // Agent 5
  [[78, 68], [50, 48], [48, 72], [78, 68]],            // Agent 6
];

const AGENT_DURATIONS = [9, 12, 11, 8, 14, 10, 13];

function AgentAvatar({ color, index }: { color: string; index: number }) {
  return (
    <g>
      {/* Head */}
      <circle cx="0" cy="-12" r="5" fill={color} />
      {/* Eye */}
      <circle cx="2" cy="-13" r="1" fill="#0a0a0a" />
      {/* Body */}
      <rect x="-4" y="-7" width="8" height="8" rx="2" fill={color} opacity="0.9" />
      {/* Arms */}
      <rect x="-8" y="-6" width="4" height="2" rx="1" fill={color} opacity="0.7" />
      <rect x="4" y="-6" width="4" height="2" rx="1" fill={color} opacity="0.7" />
      {/* Legs - no animation in SVG children easily, use static for simplicity */}
      <rect x="-3" y="1" width="2.5" height="5" rx="1" fill={color} opacity="0.8" />
      <rect x="0.5" y="1" width="2.5" height="5" rx="1" fill={color} opacity="0.8" />
      {/* Agent number */}
      <text x="0" y="-18" textAnchor="middle" fontSize="4" fill={color} fontFamily="monospace">
        #{index + 1}
      </text>
    </g>
  );
}

function Workstation({ ws, hovered, onHover, onLeave }: {
  ws: Workstation;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  // Convert % to SVG units (SVG is 1000x560)
  const sx = (ws.x / 100) * 1000;
  const sy = (ws.y / 100) * 560;

  return (
    <g
      transform={`translate(${sx}, ${sy})`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ cursor: "pointer" }}
    >
      {/* Glow base */}
      {hovered && (
        <circle
          cx="0" cy="5"
          r="45"
          fill={ws.color}
          opacity="0.08"
        />
      )}

      {/* Desk */}
      <rect x="-35" y="5" width="70" height="30" rx="4" fill="#1a1a2e" stroke={ws.color} strokeWidth="1" strokeOpacity="0.5" />
      {/* Desk legs */}
      <rect x="-28" y="35" width="5" height="15" fill="#111" />
      <rect x="23" y="35" width="5" height="15" fill="#111" />
      {/* Monitor */}
      <rect x="-20" y="-20" width="40" height="28" rx="3" fill="#0f0f1a" stroke={ws.color} strokeWidth="1.5" strokeOpacity="0.7" />
      {/* Screen glow */}
      <rect x="-16" y="-17" width="32" height="22" rx="2" fill={ws.color} fillOpacity="0.12" />
      {/* Screen content lines */}
      <rect x="-12" y="-13" width="20" height="2" rx="1" fill={ws.color} fillOpacity="0.5" />
      <rect x="-12" y="-9" width="14" height="2" rx="1" fill={ws.color} fillOpacity="0.3" />
      <rect x="-12" y="-5" width="18" height="2" rx="1" fill={ws.color} fillOpacity="0.4" />
      {/* Monitor stand */}
      <rect x="-4" y="8" width="8" height="6" fill="#1a1a2e" />
      <rect x="-10" y="12" width="20" height="3" rx="1.5" fill="#1a1a2e" />

      {/* LED indicator */}
      <circle cx="18" cy="-20" r="3" fill={ws.color}>
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Agent label */}
      <text
        x="0" y="58"
        textAnchor="middle"
        fontSize="9"
        fill={ws.color}
        fontFamily="monospace"
        fontWeight="bold"
        letterSpacing="1"
      >
        {ws.label}
      </text>

      {/* Keyboard */}
      <rect x="-22" y="8" width="30" height="8" rx="2" fill="#0a0a14" stroke={ws.color} strokeWidth="0.5" strokeOpacity="0.3" />
      <rect x="-19" y="10" width="6" height="3" rx="0.5" fill={ws.color} fillOpacity="0.2" />
      <rect x="-12" y="10" width="6" height="3" rx="0.5" fill={ws.color} fillOpacity="0.15" />
      <rect x="-5" y="10" width="8" height="3" rx="0.5" fill={ws.color} fillOpacity="0.2" />
    </g>
  );
}

function AgentWalker({ path, duration, color, wsIndex }: {
  path: Array<[number, number]>;
  duration: number;
  color: string;
  wsIndex: number;
}) {
  // Build keyframes for x and y (convert % to SVG px)
  const xs = path.map(([px]) => (px / 100) * 1000);
  const ys = path.map(([, py]) => (py / 100) * 560);

  const times = path.map((_, i) => i / (path.length - 1));

  return (
    <motion.g
      initial={{ x: xs[0], y: ys[0] }}
      animate={{ x: xs, y: ys }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
        times,
      }}
    >
      <AgentAvatar color={color} index={wsIndex} />
    </motion.g>
  );
}

export function AgentFloorSection({ t }: AgentFloorSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);

  const hoveredWs = WORKSTATIONS.find((w) => w.id === hoveredStation);

  return (
    <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-semibold uppercase tracking-widest border border-[#f59e0b]/20">
            {t.agentFloor.sectionLabel}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading text-4xl sm:text-6xl font-bold text-white text-center mb-4"
        >
          {t.agentFloor.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-white/50 text-center max-w-2xl mx-auto mb-12"
        >
          {t.agentFloor.subtitle}
        </motion.p>

        {/* SVG floor */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
          style={{ background: "#0f0f1a" }}
        >
          {/* Tooltip */}
          {hoveredWs && (
            <div
              className="absolute z-20 pointer-events-none bg-[#1a1a2e] border rounded-xl px-4 py-3 shadow-2xl max-w-xs"
              style={{
                borderColor: hoveredWs.color + "60",
                top: `${hoveredWs.y}%`,
                left: `${hoveredWs.x > 70 ? hoveredWs.x - 20 : hoveredWs.x + 5}%`,
                transform: "translateY(-120%)",
              }}
            >
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: hoveredWs.color }}>
                {hoveredWs.label}
              </div>
              <div className="text-white/70 text-xs">
                {t.agentFloor.agents[hoveredWs.taskIndex]?.task}
              </div>
            </div>
          )}

          <svg
            viewBox="0 0 1000 560"
            className="w-full"
            style={{ aspectRatio: "16/9" }}
          >
            {/* Floor grid */}
            <defs>
              <pattern id="floor-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ffffff" strokeWidth="0.3" strokeOpacity="0.08" />
              </pattern>
              <radialGradient id="room-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a1a3a" stopOpacity="1" />
                <stop offset="100%" stopColor="#0f0f1a" stopOpacity="1" />
              </radialGradient>
              {WORKSTATIONS.map((ws) => (
                <radialGradient key={ws.id} id={`glow-${ws.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={ws.color} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={ws.color} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>

            {/* Background */}
            <rect width="1000" height="560" fill="url(#room-glow)" />
            <rect width="1000" height="560" fill="url(#floor-grid)" />

            {/* Ambient workstation glows */}
            {WORKSTATIONS.map((ws) => (
              <ellipse
                key={ws.id}
                cx={(ws.x / 100) * 1000}
                cy={(ws.y / 100) * 560}
                rx="80" ry="50"
                fill={ws.color}
                fillOpacity="0.04"
              />
            ))}

            {/* Floor perspective lines */}
            <g opacity="0.1">
              {[100, 200, 300, 400].map((y) => (
                <line key={y} x1="0" y1={y + 260} x2="1000" y2={y + 260} stroke="#ffffff" strokeWidth="0.5" />
              ))}
              {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
                <line key={x} x1={x} y1="400" x2={x} y2="560" stroke="#ffffff" strokeWidth="0.5" />
              ))}
            </g>

            {/* Connection paths between stations (subtle) */}
            <g opacity="0.08">
              {WORKSTATIONS.map((ws, i) => {
                const next = WORKSTATIONS[(i + 1) % WORKSTATIONS.length]!;
                return (
                  <line
                    key={ws.id}
                    x1={(ws.x / 100) * 1000}
                    y1={(ws.y / 100) * 560}
                    x2={(next.x / 100) * 1000}
                    y2={(next.y / 100) * 560}
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="6 4"
                  />
                );
              })}
            </g>

            {/* Workstations */}
            {inView && WORKSTATIONS.map((ws) => (
              <Workstation
                key={ws.id}
                ws={ws}
                hovered={hoveredStation === ws.id}
                onHover={() => setHoveredStation(ws.id)}
                onLeave={() => setHoveredStation(null)}
              />
            ))}

            {/* Walking agents */}
            {inView && AGENT_PATHS.map((path, i) => (
              <AgentWalker
                key={i}
                path={path}
                duration={AGENT_DURATIONS[i]!}
                color={WORKSTATIONS[i]!.color}
                wsIndex={i}
              />
            ))}

            {/* Title overlay */}
            <text
              x="500" y="30"
              textAnchor="middle"
              fontSize="11"
              fill="#f59e0b"
              fontFamily="monospace"
              letterSpacing="3"
              opacity="0.6"
            >
              MADECREATIVE — LIVE OPERATIONS
            </text>

            {/* Status bar */}
            <g transform="translate(0, 530)">
              <rect width="1000" height="30" fill="#000" fillOpacity="0.4" />
              <text x="20" y="19" fontSize="9" fill="#10b981" fontFamily="monospace" opacity="0.8">
                ● SISTEMA OPERATIVO
              </text>
              <text x="200" y="19" fontSize="9" fill="#f59e0b" fontFamily="monospace" opacity="0.6">
                7 AGENTI ATTIVI
              </text>
              <text x="380" y="19" fontSize="9" fill="#3b82f6" fontFamily="monospace" opacity="0.6">
                UPTIME: 99.9%
              </text>
              <text x="560" y="19" fontSize="9" fill="#a855f7" fontFamily="monospace" opacity="0.6">
                TASK IN CODA: 142
              </text>
              <text x="740" y="19" fontSize="9" fill="#ec4899" fontFamily="monospace" opacity="0.6">
                LATENZA: 0.3ms
              </text>
            </g>
          </svg>
        </motion.div>

        {/* Agent legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-8"
        >
          {WORKSTATIONS.map((ws, i) => (
            <div
              key={ws.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: ws.color + "10", border: `1px solid ${ws.color}30` }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ws.color }}>
                <div className="w-2 h-2 rounded-full animate-ping" style={{ background: ws.color, opacity: 0.5 }} />
              </div>
              <span className="text-xs font-medium" style={{ color: ws.color }}>
                {t.agentFloor.agents[i]?.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
