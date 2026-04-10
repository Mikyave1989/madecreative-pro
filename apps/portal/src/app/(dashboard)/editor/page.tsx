"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  Bot,
  ChevronDown,
  Clock,
  Coins,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Phone,
  Quote,
  RefreshCw,
  Send,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Undo2,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  cost?: number;
}

interface Credits {
  remaining: number;
  used: number;
  total: number;
  purchased?: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl?: string | null;
}

interface HourEntry {
  open: string;
  close: string;
  closed: boolean;
}

interface Testimonial {
  name: string;
  text: string;
  rating: number;
  avatar?: string;
}

interface GalleryImage {
  url: string;
  caption?: string;
}

interface ServiceItem {
  name: string;
  description: string;
  icon?: string;
  price?: string;
}

interface WebsiteContent {
  heroText?: string;
  heroDescription?: string;
  heroImage?: string;
  heroCtaText?: string;
  aboutText?: string;
  aboutImage?: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsappNumber?: string;
  menuItems?: MenuItem[];
  hours?: Record<string, HourEntry>;
  gallery?: GalleryImage[];
  testimonials?: Testimonial[];
  services?: ServiceItem[];
  mapEmbed?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  primaryColor?: string;
  [key: string]: unknown;
}

type DeviceMode = "desktop" | "tablet" | "mobile";
type MobileTab = "chat" | "preview";

// ─── API helpers ──────────────────────────────────────────────────────────────

const API_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function refreshTokenIfNeeded(): Promise<boolean> {
  const refresh = typeof window !== "undefined" ? localStorage.getItem("mc_refresh") : null;
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_URL}/portal/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    const json = (await res.json()) as { success: boolean; data?: { accessToken: string } };
    if (json.success && json.data?.accessToken) {
      localStorage.setItem("mc_token", json.data.accessToken);
      return true;
    }
  } catch {}
  return false;
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Crea il mio sito",
  "Cambia il titolo",
  "Aggiungi menu",
  "Modifica orari",
  "Aggiungi WhatsApp",
];

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  const [step, setStep] = useState(0);
  const steps = [
    "Analizzo la richiesta...",
    "Creo la struttura del sito...",
    "Genero i contenuti...",
    "Applico le modifiche...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-[90%]">
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span className="text-sm text-indigo-300 font-medium">{steps[step]}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────

function renderMessageContent(content: string) {
  // Support **bold** and line breaks
  const lines = content.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={lineIdx} className={lineIdx > 0 ? "mt-1.5" : ""}>
        {parts.map((part, partIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={partIdx} className="font-semibold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={partIdx}>{part}</span>;
        })}
      </p>
    );
  });
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-end gap-2 max-w-[80%]">
          <div className="bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
            {renderMessageContent(msg.content)}
          </div>
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mb-0.5">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="max-w-[90%]">
        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-zinc-200 leading-relaxed">
          {renderMessageContent(msg.content)}
        </div>
      </div>
      {msg.cost !== undefined && msg.cost > 0 && (
        <p className="text-[10px] text-zinc-600 pl-1">
          {msg.cost.toFixed(1)} crediti
        </p>
      )}
    </div>
  );
}

// ─── Preview site renderer ────────────────────────────────────────────────────

const UNSPLASH_HERO = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200";
const UNSPLASH_FOOD = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600";
const UNSPLASH_ABOUT = "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600";

const DAY_LABELS: Record<string, string> = {
  monday: "Lunedì", tuesday: "Martedì", wednesday: "Mercoledì",
  thursday: "Giovedì", friday: "Venerdì", saturday: "Sabato", sunday: "Domenica",
  lun: "Lunedì", mar: "Martedì", mer: "Mercoledì",
  gio: "Giovedì", ven: "Venerdì", sab: "Sabato", dom: "Domenica",
};

function dayLabel(key: string): string {
  return DAY_LABELS[key.toLowerCase()] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

function SitePreview({ content }: { content: WebsiteContent }) {
  const hasContent =
    content.heroText ||
    content.heroDescription ||
    content.phone ||
    content.email ||
    content.address ||
    content.whatsappNumber ||
    (content.menuItems && content.menuItems.length > 0) ||
    (content.services && content.services.length > 0) ||
    (content.gallery && content.gallery.length > 0) ||
    (content.testimonials && content.testimonials.length > 0) ||
    content.hours ||
    content.aboutText;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16 bg-white">
        <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-sm font-medium text-zinc-400 mb-1">
          Nessun contenuto ancora
        </p>
        <p className="text-xs text-zinc-300">
          Inizia a chattare per creare il tuo sito
        </p>
      </div>
    );
  }

  const accentColor = content.primaryColor ?? "#4f46e5";

  // Group menu items by category
  const menuByCategory: Record<string, MenuItem[]> = {};
  if (content.menuItems && content.menuItems.length > 0) {
    for (const item of content.menuItems) {
      const cat = item.category || "Altri";
      if (!menuByCategory[cat]) menuByCategory[cat] = [];
      menuByCategory[cat].push(item);
    }
  }

  return (
    <div className="bg-white text-gray-900 font-sans min-h-full">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-base font-bold tracking-tight text-gray-900">
            {content.heroText ?? "Il tuo sito"}
          </span>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            {content.aboutText && <a href="#about" className="hover:text-gray-900 transition-colors">Chi siamo</a>}
            {(content.menuItems?.length || content.services?.length) ? <a href="#menu" className="hover:text-gray-900 transition-colors">Menu</a> : null}
            {content.gallery?.length ? <a href="#gallery" className="hover:text-gray-900 transition-colors">Galleria</a> : null}
            <a href="#contact" className="hover:text-gray-900 transition-colors">Contatti</a>
          </div>
          {content.whatsappNumber && (
            <a
              href={`https://wa.me/${content.whatsappNumber.replace(/\D/g, "")}`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: "#25D366" }}
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}
        </div>
      </nav>

      {/* ── 1. HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[480px] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.heroImage ?? UNSPLASH_HERO}
            alt="Hero"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>
        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto py-24">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/60 mb-4">
            Benvenuti
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5 drop-shadow-lg">
            {content.heroText ?? "Il tuo sito professionale"}
          </h1>
          {content.heroDescription && (
            <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8 max-w-xl mx-auto">
              {content.heroDescription}
            </p>
          )}
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            {content.heroCtaText ?? "Scopri di più"}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── 2. ABOUT ────────────────────────────────────────── */}
      {content.aboutText && (
        <section id="about" className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: accentColor }}>
                  Chi siamo
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-5 leading-tight">
                  La nostra storia
                </h2>
                <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
                  {content.aboutText}
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={content.aboutImage ?? UNSPLASH_ABOUT}
                  alt="Chi siamo"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 3a. SERVICES ────────────────────────────────────── */}
      {content.services && content.services.length > 0 && (
        <section id="menu" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: accentColor }}>
                Cosa offriamo
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">I nostri servizi</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.services.map((svc, idx) => (
                <div
                  key={idx}
                  className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {svc.icon && (
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white mb-4 text-xl"
                      style={{ backgroundColor: accentColor }}
                    >
                      {svc.icon}
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 mb-2">{svc.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{svc.description}</p>
                  {svc.price && (
                    <p className="mt-4 text-base font-bold" style={{ color: accentColor }}>
                      {svc.price}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 3b. MENU ────────────────────────────────────────── */}
      {content.menuItems && content.menuItems.length > 0 && (
        <section id="menu" className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: accentColor }}>
                La nostra proposta
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Il Menu</h2>
            </div>
            {Object.entries(menuByCategory).map(([category, items]) => (
              <div key={category} className="mb-12 last:mb-0">
                <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b border-gray-200">
                  {category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex gap-4 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl ?? UNSPLASH_FOOD}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0 py-3 pr-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</p>
                          <span className="text-sm font-bold flex-shrink-0" style={{ color: accentColor }}>
                            {item.price}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. GALLERY ──────────────────────────────────────── */}
      {content.gallery && content.gallery.length > 0 && (
        <section id="gallery" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: accentColor }}>
                I nostri momenti
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Galleria</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.gallery.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 aspect-square"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.caption ?? `Gallery ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {img.caption && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <p className="text-white text-sm font-medium">{img.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. TESTIMONIALS ─────────────────────────────────── */}
      {content.testimonials && content.testimonials.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: accentColor }}>
                Cosa dicono di noi
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Recensioni</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.testimonials.map((t, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                  <Quote className="w-6 h-6 text-gray-200" />
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      {t.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{t.name}</p>
                      <StarRating rating={t.rating} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. HOURS + CONTACT ──────────────────────────────── */}
      {(content.hours || content.phone || content.email || content.address) && (
        <section id="contact" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: accentColor }}>
                Vieni a trovarci
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Orari e Contatti</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Hours */}
              {content.hours && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-2 mb-5">
                    <Clock className="w-4 h-4" style={{ color: accentColor }} />
                    <h3 className="font-bold text-gray-900">Orari di apertura</h3>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(content.hours).map(([day, h]) => (
                      <div
                        key={day}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <span className="text-sm font-medium text-gray-700">{dayLabel(day)}</span>
                        {h.closed ? (
                          <span className="text-xs font-semibold text-red-400 bg-red-50 px-2.5 py-0.5 rounded-full">
                            Chiuso
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">
                            {h.open} – {h.close}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact + Map */}
              <div className="flex flex-col gap-5">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Contattaci</h3>
                  <div className="space-y-3">
                    {content.phone && (
                      <a
                        href={`tel:${content.phone}`}
                        className="flex items-center gap-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: accentColor }}>
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        {content.phone}
                      </a>
                    )}
                    {content.email && (
                      <a
                        href={`mailto:${content.email}`}
                        className="flex items-center gap-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: accentColor }}>
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        {content.email}
                      </a>
                    )}
                    {content.address && (
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: accentColor }}>
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        {content.address}
                      </div>
                    )}
                    {content.whatsappNumber && (
                      <a
                        href={`https://wa.me/${content.whatsappNumber.replace(/\D/g, "")}`}
                        className="flex items-center gap-3 text-sm font-semibold text-white rounded-xl px-4 py-2.5 transition-opacity hover:opacity-90 mt-1"
                        style={{ backgroundColor: "#25D366" }}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Scrivici su WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {/* Map embed placeholder */}
                {content.mapEmbed ? (
                  <div
                    className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-40"
                    dangerouslySetInnerHTML={{ __html: content.mapEmbed }}
                  />
                ) : content.address ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-100 h-40 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Mappa non disponibile</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 7. FOOTER ───────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-300 pt-12 pb-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
            {/* Brand */}
            <div>
              <p className="text-lg font-bold text-white mb-2">
                {content.heroText ?? "Il tuo sito"}
              </p>
              {content.heroDescription && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                  {content.heroDescription}
                </p>
              )}
            </div>
            {/* Quick links */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
                Link rapidi
              </p>
              <ul className="space-y-2 text-sm">
                {content.aboutText && <li><a href="#about" className="hover:text-white transition-colors">Chi siamo</a></li>}
                {(content.menuItems?.length || content.services?.length) ? <li><a href="#menu" className="hover:text-white transition-colors">Menu / Servizi</a></li> : null}
                {content.gallery?.length ? <li><a href="#gallery" className="hover:text-white transition-colors">Galleria</a></li> : null}
                <li><a href="#contact" className="hover:text-white transition-colors">Contatti</a></li>
              </ul>
            </div>
            {/* Contact + Social */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
                Contatti
              </p>
              <ul className="space-y-2 text-sm">
                {content.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    {content.phone}
                  </li>
                )}
                {content.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    {content.email}
                  </li>
                )}
                {content.address && (
                  <li className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    {content.address}
                  </li>
                )}
              </ul>
              {(content.instagramUrl || content.facebookUrl) && (
                <div className="flex items-center gap-3 mt-4">
                  {content.instagramUrl && (
                    <a
                      href={content.instagramUrl}
                      aria-label="Instagram"
                      className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                    >
                      <Instagram className="w-4 h-4 text-gray-300" />
                    </a>
                  )}
                  {content.facebookUrl && (
                    <a
                      href={content.facebookUrl}
                      aria-label="Facebook"
                      className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                    >
                      <Facebook className="w-4 h-4 text-gray-300" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} {content.heroText ?? "Il tuo sito"}. Tutti i diritti riservati.</p>
            <p>Powered by <span className="text-gray-400 font-medium">MadeCreative</span></p>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── Preview panel (toolbar + frame) ─────────────────────────────────────────

function PreviewPanel({
  content,
  onRefresh,
  building = false,
}: {
  content: WebsiteContent;
  onRefresh: () => void;
  building?: boolean;
}) {
  const [device, setDevice] = useState<DeviceMode>("desktop");

  const frameWidths: Record<DeviceMode, string> = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  };

  const deviceButtons: Array<{
    mode: DeviceMode;
    Icon: React.ComponentType<{ className?: string }>;
    label: string;
  }> = [
    { mode: "desktop", Icon: Monitor, label: "Desktop" },
    { mode: "tablet", Icon: Tablet, label: "Tablet" },
    { mode: "mobile", Icon: Smartphone, label: "Mobile" },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 flex-shrink-0">
        {/* macOS-style dots */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1 min-w-0">
          <span className="text-[11px] text-zinc-500 font-mono truncate select-none">
            tuosito.madecreative.pro
          </span>
        </div>

        {/* Device toggle */}
        <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-md overflow-hidden flex-shrink-0">
          {deviceButtons.map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setDevice(mode)}
              title={label}
              aria-label={label}
              className={`px-2.5 py-1.5 transition-colors ${
                device === mode
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          title="Aggiorna"
          aria-label="Aggiorna anteprima"
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preview frame */}
      <div className="flex-1 overflow-auto bg-zinc-950 flex justify-center relative">
        <div
          className={`${frameWidths[device]} h-full overflow-auto bg-white transition-all duration-300`}
          style={{ maxHeight: "100%" }}
        >
          <SitePreview content={content} />
        </div>

        {/* Building overlay */}
        {building && (
          <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-base font-semibold text-white mb-1">Costruendo il tuo sito...</p>
              <p className="text-xs text-zinc-400">L&apos;AI sta generando contenuti e struttura</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat panel ───────────────────────────────────────────────────────────────

function ChatPanel({
  messages,
  loading,
  credits,
  input,
  onInputChange,
  onSend,
  onSuggestion,
  onUndo,
  undoing,
  projectName,
  textareaRef,
}: {
  messages: ChatMessage[];
  loading: boolean;
  credits: Credits;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onSuggestion: (s: string) => void;
  onUndo: () => void;
  undoing: boolean;
  projectName: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const showSuggestions = messages.length === 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  // Auto-resize textarea up to 4 rows
  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target;
    el.style.height = "auto";
    const lineHeight = 20;
    const maxHeight = lineHeight * 4 + 24; // 4 rows + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    onInputChange(el.value);
  }

  const creditsPercent =
    credits.total > 0
      ? Math.round((credits.remaining / credits.total) * 100)
      : 0;
  const creditsLow = credits.remaining <= Math.ceil(credits.total * 0.15);

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-sm font-semibold text-zinc-100 truncate">
            {projectName}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Undo button */}
          <button
            onClick={onUndo}
            disabled={undoing || messages.length === 0}
            title="Annulla ultima modifica"
            aria-label="Annulla ultima modifica"
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          {/* Credits badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
              creditsLow
                ? "bg-amber-950/40 border-amber-800/50 text-amber-400"
                : "bg-zinc-800 border-zinc-700 text-zinc-300"
            }`}
          >
            <Coins
              className={`w-3 h-3 ${creditsLow ? "text-amber-400" : "text-zinc-500"}`}
            />
            <span>{credits.remaining}</span>
            <span className="text-zinc-600 font-normal">/ {credits.total}</span>
          </div>
        </div>
      </div>

      {/* Credits progress bar */}
      <div className="h-0.5 bg-zinc-800 flex-shrink-0">
        <div
          className={`h-full transition-all duration-500 ${creditsLow ? "bg-amber-500" : "bg-indigo-500"}`}
          style={{ width: `${creditsPercent}%` }}
        />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {showSuggestions && (
          <div className="flex flex-col h-full min-h-[300px] justify-center">
            {/* Greeting */}
            <div className="flex items-end gap-2.5 mb-6">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-zinc-200 leading-relaxed">
                <p>
                  Ciao! Sono il tuo assistente AI.{" "}
                  <strong className="font-semibold">
                    Cosa vuoi fare con il tuo sito oggi?
                  </strong>
                </p>
              </div>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 pl-9">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestion(s)}
                  disabled={loading || credits.remaining <= 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300 hover:border-indigo-500 hover:text-indigo-300 hover:bg-indigo-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-3 h-3 rotate-[-90deg] text-zinc-600" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}

        {loading && <TypingIndicator />}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-zinc-800">
        {credits.remaining <= 0 ? (
          <div className="flex items-center gap-2 p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-400">
            <Coins className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Crediti esauriti. Vai su{" "}
              <a href="/billing" className="underline font-semibold">
                Account
              </a>{" "}
              per ricaricare.
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-2 bg-zinc-800 border border-zinc-700 rounded-xl p-2 focus-within:border-indigo-500/70 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Scrivi cosa vuoi cambiare..."
                disabled={loading}
                rows={1}
                aria-label="Messaggio per l'AI"
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none leading-5 py-1 px-1 disabled:opacity-50"
                style={{ minHeight: "28px", maxHeight: "104px" }}
              />
              <button
                onClick={onSend}
                disabled={!input.trim() || loading}
                aria-label="Invia messaggio"
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-zinc-700 mt-1.5 text-center">
              Haiku risponde in secondi · Opus genera qualita professionale &nbsp;·&nbsp; Invio per inviare
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<Credits>({
    remaining: 100,
    used: 0,
    total: 100,
  });
  const [content, setContent] = useState<WebsiteContent>({});
  const [undoing, setUndoing] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [refreshKey, setRefreshKey] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const projectName = user?.companyName ?? "Il tuo sito";

  // Load credits + existing content on mount
  useEffect(() => {
    fetch(`${API_URL}/portal/editor/chat/credits`, {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Credits }) => {
        if (j.success && j.data) setCredits(j.data);
      })
      .catch(() => {});

    fetch(`${API_URL}/portal/editor`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(
        (j: {
          success: boolean;
          data?: { pages?: WebsiteContent };
          error?: string;
        }) => {
          if (j.success && j.data?.pages) {
            setContent(j.data.pages as WebsiteContent);
          }
        }
      )
      .catch(() => {});
  }, []);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;

      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      setMessages((prev) => [...prev, { role: "user", content: msg }]);
      setLoading(true);

      try {
        const res = await fetch(`${API_URL}/portal/editor/chat`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            message: msg,
            history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const json = (await res.json()) as {
          success: boolean;
          data?: {
            response: string;
            contentUpdates: Record<string, unknown> | null;
            currentContent: WebsiteContent;
            credits: Credits;
            cost?: { inputTokens: number; outputTokens: number; totalCost: number };
          };
          error?: string;
        };

        if (res.status === 401) {
          const refreshed = await refreshTokenIfNeeded();
          if (refreshed) {
            // Retry with new token
            const retry = await fetch(`${API_URL}/portal/editor/chat`, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({ message: msg, history: messages.map((m) => ({ role: m.role, content: m.content })) }),
            });
            const retryJson = (await retry.json()) as typeof json;
            if (retryJson.success && retryJson.data) {
              const creditCost = credits.remaining - (retryJson.data.credits?.remaining ?? credits.remaining);
              setMessages((prev) => [...prev, { role: "assistant", content: retryJson.data!.response, cost: creditCost > 0 ? creditCost : undefined }]);
              if (retryJson.data.currentContent) setContent(retryJson.data.currentContent);
              if (retryJson.data.credits) setCredits(retryJson.data.credits);
              return;
            }
          }
          setMessages((prev) => [...prev, { role: "assistant", content: "Sessione scaduta. Effettua il login di nuovo." }]);
          return;
        }

        if (!res.ok || !json.success) {
          const errText =
            json.error ??
            `Errore del server (${res.status}). Riprova tra qualche secondo.`;
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: errText },
          ]);
          return;
        }

        if (json.data) {
          const creditCost = credits.remaining - (json.data.credits?.remaining ?? credits.remaining);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: json.data!.response,
              cost: creditCost > 0 ? creditCost : undefined,
            },
          ]);
          if (json.data.currentContent) {
            setContent(json.data.currentContent);
          }
          if (json.data.credits) {
            setCredits(json.data.credits);
          }
        }
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Errore di connessione";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Errore di rete: ${errMsg}. Controlla la connessione e riprova.`,
          },
        ]);
      } finally {
        setLoading(false);
        textareaRef.current?.focus();
      }
    },
    [input, loading, messages]
  );

  const handleUndo = useCallback(async () => {
    if (undoing) return;
    setUndoing(true);
    try {
      const res = await fetch(`${API_URL}/portal/editor/chat/rollback`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { content: WebsiteContent; restoredTo: string };
        error?: string;
      };
      if (json.success && json.data?.content) {
        setContent(json.data.content as WebsiteContent);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Versione precedente ripristinata. Le modifiche si aggiornano in ~2 minuti.`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              json.error ?? "Impossibile annullare. Nessuna versione precedente trovata.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Errore durante il ripristino. Riprova.",
        },
      ]);
    } finally {
      setUndoing(false);
    }
  }, [undoing]);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div
      className="bg-zinc-950"
      style={{ height: "calc(100vh - 56px)" }}
    >
      {/* ── Mobile tab bar (visible <md) ── */}
      <div className="md:hidden flex items-stretch h-10 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
            mobileTab === "chat"
              ? "text-indigo-400 border-b-2 border-indigo-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Chat AI
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
            mobileTab === "preview"
              ? "text-indigo-400 border-b-2 border-indigo-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          Anteprima
        </button>
      </div>

      {/* ── Main split layout ── */}
      <div
        className="flex overflow-hidden"
        style={{ height: "calc(100% - 0px)" }}
      >
        {/* Left: Chat */}
        <div
          className={`
            ${mobileTab === "preview" ? "hidden" : "flex"}
            md:flex flex-col
            w-full md:w-[40%]
            border-r border-zinc-800
          `}
        >
          <ChatPanel
            messages={messages}
            loading={loading}
            credits={credits}
            input={input}
            onInputChange={setInput}
            onSend={() => void sendMessage()}
            onSuggestion={(s) => void sendMessage(s)}
            onUndo={() => void handleUndo()}
            undoing={undoing}
            projectName={projectName}
            textareaRef={textareaRef}
          />
        </div>

        {/* Divider visual (desktop only) */}
        <div className="hidden md:flex items-center justify-center w-0.5 bg-zinc-800 flex-shrink-0">
          <div className="w-0.5 h-12 bg-zinc-700 rounded-full" />
        </div>

        {/* Right: Preview */}
        <div
          className={`
            ${mobileTab === "chat" ? "hidden" : "flex"}
            md:flex flex-col flex-1 min-w-0
          `}
          key={refreshKey}
        >
          <PreviewPanel content={content} onRefresh={handleRefresh} building={loading} />
        </div>
      </div>
    </div>
  );
}
