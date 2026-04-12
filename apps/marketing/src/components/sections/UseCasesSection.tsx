"use client";

import { useState } from "react";
import type { Translations } from "@/lib/i18n";

interface UseCasesSectionProps {
  t: Translations;
  locale: string;
}

/* ── Static icon data (visual only, no text) ─────────────────────────────── */

const USE_CASE_ICONS = [
  // restaurant
  (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
      <path d="M8 4v8a4 4 0 008 0V4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M12 12v16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M20 4v24M20 4c0 0 4 2 4 8H20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // medical
  (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
      <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 10v12M10 16h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  // beauty
  (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
      <circle cx="16" cy="10" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 28c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M22 14l2 2-2 2M10 14l-2 2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // real-estate
  (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
      <path d="M4 28V14L16 4l12 10v14H4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <rect x="12" y="18" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  // ecommerce
  (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
      <path d="M4 6h4l3 14h14l2-9H8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="13" cy="24" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="23" cy="24" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  // professional
  (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
      <rect x="4" y="8" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M11 8V6a2 2 0 012-2h6a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 16h24" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 16v2M19 16v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  // startups
  (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
      <path d="M16 4c-2 6-8 9-8 9s2 8 8 11c6-3 8-11 8-11S18 10 16 4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M13 17c1 1 2 1.5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  // portfolio
  (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
      <rect x="3" y="7" width="26" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="8" y="12" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 13h6M18 16h4M18 19h6M8 20h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  ),
] as const;

const USE_CASE_COLORS = [
  "#f97316",
  "#22d3ee",
  "#ec4899",
  "#6366f1",
  "#34d399",
  "#fbbf24",
  "#818cf8",
  "#a78bfa",
] as const;

/* ── Card component ───────────────────────────────────────────────────────── */

function UseCaseCard({
  item,
  icon,
  color,
}: {
  item: Translations["useCases"]["items"][number];
  icon: React.ReactNode;
  color: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group relative p-5 sm:p-6 rounded-2xl cursor-default transition-all duration-300"
      style={{
        background: hovered ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.02)",
        border: hovered
          ? `1px solid ${color}30`
          : "1px solid rgba(255,255,255,0.06)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
        style={{
          background: hovered ? `${color}18` : `${color}0d`,
          border: `1px solid ${color}${hovered ? "35" : "18"}`,
          color,
        }}
      >
        {icon}
      </div>

      {/* Name */}
      <h3
        className="text-sm sm:text-base font-semibold mb-2 leading-snug"
        style={{ color: "#f8fafc" }}
      >
        {item.name}
      </h3>

      {/* Tagline */}
      <p className="text-xs sm:text-sm font-medium mb-3 leading-snug" style={{ color, opacity: 0.85 }}>
        {item.tagline}
      </p>

      {/* Description */}
      <p
        className="text-xs sm:text-sm leading-relaxed"
        style={{ color: "rgba(248,250,252,0.45)" }}
      >
        {item.description}
      </p>

      {/* Stats badge */}
      <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <span
          className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider"
          style={{ color, opacity: 0.6 }}
        >
          {item.stats}
        </span>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-5 right-5 sm:left-6 sm:right-6 h-px rounded-full transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
          opacity: hovered ? 1 : 0,
        }}
      />
    </div>
  );
}

/* ── Section ──────────────────────────────────────────────────────────────── */

export function UseCasesSection({ t }: UseCasesSectionProps) {
  const { useCases } = t;

  return (
    <section
      id="use-cases"
      className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-8"
      style={{ background: "#0a0d18" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-5 sm:mb-6"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#818cf8",
            }}
          >
            {useCases.sectionLabel}
          </span>

          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-5 sm:mb-6"
            style={{ color: "#f8fafc" }}
          >
            {useCases.title}
            <br />
            <span style={{ color: "#6366f1" }}>{useCases.titleHighlight}</span>
          </h2>

          <p
            className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(248,250,252,0.5)" }}
          >
            {useCases.subtitle}
          </p>
        </div>

        {/* Grid — 1 col mobile → 2 col sm → 4 col lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {useCases.items.map((item, i) => (
            <UseCaseCard
              key={i}
              item={item}
              icon={USE_CASE_ICONS[i % USE_CASE_ICONS.length]}
              color={USE_CASE_COLORS[i % USE_CASE_COLORS.length]}
            />
          ))}
        </div>

        {/* Bottom CTA nudge */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-sm" style={{ color: "rgba(248,250,252,0.35)" }}>
            {useCases.ctaNote}{" "}
            <a
              href="#pricing"
              className="underline underline-offset-2 transition-colors hover:text-indigo-400"
              style={{ color: "rgba(248,250,252,0.55)" }}
            >
              {useCases.ctaLink}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
