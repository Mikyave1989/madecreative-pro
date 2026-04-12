"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";
import { useLocaleContext } from "@/lib/locale-context";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const { t } = useLocaleContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);

      const user: AuthUser = {
        id: data.user.id ?? "",
        email: data.user.email ?? email,
        companyName: data.user.companyName ?? "Business",
        contactName: data.user.contactName ?? data.user.companyName ?? "User",
        plan: (data.user.plan ?? "STARTER") as AuthUser["plan"],
        status: (data.user.status ?? "ACTIVE") as AuthUser["status"],
      };

      setAuth(data.accessToken, data.refreshToken, user);
      toast.success(`${t.login.welcomeBack}, ${user.contactName.split(" ")[0]}!`);
      router.push("/dashboard");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t.login.invalidCredentials;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-sm text-white/90 font-medium">
              {t.login.clientPortal}
            </span>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 leading-tight whitespace-pre-line">
            {t.login.heroHeadline}
          </h2>
          <p className="text-indigo-200 text-lg max-w-sm mx-auto">
            {t.login.heroSubtitle}
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 max-w-xs mx-auto">
            {[
              { label: t.login.heroStatClients, value: "200+" },
              { label: t.login.heroStatLeads, value: "12k+" },
              { label: t.login.heroStatUptime, value: "99.9%" },
              { label: t.login.heroStatSatisfaction, value: "4.9/5" },
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

      {/* Right panel — form */}
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
            <h1 className="text-2xl font-bold text-gray-900">{t.login.pageTitle}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t.login.heroSubtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t.login.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t.login.emailPlaceholder}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t.login.passwordLabel}
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  {t.login.forgotPassword}
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t.login.passwordPlaceholder}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
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
              {t.login.submitButton}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            {t.login.supportText}{" "}
            <a
              href="mailto:support@madecreative.pro"
              className="text-indigo-600 hover:underline"
            >
              {t.login.supportLink}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
