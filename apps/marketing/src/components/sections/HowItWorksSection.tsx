"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { Translations } from "@/lib/i18n";

interface HowItWorksSectionProps {
  t: Translations;
}

const STEP_ICONS = [
  // Scraping
  <svg key="scrape" viewBox="0 0 48 48" fill="none" className="w-10 h-10">
    <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.1" />
    <path d="M16 24a8 8 0 1 0 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M24 16v4M32 20l-2.83 2.83M14 28l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="24" r="2" fill="currentColor" />
  </svg>,
  // Builder
  <svg key="build" viewBox="0 0 48 48" fill="none" className="w-10 h-10">
    <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.1" />
    <rect x="14" y="14" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M18 18h12M18 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 28v6M28 28v6M17 34h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>,
  // Launch
  <svg key="launch" viewBox="0 0 48 48" fill="none" className="w-10 h-10">
    <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.1" />
    <path d="M24 32V24M24 24l-4 4M24 24l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 14l6-4 6 4v8H18V14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>,
];

const STEP_COLORS = ["#00f0ff", "#a855f7", "#f59e0b"] as const;

export function HowItWorksSection({ t }: HowItWorksSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold uppercase tracking-widest border border-amber-100">
            {t.howItWorks.sectionLabel}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading text-4xl sm:text-5xl font-bold text-gray-900 text-center mb-4"
        >
          {t.howItWorks.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-500 text-center max-w-2xl mx-auto mb-20"
        >
          {t.howItWorks.subtitle}
        </motion.p>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-px">
            <svg viewBox="0 0 900 2" preserveAspectRatio="none" className="w-full h-px">
              <motion.path
                d="M 0 1 L 900 1"
                stroke="#e5e7eb"
                strokeWidth="2"
                strokeDasharray="8 4"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : {}}
                transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
              />
            </svg>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {t.howItWorks.steps.map((step, i) => {
              const color = STEP_COLORS[i]!;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.2 }}
                  className="relative text-center"
                >
                  {/* Icon circle */}
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: `${color}15`, border: `1px solid ${color}40`, color }}
                    >
                      {STEP_ICONS[i]}
                    </div>
                    {/* Step number */}
                    <div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-[#0a0a0a]"
                      style={{ background: color }}
                    >
                      {i + 1}
                    </div>
                  </div>

                  {/* Step label */}
                  <div
                    className="inline-block text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color }}
                  >
                    {step.number}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
