"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { type Translations, SUPPORTED_LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n";

interface NavProps {
  t: Translations;
  locale: Locale;
}

export function Nav({ t, locale }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLocale(newLocale: Locale) {
    setLangOpen(false);
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/") || `/${newLocale}`);
  }

  const navLinks = [
    { label: t.nav.howItWorks, href: `/${locale}#how-it-works` },
    { label: t.nav.demo, href: `/${locale}#demo` },
    { label: t.nav.faq, href: `/${locale}#faq` },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-md shadow-lg shadow-black/20" : ""
      }`}
      style={
        scrolled
          ? { background: "rgba(13,17,23,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)" }
          : { background: "transparent" }
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            <span className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: "#f8fafc" }}>
              made<span style={{ color: "#6366f1" }}>creative</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm transition-colors duration-200 hover:text-white"
                style={{ color: "rgba(248,250,252,0.6)" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language selector */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors"
                style={{ color: "rgba(248,250,252,0.6)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
              >
                <span className="uppercase font-medium">{locale}</span>
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${langOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-40 max-w-[90vw] rounded-xl shadow-2xl overflow-hidden"
                    style={{
                      background: "#0d1117",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {SUPPORTED_LOCALES.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => switchLocale(loc)}
                        className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between"
                        style={{
                          color: loc === locale ? "#818cf8" : "rgba(248,250,252,0.6)",
                          background: loc === locale ? "rgba(99,102,241,0.1)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (loc !== locale) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            loc === locale ? "rgba(99,102,241,0.1)" : "transparent";
                        }}
                      >
                        <span className="uppercase font-medium mr-2">{loc}</span>
                        <span className="text-xs opacity-60">{LOCALE_NAMES[loc]}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA */}
            <Link
              href={`/${locale}#demo`}
              className="gradient-indigo text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all glow-indigo"
            >
              {t.nav.startFree}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2"
            style={{ color: "rgba(248,250,252,0.8)" }}
            aria-label="Menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            style={{ background: "#0d1117", borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 px-4 rounded-lg text-sm transition-colors"
                  style={{ color: "rgba(248,250,252,0.6)" }}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-3">
                  {SUPPORTED_LOCALES.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => { switchLocale(loc); setMobileOpen(false); }}
                      className="py-2 rounded-lg text-xs font-medium uppercase transition-colors"
                      style={{
                        background: loc === locale ? "rgba(99,102,241,0.15)" : "transparent",
                        color: loc === locale ? "#818cf8" : "rgba(248,250,252,0.4)",
                      }}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <Link
                  href={`/${locale}#demo`}
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center gradient-indigo text-white px-5 py-3 rounded-xl text-sm font-semibold"
                >
                  {t.nav.startFree}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
