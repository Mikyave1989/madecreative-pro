"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createCheckout } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Suspense } from "react";
import { useLocaleContext } from "@/lib/locale-context";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
};

function SignupForm() {
  const { t } = useLocaleContext();
  const searchParams = useSearchParams();

  const plan = searchParams.get("plan") ?? "starter";
  const billing = searchParams.get("billing") ?? "monthly";
  const prefillUrl = searchParams.get("url") ?? "";

  const planLabel = PLAN_LABELS[plan] ?? "Starter";

  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(prefillUrl);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await createCheckout({
        plan: PLAN_LABELS[plan] ? plan : "starter",
        billing,
        email,
        companyName: companyName || undefined,
        websiteUrl: websiteUrl || undefined,
      });

      window.location.href = data.checkoutUrl;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t.signup.errorDefault;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel -- gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-sm text-white/90 font-medium">
              {t.signup.plan} {planLabel}
            </span>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            {t.signup.heroHeadlineA}
            <br />
            {t.signup.heroHeadlineB}{" "}
            <span className="text-indigo-200">{t.signup.heroHeadlineHighlight}</span>
          </h2>
          <p className="text-indigo-200 text-lg max-w-sm mx-auto">
            {t.signup.heroSubtitle}
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 max-w-xs mx-auto">
            {[
              { label: t.signup.heroStatSites, value: "5k+" },
              { label: t.signup.heroStatTime, value: "60s" },
              { label: t.signup.heroStatUptime, value: "99.9%" },
              { label: t.signup.heroStatSatisfaction, value: "4.9/5" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 rounded-xl p-4 text-center"
              >
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-indigo-200 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel -- form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Logo + Language selector */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                made<span className="text-indigo-600">creative</span>
              </span>
              <p className="text-sm text-gray-500 mt-1">{t.login.tagline}</p>
            </div>
            <LanguageSelector variant="dropdown" />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {t.signup.formTitle} {planLabel}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t.signup.formSubtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t.signup.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t.signup.emailPlaceholder}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Company name */}
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t.signup.companyLabel}
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder={t.signup.companyPlaceholder}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Website URL (optional) */}
            <div>
              <label
                htmlFor="websiteUrl"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t.signup.websiteLabel}{" "}
                <span className="text-gray-400 font-normal">({t.common.optional})</span>
              </label>
              <input
                id="websiteUrl"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder={t.signup.websitePlaceholder}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              {t.signup.submitButton}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            {t.signup.alreadyHaveAccount}{" "}
            <a
              href="/login"
              className="text-indigo-600 hover:underline"
            >
              {t.signup.signIn}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
