"use client";

import type { Translations } from "@/lib/i18n";

interface PricingSectionProps {
  t: Translations;
}

interface PricingTier {
  name: string;
  price: string;
  period: string;
  badge?: string;
  featured: boolean;
  stripeUrl: string;
  ctaVariant: "outline-indigo" | "filled-indigo" | "outline-gray";
  ctaLabel: string;
  items: string[];
}

const TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: "€197",
    period: "/mese",
    featured: false,
    stripeUrl:
      process.env["NEXT_PUBLIC_STRIPE_STARTER_URL"] ??
      "https://buy.stripe.com/starter",
    ctaVariant: "outline-indigo",
    ctaLabel: "Inizia con Starter",
    items: [
      "Sito web 5 pagine (Home, Chi siamo, Servizi, Contatti, Blog)",
      "Chatbot AI 24/7 addestrato sul tuo business",
      "3 automazioni (email benvenuto, reminder appuntamenti, richiesta recensione)",
      "Report mensile PDF automatico",
      "Hosting + SSL + Dominio su madecreative.pro",
      "Cookie banner + Privacy GDPR",
      "Supporto via email",
    ],
  },
  {
    name: "Growth",
    price: "€347",
    period: "/mese",
    badge: "Più scelto",
    featured: true,
    stripeUrl:
      process.env["NEXT_PUBLIC_STRIPE_GROWTH_URL"] ??
      "https://buy.stripe.com/growth",
    ctaVariant: "filled-indigo",
    ctaLabel: "Inizia con Growth",
    items: [
      "Tutto di Starter, più:",
      "Sito web fino a 10 pagine personalizzate",
      "Chatbot avanzato con prenotazione appuntamenti integrata",
      "10 automazioni personalizzate",
      "Report settimanale + analytics avanzati",
      "SEO ottimizzazione mensile",
      "Blog con 4 articoli AI/mese",
      "Supporto prioritario (risposta 4h)",
    ],
  },
  {
    name: "Pro",
    price: "€597",
    period: "/mese",
    featured: false,
    stripeUrl:
      process.env["NEXT_PUBLIC_STRIPE_PRO_URL"] ??
      "https://buy.stripe.com/pro",
    ctaVariant: "outline-gray",
    ctaLabel: "Inizia con Pro",
    items: [
      "Tutto di Growth, più:",
      "Fino a 3 sedi / siti distinti",
      "Chatbot multilingua (IT, DE, EN, FR, ES)",
      "Automazioni illimitate",
      "Campagne email marketing mensili",
      "Account manager dedicato",
      "Onboarding call 1:1",
      "SLA 99.9% uptime garantito",
    ],
  },
];

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="w-4 h-4 flex-shrink-0 mt-0.5"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7" fill={color} fillOpacity="0.15" />
      <path
        d="M5 8l2 2 4-4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CtaButton({
  variant,
  href,
  label,
}: {
  variant: PricingTier["ctaVariant"];
  href: string;
  label: string;
}) {
  const base =
    "w-full py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200 text-center block";

  const styles: Record<PricingTier["ctaVariant"], React.CSSProperties> = {
    "outline-indigo": {
      border: "1px solid rgba(99,102,241,0.5)",
      color: "#818cf8",
      background: "transparent",
    },
    "filled-indigo": {
      background: "#6366f1",
      color: "#ffffff",
      border: "1px solid transparent",
    },
    "outline-gray": {
      border: "1px solid rgba(248,250,252,0.15)",
      color: "rgba(248,250,252,0.6)",
      background: "transparent",
    },
  };

  const hoverClass =
    variant === "filled-indigo"
      ? "hover:brightness-110 active:scale-[0.98]"
      : variant === "outline-indigo"
      ? "hover:bg-indigo-500/10 active:scale-[0.98]"
      : "hover:bg-white/5 active:scale-[0.98]";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${hoverClass}`}
      style={styles[variant]}
    >
      {label}
    </a>
  );
}

function PricingCard({ tier }: { tier: PricingTier }) {
  const featuredBorderColor = "#6366f1";
  const defaultBorder = "rgba(255,255,255,0.07)";
  const checkColor = tier.featured ? "#6366f1" : "#22d3ee";

  return (
    <div
      className="relative flex flex-col rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: tier.featured ? "#161b27" : "#0d1117",
        border: `1px solid ${tier.featured ? featuredBorderColor + "60" : defaultBorder}`,
        boxShadow: tier.featured
          ? "0 0 40px rgba(99,102,241,0.12)"
          : undefined,
      }}
      onMouseEnter={(e) => {
        if (!tier.featured) {
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "rgba(99,102,241,0.35)";
        }
      }}
      onMouseLeave={(e) => {
        if (!tier.featured) {
          (e.currentTarget as HTMLDivElement).style.borderColor = defaultBorder;
        }
      }}
    >
      {/* Badge */}
      {tier.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "#6366f1",
              color: "#ffffff",
            }}
          >
            <svg
              viewBox="0 0 12 12"
              fill="none"
              className="w-3 h-3"
              aria-hidden="true"
            >
              <path
                d="M6 1l1.24 2.51L10 4.24l-2 1.95.47 2.75L6 7.51 3.53 8.94 4 6.19 2 4.24l2.76-.73L6 1z"
                fill="currentColor"
              />
            </svg>
            {tier.badge}
          </span>
        </div>
      )}

      {/* Tier name */}
      <div
        className="text-xs font-bold uppercase tracking-widest mb-4"
        style={{ color: tier.featured ? "#818cf8" : "rgba(248,250,252,0.4)" }}
      >
        {tier.name}
      </div>

      {/* Price */}
      <div className="flex items-end gap-1 mb-6">
        <span
          className="text-5xl font-bold leading-none"
          style={{ color: "#f8fafc" }}
        >
          {tier.price}
        </span>
        <span
          className="text-sm mb-1"
          style={{ color: "rgba(248,250,252,0.4)" }}
        >
          {tier.period}
        </span>
      </div>

      {/* CTA */}
      <div className="mb-8">
        <CtaButton
          variant={tier.ctaVariant}
          href={tier.stripeUrl}
          label={tier.ctaLabel}
        />
      </div>

      {/* Divider */}
      <div
        className="mb-6 h-px"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />

      {/* Feature list */}
      <ul className="space-y-3 flex-1">
        {tier.items.map((item, i) => {
          const isSectionHeader = item.startsWith("Tutto di");
          return (
            <li
              key={i}
              className={
                isSectionHeader
                  ? "text-xs font-semibold uppercase tracking-wider pt-1"
                  : "flex items-start gap-2.5"
              }
              style={{
                color: isSectionHeader
                  ? "rgba(248,250,252,0.3)"
                  : "rgba(248,250,252,0.7)",
              }}
            >
              {!isSectionHeader && <CheckIcon color={checkColor} />}
              <span className={isSectionHeader ? "" : "text-sm leading-snug"}>
                {item}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PricingSection({ t: _t }: PricingSectionProps) {
  return (
    <section
      id="pricing"
      className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "#05070f" }}
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
            Prezzi
          </span>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: "#f8fafc" }}
          >
            Scegli il piano giusto{" "}
            <span style={{ color: "#6366f1" }}>per la tua attività</span>
          </h2>
          <p
            className="text-lg max-w-xl mx-auto"
            style={{ color: "rgba(248,250,252,0.5)" }}
          >
            Tutti i piani includono sito web AI, chatbot e automazioni. Nessun
            costo nascosto.
          </p>
        </div>

        {/* Pricing grid */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {TIERS.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>

        {/* Footer notes */}
        <div className="mt-10 text-center space-y-3">
          <p
            className="text-sm"
            style={{ color: "rgba(248,250,252,0.35)" }}
          >
            Nessun setup fee. Nessun contratto. Cancelli quando vuoi.
          </p>
          {/* Guarantee badge */}
          <div className="flex justify-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: "rgba(52,211,153,0.08)",
                border: "1px solid rgba(52,211,153,0.2)",
                color: "#34d399",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4 flex-shrink-0"
                aria-hidden="true"
              >
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              14 giorni soddisfatto o rimborsato — nessuna domanda.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
