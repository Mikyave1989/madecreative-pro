"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SUPPORTED_LOCALES, getTranslations, type Locale } from "@/lib/i18n";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ locale: string }>;
}

type DemoState = "idle" | "loading" | "success";

// ─── Terminal step component ──────────────────────────────────────────────────

function TerminalStep({
  text,
  index,
  active,
  done,
}: {
  text: string;
  index: number;
  active: boolean;
  done: boolean;
}) {
  const colors = ["#22d3ee", "#818cf8", "#6366f1", "#34d399", "#f472b6"];
  const color = colors[index % colors.length]!;

  return (
    <AnimatePresence>
      {(active || done) && (
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex items-center gap-3 font-mono text-sm"
        >
          {done ? (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" fill={`${color}20`} />
              <path
                d="M5 8l2 2 4-4"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              className="w-4 h-4 flex-shrink-0 flex items-center justify-center"
            >
              <span
                className="w-2 h-2 rounded-full block"
                style={{ background: color }}
              />
            </motion.span>
          )}
          <span style={{ color: done ? color : "rgba(255,255,255,0.7)" }}>
            {text}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Stats badge ──────────────────────────────────────────────────────────────

function StatBadge({ label, icon }: { label: string; icon: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"
    >
      <span className="text-green-400 text-base">{icon}</span>
      <span className="text-sm font-medium text-white/80">{label}</span>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoPage({ params }: PageProps) {
  const { locale } = use(params);

  if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
    notFound();
  }

  const t = getTranslations(locale as Locale);
  const td = t.demoPage;

  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [demoState, setDemoState] = useState<DemoState>("idle");
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Run terminal animation when loading
  useEffect(() => {
    if (demoState !== "loading") return;

    const totalSteps = td.terminalSteps.length;
    const stepDuration = 700;

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < totalSteps; i++) {
      timers.push(
        setTimeout(() => {
          setCurrentStep(i);
        }, i * stepDuration)
      );
      timers.push(
        setTimeout(() => {
          setCompletedSteps((prev) => [...prev, i]);
        }, i * stepDuration + stepDuration - 100)
      );
    }

    timers.push(
      setTimeout(() => {
        setDemoState("success");
        setCurrentStep(-1);
      }, totalSteps * stepDuration + 400)
    );

    return () => timers.forEach(clearTimeout);
  }, [demoState, td.terminalSteps.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !sector || !city.trim()) return;
    setCurrentStep(-1);
    setCompletedSteps([]);
    setDemoState("loading");
  }

  function handleReset() {
    setDemoState("idle");
    setCompany("");
    setSector("");
    setCity("");
    setCountry("");
    setCurrentStep(-1);
    setCompletedSteps([]);
  }

  const slug = company.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <main className="min-h-screen bg-[#05070f]">
      <Nav t={t} locale={locale as Locale} />

      {/* Hero gradient */}
      <div className="absolute inset-0 h-[480px] bg-gradient-to-b from-indigo-950/20 via-[#05070f] to-transparent pointer-events-none" />

      <div className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-900/30 text-indigo-300 text-xs font-semibold uppercase tracking-widest border border-indigo-700/40">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {td.badge}
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-center mb-4 leading-tight"
          >
            {td.title}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#22d3ee]">
              {td.titleHighlight}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-white/50 text-center max-w-lg mx-auto mb-12 leading-relaxed"
          >
            {td.subtitle}
          </motion.p>

          {/* Demo card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-3xl border border-white/10 bg-[#0d1117] shadow-2xl shadow-black/50 overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {/* ── IDLE: form ── */}
              {demoState === "idle" && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="p-8 md:p-10"
                >
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Company name */}
                    <div>
                      <label className="block text-sm font-semibold text-white/60 mb-2">
                        {td.labelCompany}
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="es. Pizzeria Bella Italia"
                        className="w-full px-4 py-3.5 rounded-xl bg-[#0d1117] border border-white/10 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none transition-all text-white placeholder:text-white/30 text-sm"
                        required
                      />
                    </div>

                    {/* Sector dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-white/60 mb-2">
                        {td.labelSector}
                      </label>
                      <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl bg-[#0d1117] border border-white/10 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none transition-all text-white text-sm appearance-none"
                        required
                        style={{ colorScheme: "dark" }}
                      >
                        <option value="" disabled className="bg-[#0d1117]">
                          — {td.labelSector} —
                        </option>
                        {td.sectorOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-[#0d1117]">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* City + Country */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-white/60 mb-2">
                          {td.labelCity}
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="es. Milano"
                          className="w-full px-4 py-3.5 rounded-xl bg-[#0d1117] border border-white/10 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none transition-all text-white placeholder:text-white/30 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white/60 mb-2">
                          {td.labelCountry}
                        </label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder={td.countryPlaceholder}
                          className="w-full px-4 py-3.5 rounded-xl bg-[#0d1117] border border-white/10 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none transition-all text-white placeholder:text-white/30 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!company.trim() || !sector || !city.trim()}
                      className="w-full gradient-indigo text-white py-4 rounded-xl font-semibold text-base transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-400/40 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {td.cta}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── LOADING: terminal animation ── */}
              {demoState === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="p-8 md:p-10"
                >
                  {/* Terminal window */}
                  <div className="rounded-2xl bg-[#05070f] border border-white/10 overflow-hidden">
                    {/* Terminal chrome */}
                    <div className="bg-[#0d1117] px-4 py-3 flex items-center gap-3 border-b border-white/5">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      </div>
                      <span className="text-white/25 text-xs font-mono ml-2">
                        madecreative — ai-builder
                      </span>
                    </div>

                    {/* Terminal body */}
                    <div className="p-6 min-h-[220px] space-y-3">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-mono text-xs text-white/30 mb-4"
                      >
                        $ build --company &quot;{company}&quot; --sector {sector} --city {city}
                      </motion.div>

                      {td.terminalSteps.map((step, i) => (
                        <TerminalStep
                          key={i}
                          text={step}
                          index={i}
                          active={currentStep === i}
                          done={completedSteps.includes(i)}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── SUCCESS: preview ready ── */}
              {demoState === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="p-8 md:p-10"
                >
                  {/* Mock browser preview */}
                  <div className="rounded-2xl border border-white/10 overflow-hidden mb-6 shadow-2xl shadow-black/40">
                    {/* Browser chrome */}
                    <div className="bg-[#0d1117] px-4 py-3 flex items-center gap-3 border-b border-white/5">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      </div>
                      <div className="flex-1 bg-white/5 rounded-lg px-3 py-1.5 text-xs text-white/30 font-mono border border-white/10">
                        {slug || "preview"}.madecreative.pro
                      </div>
                      <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      </div>
                    </div>

                    {/* Mock website content */}
                    <div className="bg-[#05070f] p-6 min-h-[200px]">
                      {/* Mock hero */}
                      <div className="max-w-sm mx-auto">
                        {/* Fake nav */}
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-indigo-500 rounded-lg" />
                            <div className="h-3 bg-white/20 rounded w-20" />
                          </div>
                          <div className="flex gap-3">
                            <div className="h-2.5 bg-white/10 rounded w-10" />
                            <div className="h-2.5 bg-white/10 rounded w-10" />
                            <div className="h-2.5 bg-indigo-500/50 rounded w-14" />
                          </div>
                        </div>

                        {/* Fake hero */}
                        <div className="text-center py-4">
                          <div className="h-4 bg-white/10 rounded w-1/2 mx-auto mb-2" />
                          <div className="h-7 bg-white/20 rounded-lg w-4/5 mx-auto mb-2" />
                          <div className="h-7 bg-indigo-500/30 rounded-lg w-3/5 mx-auto mb-3" />
                          <div className="h-3 bg-white/10 rounded w-full mb-1.5" />
                          <div className="h-3 bg-white/10 rounded w-4/5 mx-auto mb-5" />
                          <div className="inline-block bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl">
                            {company}
                          </div>
                        </div>

                        {/* Fake stats row */}
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          {[1, 2, 3].map((n) => (
                            <div
                              key={n}
                              className="bg-white/5 rounded-xl p-2 text-center"
                            >
                              <div className="h-5 bg-indigo-500/20 rounded mb-1" />
                              <div className="h-2.5 bg-white/8 rounded w-3/4 mx-auto" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-3 justify-center mb-8">
                    <StatBadge label={td.statsLighthouse} icon="⚡" />
                    <StatBadge label={td.statsLoad} icon="🚀" />
                    <StatBadge label={td.statsMobile} icon="📱" />
                  </div>

                  {/* Success message */}
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      className="w-14 h-14 bg-green-500/15 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    >
                      <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                    <h2 className="font-heading text-2xl font-bold text-white mb-2">
                      {td.previewTitle}
                    </h2>
                    <p className="text-white/50 text-sm">{td.previewSubtitle}</p>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/${locale}#features`}
                      className="flex-1 text-center gradient-indigo text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {td.previewCta}
                    </Link>
                    <button
                      onClick={handleReset}
                      className="flex-1 px-6 py-3.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 hover:text-white transition-all font-medium"
                    >
                      {td.tryAgain}
                    </button>
                  </div>
                  <p className="text-center text-xs text-white/25 mt-3">
                    {td.previewCtaNote}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <Footer t={t} locale={locale} />
    </main>
  );
}
