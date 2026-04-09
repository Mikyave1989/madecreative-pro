"use client";

import { useState } from "react";
import type { Translations } from "@/lib/i18n";

interface PricingSectionProps {
  t: Translations;
  locale: string;
}

/* ── Stripe Payment Links (env vars, fallback to Stripe checkout) ──────── */
const LINKS = {
  starter: {
    monthly: "https://buy.stripe.com/28EcN7aYWgrx7b81dY24000",
    once: "https://buy.stripe.com/9B6fZj4Ay4IP53009U24001",
  },
  growth: {
    monthly: "https://buy.stripe.com/7sY5kF0kia39fHE1dY24002",
    once: "https://buy.stripe.com/7sYaEZd746QXdzwcWG24003",
  },
  pro: {
    monthly: "https://buy.stripe.com/14A6oJffcdflfHE7Cm24004",
    once: "https://buy.stripe.com/8x28wR9US1wDankbSC24005",
  },
};

/* ── i18n labels per locale ─────────────────────────────────────────────── */
const LABELS: Record<
  string,
  {
    monthly: string;
    oneTime: string;
    perMonth: string;
    oneTimeLabel: string;
    save: string;
    startCta: string;
    popular: string;
    guarantee: string;
    noSetup: string;
    noContract: string;
    cancel: string;
  }
> = {
  de: {
    monthly: "Monatlich",
    oneTime: "Einmalzahlung",
    perMonth: "/Monat",
    oneTimeLabel: "einmalig",
    save: "Spare 2 Monate",
    startCta: "Jetzt starten",
    popular: "Beliebteste",
    guarantee: "14 Tage Geld-zurück-Garantie",
    noSetup: "Kein Setup-Fee",
    noContract: "Kein Vertrag",
    cancel: "Jederzeit kündbar",
  },
  it: {
    monthly: "Mensile",
    oneTime: "Pagamento unico",
    perMonth: "/mese",
    oneTimeLabel: "una tantum",
    save: "Risparmi 2 mesi",
    startCta: "Inizia ora",
    popular: "Più scelto",
    guarantee: "14 giorni soddisfatti o rimborsati",
    noSetup: "Nessun costo di setup",
    noContract: "Nessun contratto",
    cancel: "Cancelli quando vuoi",
  },
  en: {
    monthly: "Monthly",
    oneTime: "One-time payment",
    perMonth: "/month",
    oneTimeLabel: "one-time",
    save: "Save 2 months",
    startCta: "Get started",
    popular: "Most popular",
    guarantee: "14-day money-back guarantee",
    noSetup: "No setup fee",
    noContract: "No contract",
    cancel: "Cancel anytime",
  },
  es: {
    monthly: "Mensual",
    oneTime: "Pago único",
    perMonth: "/mes",
    oneTimeLabel: "pago único",
    save: "Ahorra 2 meses",
    startCta: "Empezar ahora",
    popular: "Más elegido",
    guarantee: "14 días de garantía de devolución",
    noSetup: "Sin coste de instalación",
    noContract: "Sin contrato",
    cancel: "Cancela cuando quieras",
  },
  fr: {
    monthly: "Mensuel",
    oneTime: "Paiement unique",
    perMonth: "/mois",
    oneTimeLabel: "paiement unique",
    save: "Économisez 2 mois",
    startCta: "Commencer",
    popular: "Le plus populaire",
    guarantee: "Garantie satisfait ou remboursé 14 jours",
    noSetup: "Pas de frais d'installation",
    noContract: "Pas de contrat",
    cancel: "Annulez quand vous voulez",
  },
  nl: {
    monthly: "Maandelijks",
    oneTime: "Eenmalige betaling",
    perMonth: "/maand",
    oneTimeLabel: "eenmalig",
    save: "Bespaar 2 maanden",
    startCta: "Nu beginnen",
    popular: "Meest gekozen",
    guarantee: "14 dagen geld-terug-garantie",
    noSetup: "Geen setupkosten",
    noContract: "Geen contract",
    cancel: "Altijd opzegbaar",
  },
  pt: {
    monthly: "Mensal",
    oneTime: "Pagamento único",
    perMonth: "/mês",
    oneTimeLabel: "pagamento único",
    save: "Economize 2 meses",
    startCta: "Começar agora",
    popular: "Mais escolhido",
    guarantee: "Garantia de reembolso de 14 dias",
    noSetup: "Sem taxa de configuração",
    noContract: "Sem contrato",
    cancel: "Cancele quando quiser",
  },
};

/* ── Tier data ─────────────────────────────────────────────────────────── */
interface Tier {
  key: "starter" | "growth" | "pro";
  name: string;
  monthlyPrice: number;
  yearPrice: number;
  featured: boolean;
  features: string[];
}

function getTiers(locale: string): Tier[] {
  const tiers: Record<string, Tier[]> = {
    de: [
      {
        key: "starter",
        name: "Starter",
        monthlyPrice: 197,
        yearPrice: 1970,
        featured: false,
        features: [
          "Website mit 5 Seiten",
          "KI-Chatbot 24/7",
          "3 Automationen",
          "Monatlicher Report",
          "Hosting + SSL + Domain",
          "DSGVO Cookie-Banner",
          "E-Mail-Support",
        ],
      },
      {
        key: "growth",
        name: "Growth",
        monthlyPrice: 347,
        yearPrice: 3470,
        featured: true,
        features: [
          "Alles von Starter, plus:",
          "Bis zu 10 Seiten",
          "Chatbot mit Terminbuchung",
          "10 Automationen",
          "Wöchentlicher Report + Analytics",
          "Monatliche SEO-Optimierung",
          "Blog mit 4 KI-Artikeln/Monat",
          "Prioritäts-Support (4h)",
        ],
      },
      {
        key: "pro",
        name: "Pro",
        monthlyPrice: 597,
        yearPrice: 5970,
        featured: false,
        features: [
          "Alles von Growth, plus:",
          "Bis zu 3 Standorte / Websites",
          "Mehrsprachiger Chatbot",
          "Unbegrenzte Automationen",
          "E-Mail-Marketing-Kampagnen",
          "Persönlicher Account Manager",
          "1:1 Onboarding-Anruf",
          "99,9% Uptime SLA",
        ],
      },
    ],
    it: [
      {
        key: "starter",
        name: "Starter",
        monthlyPrice: 197,
        yearPrice: 1970,
        featured: false,
        features: [
          "Sito web 5 pagine",
          "Chatbot AI 24/7",
          "3 automazioni",
          "Report mensile PDF",
          "Hosting + SSL + Dominio",
          "Cookie banner + Privacy GDPR",
          "Supporto via email",
        ],
      },
      {
        key: "growth",
        name: "Growth",
        monthlyPrice: 347,
        yearPrice: 3470,
        featured: true,
        features: [
          "Tutto di Starter, più:",
          "Fino a 10 pagine personalizzate",
          "Chatbot con prenotazione appuntamenti",
          "10 automazioni personalizzate",
          "Report settimanale + analytics",
          "Ottimizzazione SEO mensile",
          "Blog con 4 articoli AI/mese",
          "Supporto prioritario (4h)",
        ],
      },
      {
        key: "pro",
        name: "Pro",
        monthlyPrice: 597,
        yearPrice: 5970,
        featured: false,
        features: [
          "Tutto di Growth, più:",
          "Fino a 3 sedi / siti distinti",
          "Chatbot multilingua",
          "Automazioni illimitate",
          "Campagne email marketing",
          "Account manager dedicato",
          "Onboarding call 1:1",
          "SLA 99.9% uptime garantito",
        ],
      },
    ],
    en: [
      {
        key: "starter",
        name: "Starter",
        monthlyPrice: 197,
        yearPrice: 1970,
        featured: false,
        features: [
          "5-page website",
          "AI chatbot 24/7",
          "3 automations",
          "Monthly PDF report",
          "Hosting + SSL + Domain",
          "GDPR cookie banner & privacy",
          "Email support",
        ],
      },
      {
        key: "growth",
        name: "Growth",
        monthlyPrice: 347,
        yearPrice: 3470,
        featured: true,
        features: [
          "Everything in Starter, plus:",
          "Up to 10 custom pages",
          "Chatbot with appointment booking",
          "10 custom automations",
          "Weekly report + analytics",
          "Monthly SEO optimization",
          "Blog with 4 AI articles/month",
          "Priority support (4h)",
        ],
      },
      {
        key: "pro",
        name: "Pro",
        monthlyPrice: 597,
        yearPrice: 5970,
        featured: false,
        features: [
          "Everything in Growth, plus:",
          "Up to 3 locations / websites",
          "Multilingual chatbot",
          "Unlimited automations",
          "Email marketing campaigns",
          "Dedicated account manager",
          "1:1 onboarding call",
          "99.9% uptime SLA",
        ],
      },
    ],
    es: [
      {
        key: "starter",
        name: "Starter",
        monthlyPrice: 197,
        yearPrice: 1970,
        featured: false,
        features: [
          "Sitio web de 5 páginas",
          "Chatbot IA 24/7",
          "3 automatizaciones",
          "Informe mensual PDF",
          "Hosting + SSL + Dominio",
          "Banner de cookies + RGPD",
          "Soporte por email",
        ],
      },
      {
        key: "growth",
        name: "Growth",
        monthlyPrice: 347,
        yearPrice: 3470,
        featured: true,
        features: [
          "Todo de Starter, más:",
          "Hasta 10 páginas",
          "Chatbot con reservas",
          "10 automatizaciones",
          "Informe semanal + analytics",
          "Optimización SEO mensual",
          "Blog con 4 artículos IA/mes",
          "Soporte prioritario (4h)",
        ],
      },
      {
        key: "pro",
        name: "Pro",
        monthlyPrice: 597,
        yearPrice: 5970,
        featured: false,
        features: [
          "Todo de Growth, más:",
          "Hasta 3 ubicaciones / sitios",
          "Chatbot multilingüe",
          "Automatizaciones ilimitadas",
          "Campañas de email marketing",
          "Account manager dedicado",
          "Llamada de onboarding 1:1",
          "SLA 99.9% uptime",
        ],
      },
    ],
    fr: [
      {
        key: "starter",
        name: "Starter",
        monthlyPrice: 197,
        yearPrice: 1970,
        featured: false,
        features: [
          "Site web 5 pages",
          "Chatbot IA 24/7",
          "3 automatisations",
          "Rapport mensuel PDF",
          "Hébergement + SSL + Domaine",
          "Bandeau cookies + RGPD",
          "Support par email",
        ],
      },
      {
        key: "growth",
        name: "Growth",
        monthlyPrice: 347,
        yearPrice: 3470,
        featured: true,
        features: [
          "Tout de Starter, plus :",
          "Jusqu'à 10 pages",
          "Chatbot avec prise de RDV",
          "10 automatisations",
          "Rapport hebdo + analytics",
          "Optimisation SEO mensuelle",
          "Blog avec 4 articles IA/mois",
          "Support prioritaire (4h)",
        ],
      },
      {
        key: "pro",
        name: "Pro",
        monthlyPrice: 597,
        yearPrice: 5970,
        featured: false,
        features: [
          "Tout de Growth, plus :",
          "Jusqu'à 3 sites / emplacements",
          "Chatbot multilingue",
          "Automatisations illimitées",
          "Campagnes email marketing",
          "Account manager dédié",
          "Appel d'onboarding 1:1",
          "SLA 99.9% uptime",
        ],
      },
    ],
    nl: [
      {
        key: "starter",
        name: "Starter",
        monthlyPrice: 197,
        yearPrice: 1970,
        featured: false,
        features: [
          "Website met 5 pagina's",
          "AI-chatbot 24/7",
          "3 automatiseringen",
          "Maandelijks PDF-rapport",
          "Hosting + SSL + Domein",
          "Cookie-banner + AVG",
          "E-mailondersteuning",
        ],
      },
      {
        key: "growth",
        name: "Growth",
        monthlyPrice: 347,
        yearPrice: 3470,
        featured: true,
        features: [
          "Alles van Starter, plus:",
          "Tot 10 pagina's",
          "Chatbot met afspraken",
          "10 automatiseringen",
          "Wekelijks rapport + analytics",
          "Maandelijkse SEO-optimalisatie",
          "Blog met 4 AI-artikelen/maand",
          "Prioriteitsondersteuning (4u)",
        ],
      },
      {
        key: "pro",
        name: "Pro",
        monthlyPrice: 597,
        yearPrice: 5970,
        featured: false,
        features: [
          "Alles van Growth, plus:",
          "Tot 3 locaties / websites",
          "Meertalige chatbot",
          "Onbeperkte automatiseringen",
          "E-mailmarketingcampagnes",
          "Toegewezen accountmanager",
          "1:1 onboarding-gesprek",
          "SLA 99.9% uptime",
        ],
      },
    ],
    pt: [
      {
        key: "starter",
        name: "Starter",
        monthlyPrice: 197,
        yearPrice: 1970,
        featured: false,
        features: [
          "Site com 5 páginas",
          "Chatbot IA 24/7",
          "3 automações",
          "Relatório mensal PDF",
          "Hospedagem + SSL + Domínio",
          "Banner de cookies + LGPD",
          "Suporte por email",
        ],
      },
      {
        key: "growth",
        name: "Growth",
        monthlyPrice: 347,
        yearPrice: 3470,
        featured: true,
        features: [
          "Tudo do Starter, mais:",
          "Até 10 páginas",
          "Chatbot com agendamento",
          "10 automações",
          "Relatório semanal + analytics",
          "Otimização SEO mensal",
          "Blog com 4 artigos IA/mês",
          "Suporte prioritário (4h)",
        ],
      },
      {
        key: "pro",
        name: "Pro",
        monthlyPrice: 597,
        yearPrice: 5970,
        featured: false,
        features: [
          "Tudo do Growth, mais:",
          "Até 3 locais / sites",
          "Chatbot multilíngue",
          "Automações ilimitadas",
          "Campanhas de email marketing",
          "Gerente de conta dedicado",
          "Chamada de onboarding 1:1",
          "SLA 99.9% uptime",
        ],
      },
    ],
  };
  return tiers[locale] ?? tiers["en"]!;
}

/* ── Check icon ────────────────────────────────────────────────────────── */
function Check({ featured }: { featured: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 flex-shrink-0 mt-0.5">
      <circle
        cx="10"
        cy="10"
        r="9"
        fill={featured ? "rgba(99,102,241,0.15)" : "rgba(34,211,238,0.12)"}
      />
      <path
        d="M6.5 10.5l2.5 2.5 4.5-4.5"
        stroke={featured ? "#818cf8" : "#22d3ee"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Main component ────────────────────────────────────────────────────── */
export function PricingSection({ t: _t, locale }: PricingSectionProps) {
  const [billing, setBilling] = useState<"monthly" | "once">("monthly");
  const l = LABELS[locale] ?? LABELS["en"]!;
  const tiers = getTiers(locale);

  return (
    <section id="pricing" className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ background: "#05070f" }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse, #6366f1 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#818cf8",
            }}
          >
            {_t.prezziPage.badge}
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: "#f8fafc" }}>
            {_t.prezziPage.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span style={{ color: "#6366f1" }}>
              {_t.prezziPage.title.split(" ").slice(-1)[0]}
            </span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(248,250,252,0.5)" }}>
            {_t.prezziPage.subtitle}
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-14">
          <div
            className="inline-flex items-center rounded-full p-1 gap-1"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={() => setBilling("monthly")}
              className="relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300"
              style={{
                background: billing === "monthly" ? "#6366f1" : "transparent",
                color: billing === "monthly" ? "#fff" : "rgba(248,250,252,0.5)",
              }}
            >
              {l.monthly}
            </button>
            <button
              onClick={() => setBilling("once")}
              className="relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2"
              style={{
                background: billing === "once" ? "#6366f1" : "transparent",
                color: billing === "once" ? "#fff" : "rgba(248,250,252,0.5)",
              }}
            >
              {l.oneTime}
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}
              >
                {l.save}
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier) => {
            const link = LINKS[tier.key][billing];
            const price = billing === "monthly" ? tier.monthlyPrice : tier.yearPrice;
            const isSectionHeader = (s: string) => s.includes("Starter") || s.includes("Growth") || s.startsWith("Alles") || s.startsWith("Tutto") || s.startsWith("Everything") || s.startsWith("Todo") || s.startsWith("Tout") || s.startsWith("Tudo");

            return (
              <div
                key={tier.key}
                className="relative flex flex-col rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: tier.featured
                    ? "linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(13,17,23,1) 100%)"
                    : "#0d1117",
                  border: `1px solid ${tier.featured ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)"}`,
                  boxShadow: tier.featured ? "0 0 60px rgba(99,102,241,0.1), 0 0 120px rgba(99,102,241,0.05)" : undefined,
                }}
              >
                {/* Popular badge */}
                {tier.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase"
                      style={{ background: "#6366f1", color: "#fff" }}
                    >
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                        <path
                          d="M6 1l1.24 2.51L10 4.24l-2 1.95.47 2.75L6 7.51 3.53 8.94 4 6.19 2 4.24l2.76-.73L6 1z"
                          fill="currentColor"
                        />
                      </svg>
                      {l.popular}
                    </span>
                  </div>
                )}

                {/* Tier name */}
                <div
                  className="text-xs font-bold uppercase tracking-[0.2em] mb-5"
                  style={{ color: tier.featured ? "#818cf8" : "rgba(248,250,252,0.4)" }}
                >
                  {tier.name}
                </div>

                {/* Price */}
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-5xl font-bold leading-none tabular-nums" style={{ color: "#f8fafc" }}>
                    €{price}
                  </span>
                  <span className="text-sm mb-1.5" style={{ color: "rgba(248,250,252,0.4)" }}>
                    {billing === "monthly" ? l.perMonth : l.oneTimeLabel}
                  </span>
                </div>

                {/* Monthly equivalent for one-time */}
                {billing === "once" && (
                  <p className="text-xs mb-6" style={{ color: "rgba(52,211,153,0.8)" }}>
                    = €{Math.round(tier.yearPrice / 12)}{l.perMonth} — {l.save}
                  </p>
                )}
                {billing === "monthly" && <div className="mb-6" />}

                {/* CTA */}
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-center block transition-all duration-200 active:scale-[0.98] mb-8"
                  style={
                    tier.featured
                      ? { background: "#6366f1", color: "#fff", border: "1px solid transparent" }
                      : {
                          border: "1px solid rgba(99,102,241,0.4)",
                          color: "#818cf8",
                          background: "transparent",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (tier.featured) {
                      (e.currentTarget as HTMLAnchorElement).style.filter = "brightness(1.15)";
                    } else {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,102,241,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tier.featured) {
                      (e.currentTarget as HTMLAnchorElement).style.filter = "none";
                    } else {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }
                  }}
                >
                  {l.startCta}
                </a>

                {/* Divider */}
                <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.06)" }} />

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {tier.features.map((feat, i) => {
                    const isHeader = isSectionHeader(feat);
                    return (
                      <li
                        key={i}
                        className={isHeader ? "text-xs font-semibold uppercase tracking-wider pt-1" : "flex items-start gap-2.5"}
                        style={{ color: isHeader ? "rgba(248,250,252,0.3)" : "rgba(248,250,252,0.7)" }}
                      >
                        {!isHeader && <Check featured={tier.featured} />}
                        <span className={isHeader ? "" : "text-sm leading-snug"}>{feat}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer notes */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: "rgba(248,250,252,0.35)" }}>
            <span>{l.noSetup}</span>
            <span className="hidden sm:inline">·</span>
            <span>{l.noContract}</span>
            <span className="hidden sm:inline">·</span>
            <span>{l.cancel}</span>
          </div>

          {/* Guarantee badge */}
          <div className="flex justify-center">
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
              style={{
                background: "rgba(52,211,153,0.08)",
                border: "1px solid rgba(52,211,153,0.2)",
                color: "#34d399",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0">
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
              {l.guarantee}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
