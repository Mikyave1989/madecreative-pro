"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { Translations } from "@/lib/i18n";

interface FinalCtaSectionProps {
  t: Translations;
  locale: string;
}

export function FinalCtaSection({ t, locale }: FinalCtaSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#0a0a0a]">
      {/* Gradient background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, #f59e0b18 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 40% 40% at 30% 30%, #a855f712 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 40% 40% at 70% 70%, #00f0ff08 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#f59e0b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b] text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
          {t.finalCta.badge}
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-heading text-5xl sm:text-7xl md:text-8xl font-bold text-white leading-none mb-6"
        >
          {t.finalCta.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {t.finalCta.subtitle}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <a
            href={`/${locale}#demo`}
            className="group inline-flex items-center gap-3 bg-[#f59e0b] text-[#0a0a0a] px-10 py-5 rounded-2xl text-lg font-bold hover:bg-[#fcd34d] transition-all duration-300 shadow-2xl shadow-amber-500/30 hover:shadow-amber-400/50 hover:-translate-y-1"
          >
            {t.finalCta.cta}
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <p className="text-white/25 text-sm mt-4">{t.finalCta.trustNote}</p>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 flex justify-center gap-3 flex-wrap"
        >
          {["SCRAPER", "ANALYZER", "BUILDER", "SOCIAL", "CHAT", "QA", "OUTREACH"].map((agent) => (
            <span
              key={agent}
              className="text-xs font-mono px-3 py-1.5 rounded-full bg-white/5 text-white/30 border border-white/10"
            >
              {agent}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
