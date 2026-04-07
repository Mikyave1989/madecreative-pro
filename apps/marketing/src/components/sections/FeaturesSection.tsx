"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { Translations } from "@/lib/i18n";

interface FeaturesSectionProps {
  t: Translations;
}

const FEATURE_ICONS = [
  // Website
  <svg key="web" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2 7h20" stroke="currentColor" strokeWidth="1.5" />
  </svg>,
  // SEO
  <svg key="seo" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>,
  // Social
  <svg key="social" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <rect x="2" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="14" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="14" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="14" y="14" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
  </svg>,
  // Chatbot
  <svg key="chat" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M8 10h.01M12 10h.01M16 10h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>,
  // Automation
  <svg key="auto" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>,
  // Reports
  <svg key="reports" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>,
];

const FEATURE_COLORS = [
  "#00f0ff", "#10b981", "#ec4899",
  "#3b82f6", "#f59e0b", "#a855f7",
] as const;

export function FeaturesSection({ t }: FeaturesSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold uppercase tracking-widest border border-purple-100">
            {t.features.sectionLabel}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading text-4xl sm:text-5xl font-bold text-gray-900 text-center mb-4"
        >
          {t.features.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-500 text-center max-w-2xl mx-auto mb-16"
        >
          {t.features.subtitle}
        </motion.p>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.items.map((item, i) => {
            const color = FEATURE_COLORS[i % FEATURE_COLORS.length]!;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="group relative p-6 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                  style={{ background: color + "15", color }}
                >
                  {FEATURE_ICONS[i]}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>

                {/* Hover accent */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
