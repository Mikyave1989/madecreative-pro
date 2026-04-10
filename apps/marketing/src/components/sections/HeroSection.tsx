"use client";

import { useState } from "react";
import type { Translations } from "@/lib/i18n";

interface HeroSectionProps {
  t: Translations;
  locale: string;
}

const SOCIAL_PROOF: Record<string, Array<{ value: string; label: string }>> = {
  de: [
    { value: "60s", label: "Website generiert" },
    { value: "€25", label: "ab / Monat" },
    { value: "14", label: "Tage Geld-zurück" },
  ],
  it: [
    { value: "60s", label: "per generare il sito" },
    { value: "€25", label: "a partire da / mese" },
    { value: "14", label: "giorni rimborso garantito" },
  ],
  en: [
    { value: "60s", label: "to generate your site" },
    { value: "€25", label: "starting from / month" },
    { value: "14", label: "day money-back guarantee" },
  ],
  es: [
    { value: "60s", label: "para generar tu web" },
    { value: "€25", label: "desde / mes" },
    { value: "14", label: "días garantía devolución" },
  ],
  fr: [
    { value: "60s", label: "pour générer votre site" },
    { value: "€25", label: "à partir de / mois" },
    { value: "14", label: "jours satisfait ou remboursé" },
  ],
  nl: [
    { value: "60s", label: "om je site te genereren" },
    { value: "€25", label: "vanaf / maand" },
    { value: "14", label: "dagen geld-terug-garantie" },
  ],
  pt: [
    { value: "60s", label: "para gerar seu site" },
    { value: "€25", label: "a partir de / mês" },
    { value: "14", label: "dias garantia reembolso" },
  ],
};

export function HeroSection({ t, locale }: HeroSectionProps) {
  const proof = SOCIAL_PROOF[locale] ?? SOCIAL_PROOF["en"]!;
  const [url, setUrl] = useState("");

  function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    window.location.href = `/${locale}#pricing?url=${encodeURIComponent(url.trim())}`;
  }

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#05070f" }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
        <div
          className="orb-float absolute top-[18%] left-1/2 w-[760px] h-[520px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 68%)" }}
        />
        <div
          className="orb-float-slow absolute top-[35%] left-[58%] w-[480px] h-[360px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.10) 0%, transparent 65%)", animationDelay: "2.5s" }}
        />
        <div
          className="orb-float absolute bottom-[12%] left-[8%] w-[360px] h-[280px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 65%)", animationDelay: "4.5s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-28 pb-20">
        {/* Badge */}
        <div
          className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 tracking-wide"
          style={{
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.25)",
            color: "#818cf8",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {t.hero.badge}
        </div>

        {/* Title */}
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

        {/* URL input bar */}
        <form
          onSubmit={handleAnalyze}
          className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-3 justify-center items-center max-w-2xl mx-auto mb-6"
        >
          <div className="relative flex-1 w-full">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              style={{ color: "rgba(248,250,252,0.35)" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.hero.urlPlaceholder}
              className="w-full pl-12 pr-4 py-4 rounded-xl text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/40"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#f8fafc",
              }}
            />
          </div>
          <button
            type="submit"
            className="glow-indigo inline-flex items-center gap-2 gradient-indigo text-white px-8 py-4 rounded-xl text-base font-semibold hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
          >
            {t.hero.urlCta}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </form>

        {/* Secondary CTA */}
        <div className="animate-fade-up delay-300 flex justify-center items-center mb-10">
          <a
            href={`/${locale}#how-it-works`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm transition-colors"
            style={{ color: "rgba(248,250,252,0.5)" }}
          >
            {t.hero.ctaSecondary}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </a>
        </div>

        {/* Trust note */}
        <p className="animate-fade-up delay-400 text-xs" style={{ color: "rgba(248,250,252,0.3)" }}>
          {t.hero.trustNote}
        </p>

        {/* Hero video */}
        <div className="animate-fade-up delay-400 mt-12 max-w-3xl mx-auto rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 40px rgba(99,102,241,0.15)" }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto block"
          >
            <source src="/videos/hero-demo.webm" type="video/webm" />
          </video>
        </div>

        {/* Social proof */}
        <div className="animate-fade-up delay-400 mt-14 grid grid-cols-3 gap-8 max-w-md mx-auto">
          {proof.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-3xl font-bold" style={{ color: "#818cf8" }}>
                {item.value}
              </div>
              <div className="text-xs mt-1.5" style={{ color: "rgba(248,250,252,0.35)" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "white" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </section>
  );
}
