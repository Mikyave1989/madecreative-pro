"use client";

import { useState } from "react";
import type { Translations } from "@/lib/i18n";

interface TestimonialsSectionProps {
  t: Translations;
  locale: string;
}

/* ── Static color/style data tied to item index ──────────────────────────── */

const ITEM_COLORS = ["#f97316", "#22d3ee", "#818cf8", "#ec4899"] as const;
const ITEM_INITIALS = ["MR", "SB", "TK", "LM"] as const;
const ITEM_AVATAR_BG = [
  "linear-gradient(135deg, #f97316, #dc2626)",
  "linear-gradient(135deg, #22d3ee, #6366f1)",
  "linear-gradient(135deg, #818cf8, #ec4899)",
  "linear-gradient(135deg, #ec4899, #f97316)",
] as const;
const ITEM_STARS = [5, 5, 5, 5] as const;

/* ── Star rating ──────────────────────────────────────────────────────────── */

function Stars({ count, color }: { count: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} viewBox="0 0 16 16" fill="none" className="w-4 h-4">
          <path
            d="M8 1.5l1.65 3.34 3.69.54-2.67 2.6.63 3.67L8 9.77l-3.3 1.88.63-3.67L2.66 5.38l3.69-.54L8 1.5z"
            fill={color}
            stroke={color}
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

/* ── Avatar ───────────────────────────────────────────────────────────────── */

function Avatar({
  initials,
  avatarBg,
}: {
  initials: string;
  avatarBg: string;
}) {
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-sm"
      style={{ background: avatarBg }}
    >
      {initials}
    </div>
  );
}

/* ── Quote icon ───────────────────────────────────────────────────────────── */

function QuoteIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 32 24"
      fill="none"
      className="w-8 h-6 flex-shrink-0"
      aria-hidden
    >
      <path
        d="M0 24V14.4C0 10.56 1.07 7.36 3.2 4.8 5.33 2.24 8.4.8 12.4.8v4.8c-2 0-3.6.64-4.8 1.92C6.4 8.8 5.8 10.48 5.8 12.4v.8H12V24H0zm16 0V14.4c0-3.84 1.07-7.04 3.2-9.6C21.33 2.24 24.4.8 28.4.8v4.8c-2 0-3.6.64-4.8 1.92-1.2 1.28-1.8 2.96-1.8 4.88v.8H28V24H16z"
        fill={color}
        fillOpacity="0.2"
      />
    </svg>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────────── */

function TestimonialCard({
  item,
  index,
  featured,
}: {
  item: Translations["testimonials"]["items"][number];
  index: number;
  featured?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const color = ITEM_COLORS[index % ITEM_COLORS.length];
  const initials = ITEM_INITIALS[index % ITEM_INITIALS.length];
  const avatarBg = ITEM_AVATAR_BG[index % ITEM_AVATAR_BG.length];
  const stars = ITEM_STARS[index % ITEM_STARS.length];

  return (
    <div
      className="relative flex flex-col p-5 sm:p-6 md:p-7 rounded-2xl transition-all duration-300"
      style={{
        background: hovered
          ? "rgba(255,255,255,0.03)"
          : featured
          ? "rgba(99,102,241,0.05)"
          : "rgba(255,255,255,0.02)",
        border: hovered
          ? `1px solid ${color}30`
          : featured
          ? "1px solid rgba(99,102,241,0.2)"
          : "1px solid rgba(255,255,255,0.07)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top: quote icon + stars */}
      <div className="flex items-start justify-between mb-5">
        <QuoteIcon color={color} />
        <Stars count={stars} color={color} />
      </div>

      {/* Quote */}
      <p
        className="text-sm sm:text-base leading-relaxed flex-1 mb-5 sm:mb-6"
        style={{ color: "rgba(248,250,252,0.7)" }}
      >
        &ldquo;{item.quote}&rdquo;
      </p>

      {/* Result badge */}
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold mb-4 sm:mb-5 self-start"
        style={{
          background: `${color}12`,
          border: `1px solid ${color}25`,
          color,
        }}
      >
        <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 flex-shrink-0">
          <path
            d="M3 8l3 3 7-7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {item.result}
      </div>

      {/* Divider */}
      <div
        className="h-px mb-4 sm:mb-5"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />

      {/* Author */}
      <div className="flex items-center gap-3">
        <Avatar initials={initials} avatarBg={avatarBg} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#f8fafc" }}>
            {item.name}
          </p>
          <p className="text-xs" style={{ color: "rgba(248,250,252,0.45)" }}>
            {item.role}
          </p>
          <p className="text-xs" style={{ color: "rgba(248,250,252,0.25)" }}>
            {item.location}
          </p>
        </div>
      </div>

      {/* Accent line */}
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

export function TestimonialsSection({ t }: TestimonialsSectionProps) {
  const { testimonials } = t;

  return (
    <section
      id="testimonials"
      className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: "#0a0d18" }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[300px] sm:h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 max-w-7xl mx-auto">
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
            {testimonials.sectionLabel}
          </span>

          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-5 sm:mb-6"
            style={{ color: "#f8fafc" }}
          >
            {testimonials.title}
            <br />
            <span style={{ color: "#6366f1" }}>{testimonials.titleHighlight}</span>
          </h2>

          <p
            className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(248,250,252,0.5)" }}
          >
            {testimonials.subtitle}
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 md:gap-16 mb-12 sm:mb-16">
          {testimonials.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums mb-1"
                style={{ color: "#f8fafc" }}
              >
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: "rgba(248,250,252,0.4)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Cards grid — 1 col mobile → 2 col sm → 4 col xl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {testimonials.items.map((item, i) => (
            <TestimonialCard key={i} item={item} index={i} featured={i === 0} />
          ))}
        </div>

        {/* Trust footer */}
        <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-10">
          {testimonials.trust.map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-2 text-xs sm:text-sm"
              style={{ color: "rgba(248,250,252,0.35)" }}
            >
              <span style={{ color: "rgba(248,250,252,0.2)" }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
