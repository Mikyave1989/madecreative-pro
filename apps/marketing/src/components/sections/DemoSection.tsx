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

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all placeholder:text-[rgba(248,250,252,0.25)]";
  const inputStyle = {
    background: "#0d1117",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#f8fafc",
  };
  const inputFocusStyle = {
    borderColor: "#6366f1",
    boxShadow: "0 0 0 3px rgba(99,102,241,0.15)",
  };

  return (
    <section
      ref={ref}
      id="demo"
      className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "#0d1117" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.2)",
              color: "#22d3ee",
            }}
          >
            {t.demo.sectionLabel}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-bold text-center mb-4"
          style={{ color: "#f8fafc" }}
        >
          {t.demo.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-center max-w-xl mx-auto mb-12"
          style={{ color: "rgba(248,250,252,0.5)" }}
        >
          {t.demo.subtitle}
        </motion.p>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#161b27",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
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
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "rgba(248,250,252,0.7)" }}
                    >
                      Nome azienda
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.demo.namePlaceholder}
                      className={inputClass}
                      style={inputStyle}
                      onFocus={(e) =>
                        Object.assign(e.currentTarget.style, inputFocusStyle)
                      }
                      onBlur={(e) =>
                        Object.assign(e.currentTarget.style, inputStyle)
                      }
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
                        style={{ color: "rgba(248,250,252,0.7)" }}
                      >
                        Settore
                      </label>
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder={t.demo.sectorPlaceholder}
                        className={inputClass}
                        style={inputStyle}
                        onFocus={(e) =>
                          Object.assign(e.currentTarget.style, inputFocusStyle)
                        }
                        onBlur={(e) =>
                          Object.assign(e.currentTarget.style, inputStyle)
                        }
                        required
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
                        style={{ color: "rgba(248,250,252,0.7)" }}
                      >
                        Città
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t.demo.cityPlaceholder}
                        className={inputClass}
                        style={inputStyle}
                        onFocus={(e) =>
                          Object.assign(e.currentTarget.style, inputFocusStyle)
                        }
                        onBlur={(e) =>
                          Object.assign(e.currentTarget.style, inputStyle)
                        }
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!name.trim() || !sector.trim() || !city.trim()}
                    className="w-full gradient-indigo text-white py-4 rounded-xl font-semibold text-base transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed glow-indigo"
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
                <div
                  className="w-full max-w-md font-mono text-sm rounded-2xl p-6 space-y-2"
                  style={{ background: "#05070f" }}
                >
                  <LoadingLine
                    text={`> Analisi "${name}" in corso...`}
                    delay={0}
                    color="#22d3ee"
                  />
                  <LoadingLine text={`> Settore: ${sector}`} delay={0.4} color="#a78bfa" />
                  <LoadingLine
                    text={`> Geolocalizzazione: ${city}`}
                    delay={0.8}
                    color="#818cf8"
                  />
                  <LoadingLine
                    text="> Generazione layout..."
                    delay={1.2}
                    color="#34d399"
                  />
                  <LoadingLine
                    text="> Ottimizzazione SEO..."
                    delay={1.6}
                    color="#f472b6"
                  />
                  <LoadingLine
                    text="> Configurazione chatbot..."
                    delay={2.0}
                    color="#6366f1"
                  />
                </div>
                <p
                  className="text-sm mt-6 animate-pulse"
                  style={{ color: "rgba(248,250,252,0.4)" }}
                >
                  {t.demo.loading}
                </p>
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
                <div
                  className="rounded-2xl overflow-hidden mb-6"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {/* Browser chrome */}
                  <div
                    className="px-4 py-3 flex items-center gap-3"
                    style={{ background: "#0d1117" }}
                  >
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <div
                      className="flex-1 rounded-lg px-3 py-1 text-xs"
                      style={{
                        background: "#161b27",
                        color: "rgba(248,250,252,0.3)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {name.toLowerCase().replace(/\s+/g, "-")}.madecreative.pro
                    </div>
                  </div>
                  {/* Mock website content */}
                  <div className="p-6" style={{ background: "#05070f" }}>
                    <div className="max-w-xs mx-auto text-center py-4">
                      <div className="w-10 h-10 rounded-xl mx-auto mb-4 gradient-indigo" />
                      <div
                        className="h-5 rounded-lg w-3/4 mx-auto mb-2"
                        style={{ background: "rgba(255,255,255,0.12)" }}
                      />
                      <div
                        className="h-3 rounded-lg w-full mb-1.5"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      />
                      <div
                        className="h-3 rounded-lg w-5/6 mx-auto mb-4"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      />
                      <div className="gradient-indigo text-white text-xs font-semibold px-4 py-2 rounded-lg inline-block">
                        {name}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(52,211,153,0.1)" }}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      style={{ color: "#34d399" }}
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{ color: "#f8fafc" }}
                  >
                    {t.demo.successTitle}
                  </h3>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "rgba(248,250,252,0.5)" }}
                  >
                    {t.demo.successSubtitle}
                  </p>
                  <p className="text-sm font-semibold mb-6" style={{ color: "#818cf8" }}>
                    {t.demo.successNote}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href={`/${locale}#demo`}
                      className="gradient-indigo text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors glow-indigo hover:opacity-90"
                    >
                      {t.nav.startFree}
                    </a>
                    <button
                      onClick={reset}
                      className="px-6 py-3 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(248,250,252,0.5)",
                      }}
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

function LoadingLine({
  text,
  delay,
  color,
}: {
  text: string;
  delay: number;
  color: string;
}) {
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
        className="text-xs"
        style={{ color: "rgba(248,250,252,0.4)" }}
      >
        _
      </motion.span>
    </motion.div>
  );
}
