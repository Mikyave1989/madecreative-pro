"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("portal_token");
}

interface Template {
  id: string;
  name: string;
  sector: string;
  preview: string;
  colors: { primary: string; accent: string; bg: string };
  description: string;
}

const TEMPLATES: Template[] = [
  { id: "ristorante-elegante", name: "Ristorante Elegante", sector: "restaurant", preview: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop", colors: { primary: "#1a1208", accent: "#c9a84c", bg: "#faf8f4" }, description: "Design premium per ristoranti e trattorie. Colori caldi, tipografia elegante." },
  { id: "studio-dentistico", name: "Studio Dentistico", sector: "dental", preview: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop", colors: { primary: "#0a2540", accent: "#00b4d8", bg: "#f0f8ff" }, description: "Pulito e professionale. Ideale per studi medici e dentistici." },
  { id: "studio-legale", name: "Studio Legale", sector: "legal", preview: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop", colors: { primary: "#1a1a2e", accent: "#c5a028", bg: "#f8f7f4" }, description: "Autorevole e sofisticato. Perfetto per avvocati e consulenti." },
  { id: "palestra-fitness", name: "Palestra & Fitness", sector: "fitness", preview: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop", colors: { primary: "#0d0d0d", accent: "#ff3d00", bg: "#111111" }, description: "Energico e dinamico. Dark mode con accenti rossi." },
  { id: "salone-bellezza", name: "Salone di Bellezza", sector: "beauty", preview: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop", colors: { primary: "#2a1f1a", accent: "#c9967a", bg: "#fdf8f5" }, description: "Femminile e raffinato. Toni rose gold e crema." },
  { id: "hotel-luxury", name: "Hotel & B&B", sector: "hotel", preview: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop", colors: { primary: "#1c1610", accent: "#c9a84c", bg: "#f9f6f0" }, description: "Lusso discreto. Per hotel, B&B e case vacanza." },
  { id: "ecommerce-moderno", name: "E-Commerce", sector: "ecommerce", preview: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&h=400&fit=crop", colors: { primary: "#1a1a1a", accent: "#e63946", bg: "#ffffff" }, description: "Minimalista e orientato alla conversione." },
  { id: "agenzia-immobiliare", name: "Agenzia Immobiliare", sector: "realestate", preview: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop", colors: { primary: "#1a2744", accent: "#c9a84c", bg: "#f8f7f5" }, description: "Professionale con tocco premium. Per agenzie immobiliari." },
  { id: "studio-medico", name: "Studio Medico", sector: "medical", preview: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop", colors: { primary: "#005f73", accent: "#0a9396", bg: "#f0fbfc" }, description: "Rassicurante e pulito. Per cliniche e studi medici." },
];

export default function TemplatesPage() {
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  async function applyTemplate(template: Template) {
    setApplying(template.id);
    try {
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${API_URL}/portal/website/pages`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          templateId: template.id,
          sector: template.sector,
          designTokens: { colors: template.colors },
        }),
      });

      setApplied(template.id);
      setTimeout(() => setApplied(null), 3000);
    } catch { /* */ }
    finally { setApplying(null); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Template
        </h2>
        <p className="text-sm text-slate-400 mt-1">Scegli un template di partenza per il tuo sito. L&apos;AI lo personalizzerà per te.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all">
            {/* Preview image */}
            <div className="relative h-40 overflow-hidden">
              <img src={t.preview} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              {/* Color dots */}
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: t.colors.primary }} />
                <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: t.colors.accent }} />
                <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: t.colors.bg }} />
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-1">{t.name}</h3>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">{t.description}</p>
              <button
                onClick={() => void applyTemplate(t)}
                disabled={applying === t.id}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600/20 text-indigo-400 text-xs font-semibold rounded-lg hover:bg-indigo-600/30 transition-colors disabled:opacity-50"
              >
                {applying === t.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : applied === t.id ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {applied === t.id ? "Applicato!" : "Usa questo template"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
