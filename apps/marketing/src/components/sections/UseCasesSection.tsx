"use client";

import { useState } from "react";

/* ── Use-case data ────────────────────────────────────────────────────────── */

const USE_CASES = [
  {
    id: "restaurant",
    name: "Restaurants & Hospitality",
    tagline: "Menus, reservations, and ambiance — live in minutes.",
    description:
      "Menu pages, online booking widgets, opening hours, location maps, and gallery sections. The AI knows what restaurants need and builds it automatically.",
    color: "#f97316",
    stats: "Most popular category",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
        <path d="M8 4v8a4 4 0 008 0V4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M12 12v16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M20 4v24M20 4c0 0 4 2 4 8H20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "medical",
    name: "Medical & Dental Clinics",
    tagline: "Professional sites patients trust instantly.",
    description:
      "Appointment booking forms, service descriptions, team profiles, insurance info, and patient FAQs. Fully GDPR-compliant by default.",
    color: "#22d3ee",
    stats: "2nd most popular",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
        <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.75" />
        <path d="M16 10v12M10 16h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "beauty",
    name: "Beauty & Fitness Studios",
    tagline: "Bookings, pricing, and brand — beautifully presented.",
    description:
      "Service menus, class schedules, before/after galleries, instructor bios, and online booking. Mobile-first for clients booking on the go.",
    color: "#ec4899",
    stats: "Fast growing segment",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
        <circle cx="16" cy="10" r="4" stroke="currentColor" strokeWidth="1.75" />
        <path d="M8 28c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M22 14l2 2-2 2M10 14l-2 2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "real-estate",
    name: "Real Estate Agencies",
    tagline: "Property listings, lead capture, and agent profiles.",
    description:
      "Property search pages, contact forms, agent directories, neighborhood guides, and virtual tour embeds. Optimized for local SEO.",
    color: "#6366f1",
    stats: "High-ticket conversions",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
        <path d="M4 28V14L16 4l12 10v14H4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <rect x="12" y="18" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "ecommerce",
    name: "E-commerce Stores",
    tagline: "Product pages, cart flows, and checkout — built to convert.",
    description:
      "Product galleries, category pages, shopping cart, Stripe integration, and order confirmation pages. The AI handles the full purchase funnel.",
    color: "#34d399",
    stats: "Full checkout included",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
        <path d="M4 6h4l3 14h14l2-9H8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="13" cy="24" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="23" cy="24" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "professional",
    name: "Professional Services",
    tagline: "Law firms, accountants, consultants — credibility on day one.",
    description:
      "Service pages, case studies, team bios, consultation booking, and contact forms. The AI writes professional copy that establishes authority.",
    color: "#fbbf24",
    stats: "B2B lead generation",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
        <rect x="4" y="8" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M11 8V6a2 2 0 012-2h6a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 16h24" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13 16v2M19 16v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "startups",
    name: "Startups & SaaS",
    tagline: "Launch pages that convert visitors into signups.",
    description:
      "Hero sections, feature comparisons, pricing tables, testimonials, and email capture forms. A/B test variants with a single AI prompt.",
    color: "#818cf8",
    stats: "Fastest time-to-live",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
        <path d="M16 4c-2 6-8 9-8 9s2 8 8 11c6-3 8-11 8-11S18 10 16 4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M13 17c1 1 2 1.5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "portfolio",
    name: "Portfolios & Creatives",
    tagline: "Show your work. Get hired. No code needed.",
    description:
      "Project galleries, case study pages, skills sections, contact forms, and downloadable CVs. The AI makes creatives look as good as their work.",
    color: "#a78bfa",
    stats: "Loved by designers",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden>
        <rect x="3" y="7" width="26" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="8" y="12" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M18 13h6M18 16h4M18 19h6M8 20h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

/* ── Card component ───────────────────────────────────────────────────────── */

function UseCaseCard({ item }: { item: (typeof USE_CASES)[number] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group relative p-6 rounded-2xl cursor-default transition-all duration-300"
      style={{
        background: hovered ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.02)",
        border: hovered
          ? `1px solid ${item.color}30`
          : "1px solid rgba(255,255,255,0.06)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
        style={{
          background: hovered ? `${item.color}18` : `${item.color}0d`,
          border: `1px solid ${item.color}${hovered ? "35" : "18"}`,
          color: item.color,
        }}
      >
        {item.icon}
      </div>

      {/* Name */}
      <h3
        className="text-base font-semibold mb-2 leading-snug"
        style={{ color: "#f8fafc" }}
      >
        {item.name}
      </h3>

      {/* Tagline */}
      <p className="text-sm font-medium mb-3" style={{ color: item.color, opacity: 0.85 }}>
        {item.tagline}
      </p>

      {/* Description */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: "rgba(248,250,252,0.45)" }}
      >
        {item.description}
      </p>

      {/* Stats badge */}
      <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: item.color, opacity: 0.6 }}
        >
          {item.stats}
        </span>
      </div>

      {/* Bottom accent line */}
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

export function UseCasesSection() {
  return (
    <section
      id="use-cases"
      className="py-32 px-4 sm:px-6 lg:px-8"
      style={{ background: "#0a0d18" }}
    >
      <div className="max-w-7xl mx-auto">
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
            Built for every business
          </span>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6"
            style={{ color: "#f8fafc" }}
          >
            Whatever your business —
            <br />
            <span style={{ color: "#6366f1" }}>MadeCreative builds it.</span>
          </h2>

          <p
            className="text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(248,250,252,0.5)" }}
          >
            From a family restaurant to a Series A startup — the AI understands your industry
            and generates a site that matches your specific needs, audience, and goals.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {USE_CASES.map((item) => (
            <UseCaseCard key={item.id} item={item} />
          ))}
        </div>

        {/* Bottom CTA nudge */}
        <div className="mt-16 text-center">
          <p className="text-sm" style={{ color: "rgba(248,250,252,0.35)" }}>
            Don&apos;t see your industry?{" "}
            <a
              href="#pricing"
              className="underline underline-offset-2 transition-colors hover:text-indigo-400"
              style={{ color: "rgba(248,250,252,0.55)" }}
            >
              Try it free — describe what you need.
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
