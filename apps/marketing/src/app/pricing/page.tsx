"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Plan data ────────────────────────────────────────────────────────────────

interface Plan {
  id: "STARTER" | "GROWTH" | "ENTERPRISE";
  name: string;
  monthlyPrice: number;
  annualMonthlyPrice: number; // monthly price when paying annually
  setupFee: number;
  popular: boolean;
  color: string;
  description: string;
  features: string[];
  notIncluded?: string[];
}

const PLANS: Plan[] = [
  {
    id: "STARTER",
    name: "Starter",
    monthlyPrice: 297,
    annualMonthlyPrice: 238, // 20% off
    setupFee: 497,
    popular: false,
    color: "#00f0ff",
    description: "Perfect for small businesses getting started online.",
    features: [
      "1 professional website",
      "Subdomain (yourbiz.madecreative.pro)",
      "SSL certificate included",
      "Local SEO optimization",
      "12 social posts/month",
      "AI chatbot (24/7 support)",
      "3 automations",
      "50 leads/month",
      "Cookie banner + Privacy policy",
      "Monthly performance report",
      "Email support (48h SLA)",
    ],
    notIncluded: ["Custom domain", "Priority support", "AI agents"],
  },
  {
    id: "GROWTH",
    name: "Growth",
    monthlyPrice: 697,
    annualMonthlyPrice: 558,
    setupFee: 1497,
    popular: true,
    color: "#a855f7",
    description: "For growing businesses that need more power and reach.",
    features: [
      "3 professional websites",
      "Custom domain included",
      "Advanced SEO + Google Business",
      "30 social posts/month",
      "2 AI chatbots",
      "10 automations",
      "200 leads/month",
      "Review management",
      "Weekly performance reports",
      "Priority support (24h SLA)",
      "AI agents enabled",
      "Analytics dashboard",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    monthlyPrice: 1497,
    annualMonthlyPrice: 1198,
    setupFee: 4997,
    popular: false,
    color: "#f59e0b",
    description: "Full-service digital marketing for established businesses.",
    features: [
      "10 websites",
      "Multiple custom domains",
      "Full SEO suite + Google Ads",
      "90 social posts/month",
      "5 AI chatbots",
      "50 automations",
      "1000 leads/month",
      "Daily performance reports",
      "Dedicated account manager",
      "Custom integrations",
      "White-label option",
      "Phone support (4h SLA)",
      "Custom AI training",
    ],
  },
];

// ─── Feature comparison table data ────────────────────────────────────────────

interface FeatureRow {
  category: string;
  features: { name: string; starter: string | boolean; growth: string | boolean; enterprise: string | boolean }[];
}

const FEATURE_ROWS: FeatureRow[] = [
  {
    category: "Website",
    features: [
      { name: "Websites included", starter: "1", growth: "3", enterprise: "10" },
      { name: "Custom domain", starter: false, growth: true, enterprise: true },
      { name: "SSL certificate", starter: true, growth: true, enterprise: true },
      { name: "Cookie banner (GDPR)", starter: true, growth: true, enterprise: true },
      { name: "Privacy policy page", starter: true, growth: true, enterprise: true },
    ],
  },
  {
    category: "Marketing",
    features: [
      { name: "Social posts/month", starter: "12", growth: "30", enterprise: "90" },
      { name: "Leads/month", starter: "50", growth: "200", enterprise: "1000" },
      { name: "SEO optimization", starter: "Basic", growth: "Advanced", enterprise: "Full suite" },
      { name: "Google Ads management", starter: false, growth: true, enterprise: true },
    ],
  },
  {
    category: "AI & Automation",
    features: [
      { name: "AI chatbots", starter: "1", growth: "2", enterprise: "5" },
      { name: "Automations", starter: "3", growth: "10", enterprise: "50" },
      { name: "AI agents", starter: false, growth: true, enterprise: true },
    ],
  },
  {
    category: "Support",
    features: [
      { name: "Email support", starter: true, growth: true, enterprise: true },
      { name: "Priority support", starter: false, growth: true, enterprise: true },
      { name: "Dedicated account manager", starter: false, growth: false, enterprise: true },
      { name: "Phone support", starter: false, growth: false, enterprise: true },
    ],
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function CheckIcon({ color }: { color: string }) {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill={`${color}20`} />
      <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-gray-300" viewBox="0 0 16 16" fill="none">
      <path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TableCheck({ value, color }: { value: string | boolean; color: string }) {
  if (value === false) return <XIcon />;
  if (value === true) return <CheckIcon color={color} />;
  return <span className="text-sm font-medium" style={{ color }}>{value}</span>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const getCheckoutUrl = (planId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.madecreative.pro";
    return `${apiUrl}/public/checkout?plan=${planId}&billing=${annual ? "annual" : "monthly"}`;
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Made<span className="text-blue-600">Creative</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">Home</Link>
              <Link
                href="https://app.madecreative.pro/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20">
        {/* Header */}
        <div className="text-center px-4 mb-12">
          <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            Transparent pricing — no hidden fees
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Start growing today
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            One-time setup fee + monthly subscription. Cancel anytime.
            30-day money-back guarantee on all plans.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !annual
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                annual
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 mb-20">
          {PLANS.map((plan) => {
            const displayPrice = annual ? plan.annualMonthlyPrice : plan.monthlyPrice;
            const annualTotal = plan.annualMonthlyPrice * 12;
            const savings = plan.monthlyPrice * 12 - annualTotal;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-8 flex flex-col ${
                  plan.popular
                    ? "border-purple-500 shadow-xl shadow-purple-100 scale-105"
                    : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg"
                    style={{ backgroundColor: plan.color }}
                  >
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-extrabold text-gray-900">
                      €{displayPrice}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </div>

                  {annual && (
                    <p className="text-sm text-green-600 font-medium">
                      Save €{savings}/year — billed €{annualTotal}/year
                    </p>
                  )}

                  <div className="mt-3 inline-flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 border border-gray-200">
                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M10 6v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    One-time setup: <strong className="text-gray-900">€{plan.setupFee}</strong>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckIcon color={plan.color} />
                      {feature}
                    </li>
                  ))}
                  {plan.notIncluded?.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-400 line-through">
                      <XIcon />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  <Link
                    href={getCheckoutUrl(plan.id)}
                    className={`block w-full text-center py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                      plan.popular
                        ? "text-white shadow-lg"
                        : "border-2 hover:opacity-90"
                    }`}
                    style={
                      plan.popular
                        ? { backgroundColor: plan.color, boxShadow: `0 4px 20px ${plan.color}40` }
                        : { borderColor: plan.color, color: plan.color }
                    }
                  >
                    Get Started with {plan.name}
                  </Link>
                  <p className="text-center text-xs text-gray-400">
                    30-day money-back guarantee
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div className="max-w-6xl mx-auto px-4 mb-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Full feature comparison
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 w-2/5">
                    Feature
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      className="text-center px-6 py-4 text-sm font-bold"
                      style={{ color: plan.color }}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row) => (
                  <>
                    <tr key={`cat-${row.category}`} className="bg-gray-50 border-y border-gray-100">
                      <td
                        colSpan={4}
                        className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-gray-400"
                      >
                        {row.category}
                      </td>
                    </tr>
                    {row.features.map((feature) => (
                      <tr
                        key={feature.name}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-3.5 text-sm text-gray-700">{feature.name}</td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex justify-center">
                            <TableCheck value={feature.starter} color={PLANS[0]!.color} />
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex justify-center">
                            <TableCheck value={feature.growth} color={PLANS[1]!.color} />
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex justify-center">
                            <TableCheck value={feature.enterprise} color={PLANS[2]!.color} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ section */}
        <div className="max-w-3xl mx-auto px-4 mb-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>

        {/* Guarantee banner */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-8 text-center">
            <div className="text-4xl mb-3">30</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              30-day money-back guarantee
            </h3>
            <p className="text-gray-600 max-w-lg mx-auto text-sm">
              Not satisfied in the first 30 days? We&apos;ll refund your setup fee and first month,
              no questions asked. We&apos;re that confident in what we deliver.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <Link href="/" className="text-lg font-bold text-gray-900">
            Made<span className="text-blue-600">Creative</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">
            © {new Date().getFullYear()} MadeCreative. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-900 text-sm">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-900 text-sm">Terms of Service</Link>
            <Link href="/contact" className="text-gray-500 hover:text-gray-900 text-sm">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ─── FAQ items ────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "What does the setup fee include?",
    a: "The one-time setup fee covers the complete onboarding: building and deploying your website, configuring your chatbot, setting up automations, and training the AI on your business content. It's a one-time investment — monthly fees cover ongoing management.",
  },
  {
    q: "How long until my website is live?",
    a: "Your website goes live within 15 minutes of payment. Our automated pipeline handles everything: domain setup, SSL certificate, cookie banner, privacy policy, contact form, and deployment.",
  },
  {
    q: "Can I use my own domain?",
    a: "Starter plans use a subdomain (yourbiz.madecreative.pro). Growth and Enterprise plans include a custom domain connection. You can point any domain you own to your MadeCreative site.",
  },
  {
    q: "What happens if I cancel?",
    a: "You can cancel anytime with no penalties. Your website stays live until the end of your billing period. You can export all your content and data at any time.",
  },
  {
    q: "Is the 30-day guarantee on the setup fee too?",
    a: "Yes. If you're not satisfied within the first 30 days, we refund both the setup fee and the first monthly payment. No questions asked.",
  },
  {
    q: "What languages are supported?",
    a: "We support German, Italian, French, Spanish, Dutch, Polish, Czech, Hungarian, Romanian, and English. Your website content, chatbot, and automated emails are all generated in your preferred language.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-6 py-4 flex items-center justify-between font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <span>{question}</span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
          {answer}
        </div>
      )}
    </div>
  );
}
