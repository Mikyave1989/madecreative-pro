"use client";

import { useState } from "react";
import type { Translations } from "@/lib/i18n";

interface FaqSectionProps {
  t: Translations;
}

const HARDCODED_FAQS = [
  {
    q: "Devo fare qualcosa per configurarlo?",
    a: "No. Il nostro sistema trova la tua attività, crea il sito, lo mette online. Tu non tocchi nulla.",
  },
  {
    q: "Posso modificare il sito?",
    a: "Sì. Dal tuo portale cliente hai un editor self-service. Cambi testi, foto, orari, telefono. In 2 minuti il sito si aggiorna.",
  },
  {
    q: "Come cancello?",
    a: "Un click dal portale. Il sito va offline entro 24 ore. Nessun preavviso, nessuna penale.",
  },
  {
    q: "E se voglio cancellare?",
    a: "Puoi cancellare in qualsiasi momento. In caso di problemi, il nostro team di supporto ti aiuterà immediatamente.",
  },
  {
    q: "Funziona per il mio settore?",
    a: "Sì: ristoranti, dentisti, studi legali, palestre, centri estetici, hotel, negozi, professionisti.",
  },
];

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: open ? "#161b27" : "#0d1117",
        border: `1px solid ${open ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
        aria-expanded={open}
      >
        <span
          className="text-sm font-semibold transition-colors"
          style={{ color: open ? "#818cf8" : "#f8fafc" }}
        >
          {question}
        </span>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={{
            background: open ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
            color: open ? "#818cf8" : "rgba(248,250,252,0.4)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {open && (
        <div
          className="px-6 pb-5 text-sm leading-relaxed"
          style={{
            color: "rgba(248,250,252,0.55)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "1rem",
          }}
        >
          {answer}
        </div>
      )}
    </div>
  );
}

export function FaqSection({ t }: FaqSectionProps) {
  // Use i18n FAQ items if present, otherwise fall back to hardcoded Italian
  const faqItems =
    t.faq?.items?.length > 0 ? t.faq.items : HARDCODED_FAQS;

  return (
    <section
      id="faq"
      className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "#05070f" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(248,250,252,0.5)",
            }}
          >
            {t.faq?.sectionLabel ?? "FAQ"}
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold" style={{ color: "#f8fafc" }}>
            {t.faq?.title ?? "Domande frequenti"}
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <FaqItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
