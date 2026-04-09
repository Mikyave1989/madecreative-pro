import type { Translations } from "@/lib/i18n";

interface FinalCtaSectionProps {
  t: Translations;
  locale: string;
}

export function FinalCtaSection({ t, locale }: FinalCtaSectionProps) {
  return (
    <section
      className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: "#05070f" }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)" }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
          style={{
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.25)",
            color: "#818cf8",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          {t.finalCta.badge}
        </div>

        {/* Title */}
        <h2
          className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6"
          style={{ color: "#f8fafc" }}
        >
          {t.finalCta.title.split("60").map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>
                {part}
                <span className="text-gradient">60</span>
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </h2>

        <p
          className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "rgba(248,250,252,0.5)" }}
        >
          {t.finalCta.subtitle}
        </p>

        {/* CTA */}
        <a
          href={`/${locale}#pricing`}
          className="inline-flex items-center gap-3 gradient-indigo text-white px-10 py-5 rounded-2xl text-lg font-bold hover:opacity-90 transition-all duration-200 hover:-translate-y-1 glow-indigo"
        >
          {t.finalCta.cta}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>

        <p className="text-sm mt-4" style={{ color: "rgba(248,250,252,0.25)" }}>
          {t.finalCta.trustNote}
        </p>

        {/* Agent badges */}
        <div className="mt-16 flex justify-center gap-2 flex-wrap">
          {["SCRAPER", "ANALYZER", "BUILDER", "OUTREACH", "QA"].map((agent) => (
            <span
              key={agent}
              className="text-xs font-mono px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "rgba(248,250,252,0.25)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {agent}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
