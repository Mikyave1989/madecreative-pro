"use client";

import { useState } from "react";
import type { Translations } from "@/lib/i18n";

interface ComparisonSectionProps {
  t: Translations;
  locale: string;
}

/* ── Data ─────────────────────────────────────────────────────────────────── */

type CellValue = true | false | "partial" | string;

interface ComparisonRow {
  madecreative: CellValue;
  wix: CellValue;
  wordpress: CellValue;
  customdev: CellValue;
  highlight?: boolean;
}

const ROWS: ComparisonRow[] = [
  { madecreative: true,      wix: false,      wordpress: false,     customdev: false,  highlight: true },
  { madecreative: true,      wix: false,      wordpress: false,     customdev: true,   highlight: true },
  { madecreative: true,      wix: false,      wordpress: false,     customdev: false,  highlight: true },
  { madecreative: true,      wix: true,       wordpress: false,     customdev: false },
  { madecreative: "€25/mo",  wix: "~€16/mo",  wordpress: "€25+",    customdev: "€5k+" },
  { madecreative: true,      wix: true,       wordpress: false,     customdev: false },
  { madecreative: true,      wix: "partial",  wordpress: "partial", customdev: false },
  { madecreative: true,      wix: true,       wordpress: "partial", customdev: false },
  { madecreative: true,      wix: false,      wordpress: false,     customdev: false },
  { madecreative: true,      wix: true,       wordpress: false,     customdev: false },
  { madecreative: true,      wix: false,      wordpress: "partial", customdev: true },
  { madecreative: true,      wix: true,       wordpress: true,      customdev: true },
];

const COLUMNS = [
  { key: "madecreative", highlight: true  },
  { key: "wix",          highlight: false },
  { key: "wordpress",    highlight: false },
  { key: "customdev",    highlight: false },
] as const;

type ColKey = (typeof COLUMNS)[number]["key"];

/* ── Highlight strip icons ───────────────────────────────────────────────── */

const HIGHLIGHT_ICONS = [
  (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
      <path d="M10 2l2.48 5.01L18 8.18l-4 3.9.94 5.5L10 14.77 5.06 17.58 6 12.08 2 8.18l5.52-.77L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
      <path d="M10 18s7-3.5 7-8.75V4.375L10 2 3 4.375V9.25C3 14.5 10 18 10 18z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v1.5M10 12.5V14M7.5 8.5A2.5 2.5 0 0112.5 10a2.5 2.5 0 01-5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
] as const;

const HIGHLIGHT_COLORS = ["#6366f1", "#34d399", "#fbbf24"] as const;

/* ── Cell renderer ────────────────────────────────────────────────────────── */

function Cell({
  value,
  isMC,
  partialLabel,
}: {
  value: CellValue;
  isMC: boolean;
  partialLabel: string;
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
          className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{
            background: "rgba(251,191,36,0.1)",
            color: "#fbbf24",
            border: "1px solid rgba(251,191,36,0.2)",
          }}
        >
          {partialLabel}
        </span>
      </div>
    );
  }

  // String value (prices etc.)
  return (
    <div className="flex justify-center">
      <span
        className="text-sm font-semibold whitespace-nowrap"
        style={{ color: isMC ? "#818cf8" : "rgba(248,250,252,0.55)" }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Section ──────────────────────────────────────────────────────────────── */

export function ComparisonSection({ t }: ComparisonSectionProps) {
  const { comparison } = t;
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const colLabels = [
    comparison.headers.madecreative,
    comparison.headers.wix,
    comparison.headers.wordpress,
    comparison.headers.custom,
  ];

  return (
    <section
      id="comparison"
      className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-8"
      style={{ background: "#05070f" }}
    >
      <div className="max-w-5xl mx-auto">
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
            {comparison.sectionLabel}
          </span>

          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-5 sm:mb-6"
            style={{ color: "#f8fafc" }}
          >
            {comparison.title}
            <br />
            <span style={{ color: "#6366f1" }}>{comparison.titleHighlight}</span>
          </h2>

          <p
            className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(248,250,252,0.5)" }}
          >
            {comparison.subtitle}
          </p>
        </div>

        {/* Table wrapper — horizontally scrollable on mobile, sticky first column */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full min-w-[560px]" style={{ borderCollapse: "collapse" }}>
              {/* Column headers */}
              <thead>
                <tr style={{ background: "#0d1117", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {/* Sticky feature label header */}
                  <th
                    className="px-4 sm:px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider sticky left-0 z-10"
                    style={{
                      background: "#0d1117",
                      color: "rgba(248,250,252,0.3)",
                      minWidth: 140,
                    }}
                  >
                    {comparison.headers.feature}
                  </th>
                  {COLUMNS.map((col, i) => (
                    <th
                      key={col.key}
                      className="px-3 py-4 text-center relative"
                      style={
                        col.highlight
                          ? {
                              background: "rgba(99,102,241,0.08)",
                              borderLeft: "1px solid rgba(99,102,241,0.2)",
                              borderRight: "1px solid rgba(99,102,241,0.2)",
                              minWidth: 110,
                            }
                          : { minWidth: 90 }
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
                        {colLabels[i]}
                      </span>
                      {col.highlight && (
                        <div className="mt-1">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                            style={{ background: "#6366f1", color: "#fff" }}
                          >
                            {comparison.best}
                          </span>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Data rows */}
              <tbody>
                {ROWS.map((row, i) => {
                  const isHovered = hoveredRow === i;
                  const isHighlighted = !!row.highlight;
                  const featureName = comparison.features[i]?.name ?? "";

                  return (
                    <tr
                      key={i}
                      className="transition-colors duration-150"
                      style={{
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
                      {/* Feature name — sticky on mobile */}
                      <td
                        className="px-4 sm:px-5 py-4 sticky left-0 z-10"
                        style={{
                          background: isHovered
                            ? "rgba(13,17,23,0.97)"
                            : isHighlighted
                            ? "rgba(8,10,22,0.97)"
                            : "rgba(5,7,15,0.97)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {isHighlighted && (
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: "#6366f1" }}
                            />
                          )}
                          <span
                            className="text-xs sm:text-sm font-medium whitespace-nowrap"
                            style={{
                              color: isHighlighted
                                ? "#f8fafc"
                                : "rgba(248,250,252,0.65)",
                            }}
                          >
                            {featureName}
                          </span>
                        </div>
                      </td>

                      {/* Cells */}
                      {COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className="px-3 py-4"
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
                            partialLabel={comparison.partial}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footnote */}
        <p
          className="text-center text-xs mt-5 sm:mt-6 px-2"
          style={{ color: "rgba(248,250,252,0.25)" }}
        >
          {comparison.footnote}
        </p>

        {/* Highlights strip */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {comparison.highlights.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                background: `${HIGHLIGHT_COLORS[i]}08`,
                border: `1px solid ${HIGHLIGHT_COLORS[i]}20`,
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: `${HIGHLIGHT_COLORS[i]}15`,
                  color: HIGHLIGHT_COLORS[i],
                }}
              >
                {HIGHLIGHT_ICONS[i]}
              </div>
              <p
                className="text-sm font-medium leading-snug"
                style={{ color: "rgba(248,250,252,0.7)" }}
              >
                {item.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
