"use client";

import { useState } from "react";

/* ── Data ─────────────────────────────────────────────────────────────────── */

type CellValue = true | false | "partial" | string;

interface ComparisonRow {
  feature: string;
  madecreative: CellValue;
  wix: CellValue;
  wordpress: CellValue;
  customdev: CellValue;
  highlight?: boolean;
}

const ROWS: ComparisonRow[] = [
  {
    feature: "AI code generation",
    madecreative: true,
    wix: false,
    wordpress: false,
    customdev: false,
    highlight: true,
  },
  {
    feature: "Real React / Next.js output",
    madecreative: true,
    wix: false,
    wordpress: false,
    customdev: true,
    highlight: true,
  },
  {
    feature: "Chat-based editing",
    madecreative: true,
    wix: false,
    wordpress: false,
    customdev: false,
    highlight: true,
  },
  {
    feature: "Live preview",
    madecreative: true,
    wix: true,
    wordpress: false,
    customdev: false,
  },
  {
    feature: "Starting price",
    madecreative: "€25/mo",
    wix: "~€16/mo",
    wordpress: "€25+ plugins",
    customdev: "€5,000+",
  },
  {
    feature: "Instant deploy",
    madecreative: true,
    wix: true,
    wordpress: false,
    customdev: false,
  },
  {
    feature: "Built-in SEO",
    madecreative: true,
    wix: "partial",
    wordpress: "partial",
    customdev: false,
  },
  {
    feature: "Mobile responsive",
    madecreative: true,
    wix: true,
    wordpress: "partial",
    customdev: false,
  },
  {
    feature: "Version history",
    madecreative: true,
    wix: false,
    wordpress: false,
    customdev: false,
  },
  {
    feature: "No code required",
    madecreative: true,
    wix: true,
    wordpress: false,
    customdev: false,
  },
  {
    feature: "You own the code",
    madecreative: true,
    wix: false,
    wordpress: "partial",
    customdev: true,
  },
  {
    feature: "Custom domain + SSL",
    madecreative: true,
    wix: true,
    wordpress: true,
    customdev: true,
  },
];

const COLUMNS = [
  { key: "madecreative", label: "MadeCreative", highlight: true },
  { key: "wix", label: "Wix", highlight: false },
  { key: "wordpress", label: "WordPress", highlight: false },
  { key: "customdev", label: "Custom Dev", highlight: false },
] as const;

type ColKey = (typeof COLUMNS)[number]["key"];

/* ── Cell renderer ────────────────────────────────────────────────────────── */

function Cell({
  value,
  isMC,
}: {
  value: CellValue;
  isMC: boolean;
}) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: isMC ? "rgba(99,102,241,0.2)" : "rgba(52,211,153,0.12)",
          }}
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
            <path
              d="M3.5 8l3 3 6-6"
              stroke={isMC ? "#818cf8" : "#34d399"}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (value === false) {
    return (
      <div className="flex justify-center">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
            <path
              d="M5 5l6 6M11 5l-6 6"
              stroke="rgba(248,250,252,0.2)"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (value === "partial") {
    return (
      <div className="flex justify-center">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(251,191,36,0.1)",
            color: "#fbbf24",
            border: "1px solid rgba(251,191,36,0.2)",
          }}
        >
          Partial
        </span>
      </div>
    );
  }

  // String value (prices etc.)
  return (
    <div className="flex justify-center">
      <span
        className="text-sm font-semibold"
        style={{ color: isMC ? "#818cf8" : "rgba(248,250,252,0.55)" }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Section ──────────────────────────────────────────────────────────────── */

export function ComparisonSection() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <section
      id="comparison"
      className="py-32 px-4 sm:px-6 lg:px-8"
      style={{ background: "#05070f" }}
    >
      <div className="max-w-5xl mx-auto">
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
            How we compare
          </span>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6"
            style={{ color: "#f8fafc" }}
          >
            Why choose MadeCreative
            <br />
            <span style={{ color: "#6366f1" }}>over the alternatives?</span>
          </h2>

          <p
            className="text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(248,250,252,0.5)" }}
          >
            Wix locks you into their builder. WordPress needs plugins, hosting, and a
            developer. Custom dev costs thousands. MadeCreative gives you real code,
            AI speed, and zero setup.
          </p>
        </div>

        {/* Table wrapper */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Column headers */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: "1fr repeat(4, minmax(0, 1fr))",
              background: "#0d1117",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="px-5 py-4" />
            {COLUMNS.map((col) => (
              <div
                key={col.key}
                className="px-3 py-4 text-center relative"
                style={
                  col.highlight
                    ? {
                        background: "rgba(99,102,241,0.08)",
                        borderLeft: "1px solid rgba(99,102,241,0.2)",
                        borderRight: "1px solid rgba(99,102,241,0.2)",
                      }
                    : {}
                }
              >
                {col.highlight && (
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: "#6366f1" }}
                  />
                )}
                <span
                  className="text-sm font-bold"
                  style={{
                    color: col.highlight ? "#818cf8" : "rgba(248,250,252,0.5)",
                  }}
                >
                  {col.label}
                </span>
                {col.highlight && (
                  <div className="mt-1">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                      style={{
                        background: "#6366f1",
                        color: "#fff",
                      }}
                    >
                      Best
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {ROWS.map((row, i) => {
            const isHovered = hoveredRow === i;
            const isHighlighted = !!row.highlight;

            return (
              <div
                key={row.feature}
                className="grid transition-colors duration-150"
                style={{
                  gridTemplateColumns: "1fr repeat(4, minmax(0, 1fr))",
                  background: isHovered
                    ? "rgba(255,255,255,0.025)"
                    : isHighlighted
                    ? "rgba(99,102,241,0.02)"
                    : "transparent",
                  borderBottom:
                    i < ROWS.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                }}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Feature name */}
                <div className="px-5 py-4 flex items-center gap-3">
                  {isHighlighted && (
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: "#6366f1" }}
                    />
                  )}
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: isHighlighted
                        ? "#f8fafc"
                        : "rgba(248,250,252,0.65)",
                    }}
                  >
                    {row.feature}
                  </span>
                </div>

                {/* Cells */}
                {COLUMNS.map((col) => (
                  <div
                    key={col.key}
                    className="px-3 py-4 flex items-center justify-center"
                    style={
                      col.highlight
                        ? {
                            background: "rgba(99,102,241,0.05)",
                            borderLeft: "1px solid rgba(99,102,241,0.15)",
                            borderRight: "1px solid rgba(99,102,241,0.15)",
                          }
                        : {}
                    }
                  >
                    <Cell
                      value={row[col.key as ColKey]}
                      isMC={col.key === "madecreative"}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "rgba(248,250,252,0.25)" }}
        >
          Pricing and features accurate as of April 2026. &quot;Partial&quot; indicates the feature
          requires plugins, manual setup, or third-party tools.
        </p>

        {/* Highlights strip */}
        <div className="mt-12 grid sm:grid-cols-3 gap-4">
          {[
            {
              label: "Only AI builder with real React output",
              color: "#6366f1",
              icon: (
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                  <path d="M10 2l2.48 5.01L18 8.18l-4 3.9.94 5.5L10 14.77 5.06 17.58 6 12.08 2 8.18l5.52-.77L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              label: "No plugins. No hosting headaches. No code.",
              color: "#34d399",
              icon: (
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                  <path d="M10 18s7-3.5 7-8.75V4.375L10 2 3 4.375V9.25C3 14.5 10 18 10 18z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              label: "€25/mo vs €5,000+ for custom dev",
              color: "#fbbf24",
              icon: (
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 6v1.5M10 12.5V14M7.5 8.5A2.5 2.5 0 0112.5 10a2.5 2.5 0 01-5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                background: `${item.color}08`,
                border: `1px solid ${item.color}20`,
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${item.color}15`, color: item.color }}
              >
                {item.icon}
              </div>
              <p
                className="text-sm font-medium leading-snug"
                style={{ color: "rgba(248,250,252,0.7)" }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
