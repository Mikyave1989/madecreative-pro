"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { Translations } from "@/lib/i18n";

interface PricingSectionProps {
  t: Translations;
}

const PLAN_PRICES = [
  { monthly: 297, annual: 238 },
  { monthly: 697, annual: 558 },
  { monthly: 1497, annual: 1198 },
];

const PLAN_SETUP = [497, 1497, 4997];
const PLAN_COLORS = ["#00f0ff", "#a855f7", "#f59e0b"] as const;
const PLAN_POPULAR = [false, true, false];

export function PricingSection({ t }: PricingSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [annual, setAnnual] = useState(false);

  function getCheckoutUrl(planIndex: number) {
    const ids = ["STARTER", "GROWTH", "ENTERPRISE"];
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.madecreative.pro";
    return `${apiUrl}/public/checkout?plan=${ids[planIndex]}&billing=${annual ? "annual" : "monthly"}`;
  }

  return (
    <section ref={ref} id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-900/30 text-amber-400 text-xs font-semibold uppercase tracking-widest border border-amber-800/40">
            {t.pricing.sectionLabel}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading text-4xl sm:text-5xl font-bold text-white text-center mb-4"
        >
          {t.pricing.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-white/50 text-center max-w-xl mx-auto mb-10"
        >
          {t.pricing.subtitle}
        </motion.p>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 rounded-2xl p-1.5 border border-white/10">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                !annual
                  ? "bg-white text-gray-900 shadow-lg"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {t.pricing.monthly}
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                annual
                  ? "bg-white text-gray-900 shadow-lg"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {t.pricing.annual}
              <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                {t.pricing.annualDiscount}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 items-center">
          {t.pricing.plans.map((plan, i) => {
            const color = PLAN_COLORS[i]!;
            const price = annual ? PLAN_PRICES[i]!.annual : PLAN_PRICES[i]!.monthly;
            const isPopular = PLAN_POPULAR[i]!;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                className={`relative rounded-3xl p-8 border flex flex-col ${
                  isPopular
                    ? "border-[#a855f7] shadow-2xl scale-105"
                    : "border-white/10"
                }`}
                style={{
                  background: isPopular
                    ? "linear-gradient(135deg, #1a0a2e 0%, #0f0f1a 100%)"
                    : "#111",
                }}
              >
                {isPopular && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white"
                    style={{ background: color }}
                  >
                    {t.pricing.mostPopular}
                  </div>
                )}

                {/* Color accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
                  style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
                />

                <div className="mb-6">
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color }}
                  >
                    {plan.name}
                  </div>
                  <p className="text-white/50 text-sm mb-4">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-5xl font-bold text-white">€{price}</span>
                    <span className="text-white/40 text-sm">{t.pricing.perMonth}</span>
                  </div>
                  <p className="text-white/30 text-xs">
                    {t.pricing.setupFee}: €{PLAN_SETUP[i]}
                  </p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm text-white/70">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none" style={{ color }}>
                        <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.15" />
                        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href={getCheckoutUrl(i)}
                  className="block w-full text-center py-3.5 px-6 rounded-xl font-semibold text-sm transition-all"
                  style={
                    isPopular
                      ? { background: color, color: "#0a0a0a", boxShadow: `0 4px 20px ${color}40` }
                      : { border: `1.5px solid ${color}50`, color, background: `${color}10` }
                  }
                >
                  {t.pricing.getStarted}
                </a>
                <p className="text-center text-xs text-white/25 mt-3">{t.pricing.moneyBack}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
