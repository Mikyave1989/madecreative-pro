"use client";

import type { Translations } from "@/lib/i18n";

interface FeaturesSectionProps {
  t: Translations;
}

const FEATURE_ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 7h20" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    color: "#22d3ee",
    title: "Sito web 5 pagine",
    description: "Home, Chi siamo, Servizi, Contatti, Blog. Design professionale ottimizzato per ogni settore.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M8 10h.01M12 10h.01M16 10h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    color: "#818cf8",
    title: "Chatbot AI 24/7",
    description: "Auto-addestrato sul tuo business. Risponde a domande, cattura contatti, prenota appuntamenti.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    color: "#6366f1",
    title: "3 automazioni base",
    description: "Email di benvenuto automatica, reminder appuntamenti, richiesta recensione post-servizio.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    color: "#34d399",
    title: "Report mensile PDF",
    description: "Visite, lead, performance chatbot, posizione Google. Consegnato automaticamente ogni mese.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    color: "#f472b6",
    title: "Hosting + SSL + Dominio",
    description: "Tutto incluso su madecreative.pro. Certificato SSL, CDN globale, uptime 99.9%.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "#a78bfa",
    title: "Cookie banner + Privacy",
    description: "Conformità GDPR completa. Cookie banner, privacy policy e cookie policy generate automaticamente.",
  },
];

export function FeaturesSection({ t }: FeaturesSectionProps) {
  return (
    <section
      id="features"
      className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "#0d1117" }}
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
            {t.features.sectionLabel}
          </span>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: "#f8fafc" }}
          >
            Tutto a €197/mese. Nient&apos;altro.
          </h2>
          <p
            className="text-lg max-w-xl mx-auto mb-3"
            style={{ color: "rgba(248,250,252,0.5)" }}
          >
            Nessun setup fee. Nessun contratto. Cancelli quando vuoi.
          </p>
          {/* Guarantee badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mt-2"
            style={{
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.2)",
              color: "#34d399",
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
              <path
                d="M9 12l2 2 4-4M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Rimborso automatico entro 14 giorni — nessuna domanda.
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURE_ITEMS.map((item, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#161b27",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `${item.color}30`;
                (e.currentTarget as HTMLDivElement).style.background = "#1a2033";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLDivElement).style.background = "#161b27";
              }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${item.color}14`, color: item.color }}
              >
                {item.icon}
              </div>

              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "#f8fafc" }}
              >
                {item.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(248,250,252,0.45)" }}
              >
                {item.description}
              </p>

              {/* Bottom accent */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl"
                style={{ background: `linear-gradient(90deg, ${item.color}60, transparent)` }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
