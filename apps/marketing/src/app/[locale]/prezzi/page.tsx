"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { SUPPORTED_LOCALES, getTranslations, type Locale } from "@/lib/i18n";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface PlanData {
  id: "STARTER" | "GROWTH" | "ENTERPRISE";
  monthlyPrice: number;
  annualPrice: number;
  setupFee: number;
  popular: boolean;
  color: string;
}

// ─── Static plan data ─────────────────────────────────────────────────────────

const PLAN_DATA: PlanData[] = [
  {
    id: "STARTER",
    monthlyPrice: 297,
    annualPrice: 238,
    setupFee: 497,
    popular: false,
    color: "#00f0ff",
  },
  {
    id: "GROWTH",
    monthlyPrice: 697,
    annualPrice: 558,
    setupFee: 1497,
    popular: true,
    color: "#a855f7",
  },
  {
    id: "ENTERPRISE",
    monthlyPrice: 1497,
    annualPrice: 1198,
    setupFee: 4997,
    popular: false,
    color: "#f59e0b",
  },
];

type FeatureValue = string | boolean;

interface FeatureRow {
  key: string;
  starter: FeatureValue;
  growth: FeatureValue;
  enterprise: FeatureValue;
}

interface FeatureCategory {
  categoryKey: "website" | "marketing" | "ai" | "support";
  rows: FeatureRow[];
}

const FEATURE_TABLE: FeatureCategory[] = [
  {
    categoryKey: "website",
    rows: [
      { key: "websites", starter: "1", growth: "3", enterprise: "10" },
      { key: "customDomain", starter: false, growth: true, enterprise: true },
      { key: "ssl", starter: true, growth: true, enterprise: true },
      { key: "gdpr", starter: true, growth: true, enterprise: true },
      { key: "privacy", starter: true, growth: true, enterprise: true },
    ],
  },
  {
    categoryKey: "marketing",
    rows: [
      { key: "socialPosts", starter: "12", growth: "30", enterprise: "90" },
      { key: "leads", starter: "50", growth: "200", enterprise: "1000" },
      { key: "seo", starter: "seoBasic", growth: "seoAdvanced", enterprise: "seoFull" },
      { key: "googleAds", starter: false, growth: true, enterprise: true },
    ],
  },
  {
    categoryKey: "ai",
    rows: [
      { key: "chatbots", starter: "1", growth: "2", enterprise: "5" },
      { key: "automations", starter: "3", growth: "10", enterprise: "50" },
      { key: "aiAgents", starter: false, growth: true, enterprise: true },
    ],
  },
  {
    categoryKey: "support",
    rows: [
      { key: "emailSupport", starter: true, growth: true, enterprise: true },
      { key: "prioritySupport", starter: false, growth: true, enterprise: true },
      { key: "accountManager", starter: false, growth: false, enterprise: true },
      { key: "phoneSupport", starter: false, growth: false, enterprise: true },
    ],
  },
];

// ─── Helper components ────────────────────────────────────────────────────────

function CheckIcon({ color }: { color: string }) {
  return (
    <svg className="h-4 w-4 shrink-0 mx-auto" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill={`${color}20`} />
      <path
        d="M5 8l2 2 4-4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 mx-auto text-white/15" viewBox="0 0 16 16" fill="none">
      <path
        d="M5 5l6 6M11 5l-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FeatureCell({
  value,
  color,
  seoLabels,
}: {
  value: FeatureValue;
  color: string;
  seoLabels: { seoBasic: string; seoAdvanced: string; seoFull: string };
}) {
  if (value === false) return <XIcon />;
  if (value === true) return <CheckIcon color={color} />;
  // Resolve SEO key aliases
  if (value === "seoBasic")
    return <span className="text-xs font-medium" style={{ color }}>{seoLabels.seoBasic}</span>;
  if (value === "seoAdvanced")
    return <span className="text-xs font-medium" style={{ color }}>{seoLabels.seoAdvanced}</span>;
  if (value === "seoFull")
    return <span className="text-xs font-medium" style={{ color }}>{seoLabels.seoFull}</span>;
  return <span className="text-sm font-semibold" style={{ color }}>{value}</span>;
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-6 py-4 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
      >
        <span className="font-semibold text-sm pr-4">{question}</span>
        <svg
          className={`h-5 w-5 text-white/30 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 8l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-white/50 leading-relaxed border-t border-white/5 pt-4">
          {answer}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PrezziPage({ params }: PageProps) {
  const { locale } = use(params);

  if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
    notFound();
  }

  const t = getTranslations(locale as Locale);
  const tp = t.prezziPage;

  const [annual, setAnnual] = useState(false);

  function getCheckoutUrl(planId: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.madecreative.pro";
    return `${apiUrl}/public/checkout?plan=${planId}&billing=${annual ? "annual" : "monthly"}`;
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Nav t={t} locale={locale as Locale} />

      <div className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        {/* ── HEADER ── */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-900/30 text-amber-400 text-xs font-semibold uppercase tracking-widest border border-amber-800/40">
              {tp.badge}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-5xl sm:text-6xl font-bold text-white mb-4"
          >
            {tp.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-white/50 max-w-xl mx-auto mb-10"
          >
            {tp.subtitle}
          </motion.p>

          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center gap-2 bg-white/5 rounded-2xl p-1.5 border border-white/10"
          >
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                !annual
                  ? "bg-white text-gray-900 shadow-lg"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tp.monthly}
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                annual
                  ? "bg-white text-gray-900 shadow-lg"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tp.annual}
              <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                {tp.annualDiscount}
              </span>
            </button>
          </motion.div>
        </div>

        {/* ── PLAN CARDS ── */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 items-center mb-20">
          {PLAN_DATA.map((plan, i) => {
            const planTranslation = tp.plans[i];
            if (!planTranslation) return null;

            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            const annualTotal = plan.annualPrice * 12;
            const savings = plan.monthlyPrice * 12 - annualTotal;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 48 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
                className={`relative rounded-3xl p-8 border flex flex-col ${
                  plan.popular
                    ? "border-[#a855f7] shadow-2xl shadow-purple-900/30 scale-105"
                    : "border-white/10"
                }`}
                style={{
                  background: plan.popular
                    ? "linear-gradient(135deg, #1a0a2e 0%, #0f0f1a 100%)"
                    : "#111",
                }}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg"
                    style={{ background: plan.color }}
                  >
                    {tp.mostPopular}
                  </div>
                )}

                {/* Color accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
                  style={{
                    background: `linear-gradient(90deg, ${plan.color}, transparent)`,
                  }}
                />

                <div className="mb-6">
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: plan.color }}
                  >
                    {planTranslation.name}
                  </div>
                  <p className="text-white/50 text-sm mb-5">{planTranslation.description}</p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-5xl font-bold text-white">€{price}</span>
                    <span className="text-white/40 text-sm">{tp.perMonth}</span>
                  </div>

                  {annual && (
                    <p className="text-green-400 text-xs font-medium mb-1">
                      {tp.savingsLabel.replace("{n}", String(savings))}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mt-3">
                    <svg className="w-3.5 h-3.5 text-white/30" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
                      <path
                        d="M8 5v3.5l2 2"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-white/30 text-xs">
                      {tp.setupFee}: <strong className="text-white/50">€{plan.setupFee}</strong>
                    </span>
                  </div>
                </div>

                {/* Feature list */}
                <ul className="space-y-2.5 mb-8 flex-1">
                  {planTranslation.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm text-white/70">
                      <svg
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{ color: plan.color }}
                      >
                        <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.12" />
                        <path
                          d="M5 8l2 2 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={getCheckoutUrl(plan.id)}
                  className="block w-full text-center py-3.5 px-6 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
                  style={
                    plan.popular
                      ? {
                          background: plan.color,
                          color: "#0a0a0a",
                          boxShadow: `0 4px 24px ${plan.color}40`,
                        }
                      : {
                          border: `1.5px solid ${plan.color}50`,
                          color: plan.color,
                          background: `${plan.color}0d`,
                        }
                  }
                >
                  {tp.getStarted}
                </a>
                <p className="text-center text-xs text-white/20 mt-3">{tp.moneyBack}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ── FEATURE COMPARISON TABLE ── */}
        <div className="max-w-6xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-heading text-3xl font-bold text-white text-center mb-10"
          >
            {tp.compareTitle}
          </motion.h2>

          <div className="overflow-x-auto rounded-2xl border border-white/10 shadow-2xl shadow-black/30">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/40 w-2/5">
                    &nbsp;
                  </th>
                  {PLAN_DATA.map((plan, i) => (
                    <th
                      key={plan.id}
                      className="text-center px-4 py-4 text-sm font-bold"
                      style={{ color: plan.color }}
                    >
                      {tp.plans[i]?.name ?? plan.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_TABLE.map((category) => (
                  <>
                    <tr
                      key={`cat-${category.categoryKey}`}
                      className="bg-white/3 border-y border-white/5"
                    >
                      <td
                        colSpan={4}
                        className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white/30"
                      >
                        {tp.tableCategories[category.categoryKey]}
                      </td>
                    </tr>
                    {category.rows.map((row) => {
                      const featureName =
                        tp.tableFeatures[row.key as keyof typeof tp.tableFeatures];
                      return (
                        <tr
                          key={row.key}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors"
                        >
                          <td className="px-6 py-3.5 text-sm text-white/60">
                            {featureName ?? row.key}
                          </td>
                          {[row.starter, row.growth, row.enterprise].map((val, ci) => (
                            <td
                              key={ci}
                              className="px-4 py-3.5 text-center"
                            >
                              <div className="flex justify-center">
                                <FeatureCell
                                  value={val}
                                  color={PLAN_DATA[ci]!.color}
                                  seoLabels={{
                                    seoBasic: tp.seoBasic,
                                    seoAdvanced: tp.seoAdvanced,
                                    seoFull: tp.seoFull,
                                  }}
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── MONEY-BACK GUARANTEE ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto mb-20"
        >
          <div className="relative rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-[#0f0f0f] p-10 text-center overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="font-heading text-2xl font-bold text-white mb-3">
                {tp.moneyBackTitle}
              </h3>
              <p className="text-white/50 max-w-md mx-auto text-sm leading-relaxed">
                {tp.moneyBackDesc}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── FAQ ── */}
        <div className="max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-heading text-3xl font-bold text-white text-center mb-10"
          >
            {tp.faqTitle}
          </motion.h2>

          <div className="space-y-3">
            {t.faq.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <FaqItem question={item.q} answer={item.a} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── FINAL CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            {t.finalCta.title}
          </h2>
          <p className="text-white/50 text-lg mb-8">{t.finalCta.subtitle}</p>
          <Link
            href={`/${locale}/demo`}
            className="inline-block bg-[#f59e0b] text-[#0a0a0a] px-8 py-4 rounded-xl font-semibold text-base hover:bg-[#fcd34d] transition-all shadow-lg shadow-amber-500/25 hover:-translate-y-0.5 active:translate-y-0"
          >
            {t.finalCta.cta}
          </Link>
          <p className="text-white/25 text-xs mt-4">{t.finalCta.trustNote}</p>
        </motion.div>
      </div>

      <Footer t={t} locale={locale} />
    </main>
  );
}
