import type { Translations } from "@/lib/i18n";

interface HeroSectionProps {
  t: Translations;
  locale: string;
}

export function HeroSection({ t, locale }: HeroSectionProps) {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#05070f" }}
    >
      {/* Static background — no animated blur */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Subtle grid */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Static indigo glow — no animation */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[400px] rounded-full opacity-[0.12]"
          style={{ background: "radial-gradient(ellipse, #6366f1 0%, transparent 70%)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
        {/* Badge */}
        <div
          className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.25)",
            color: "#818cf8",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {t.hero.badge}
        </div>

        {/* Title — CSS animation, NOT per-character */}
        <h1 className="animate-fade-up delay-100 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight mb-6">
          <span style={{ color: "#f8fafc" }}>{t.hero.title}</span>
          <br />
          <span className="text-gradient">{t.hero.titleHighlight}</span>
        </h1>

        {/* Subtitle */}
        <p
          className="animate-fade-up delay-200 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "rgba(248,250,252,0.55)" }}
        >
          {t.hero.subtitle}
        </p>

        {/* CTA */}
        <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
          <a
            href={`/${locale}#demo`}
            className="glow-indigo inline-flex items-center gap-2 gradient-indigo text-white px-8 py-4 rounded-xl text-base font-semibold hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5"
          >
            {t.hero.cta}
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </a>
          <a
            href={`/${locale}#how-it-works`}
            className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-sm transition-colors"
            style={{
              color: "rgba(248,250,252,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {t.hero.ctaSecondary}
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
              />
            </svg>
          </a>
        </div>

        {/* Trust note */}
        <p
          className="animate-fade-up delay-400 text-xs"
          style={{ color: "rgba(248,250,252,0.3)" }}
        >
          {t.hero.trustNote}
        </p>

        {/* Social proof numbers */}
        <div className="animate-fade-up delay-400 mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { value: "60s", label: "per generare il sito" },
            { value: "€197", label: "tutto incluso / mese" },
            { value: "14gg", label: "rimborso garantito" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl font-bold" style={{ color: "#818cf8" }}>
                {item.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "rgba(248,250,252,0.35)" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          style={{ color: "white" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </section>
  );
}
