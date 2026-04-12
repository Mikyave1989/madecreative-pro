"use client";

import { useState } from "react";

/* ── Data ─────────────────────────────────────────────────────────────────── */

const TESTIMONIALS = [
  {
    id: "marco",
    name: "Marco R.",
    role: "Restaurant Owner",
    location: "Milan, Italy",
    quote:
      "In 2 minutes I had a site that would have cost me €5,000 with an agency. I typed 'build a site for my trattoria in Milan with online reservations' and it built exactly that — menu, photos, booking widget, everything. My customers can book directly from Google now.",
    result: "Reservations up 40% in first month",
    color: "#f97316",
    stars: 5,
    initials: "MR",
    avatarBg: "linear-gradient(135deg, #f97316, #dc2626)",
  },
  {
    id: "sarah",
    name: "Dr. Sarah B.",
    role: "Dental Clinic Owner",
    location: "Vienna, Austria",
    quote:
      "The AI understood exactly what my practice needed — patient trust, professional design, appointment booking, and GDPR-compliant forms. I was worried about the medical sector but it generated proper Schema.org markup and everything was correct. My patients comment on how professional it looks.",
    result: "New patient inquiries doubled",
    color: "#22d3ee",
    stars: 5,
    initials: "SB",
    avatarBg: "linear-gradient(135deg, #22d3ee, #6366f1)",
  },
  {
    id: "thomas",
    name: "Thomas K.",
    role: "Startup Founder",
    location: "Berlin, Germany",
    quote:
      "I described my SaaS landing page and it built exactly what I had in mind — feature sections, pricing table, testimonials, the works. I then asked it to add a waitlist form and it did it in 30 seconds. What would have taken a freelancer a week took me one afternoon. The code is actually clean too.",
    result: "€0 spent on development",
    color: "#818cf8",
    stars: 5,
    initials: "TK",
    avatarBg: "linear-gradient(135deg, #818cf8, #ec4899)",
  },
  {
    id: "lucia",
    name: "Lucia M.",
    role: "Beauty Studio Owner",
    location: "Barcelona, Spain",
    quote:
      "I have zero technical knowledge and I was scared to try. But I typed what I wanted and it just worked. Beautiful gallery, service prices, Instagram feed integration, a booking button. My clients tell me it looks better than my competitors who paid agencies thousands.",
    result: "Fully live in under 1 hour",
    color: "#ec4899",
    stars: 5,
    initials: "LM",
    avatarBg: "linear-gradient(135deg, #ec4899, #f97316)",
  },
] as const;

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
  size = "md",
}: {
  initials: string;
  avatarBg: string;
  size?: "md" | "lg";
}) {
  const cls = size === "lg" ? "w-14 h-14 text-lg" : "w-11 h-11 text-sm";
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
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
  featured,
}: {
  item: (typeof TESTIMONIALS)[number];
  featured?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex flex-col p-6 sm:p-7 rounded-2xl transition-all duration-300"
      style={{
        background: hovered
          ? "rgba(255,255,255,0.03)"
          : featured
          ? "rgba(99,102,241,0.05)"
          : "rgba(255,255,255,0.02)",
        border: hovered
          ? `1px solid ${item.color}30`
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
        <QuoteIcon color={item.color} />
        <Stars count={item.stars} color={item.color} />
      </div>

      {/* Quote */}
      <p
        className="text-sm sm:text-base leading-relaxed flex-1 mb-6"
        style={{ color: "rgba(248,250,252,0.7)" }}
      >
        &ldquo;{item.quote}&rdquo;
      </p>

      {/* Result badge */}
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold mb-5 self-start"
        style={{
          background: `${item.color}12`,
          border: `1px solid ${item.color}25`,
          color: item.color,
        }}
      >
        <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
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
        className="h-px mb-5"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />

      {/* Author */}
      <div className="flex items-center gap-3">
        <Avatar initials={item.initials} avatarBg={item.avatarBg} />
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
        className="absolute bottom-0 left-6 right-6 h-px rounded-full transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${item.color}50, transparent)`,
          opacity: hovered ? 1 : 0,
        }}
      />
    </div>
  );
}

/* ── Section ──────────────────────────────────────────────────────────────── */

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: "#0a0d18" }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 max-w-7xl mx-auto">
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
            Customer stories
          </span>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6"
            style={{ color: "#f8fafc" }}
          >
            Real businesses.
            <br />
            <span style={{ color: "#6366f1" }}>Real results.</span>
          </h2>

          <p
            className="text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(248,250,252,0.5)" }}
          >
            From restaurant owners to startup founders — see what happens when you
            replace €5,000 agency quotes with a 2-minute AI conversation.
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mb-16">
          {[
            { value: "< 2 min", label: "Average build time" },
            { value: "€25/mo", label: "Starting price" },
            { value: "95+", label: "PageSpeed score" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-3xl sm:text-4xl font-bold tabular-nums mb-1"
                style={{ color: "#f8fafc" }}
              >
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: "rgba(248,250,252,0.4)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Cards grid — 2 cols on md, 4 on xl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {TESTIMONIALS.map((item, i) => (
            <TestimonialCard key={item.id} item={item} featured={i === 0} />
          ))}
        </div>

        {/* Trust footer */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {[
            { icon: "★", text: "4.9/5 average rating" },
            { icon: "✓", text: "No credit card required" },
            { icon: "↺", text: "Cancel anytime" },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-2 text-sm"
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
