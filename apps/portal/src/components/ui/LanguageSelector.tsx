"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { SUPPORTED_LOCALES, LOCALE_LABELS, LOCALE_FLAGS, type Locale } from "@/lib/i18n";
import { useLocaleContext } from "@/lib/locale-context";

// ─── Props ────────────────────────────────────────────────────────────────────

interface LanguageSelectorProps {
  /** Visual variant: "topbar" (dark, compact) | "dropdown" (standard menu) */
  variant?: "topbar" | "dropdown";
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LanguageSelector({
  variant = "dropdown",
  className = "",
}: LanguageSelectorProps) {
  const { locale, setLocale } = useLocaleContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const handleSelect = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  if (variant === "topbar") {
    return (
      <div ref={ref} style={{ position: "relative" }} className={className}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Select language"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #27272a",
            background: "transparent",
            cursor: "pointer",
            fontSize: 11,
            color: "#a1a1aa",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3f3f46"; e.currentTarget.style.color = "#e4e4e7"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#27272a"; e.currentTarget.style.color = "#a1a1aa"; }}
        >
          <span>{LOCALE_FLAGS[locale]}</span>
          <span style={{ fontWeight: 500 }}>{locale.toUpperCase()}</span>
          <ChevronDown style={{ width: 10, height: 10 }} />
        </button>

        {open && (
          <div
            role="listbox"
            aria-label="Language options"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              zIndex: 9999,
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: 10,
              padding: 4,
              minWidth: 160,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                role="option"
                aria-selected={loc === locale}
                onClick={() => handleSelect(loc)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "7px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: loc === locale ? "rgba(99,102,241,0.1)" : "transparent",
                  color: loc === locale ? "#818cf8" : "#a1a1aa",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (loc !== locale) {
                    e.currentTarget.style.background = "#27272a";
                    e.currentTarget.style.color = "#e4e4e7";
                  }
                }}
                onMouseLeave={(e) => {
                  if (loc !== locale) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#a1a1aa";
                  }
                }}
              >
                <span style={{ fontSize: 14 }}>{LOCALE_FLAGS[loc]}</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{LOCALE_LABELS[loc]}</span>
                {loc === locale && <Check style={{ width: 11, height: 11 }} />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Standard dropdown variant (for settings / light backgrounds) ───────────
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-sm text-slate-300 hover:border-indigo-500 hover:text-white transition-colors font-medium"
      >
        <span className="text-base leading-none">{LOCALE_FLAGS[locale]}</span>
        <span>{LOCALE_LABELS[locale]}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Language options"
          className="absolute top-[calc(100%+6px)] right-0 z-50 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 min-w-[180px] shadow-2xl"
        >
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc}
              role="option"
              aria-selected={loc === locale}
              onClick={() => handleSelect(loc)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-3 transition-colors ${
                loc === locale
                  ? "bg-indigo-600/15 text-indigo-400 font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-base leading-none">{LOCALE_FLAGS[loc]}</span>
              <span className="flex-1">{LOCALE_LABELS[loc]}</span>
              {loc === locale && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
