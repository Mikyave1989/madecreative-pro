"use client";

import type { Translations } from "@/lib/i18n";

interface FeaturesSectionProps {
  t: Translations;
}

const ICONS = [
  // Website
  <svg key="web" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2 7h20" stroke="currentColor" strokeWidth="1.5" />
  </svg>,
  // SEO
  <svg key="seo" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>,
  // Social
  <svg key="social" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M17 2h4v4M14.5 9.5L21 3M8 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  // Chatbot
  <svg key="chat" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M8 10h.01M12 10h.01M16 10h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>,
  // Automation
  <svg key="auto" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>,
  // Reports
  <svg key="report" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>,
];

const COLORS = ["#22d3ee", "#6366f1", "#f472b6", "#818cf8", "#34d399", "#a78bfa"];

export function FeaturesSection({ t }: FeaturesSectionProps) {
  return (
    <section id="features" className="py-28 px-4 sm:px-6 lg:px-8" style={{ background: "#0d1117" }}>
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
            {t.features.sectionLabel}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: "#f8fafc" }}>
            {t.features.title}
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(248,250,252,0.5)" }}>
            {t.features.subtitle}
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.features.items.map((item, i) => {
            const color = COLORS[i % COLORS.length]!;
            const icon = ICONS[i % ICONS.length];
            return (
              <div
                key={i}
                className="group relative p-4 sm:p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "#161b27",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${color}30`;
                  (e.currentTarget as HTMLDivElement).style.background = "#1a2033";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLDivElement).style.background = "#161b27";
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}14`, color }}
                >
                  {icon}
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: "#f8fafc" }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(248,250,252,0.45)" }}>
                  {item.description}
                </p>
                <div
                  className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl"
                  style={{ background: `linear-gradient(90deg, ${color}60, transparent)` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
