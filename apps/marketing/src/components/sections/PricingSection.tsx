"use client";

import { useState } from "react";
import type { Translations } from "@/lib/i18n";

interface PricingSectionProps {
  t: Translations;
  locale: string;
}

/* ── Stripe Payment Links ──────────────────────────────────────────────── */
const LINKS = {
  starter: {
    monthly: "https://buy.stripe.com/fZu4gB5ECa393YWaOy24006",
    annual: "https://buy.stripe.com/5kQ14paYW1wD1QObSC24007",
  },
  growth: {
    monthly: "https://buy.stripe.com/4gM6oJeb80szgLI7Cm24008",
    annual: "https://buy.stripe.com/14A14p4Ay8Z58fc7Cm24009",
  },
  pro: {
    monthly: "https://buy.stripe.com/cNicN7ffcejp9jg1dY2400a",
    annual: "https://buy.stripe.com/eVq7sN1om0szfHEcWG2400b",
  },
};

/* ── i18n labels ────────────────────────────────────────────────────────── */
const L: Record<string, {
  monthly: string; annual: string; perMonth: string; perYear: string;
  save: string; free: string; startFree: string; getCta: string;
  popular: string; guarantee: string; noCard: string; noContract: string;
  cancel: string; current: string; features: string;
}> = {
  de: { monthly: "Monatlich", annual: "Jährlich", perMonth: "/Mo.", perYear: "/Jahr", save: "2 Monate gratis", free: "Kostenlos", startFree: "Jetzt starten", getCta: "Jetzt starten", popular: "Beliebteste", guarantee: "14 Tage Geld-zurück-Garantie", noCard: "Keine Kreditkarte", noContract: "Kein Vertrag", cancel: "Jederzeit kündbar", current: "Aktueller Plan", features: "Funktionen" },
  it: { monthly: "Mensile", annual: "Annuale", perMonth: "/mese", perYear: "/anno", save: "2 mesi gratis", free: "Gratis", startFree: "Inizia ora", getCta: "Inizia ora", popular: "Più scelto", guarantee: "14 giorni soddisfatti o rimborsati", noCard: "Nessuna carta richiesta", noContract: "Nessun contratto", cancel: "Cancelli quando vuoi", current: "Piano attuale", features: "Funzionalità" },
  en: { monthly: "Monthly", annual: "Annual", perMonth: "/mo", perYear: "/year", save: "2 months free", free: "Free", startFree: "Get started", getCta: "Get started", popular: "Most popular", guarantee: "14-day money-back guarantee", noCard: "No credit card", noContract: "No contract", cancel: "Cancel anytime", current: "Current plan", features: "Features" },
  es: { monthly: "Mensual", annual: "Anual", perMonth: "/mes", perYear: "/año", save: "2 meses gratis", free: "Gratis", startFree: "Empezar ahora", getCta: "Empezar ahora", popular: "Más elegido", guarantee: "14 días de garantía", noCard: "Sin tarjeta", noContract: "Sin contrato", cancel: "Cancela cuando quieras", current: "Plan actual", features: "Funciones" },
  fr: { monthly: "Mensuel", annual: "Annuel", perMonth: "/mois", perYear: "/an", save: "2 mois offerts", free: "Gratuit", startFree: "Commencer", getCta: "Commencer", popular: "Le plus populaire", guarantee: "Garantie 14 jours", noCard: "Sans carte", noContract: "Sans engagement", cancel: "Résiliez quand vous voulez", current: "Plan actuel", features: "Fonctionnalités" },
  nl: { monthly: "Maandelijks", annual: "Jaarlijks", perMonth: "/mnd", perYear: "/jaar", save: "2 maanden gratis", free: "Gratis", startFree: "Nu starten", getCta: "Nu beginnen", popular: "Meest gekozen", guarantee: "14 dagen geld-terug", noCard: "Geen creditcard", noContract: "Geen contract", cancel: "Altijd opzegbaar", current: "Huidig plan", features: "Functies" },
  pt: { monthly: "Mensal", annual: "Anual", perMonth: "/mês", perYear: "/ano", save: "2 meses grátis", free: "Grátis", startFree: "Começar agora", getCta: "Começar agora", popular: "Mais escolhido", guarantee: "14 dias de garantia", noCard: "Sem cartão", noContract: "Sem contrato", cancel: "Cancele quando quiser", current: "Plano atual", features: "Recursos" },
};

/* ── Tier data ──────────────────────────────────────────────────────────── */
interface Tier {
  key: "free" | "starter" | "growth" | "pro";
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  credits: string;
  featured: boolean;
  features: string[];
}

function getTiers(locale: string): Tier[] {
  const f = {
    de: {
      free: ["1 Website (5 Seiten)", "5 KI-Credits/Tag", "Chatbot AI", "madecreative.pro Subdomain", "Community Support"],
      starter: ["Website mit 5 Seiten", "100 KI-Credits/Monat", "Eigene Domain", "WhatsApp-Widget", "Menü/Preisliste-Editor", "Monatlicher Report", "E-Mail-Support", "Kein Lovable-Badge"],
      growth: ["Alles von Starter, plus:", "250 KI-Credits/Monat", "Bis zu 10 Seiten", "Chatbot mit Terminbuchung", "SEO-Optimierung monatlich", "Blog mit 4 KI-Artikeln/Monat", "Google Analytics + Meta Pixel", "Prioritäts-Support (4h)"],
      pro: ["Alles von Growth, plus:", "500 KI-Credits/Monat", "Bis zu 3 Standorte", "Mehrsprachiger Chatbot", "E-Mail-Marketing-Kampagnen", "SSO + Team-Workspace", "Persönlicher Account Manager", "99,9% Uptime SLA"],
    },
    it: {
      free: ["1 sito web (5 pagine)", "5 crediti AI/giorno", "Chatbot AI", "Sottodominio madecreative.pro", "Supporto community"],
      starter: ["Sito web 5 pagine", "100 crediti AI/mese", "Dominio personalizzato", "Widget WhatsApp", "Editor menu/listino", "Report mensile", "Supporto email", "Nessun badge MadeCreative"],
      growth: ["Tutto di Starter, più:", "250 crediti AI/mese", "Fino a 10 pagine", "Chatbot con prenotazioni", "Ottimizzazione SEO mensile", "Blog con 4 articoli AI/mese", "Google Analytics + Meta Pixel", "Supporto prioritario (4h)"],
      pro: ["Tutto di Growth, più:", "500 crediti AI/mese", "Fino a 3 sedi", "Chatbot multilingua", "Campagne email marketing", "SSO + workspace team", "Account manager dedicato", "SLA 99.9% uptime"],
    },
    en: {
      free: ["1 website (5 pages)", "5 AI credits/day", "AI chatbot", "madecreative.pro subdomain", "Community support"],
      starter: ["5-page website", "100 AI credits/month", "Custom domain", "WhatsApp widget", "Menu/price list editor", "Monthly report", "Email support", "No MadeCreative badge"],
      growth: ["Everything in Starter, plus:", "250 AI credits/month", "Up to 10 pages", "Chatbot with booking", "Monthly SEO optimization", "Blog with 4 AI articles/month", "Google Analytics + Meta Pixel", "Priority support (4h)"],
      pro: ["Everything in Growth, plus:", "500 AI credits/month", "Up to 3 locations", "Multilingual chatbot", "Email marketing campaigns", "SSO + team workspace", "Dedicated account manager", "99.9% uptime SLA"],
    },
    es: {
      free: ["1 sitio web (5 páginas)", "5 créditos AI/día", "Chatbot AI", "Subdominio madecreative.pro", "Soporte community"],
      starter: ["Sitio web 5 páginas", "100 créditos AI/mes", "Dominio personalizado", "Widget WhatsApp", "Editor menú/precios", "Informe mensual", "Soporte email", "Sin badge MadeCreative"],
      growth: ["Todo de Starter, más:", "250 créditos AI/mes", "Hasta 10 páginas", "Chatbot con reservas", "Optimización SEO mensual", "Blog con 4 artículos AI/mes", "Google Analytics + Meta Pixel", "Soporte prioritario (4h)"],
      pro: ["Todo de Growth, más:", "500 créditos AI/mes", "Hasta 3 ubicaciones", "Chatbot multilingüe", "Campañas email marketing", "SSO + workspace equipo", "Account manager dedicado", "SLA 99.9% uptime"],
    },
    fr: {
      free: ["1 site web (5 pages)", "5 crédits AI/jour", "Chatbot AI", "Sous-domaine madecreative.pro", "Support communauté"],
      starter: ["Site web 5 pages", "100 crédits AI/mois", "Domaine personnalisé", "Widget WhatsApp", "Éditeur menu/tarifs", "Rapport mensuel", "Support email", "Sans badge MadeCreative"],
      growth: ["Tout de Starter, plus :", "250 crédits AI/mois", "Jusqu'à 10 pages", "Chatbot avec réservation", "Optimisation SEO mensuelle", "Blog avec 4 articles AI/mois", "Google Analytics + Meta Pixel", "Support prioritaire (4h)"],
      pro: ["Tout de Growth, plus :", "500 crédits AI/mois", "Jusqu'à 3 sites", "Chatbot multilingue", "Campagnes email marketing", "SSO + workspace équipe", "Account manager dédié", "SLA 99.9% uptime"],
    },
    nl: {
      free: ["1 website (5 pagina's)", "5 AI-credits/dag", "AI-chatbot", "madecreative.pro subdomein", "Community support"],
      starter: ["Website met 5 pagina's", "100 AI-credits/maand", "Eigen domein", "WhatsApp-widget", "Menu/prijslijst editor", "Maandelijks rapport", "E-mailsupport", "Geen MadeCreative badge"],
      growth: ["Alles van Starter, plus:", "250 AI-credits/maand", "Tot 10 pagina's", "Chatbot met boekingen", "Maandelijkse SEO-optimalisatie", "Blog met 4 AI-artikelen/maand", "Google Analytics + Meta Pixel", "Prioriteitssupport (4u)"],
      pro: ["Alles van Growth, plus:", "500 AI-credits/maand", "Tot 3 locaties", "Meertalige chatbot", "E-mailmarketingcampagnes", "SSO + team workspace", "Toegewezen accountmanager", "SLA 99.9% uptime"],
    },
    pt: {
      free: ["1 site (5 páginas)", "5 créditos AI/dia", "Chatbot AI", "Subdomínio madecreative.pro", "Suporte community"],
      starter: ["Site com 5 páginas", "100 créditos AI/mês", "Domínio personalizado", "Widget WhatsApp", "Editor menu/preços", "Relatório mensal", "Suporte email", "Sem badge MadeCreative"],
      growth: ["Tudo do Starter, mais:", "250 créditos AI/mês", "Até 10 páginas", "Chatbot com agendamento", "Otimização SEO mensal", "Blog com 4 artigos AI/mês", "Google Analytics + Meta Pixel", "Suporte prioritário (4h)"],
      pro: ["Tudo do Growth, mais:", "500 créditos AI/mês", "Até 3 locais", "Chatbot multilíngue", "Campanhas email marketing", "SSO + workspace equipe", "Gerente de conta dedicado", "SLA 99.9% uptime"],
    },
  };
  const lang = f[locale as keyof typeof f] ?? f["en"];
  return [
    { key: "starter", name: "Starter", monthlyPrice: 25, annualPrice: 250, credits: "100/mo", featured: false, features: lang.starter },
    { key: "growth", name: "Growth", monthlyPrice: 50, annualPrice: 500, credits: "250/mo", featured: true, features: lang.growth },
    { key: "pro", name: "Pro", monthlyPrice: 99, annualPrice: 990, credits: "500/mo", featured: false, features: lang.pro },
  ];
}

/* ── Check icon ──────────────────────────────────────────────────────── */
function Check({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 flex-shrink-0 mt-0.5">
      <circle cx="10" cy="10" r="9" fill={`${color}20`} />
      <path d="M6.5 10.5l2.5 2.5 4.5-4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Main ────────────────────────────────────────────────────────────── */
export function PricingSection({ t: _t, locale }: PricingSectionProps) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const l = L[locale] ?? L["en"]!;
  const tiers = getTiers(locale);

  return (
    <section id="pricing" className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ background: "#05070f" }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(ellipse, #6366f1 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8" }}>
            {_t.prezziPage.badge}
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: "#f8fafc" }}>
            {_t.prezziPage.title}
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(248,250,252,0.5)" }}>
            {_t.prezziPage.subtitle}
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-14">
          <div className="inline-flex items-center rounded-full p-1 gap-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => setBilling("monthly")} className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-300" style={{ background: billing === "monthly" ? "#6366f1" : "transparent", color: billing === "monthly" ? "#fff" : "rgba(248,250,252,0.5)" }}>
              {l.monthly}
            </button>
            <button onClick={() => setBilling("annual")} className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2" style={{ background: billing === "annual" ? "#6366f1" : "transparent", color: billing === "annual" ? "#fff" : "rgba(248,250,252,0.5)" }}>
              {l.annual}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>{l.save}</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier) => {
            const price = billing === "monthly" ? tier.monthlyPrice : tier.annualPrice;
            const link = LINKS[tier.key as "starter" | "growth" | "pro"]?.[billing] ?? "#";
            const checkColor = tier.featured ? "#6366f1" : "#22d3ee";
            const isSectionHeader = (s: string) => s.includes("Free") || s.includes("Starter") || s.includes("Growth") || s.startsWith("Alles") || s.startsWith("Tutto") || s.startsWith("Everything") || s.startsWith("Todo") || s.startsWith("Tout") || s.startsWith("Tudo");

            return (
              <div key={tier.key} className="relative flex flex-col rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1" style={{
                background: tier.featured ? "linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(13,17,23,1) 100%)" : "#0d1117",
                border: `1px solid ${tier.featured ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)"}`,
                boxShadow: tier.featured ? "0 0 60px rgba(99,102,241,0.1)" : undefined,
              }}>
                {tier.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase" style={{ background: "#6366f1", color: "#fff" }}>
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M6 1l1.24 2.51L10 4.24l-2 1.95.47 2.75L6 7.51 3.53 8.94 4 6.19 2 4.24l2.76-.73L6 1z" fill="currentColor" /></svg>
                      {l.popular}
                    </span>
                  </div>
                )}

                <div className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: tier.featured ? "#818cf8" : "rgba(248,250,252,0.4)" }}>
                  {tier.name}
                </div>

                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold leading-none tabular-nums" style={{ color: "#f8fafc" }}>
                    {price === 0 ? l.free : `€${price}`}
                  </span>
                  {price > 0 && (
                    <span className="text-sm mb-1" style={{ color: "rgba(248,250,252,0.4)" }}>
                      {billing === "monthly" ? l.perMonth : l.perYear}
                    </span>
                  )}
                </div>

                {billing === "annual" && price > 0 && (
                  <p className="text-xs mb-5" style={{ color: "rgba(52,211,153,0.8)" }}>
                    = €{Math.round(tier.annualPrice / 12)}{l.perMonth}
                  </p>
                )}
                {(billing === "monthly" || price === 0) && <div className="mb-5" />}

                <a href={link} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 px-6 rounded-xl text-sm font-semibold text-center block transition-all duration-200 active:scale-[0.98] mb-6"
                  style={tier.featured
                    ? { background: "#6366f1", color: "#fff" }
                    : { border: "1px solid rgba(99,102,241,0.4)", color: "#818cf8" }
                  }>
                  {l.getCta}
                </a>

                <div className="h-px mb-5" style={{ background: "rgba(255,255,255,0.06)" }} />

                <ul className="space-y-2.5 flex-1">
                  {tier.features.map((feat, i) => {
                    const isHeader = isSectionHeader(feat);
                    return (
                      <li key={i} className={isHeader ? "text-[10px] font-semibold uppercase tracking-wider pt-1" : "flex items-start gap-2.5"}
                        style={{ color: isHeader ? "rgba(248,250,252,0.3)" : "rgba(248,250,252,0.7)" }}>
                        {!isHeader && <Check color={checkColor} />}
                        <span className={isHeader ? "" : "text-sm leading-snug"}>{feat}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: "rgba(248,250,252,0.35)" }}>
            <span>{l.noCard}</span><span className="hidden sm:inline">·</span>
            <span>{l.noContract}</span><span className="hidden sm:inline">·</span>
            <span>{l.cancel}</span>
          </div>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {l.guarantee}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
