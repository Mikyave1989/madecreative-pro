"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type { Translations } from "@/lib/i18n";

interface DemoSectionProps {
  t: Translations;
  locale: string;
}

type DemoState = "idle" | "loading" | "success";

export function DemoSection({ t, locale }: DemoSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState<DemoState>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sector.trim() || !city.trim()) return;
    setState("loading");
    await new Promise((r) => setTimeout(r, 2400));
    setState("success");
  }

  function reset() {
    setState("idle");
    setName("");
    setSector("");
    setCity("");
  }

  return (
    <section ref={ref} id="demo" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-600 text-xs font-semibold uppercase tracking-widest border border-cyan-100">
            {t.demo.sectionLabel}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading text-4xl sm:text-5xl font-bold text-gray-900 text-center mb-4"
        >
          {t.demo.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-500 text-center max-w-xl mx-auto mb-12"
        >
          {t.demo.subtitle}
        </motion.p>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-100 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 md:p-10"
              >
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nome azienda
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.demo.namePlaceholder}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Settore
                      </label>
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder={t.demo.sectorPlaceholder}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Città
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t.demo.cityPlaceholder}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!name.trim() || !sector.trim() || !city.trim()}
                    className="w-full bg-[#f59e0b] text-[#0a0a0a] py-4 rounded-xl font-semibold text-base hover:bg-[#fcd34d] transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-400/40 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {t.demo.cta}
                  </button>
                </form>
              </motion.div>
            )}

            {state === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[320px]"
              >
                {/* Terminal-style loading */}
                <div className="w-full max-w-md font-mono text-sm bg-[#0a0a0a] rounded-2xl p-6 space-y-2">
                  <LoadingLine text={`> Analisi "${name}" in corso...`} delay={0} color="#00f0ff" />
                  <LoadingLine text={`> Settore: ${sector}`} delay={0.4} color="#a855f7" />
                  <LoadingLine text={`> Geolocalizzazione: ${city}`} delay={0.8} color="#f59e0b" />
                  <LoadingLine text="> Generazione layout..." delay={1.2} color="#10b981" />
                  <LoadingLine text="> Ottimizzazione SEO..." delay={1.6} color="#ec4899" />
                  <LoadingLine text="> Configurazione chatbot..." delay={2.0} color="#3b82f6" />
                </div>
                <p className="text-gray-500 text-sm mt-6 animate-pulse">{t.demo.loading}</p>
              </motion.div>
            )}

            {state === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 md:p-10"
              >
                {/* Mock website preview */}
                <div className="rounded-2xl border border-gray-200 overflow-hidden mb-6 shadow-lg">
                  {/* Browser chrome */}
                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 bg-white rounded-lg px-3 py-1 text-xs text-gray-400 border border-gray-200">
                      {name.toLowerCase().replace(/\s+/g, "-")}.madecreative.pro
                    </div>
                  </div>
                  {/* Mock website content */}
                  <div className="bg-[#0a0a0a] p-6">
                    <div className="max-w-xs mx-auto text-center py-4">
                      <div className="w-10 h-10 bg-[#f59e0b] rounded-xl mx-auto mb-4" />
                      <div className="h-5 bg-white/20 rounded-lg w-3/4 mx-auto mb-2" />
                      <div className="h-3 bg-white/10 rounded-lg w-full mb-1.5" />
                      <div className="h-3 bg-white/10 rounded-lg w-5/6 mx-auto mb-4" />
                      <div className="bg-[#f59e0b] text-[#0a0a0a] text-xs font-semibold px-4 py-2 rounded-lg inline-block">
                        {name}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t.demo.successTitle}</h3>
                  <p className="text-gray-500 text-sm mb-1">{t.demo.successSubtitle}</p>
                  <p className="text-[#f59e0b] text-sm font-semibold mb-6">{t.demo.successNote}</p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href={`/${locale}#pricing`}
                      className="bg-[#f59e0b] text-[#0a0a0a] px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#fcd34d] transition-colors shadow-lg shadow-amber-500/25"
                    >
                      {t.nav.startFree}
                    </a>
                    <button
                      onClick={reset}
                      className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors font-medium"
                    >
                      Riprova
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

function LoadingLine({ text, delay, color }: { text: string; delay: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-2"
    >
      <span style={{ color }} className="text-xs">
        {text}
      </span>
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, delay }}
        className="text-white/60 text-xs"
      >
        _
      </motion.span>
    </motion.div>
  );
}
