"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  Upload,
  Loader2,
  AlertCircle,
  Rocket,
  Phone,
  Mail,
  MapPin,
  Clock,
  ImageIcon,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HoursEntry {
  open: string;
  close: string;
  closed: boolean;
}

type DayKey = "lun" | "mar" | "mer" | "gio" | "ven" | "sab" | "dom";

interface WebsiteContent {
  heroText: string;
  heroDescription: string;
  phone: string;
  email: string;
  address: string;
  hours: Record<DayKey, HoursEntry>;
  heroImageUrl: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

const DAY_LABELS: Record<DayKey, string> = {
  lun: "Lunedi",
  mar: "Martedi",
  mer: "Mercoledi",
  gio: "Giovedi",
  ven: "Venerdi",
  sab: "Sabato",
  dom: "Domenica",
};

const DAY_KEYS: DayKey[] = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

const DEFAULT_CONTENT: WebsiteContent = {
  heroText: "",
  heroDescription: "",
  phone: "",
  email: "",
  address: "",
  heroImageUrl: null,
  hours: {
    lun: { open: "09:00", close: "18:00", closed: false },
    mar: { open: "09:00", close: "18:00", closed: false },
    mer: { open: "09:00", close: "18:00", closed: false },
    gio: { open: "09:00", close: "18:00", closed: false },
    ven: { open: "09:00", close: "18:00", closed: false },
    sab: { open: "09:00", close: "13:00", closed: false },
    dom: { open: "09:00", close: "13:00", closed: true },
  },
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("portal_token");
}

// ─── Inline editable field ────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing, value]);

  function confirm() {
    onChange(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      </div>

      {editing ? (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full bg-slate-800 border border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              onKeyDown={(e) => {
                if (e.key === "Escape") cancel();
              }}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-slate-800 border border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") confirm();
                if (e.key === "Escape") cancel();
              }}
            />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={confirm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Salva
            </button>
            <button
              onClick={cancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full text-left group/field flex items-start justify-between gap-3 px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl hover:border-slate-600 hover:bg-slate-800 transition-all"
        >
          <span className={`text-sm ${value ? "text-white" : "text-slate-600"} leading-relaxed`}>
            {value || placeholder || "Clicca per modificare"}
          </span>
          <Pencil className="w-3.5 h-3.5 text-slate-600 group-hover/field:text-indigo-400 flex-shrink-0 mt-0.5 transition-colors" />
        </button>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 space-y-5 border-t border-slate-800">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Hours editor ─────────────────────────────────────────────────────────────

function HoursEditor({
  hours,
  onChange,
}: {
  hours: Record<DayKey, HoursEntry>;
  onChange: (hours: Record<DayKey, HoursEntry>) => void;
}) {
  function updateDay(day: DayKey, field: keyof HoursEntry, value: string | boolean) {
    onChange({
      ...hours,
      [day]: { ...hours[day], [field]: value },
    });
  }

  return (
    <div className="space-y-2">
      {DAY_KEYS.map((day) => {
        const entry = hours[day];
        return (
          <div key={day} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 w-10 uppercase">{day}</span>
            <button
              onClick={() => updateDay(day, "closed", !entry.closed)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                !entry.closed ? "bg-indigo-600" : "bg-slate-700"
              }`}
              aria-label={entry.closed ? "Chiuso" : "Aperto"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  !entry.closed ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            {entry.closed ? (
              <span className="text-xs text-slate-600 flex-1">Chiuso</span>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={entry.open}
                  onChange={(e) => updateDay(day, "open", e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 w-[90px]"
                />
                <span className="text-slate-600 text-xs">—</span>
                <input
                  type="time"
                  value={entry.close}
                  onChange={(e) => updateDay(day, "close", e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 w-[90px]"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [rebuildStatus, setRebuildStatus] = useState<"idle" | "queued">("idle");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadContent();
  }, []);

  async function loadContent() {
    setLoading(true);
    setLoadError(null);
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/portal/website/content`, { headers });
      const json = (await res.json()) as { success: boolean; data?: WebsiteContent; error?: string };

      if (!json.success) throw new Error(json.error ?? "Errore di caricamento");
      setContent({ ...DEFAULT_CONTENT, ...json.data });
    } catch {
      // Use defaults silently — API may not be live yet
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof WebsiteContent>(key: K, value: WebsiteContent[K]) {
    setContent((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("idle");
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const token = getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Upload image first if selected
      let heroImageUrl = content.heroImageUrl;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch(`${API_URL}/portal/files/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        const uploadJson = (await uploadRes.json()) as {
          success: boolean;
          data?: { urls: string[] };
          error?: string;
        };
        if (uploadJson.success && uploadJson.data?.urls[0]) {
          heroImageUrl = uploadJson.data.urls[0];
        }
      }

      const payload = { ...content, heroImageUrl };
      const res = await fetch(`${API_URL}/portal/website/pages`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Errore nel salvataggio");

      setContent(payload);
      setImageFile(null);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRebuild() {
    if (rebuilding) return;
    setRebuilding(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/portal/website/rebuild`, {
        method: "POST",
        headers,
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Errore");

      setRebuildStatus("queued");
    } catch {
      // show generic error inline
    } finally {
      setRebuilding(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setSaveStatus("idle");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-400">{loadError}</p>
        <button
          onClick={() => void loadContent()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Editor sito</h2>
          <p className="text-sm text-slate-400 mt-1">
            Modifica i contenuti del tuo sito. Non puoi cambiare layout, colori o font.
          </p>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="flex items-start gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-400">
          Puoi modificare testi, foto, contatti e orari. Layout, colori e font sono gestiti dal team madecreative.
        </p>
      </div>

      {/* Hero section */}
      <Section title="Sezione Hero">
        <EditableField
          label="Titolo principale"
          value={content.heroText}
          onChange={(v) => update("heroText", v)}
          placeholder="es. Il miglior ristorante di Milano"
        />
        <EditableField
          label="Descrizione"
          value={content.heroDescription}
          onChange={(v) => update("heroDescription", v)}
          placeholder="es. Cucina tradizionale italiana dal 1985"
          multiline
        />

        {/* Hero image upload */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Foto hero
            </label>
          </div>
          <div
            className="relative flex flex-col items-center justify-center gap-3 p-6 bg-slate-800/60 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-slate-800 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview || content.heroImageUrl ? (
              <div className="relative w-full">
                <img
                  src={imagePreview ?? content.heroImageUrl!}
                  alt="Hero preview"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Cambia foto
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-300 font-medium">Carica una foto</p>
                  <p className="text-xs text-slate-500 mt-0.5">PNG, JPG fino a 10MB</p>
                </div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          {imageFile && (
            <p className="text-xs text-indigo-400 mt-1.5 flex items-center gap-1">
              <Check className="w-3 h-3" />
              {imageFile.name} — verra caricata al salvataggio
            </p>
          )}
        </div>
      </Section>

      {/* About / Descrizione */}
      <Section title="Chi siamo" defaultOpen={false}>
        <EditableField
          label="Testo presentazione"
          value={content.heroDescription}
          onChange={(v) => update("heroDescription", v)}
          placeholder="es. Siamo un team di professionisti dedicati alla tua crescita..."
          multiline
        />
      </Section>

      {/* Contatti */}
      <Section title="Contatti" defaultOpen={false}>
        <EditableField
          label="Telefono"
          value={content.phone}
          onChange={(v) => update("phone", v)}
          placeholder="+39 02 1234567"
          icon={Phone}
        />
        <EditableField
          label="Email"
          value={content.email}
          onChange={(v) => update("email", v)}
          placeholder="info@esempio.it"
          icon={Mail}
        />
        <EditableField
          label="Indirizzo"
          value={content.address}
          onChange={(v) => update("address", v)}
          placeholder="Via Roma 1, 20100 Milano"
          icon={MapPin}
        />
      </Section>

      {/* Orari */}
      <Section title="Orari di apertura" defaultOpen={false}>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <p className="text-xs text-slate-400">Attiva/disattiva ogni giorno e imposta gli orari</p>
        </div>
        <HoursEditor
          hours={content.hours}
          onChange={(h) => update("hours", h)}
        />
      </Section>

      {/* Actions bar */}
      <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800 -mx-6 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <Check className="w-4 h-4" />
              Modifiche salvate
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1.5 text-sm text-red-400">
              <AlertCircle className="w-4 h-4" />
              Errore nel salvataggio
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saving ? "Salvataggio..." : "Salva modifiche"}
          </button>

          {rebuildStatus === "queued" ? (
            <div className="flex-1 sm:flex-none flex items-center gap-2 px-5 py-2.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold rounded-xl">
              <Rocket className="w-4 h-4" />
              Live in 2 minuti
            </div>
          ) : (
            <button
              onClick={() => void handleRebuild()}
              disabled={rebuilding}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rebuilding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              {rebuilding ? "Avvio..." : "Pubblica sito"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
