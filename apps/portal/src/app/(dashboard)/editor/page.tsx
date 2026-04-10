"use client";

import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";

// Dynamic import of Sandpack — avoids build failure if package not installed
const SandpackPreviewDynamic = dynamic(
  () => import("@codesandbox/sandpack-react").then((mod) => {
    const { SandpackProvider, SandpackPreview: Frame } = mod;
    // Return a wrapper component
    return function SandpackWrapper({ files, theme, options }: { files: Record<string, string>; theme?: string; options?: Record<string, unknown> }) {
      return (
        <SandpackProvider template="react" files={files} theme={theme as "dark"} options={options}>
          <Frame style={{ height: "100%", border: "none" }} />
        </SandpackProvider>
      );
    };
  }),
  { ssr: false, loading: () => null }
);
import {
  ArrowRight,
  Bot,
  ChevronDown,
  Clock,
  Coins,
  ExternalLink,
  Facebook,
  FileCode,
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  MousePointer,
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
  streaming?: boolean;
  tools?: Array<{ name: string; status: "running" | "done" }>;
  changes?: Record<string, unknown>;
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

const TOOL_LABELS: Record<string, string> = {
  update_hero: "Hero",
  update_contact: "Contatti",
  set_whatsapp: "WhatsApp",
  add_menu_item: "Menu",
  remove_menu_item: "Menu",
  update_hours: "Orari",
  update_about: "Chi siamo",
  set_gallery: "Galleria",
  set_testimonials: "Recensioni",
  set_services: "Servizi",
  search_photos: "Foto",
  get_current_content: "Contenuto",
  generate_with_opus: "Generazione AI",
};

// ─── Changes card (Phase 6) ───────────────────────────────────────────────────

const CHANGE_LABELS: Record<string, string> = {
  heroText: "Titolo hero",
  heroDescription: "Descrizione hero",
  heroImage: "Immagine hero",
  heroCtaText: "Testo CTA hero",
  aboutText: "Sezione chi siamo",
  aboutImage: "Immagine chi siamo",
  phone: "Telefono",
  email: "Email",
  address: "Indirizzo",
  whatsappNumber: "WhatsApp",
  menuItems: "Menu",
  services: "Servizi",
  gallery: "Galleria foto",
  testimonials: "Testimonianze",
  hours: "Orari",
  mapEmbed: "Mappa",
  instagramUrl: "Instagram",
  facebookUrl: "Facebook",
  primaryColor: "Colore principale",
};

function ChangesCard({ changes }: { changes: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const keys = Object.keys(changes);
  if (keys.length === 0) return null;

  return (
    <div className="mt-2 max-w-[90%]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <FileCode className="w-3 h-3" />
        {keys.length} {keys.length === 1 ? "sezione modificata" : "sezioni modificate"}
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs space-y-1.5">
          {keys.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="text-zinc-400">{CHANGE_LABELS[key] ?? key}</span>
              <span className="text-emerald-400 ml-auto font-medium">modificata</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
      {/* Tool call badges */}
      {msg.tools && msg.tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1 max-w-[90%]">
          {msg.tools.map((tool, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                tool.status === "running"
                  ? "bg-indigo-950/40 border-indigo-500/40 text-indigo-300"
                  : "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
              }`}
            >
              {tool.status === "running" ? (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
              {TOOL_LABELS[tool.name] ?? tool.name}
            </span>
          ))}
        </div>
      )}

      <div className="max-w-[90%]">
        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-zinc-200 leading-relaxed">
          {msg.content ? (
            <>
              {renderMessageContent(msg.content)}
              {msg.streaming && (
                <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
              )}
            </>
          ) : msg.streaming ? (
            <span className="inline-block w-0.5 h-3.5 bg-indigo-400 animate-pulse align-middle" />
          ) : null}
        </div>
      </div>
      {msg.cost !== undefined && msg.cost > 0 && (
        <p className="text-[10px] text-zinc-600 pl-1">
          {msg.cost.toFixed(1)} crediti
        </p>
      )}
      {msg.changes && Object.keys(msg.changes).length > 0 && (
        <ChangesCard changes={msg.changes} />
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

// ─── Visual edit section wrapper (Phase 5) ───────────────────────────────────

function SectionWrap({
  name,
  label,
  children,
  active,
  onSectionClick,
}: {
  name: string;
  label: string;
  children: React.ReactNode;
  active: boolean;
  onSectionClick: (section: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  if (!active) return <>{children}</>;
  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSectionClick(name)}
      style={{
        outline: hovered ? "2px solid #6366f1" : "2px solid transparent",
        outlineOffset: "-2px",
        cursor: "pointer",
      }}
    >
      {hovered && (
        <div
          className="absolute top-2 left-1/2 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shadow-lg"
          style={{
            transform: "translateX(-50%)",
            backgroundColor: "#6366f1",
            pointerEvents: "none",
          }}
        >
          <MousePointer className="w-3 h-3" />
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function StaticSitePreview({
  content,
  onSectionClick,
}: {
  content: WebsiteContent;
  onSectionClick?: (section: string) => void;
}) {
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

  const editMode = !!onSectionClick;
  const sectionClick = onSectionClick ?? (() => {});

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
      <SectionWrap name="hero" label="Hero" active={editMode} onSectionClick={sectionClick}>
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
      </SectionWrap>

      {/* ── 2. ABOUT ────────────────────────────────────────── */}
      {content.aboutText && (
        <SectionWrap name="about" label="Chi siamo" active={editMode} onSectionClick={sectionClick}>
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
        </SectionWrap>
      )}

      {/* ── 3a. SERVICES ────────────────────────────────────── */}
      {content.services && content.services.length > 0 && (
        <SectionWrap name="services" label="Servizi" active={editMode} onSectionClick={sectionClick}>
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
        </SectionWrap>
      )}

      {/* ── 3b. MENU ────────────────────────────────────────── */}
      {content.menuItems && content.menuItems.length > 0 && (
        <SectionWrap name="menu" label="Menu" active={editMode} onSectionClick={sectionClick}>
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
        </SectionWrap>
      )}

      {/* ── 4. GALLERY ──────────────────────────────────────── */}
      {content.gallery && content.gallery.length > 0 && (
        <SectionWrap name="gallery" label="Galleria" active={editMode} onSectionClick={sectionClick}>
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
        </SectionWrap>
      )}

      {/* ── 5. TESTIMONIALS ─────────────────────────────────── */}
      {content.testimonials && content.testimonials.length > 0 && (
        <SectionWrap name="testimonials" label="Recensioni" active={editMode} onSectionClick={sectionClick}>
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
        </SectionWrap>
      )}

      {/* ── 6. HOURS + CONTACT ──────────────────────────────── */}
      {(content.hours || content.phone || content.email || content.address) && (
        <SectionWrap name="contact" label="Orari e Contatti" active={editMode} onSectionClick={sectionClick}>
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
        </SectionWrap>
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

// ─── Sandpack helpers ─────────────────────────────────────────────────────────

/**
 * Escape a raw string so it can be safely embedded as a JS template-literal.
 * Backticks, backslashes, and ${…} would otherwise break the generated code.
 */
function escJs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

function generateFallbackAppJs(content: WebsiteContent): string {
  const accent = escJs(content.primaryColor ?? "#4f46e5");
  const heroText = escJs(content.heroText ?? "Il tuo sito professionale");
  const heroDesc = escJs(content.heroDescription ?? "");
  const heroImage = escJs(
    content.heroImage ??
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200"
  );
  const heroCtaText = escJs(content.heroCtaText ?? "Scopri di più");
  const aboutText = escJs(content.aboutText ?? "");
  const aboutImage = escJs(
    content.aboutImage ??
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600"
  );
  const phone = escJs(content.phone ?? "");
  const email = escJs(content.email ?? "");
  const address = escJs(content.address ?? "");
  const whatsapp = escJs(content.whatsappNumber ?? "");

  const servicesJson = JSON.stringify(content.services ?? []);
  const menuJson = JSON.stringify(content.menuItems ?? []);
  const galleryJson = JSON.stringify(content.gallery ?? []);
  const testimonialsJson = JSON.stringify(content.testimonials ?? []);
  const hoursJson = JSON.stringify(content.hours ?? null);

  return `import "./styles.css";

const ACCENT = "${accent}";
const SERVICES = ${servicesJson};
const MENU = ${menuJson};
const GALLERY = ${galleryJson};
const TESTIMONIALS = ${testimonialsJson};
const HOURS = ${hoursJson};

const DAY_LABELS = {
  monday:"Lunedì",tuesday:"Martedì",wednesday:"Mercoledì",
  thursday:"Giovedì",friday:"Venerdì",saturday:"Sabato",sunday:"Domenica",
  lun:"Lunedì",mar:"Martedì",mer:"Mercoledì",
  gio:"Giovedì",ven:"Venerdì",sab:"Sabato",dom:"Domenica",
};
function dayLabel(k) {
  return DAY_LABELS[k.toLowerCase()] ?? (k.charAt(0).toUpperCase() + k.slice(1));
}

function StarRating({ rating }) {
  return (
    <div style={{display:"flex",gap:"2px"}}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{color: n <= rating ? "#f59e0b" : "#d1d5db", fontSize:"14px"}}>★</span>
      ))}
    </div>
  );
}

export default function App() {
  const hasContent = ${
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
    content.aboutText
      ? "true"
      : "false"
  };

  if (!hasContent) {
    return (
      <div className="empty-state">
        <div className="empty-icon">✨</div>
        <p className="empty-title">Nessun contenuto ancora</p>
        <p className="empty-sub">Inizia a chattare per creare il tuo sito</p>
      </div>
    );
  }

  const menuByCategory = {};
  MENU.forEach(item => {
    const cat = item.category || "Altri";
    if (!menuByCategory[cat]) menuByCategory[cat] = [];
    menuByCategory[cat].push(item);
  });

  return (
    <div className="site">
      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <span className="nav-brand">\`${heroText}\`</span>
          <div className="nav-links">
            ${aboutText ? `<a href="#about">Chi siamo</a>` : ""}
            ${(content.menuItems?.length || content.services?.length) ? `<a href="#menu">Menu</a>` : ""}
            ${content.gallery?.length ? `<a href="#gallery">Galleria</a>` : ""}
            <a href="#contact">Contatti</a>
          </div>
          ${
            whatsapp
              ? `<a href={\`https://wa.me/\${("${whatsapp}").replace(/\\D/g,"")}\`} className="btn-whatsapp">WhatsApp</a>`
              : ""
          }
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" style={{backgroundImage:\`url(${heroImage})\`}}>
        <div className="hero-overlay">
          <p className="hero-eyebrow">Benvenuti</p>
          <h1 className="hero-title">${heroText}</h1>
          ${heroDesc ? `<p className="hero-desc">${heroDesc}</p>` : ""}
          <a href="#contact" className="hero-cta" style={{backgroundColor: ACCENT}}>
            ${heroCtaText} →
          </a>
        </div>
      </section>

      ${
        aboutText
          ? `{/* ABOUT */}
      <section id="about" className="section section-gray">
        <div className="container grid-2">
          <div>
            <p className="eyebrow" style={{color:ACCENT}}>Chi siamo</p>
            <h2 className="section-title">La nostra storia</h2>
            <p className="section-body">${aboutText}</p>
          </div>
          <div className="img-wrap">
            <img src="${aboutImage}" alt="Chi siamo" />
          </div>
        </div>
      </section>`
          : ""
      }

      {/* SERVICES */}
      {SERVICES.length > 0 && (
        <section id="menu" className="section">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow" style={{color:ACCENT}}>Cosa offriamo</p>
              <h2 className="section-title">I nostri servizi</h2>
            </div>
            <div className="card-grid">
              {SERVICES.map((svc, idx) => (
                <div key={idx} className="card">
                  {svc.icon && <div className="card-icon" style={{backgroundColor:ACCENT}}>{svc.icon}</div>}
                  <h3 className="card-title">{svc.name}</h3>
                  <p className="card-body">{svc.description}</p>
                  {svc.price && <p className="card-price" style={{color:ACCENT}}>{svc.price}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MENU */}
      {MENU.length > 0 && (
        <section id="menu" className="section section-gray">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow" style={{color:ACCENT}}>La nostra proposta</p>
              <h2 className="section-title">Il Menu</h2>
            </div>
            {Object.entries(menuByCategory).map(([cat, items]) => (
              <div key={cat} className="menu-cat">
                <h3 className="menu-cat-title">{cat}</h3>
                <div className="menu-grid">
                  {items.map(item => (
                    <div key={item.id} className="menu-item">
                      <img src={item.imageUrl || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200"} alt={item.name} />
                      <div className="menu-item-body">
                        <div className="menu-item-row">
                          <p className="menu-item-name">{item.name}</p>
                          <span className="menu-item-price" style={{color:ACCENT}}>{item.price}</span>
                        </div>
                        {item.description && <p className="menu-item-desc">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GALLERY */}
      {GALLERY.length > 0 && (
        <section id="gallery" className="section">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow" style={{color:ACCENT}}>I nostri momenti</p>
              <h2 className="section-title">Galleria</h2>
            </div>
            <div className="gallery-grid">
              {GALLERY.map((img, idx) => (
                <div key={idx} className="gallery-item">
                  <img src={img.url} alt={img.caption || "Gallery"} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {TESTIMONIALS.length > 0 && (
        <section className="section section-gray">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow" style={{color:ACCENT}}>Cosa dicono di noi</p>
              <h2 className="section-title">Recensioni</h2>
            </div>
            <div className="card-grid">
              {TESTIMONIALS.map((t, idx) => (
                <div key={idx} className="testimonial-card">
                  <p className="testimonial-quote">❝{t.text}❞</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">
                      {t.avatar
                        ? <img src={t.avatar} alt={t.name} />
                        : <span>{t.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div>
                      <p className="testimonial-name">{t.name}</p>
                      <StarRating rating={t.rating} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTACT + HOURS */}
      {(HOURS || ${phone ? "true" : "false"} || ${email ? "true" : "false"} || ${address ? "true" : "false"}) && (
        <section id="contact" className="section">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow" style={{color:ACCENT}}>Vieni a trovarci</p>
              <h2 className="section-title">Orari e Contatti</h2>
            </div>
            <div className="contact-grid">
              {HOURS && (
                <div className="hours-card">
                  <h3 className="hours-title">Orari di apertura</h3>
                  {Object.entries(HOURS).map(([day, h]) => (
                    <div key={day} className="hours-row">
                      <span className="hours-day">{dayLabel(day)}</span>
                      {h.closed
                        ? <span className="hours-closed">Chiuso</span>
                        : <span className="hours-time">{h.open} – {h.close}</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="contact-card">
                <h3 className="hours-title">Contattaci</h3>
                ${phone ? `<a href="tel:${phone}" className="contact-row"><span className="contact-icon" style={{backgroundColor:ACCENT}}>📞</span>${phone}</a>` : ""}
                ${email ? `<a href="mailto:${email}" className="contact-row"><span className="contact-icon" style={{backgroundColor:ACCENT}}>✉️</span>${email}</a>` : ""}
                ${address ? `<div className="contact-row"><span className="contact-icon" style={{backgroundColor:ACCENT}}>📍</span>${address}</div>` : ""}
                ${
                  whatsapp
                    ? `<a href={\`https://wa.me/\${("${whatsapp}").replace(/\\D/g,"")}\`} className="btn-wa-contact">WhatsApp</a>`
                    : ""
                }
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <p className="footer-brand">${heroText}</p>
          ${heroDesc ? `<p className="footer-desc">${heroDesc}</p>` : ""}
          <p className="footer-copy">© {new Date().getFullYear()} ${heroText} · Powered by MadeCreative</p>
        </div>
      </footer>
    </div>
  );
}
`;
}

function generateFallbackCSS(): string {
  return `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; background: #fff; }
a { text-decoration: none; color: inherit; }
img { display: block; width: 100%; height: 100%; object-fit: cover; }

/* Layout */
.site { min-height: 100vh; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
.img-wrap { border-radius: 16px; overflow: hidden; aspect-ratio: 4/3; }

/* Nav */
.nav { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-bottom: 1px solid #f3f4f6; }
.nav-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; }
.nav-brand { font-size: 15px; font-weight: 700; color: #111827; }
.nav-links { display: flex; gap: 24px; font-size: 14px; font-weight: 500; color: #4b5563; }
.nav-links a:hover { color: #111827; }
.btn-whatsapp { background: #25D366; color: #fff; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; }

/* Hero */
.hero { position: relative; min-height: 480px; display: flex; align-items: center; justify-content: center; background-size: cover; background-position: center; }
.hero-overlay { position: relative; z-index: 2; text-align: center; padding: 96px 24px; max-width: 700px; }
.hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,.6), rgba(0,0,0,.55), rgba(0,0,0,.7)); }
.hero-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,.6); margin-bottom: 16px; }
.hero-title { font-size: 42px; font-weight: 700; color: #fff; line-height: 1.2; margin-bottom: 20px; }
.hero-desc { font-size: 16px; color: rgba(255,255,255,.8); line-height: 1.6; margin-bottom: 32px; }
.hero-cta { display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; border-radius: 999px; font-size: 14px; font-weight: 600; color: #fff; }

/* Sections */
.section { padding: 80px 0; }
.section-gray { background: #f9fafb; }
.section-head { text-align: center; margin-bottom: 48px; }
.eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 12px; }
.section-title { font-size: 28px; font-weight: 700; color: #111827; }
.section-body { font-size: 15px; color: #4b5563; line-height: 1.7; margin-top: 12px; }

/* Cards */
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }
.card { background: #fff; border: 1px solid #f3f4f6; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
.card-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; margin-bottom: 16px; font-size: 20px; }
.card-title { font-weight: 700; color: #111827; margin-bottom: 8px; }
.card-body { font-size: 13px; color: #6b7280; line-height: 1.6; }
.card-price { margin-top: 16px; font-size: 15px; font-weight: 700; }

/* Menu */
.menu-cat { margin-bottom: 40px; }
.menu-cat:last-child { margin-bottom: 0; }
.menu-cat-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
.menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.menu-item { display: flex; gap: 16px; background: #fff; border: 1px solid #f3f4f6; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.menu-item img { width: 80px; height: 80px; flex-shrink: 0; object-fit: cover; }
.menu-item-body { flex: 1; padding: 12px 16px 12px 0; }
.menu-item-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.menu-item-name { font-weight: 600; font-size: 14px; color: #111827; }
.menu-item-price { font-weight: 700; font-size: 14px; flex-shrink: 0; }
.menu-item-desc { font-size: 12px; color: #6b7280; margin-top: 4px; }

/* Gallery */
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.gallery-item { aspect-ratio: 1; border-radius: 16px; overflow: hidden; }
.gallery-item img { transition: transform .4s; }
.gallery-item:hover img { transform: scale(1.05); }

/* Testimonials */
.testimonial-card { background: #fff; border: 1px solid #f3f4f6; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.testimonial-quote { font-size: 13px; color: #374151; line-height: 1.6; flex: 1; }
.testimonial-author { display: flex; align-items: center; gap: 12px; padding-top: 12px; border-top: 1px solid #f3f4f6; }
.testimonial-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; background: #f3f4f6; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #9ca3af; }
.testimonial-name { font-size: 12px; font-weight: 600; color: #111827; margin-bottom: 2px; }

/* Contact */
.contact-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 40px; }
.hours-card, .contact-card { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 16px; padding: 24px; }
.hours-title { font-weight: 700; color: #111827; margin-bottom: 20px; }
.hours-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
.hours-row:last-child { border-bottom: none; }
.hours-day { font-size: 14px; font-weight: 500; color: #374151; }
.hours-closed { font-size: 12px; font-weight: 600; color: #ef4444; background: #fef2f2; padding: 2px 10px; border-radius: 999px; }
.hours-time { font-size: 14px; font-weight: 600; color: #111827; }
.contact-row { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #374151; margin-bottom: 12px; }
.contact-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; font-size: 14px; }
.btn-wa-contact { display: inline-flex; align-items: center; gap: 8px; background: #25D366; color: #fff; padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; margin-top: 8px; }

/* Footer */
.footer { background: #111827; color: #9ca3af; padding: 48px 0 24px; }
.footer-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; text-align: center; }
.footer-brand { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 8px; }
.footer-desc { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
.footer-copy { font-size: 12px; color: #4b5563; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fff; text-align: center; padding: 24px; }
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-title { font-size: 14px; font-weight: 500; color: #9ca3af; margin-bottom: 4px; }
.empty-sub { font-size: 12px; color: #d1d5db; }

@media (max-width: 640px) {
  .grid-2 { grid-template-columns: 1fr; }
  .hero-title { font-size: 30px; }
  .nav-links { display: none; }
}
`;
}

function generateFallbackFiles(content: WebsiteContent): Record<string, string> {
  return {
    "/App.js": generateFallbackAppJs(content),
    "/styles.css": generateFallbackCSS(),
  };
}

/** Strip all TypeScript syntax from source code so Sandpack (plain JS) can run it. */
function stripTypeScript(src: string): string {
  let code = src;

  // 1. Remove entire interface/type blocks (single-line and multi-line)
  code = code.replace(/^(?:export\s+)?interface\s+\w+[^{]*\{[^}]*\}\s*\n?/gm, "");
  code = code.replace(/^(?:export\s+)?type\s+\w+\s*=\s*[^;\n]+;?\s*\n?/gm, "");

  // 2. Remove import type statements
  code = code.replace(/^import\s+type\s+[^;\n]+;?\s*\n?/gm, "");

  // 3. Remove type annotations from function params and variables
  //    e.g. (x: string, y: number[]) → (x, y)
  //    e.g. const x: string = → const x =
  //    e.g. property?: string | null → property
  code = code.replace(/(\w+)\??\s*:\s*(?:(?:React\.)?[\w<>[\]|&()\s,.]+?)(?=\s*[=;,)\]}])/g, "$1");

  // 4. Remove generic type params from function calls and declarations
  //    e.g. useState<string>("") → useState("")
  //    e.g. Array<MenuItem> → Array
  code = code.replace(/<(?:[^<>]|<[^<>]*>)*>/g, "");

  // 5. Remove "as Type" casts
  code = code.replace(/\s+as\s+[\w[\]|&<>().,\s]+(?=[;,)\]\n}])/g, "");

  // 6. Remove non-null assertions (x! → x)
  code = code.replace(/(\w+|\]|\))!/g, "$1");

  // 7. Clean up empty lines left behind
  code = code.replace(/\n{3,}/g, "\n\n");

  return code;
}

/** Convert a DB project bundle (Next.js files) to Sandpack-compatible React files. */
function convertProjectFilesToSandpack(
  projectFiles: Record<string, string>
): Record<string, string> {
  const pageContent = projectFiles["app/page.tsx"] ?? projectFiles["app/page.js"] ?? "";
  const cssContent = projectFiles["app/globals.css"] ?? projectFiles["styles/globals.css"] ?? "";

  // Strip Next.js-only imports and "use client"
  let appJs = pageContent
    .replace(/^import\s+.*from\s+["']next\/[^"']+["'];?\s*\n?/gm, "")
    .replace(/^import\s+.*from\s+["']@next\/[^"']+["'];?\s*\n?/gm, "")
    .replace(/^"use client";\s*\n?/m, "");

  // Strip all TypeScript syntax
  appJs = stripTypeScript(appJs);

  // Rename exports to App
  appJs = appJs
    .replace(/export\s+default\s+function\s+\w+/g, "export default function App")
    .replace(/export\s+default\s+(?:const|let|var)\s+\w+\s*=\s*/g, "export default function App() { return ");

  // Prepend React import if missing
  if (!appJs.includes("import React")) {
    appJs = `import React from "react";\nimport "./styles.css";\n` + appJs;
  } else {
    appJs = appJs.replace(
      /import\s+React/,
      `import "./styles.css";\nimport React`
    );
  }

  return {
    "/App.js": appJs,
    "/styles.css": cssContent,
  };
}

// ─── Sandpack error boundary ──────────────────────────────────────────────────

interface SandpackErrorBoundaryState {
  hasError: boolean;
}

class SandpackErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  SandpackErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SandpackErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ─── Sandpack live preview ────────────────────────────────────────────────────

function SandpackLivePreview({
  files,
  content,
  onSectionClick,
}: {
  files: Record<string, string> | null;
  content: WebsiteContent;
  onSectionClick?: (section: string) => void;
}) {
  const sandpackFiles = files
    ? convertProjectFilesToSandpack(files)
    : generateFallbackFiles(content);

  return (
    <SandpackErrorBoundary fallback={<StaticSitePreview content={content} onSectionClick={onSectionClick} />}>
      <div style={{ height: "100%", minHeight: "100%" }}>
        <SandpackPreviewDynamic
          files={sandpackFiles}
          theme="dark"
          options={{
            autorun: true,
            autoReload: true,
            recompileMode: "delayed",
            recompileDelay: 500,
          }}
        />
      </div>
    </SandpackErrorBoundary>
  );
}

// ─── Preview panel (toolbar + frame) ─────────────────────────────────────────

function PreviewPanel({
  content,
  onRefresh,
  building = false,
  deployUrl,
  projectFiles,
  onSectionClick,
}: {
  content: WebsiteContent;
  onRefresh: () => void;
  building?: boolean;
  deployUrl?: string | null;
  projectFiles?: Record<string, string> | null;
  onSectionClick?: (section: string) => void;
}) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [editMode, setEditMode] = useState(false);

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
        {deployUrl ? (
          <a
            href={deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center gap-2 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-md px-3 py-1 min-w-0 group"
            title="Apri sito live"
          >
            <span className="text-[11px] text-zinc-300 font-mono truncate select-none group-hover:text-white transition-colors">
              {deployUrl.replace(/^https?:\/\//, "")}
            </span>
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </a>
        ) : (
          <div className="flex-1 flex items-center bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1 min-w-0">
            <span className="text-[11px] text-zinc-500 font-mono truncate select-none">
              tuosito.madecreative.pro
            </span>
          </div>
        )}

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

        {/* Visual Edit Mode toggle */}
        <button
          onClick={() => setEditMode((v) => !v)}
          title={editMode ? "Disattiva modifica visuale" : "Modifica visuale"}
          aria-label={editMode ? "Disattiva modifica visuale" : "Attiva modifica visuale"}
          className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${
            editMode
              ? "bg-indigo-600 text-white"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
        </button>

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
          className={`${frameWidths[device]} h-full transition-all duration-300 overflow-y-auto`}
        >
          <SandpackLivePreview
            files={projectFiles ?? null}
            content={content}
            onSectionClick={editMode ? onSectionClick : undefined}
          />
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
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [projectFiles, setProjectFiles] = useState<Record<string, string> | null>(null);
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
          data?: {
            pages?: WebsiteContent;
            deployUrl?: string | null;
            files?: { files?: Record<string, string> };
          };
          error?: string;
        }) => {
          if (j.success && j.data?.pages) {
            setContent(j.data.pages as WebsiteContent);
          }
          if (j.success && j.data?.deployUrl) {
            setDeployUrl(j.data.deployUrl);
          }
          if (j.success && j.data?.files?.files) {
            setProjectFiles(j.data.files.files);
          }
        }
      )
      .catch(() => {});
  }, []);

  // Non-streaming fallback
  const sendMessageNonStreaming = useCallback(
    async (msg: string) => {
      try {
        const res = await fetch(`${API_URL}/portal/editor/chat`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            message: msg,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        type ChatResponse = {
          success: boolean;
          data?: {
            response: string;
            contentUpdates: Record<string, unknown> | null;
            currentContent: WebsiteContent;
            deployUrl?: string | null;
            credits: Credits;
            cost?: { inputTokens: number; outputTokens: number; totalCost: number };
          };
          error?: string;
        };

        if (res.status === 401) {
          const refreshed = await refreshTokenIfNeeded();
          if (refreshed) {
            const retry = await fetch(`${API_URL}/portal/editor/chat`, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({ message: msg, history: messages.map((m) => ({ role: m.role, content: m.content })) }),
            });
            const retryJson = (await retry.json()) as ChatResponse;
            if (retryJson.success && retryJson.data) {
              const creditCost = credits.remaining - (retryJson.data.credits?.remaining ?? credits.remaining);
              const retryChanges = retryJson.data.contentUpdates ?? {};
              setMessages((prev) => [...prev, {
                role: "assistant",
                content: retryJson.data!.response,
                cost: creditCost > 0 ? creditCost : undefined,
                ...(Object.keys(retryChanges).length > 0 ? { changes: retryChanges } : {}),
              }]);
              if (retryJson.data.currentContent) setContent(retryJson.data.currentContent);
              if (retryJson.data.deployUrl) setDeployUrl(retryJson.data.deployUrl);
              if (retryJson.data.credits) setCredits(retryJson.data.credits);
              return;
            }
          }
          setMessages((prev) => [...prev, { role: "assistant", content: "Sessione scaduta. Effettua il login di nuovo." }]);
          return;
        }

        const json = (await res.json()) as ChatResponse;

        if (!res.ok || !json.success) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: json.error ?? `Errore del server (${res.status}). Riprova tra qualche secondo.` },
          ]);
          return;
        }

        if (json.data) {
          const creditCost = credits.remaining - (json.data.credits?.remaining ?? credits.remaining);
          const changes = json.data.contentUpdates ?? {};
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: json.data!.response,
              cost: creditCost > 0 ? creditCost : undefined,
              ...(Object.keys(changes).length > 0 ? { changes } : {}),
            },
          ]);
          if (json.data.currentContent) setContent(json.data.currentContent);
          if (json.data.deployUrl) setDeployUrl(json.data.deployUrl);
          if (json.data.credits) setCredits(json.data.credits);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Errore di connessione";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Errore di rete: ${errMsg}. Controlla la connessione e riprova.` },
        ]);
      }
    },
    [credits.remaining, messages]
  );

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

      // Index of the assistant message we'll update during streaming
      let assistantMsgIndex = -1;

      try {
        const res = await fetch(`${API_URL}/portal/editor/chat/stream`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            message: msg,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        // Fall back to non-streaming on auth error or no body
        if (res.status === 401) {
          const refreshed = await refreshTokenIfNeeded();
          if (!refreshed) {
            setMessages((prev) => [...prev, { role: "assistant", content: "Sessione scaduta. Effettua il login di nuovo." }]);
            return;
          }
          await sendMessageNonStreaming(msg);
          return;
        }

        if (!res.ok || !res.body) {
          await sendMessageNonStreaming(msg);
          return;
        }

        // Add empty assistant message placeholder
        setMessages((prev) => {
          assistantMsgIndex = prev.length; // user msg is last, assistant will be at length
          return [...prev, { role: "assistant", content: "", streaming: true, tools: [] }];
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantText = "";
        let accumulatedChanges: Record<string, unknown> = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            if (!part.startsWith("data: ")) continue;
            const raw = part.slice(6).trim();
            if (!raw) continue;

            let event: Record<string, unknown>;
            try {
              event = JSON.parse(raw) as Record<string, unknown>;
            } catch {
              continue;
            }

            switch (event.type) {
              case "text_delta": {
                assistantText += event.text as string;
                const captured = assistantText;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = { ...last, content: captured };
                  }
                  return updated;
                });
                break;
              }

              case "tool_start": {
                const toolName = event.toolName as string;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    const tools = [...(last.tools ?? []), { name: toolName, status: "running" as const }];
                    updated[updated.length - 1] = { ...last, tools };
                  }
                  return updated;
                });
                break;
              }

              case "tool_done": {
                const toolName = event.toolName as string;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    const tools = (last.tools ?? []).map((t) =>
                      t.name === toolName && t.status === "running"
                        ? { ...t, status: "done" as const }
                        : t
                    );
                    updated[updated.length - 1] = { ...last, tools };
                  }
                  return updated;
                });
                break;
              }

              case "content_update": {
                const updates = event.updates as Record<string, unknown>;
                setContent((prev) => ({ ...prev, ...updates }));
                accumulatedChanges = { ...accumulatedChanges, ...updates };
                break;
              }

              case "complete": {
                if (event.deployUrl) setDeployUrl(event.deployUrl as string);
                if (event.credits) setCredits(event.credits as Credits);
                break;
              }

              case "error": {
                assistantText = (event.message as string | undefined) ?? "Errore del server. Riprova.";
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = { ...last, content: assistantText };
                  }
                  return updated;
                });
                break;
              }
            }
          }
        }

        // Mark streaming as finished, attach content changes
        const finalChanges = accumulatedChanges;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            const { streaming: _streaming, ...rest } = last;
            void _streaming;
            updated[updated.length - 1] = {
              ...rest,
              ...(Object.keys(finalChanges).length > 0 ? { changes: finalChanges } : {}),
            };
          }
          return updated;
        });
      } catch {
        // Network or parse error — fall back to non-streaming
        // Remove the empty streaming placeholder if it was added
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant" && last.streaming && !last.content) {
            updated.pop();
          }
          return updated;
        });
        await sendMessageNonStreaming(msg);
      } finally {
        setLoading(false);
        textareaRef.current?.focus();
      }
    },
    [input, loading, messages, sendMessageNonStreaming]
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

  const SECTION_LABELS: Record<string, string> = {
    hero: "hero",
    about: "chi siamo",
    services: "servizi",
    menu: "menu",
    gallery: "galleria",
    testimonials: "recensioni",
    contact: "orari e contatti",
  };

  function handleSectionClick(section: string) {
    const label = SECTION_LABELS[section] ?? section;
    const prompt = `Modifica la sezione ${label}: `;
    setInput(prompt);
    // Switch to chat tab on mobile
    setMobileTab("chat");
    // Focus the textarea after a short tick so the tab switch renders first
    setTimeout(() => {
      textareaRef.current?.focus();
      const el = textareaRef.current;
      if (el) {
        el.selectionStart = el.selectionEnd = el.value.length;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 104)}px`;
      }
    }, 50);
  }

  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    if (publishing) return;
    setPublishing(true);
    try {
      const res = await fetch(`${API_URL}/portal/editor`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "deploy" }),
      });
      const json = (await res.json()) as { success: boolean; data?: { deployUrl?: string }; error?: string };
      if (json.success && json.data?.deployUrl) {
        setDeployUrl(json.data.deployUrl);
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `Sito pubblicato con successo! Visita: ${json.data!.deployUrl}`,
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Errore durante la pubblicazione. Riprova.",
      }]);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div
      className="flex flex-col bg-zinc-950"
      style={{ height: "calc(100vh - 56px)" }}
    >
      {/* ── Lovable-style top bar ── */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
        {/* Left: Project name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-100">{projectName}</span>
          </div>

          {/* Mobile tab switcher */}
          <div className="md:hidden flex items-center bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
            <button
              onClick={() => setMobileTab("chat")}
              className={`px-3 py-1 text-[11px] font-medium transition-colors ${
                mobileTab === "chat" ? "bg-indigo-600 text-white" : "text-zinc-500"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setMobileTab("preview")}
              className={`px-3 py-1 text-[11px] font-medium transition-colors ${
                mobileTab === "preview" ? "bg-indigo-600 text-white" : "text-zinc-500"
              }`}
            >
              Preview
            </button>
          </div>

          {/* Desktop: Preview tab indicator */}
          <div className="hidden md:flex items-center gap-1 ml-2">
            <span className="text-[11px] text-zinc-600 border-b-2 border-transparent px-2 py-1">Code</span>
            <span className="text-[11px] text-indigo-400 border-b-2 border-indigo-500 px-2 py-1 font-medium">Preview</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Credits badge */}
          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
            credits.remaining <= Math.ceil(credits.total * 0.15)
              ? "bg-amber-950/40 border-amber-800/50 text-amber-400"
              : "bg-zinc-800 border-zinc-700 text-zinc-300"
          }`}>
            <Coins className="w-3 h-3 text-zinc-500" />
            <span>{credits.remaining}</span>
            <span className="text-zinc-600 font-normal">/ {credits.total}</span>
          </div>

          {/* Undo */}
          <button
            onClick={() => void handleUndo()}
            disabled={undoing || messages.length === 0}
            title="Annulla ultima modifica"
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-30"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          {/* Share */}
          {deployUrl && (
            <button
              onClick={() => { void navigator.clipboard.writeText(deployUrl); }}
              title="Copia link"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* Publish */}
          <button
            onClick={() => void handlePublish()}
            disabled={publishing}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {publishing ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Globe className="w-3 h-3" />
            )}
            Publish
          </button>
        </div>
      </div>

      {/* ── Main split layout ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
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
        <div className="hidden md:flex items-center justify-center w-px bg-zinc-800 flex-shrink-0">
          <div className="w-px h-12 bg-zinc-700 rounded-full" />
        </div>

        {/* Right: Preview */}
        <div
          className={`
            ${mobileTab === "chat" ? "hidden" : "flex"}
            md:flex flex-col flex-1 min-w-0
          `}
          key={refreshKey}
        >
          <PreviewPanel
            content={content}
            onRefresh={handleRefresh}
            building={loading}
            deployUrl={deployUrl}
            projectFiles={projectFiles}
            onSectionClick={handleSectionClick}
          />
        </div>
      </div>
    </div>
  );
}
