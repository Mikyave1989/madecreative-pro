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
  Plus,
  Trash2,
  MessageCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HoursEntry {
  open: string;
  close: string;
  closed: boolean;
}

type DayKey = "lun" | "mar" | "mer" | "gio" | "ven" | "sab" | "dom";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  category: string;
}

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
}

interface WebsiteContent {
  heroText: string;
  heroDescription: string;
  phone: string;
  email: string;
  address: string;
  hours: Record<DayKey, HoursEntry>;
  heroImageUrl: string | null;
  whatsappNumber: string;
  menuItems: MenuItem[];
  galleryPhotos: GalleryPhoto[];
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
  whatsappNumber: "",
  menuItems: [],
  galleryPhotos: [],
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

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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
              onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
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
                if (e.key === "Enter") { onChange(draft); setEditing(false); }
                if (e.key === "Escape") { setDraft(value); setEditing(false); }
              }}
            />
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => { onChange(draft); setEditing(false); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition-colors">
              <Check className="w-3.5 h-3.5" /> Salva
            </button>
            <button onClick={() => { setDraft(value); setEditing(false); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-600 transition-colors">
              <X className="w-3.5 h-3.5" /> Annulla
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

function Section({ title, children, defaultOpen = true, badge }: { title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{title}</span>
          {badge && <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600/20 text-indigo-400 rounded-full">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-6 pb-6 pt-2 space-y-5 border-t border-slate-800">{children}</div>}
    </div>
  );
}

// ─── Hours editor ─────────────────────────────────────────────────────────────

function HoursEditor({ hours, onChange }: { hours: Record<DayKey, HoursEntry>; onChange: (h: Record<DayKey, HoursEntry>) => void }) {
  function updateDay(day: DayKey, field: keyof HoursEntry, value: string | boolean) {
    onChange({ ...hours, [day]: { ...hours[day], [field]: value } });
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
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${!entry.closed ? "bg-indigo-600" : "bg-slate-700"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${!entry.closed ? "translate-x-4" : "translate-x-0"}`} />
            </button>
            {entry.closed ? (
              <span className="text-xs text-slate-600 flex-1">Chiuso</span>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <input type="time" value={entry.open} onChange={(e) => updateDay(day, "open", e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 w-[90px]" />
                <span className="text-slate-600 text-xs">—</span>
                <input type="time" value={entry.close} onChange={(e) => updateDay(day, "close", e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 w-[90px]" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Menu Item Editor ─────────────────────────────────────────────────────────

function MenuItemEditor({ item, onUpdate, onDelete }: { item: MenuItem; onUpdate: (item: MenuItem) => void; onDelete: () => void }) {
  return (
    <div className="flex gap-4 p-4 bg-slate-800/60 border border-slate-700 rounded-xl">
      {/* Photo */}
      <div className="w-20 h-20 bg-slate-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-5 h-5 text-slate-500" />
        )}
      </div>
      {/* Fields */}
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={item.name}
            onChange={(e) => onUpdate({ ...item, name: e.target.value })}
            placeholder="Nome prodotto/piatto"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            value={item.price}
            onChange={(e) => onUpdate({ ...item, price: e.target.value })}
            placeholder="€ 0.00"
            className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <input
          type="text"
          value={item.description}
          onChange={(e) => onUpdate({ ...item, description: e.target.value })}
          placeholder="Descrizione breve (opzionale)"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={item.category}
            onChange={(e) => onUpdate({ ...item, category: e.target.value })}
            placeholder="Categoria (es. Antipasti, Primi...)"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
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

  useEffect(() => { void loadContent(); }, []);

  async function loadContent() {
    setLoading(true);
    setLoadError(null);
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/portal/website/content`, { headers });
      const json = (await res.json()) as { success: boolean; data?: WebsiteContent; error?: string };
      if (!json.success) throw new Error(json.error ?? "Errore");
      setContent({ ...DEFAULT_CONTENT, ...json.data });
    } catch {
      // defaults
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof WebsiteContent>(key: K, value: WebsiteContent[K]) {
    setContent((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("idle");
  }

  function addMenuItem() {
    const item: MenuItem = { id: generateId(), name: "", description: "", price: "", imageUrl: null, category: "" };
    update("menuItems", [...content.menuItems, item]);
  }

  function updateMenuItem(id: string, updated: MenuItem) {
    update("menuItems", content.menuItems.map((m) => (m.id === id ? updated : m)));
  }

  function deleteMenuItem(id: string) {
    update("menuItems", content.menuItems.filter((m) => m.id !== id));
  }

  function addGalleryPhoto() {
    const photo: GalleryPhoto = { id: generateId(), url: "", caption: "" };
    update("galleryPhotos", [...content.galleryPhotos, photo]);
  }

  function deleteGalleryPhoto(id: string) {
    update("galleryPhotos", content.galleryPhotos.filter((p) => p.id !== id));
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let heroImageUrl = content.heroImageUrl;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch(`${API_URL}/portal/files/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        const uploadJson = (await uploadRes.json()) as { success: boolean; data?: { urls: string[] }; error?: string };
        if (uploadJson.success && uploadJson.data?.urls[0]) heroImageUrl = uploadJson.data.urls[0];
      }

      const payload = { ...content, heroImageUrl };
      const res = await fetch(`${API_URL}/portal/website/pages`, { method: "PATCH", headers, body: JSON.stringify(payload) });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Errore");

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
      const res = await fetch(`${API_URL}/portal/website/rebuild`, { method: "POST", headers });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Errore");
      setRebuildStatus("queued");
    } catch {
      // error
    } finally {
      setRebuilding(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setSaveStatus("idle");
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-400">{loadError}</p>
        <button onClick={() => void loadContent()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg">Riprova</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Editor sito</h2>
          <p className="text-sm text-slate-400 mt-1">Modifica contenuti, menu, foto e impostazioni del tuo sito.</p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-400">
          Modifica testi, foto, menu/listino, contatti e orari. Dopo le modifiche, clicca &quot;Salva&quot; e poi &quot;Pubblica&quot; per aggiornare il sito.
        </p>
      </div>

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <Section title="Sezione Hero">
        <EditableField label="Titolo principale" value={content.heroText} onChange={(v) => update("heroText", v)} placeholder="es. Il miglior ristorante di Milano" />
        <EditableField label="Descrizione" value={content.heroDescription} onChange={(v) => update("heroDescription", v)} placeholder="es. Cucina tradizionale italiana dal 1985" multiline />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Foto hero</label>
          </div>
          <div className="relative flex flex-col items-center justify-center gap-3 p-6 bg-slate-800/60 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 transition-all" onClick={() => fileInputRef.current?.click()}>
            {imagePreview || content.heroImageUrl ? (
              <div className="relative w-full">
                <img src={imagePreview ?? content.heroImageUrl!} alt="Hero" className="w-full h-40 object-cover rounded-lg" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> Cambia foto</span>
                </div>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center"><Upload className="w-5 h-5 text-slate-400" /></div>
                <div className="text-center"><p className="text-sm text-slate-300 font-medium">Carica una foto</p><p className="text-xs text-slate-500 mt-0.5">PNG, JPG fino a 10MB</p></div>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>
        </div>
      </Section>

      {/* ─── WhatsApp ──────────────────────────────────────────────────────── */}
      <Section title="WhatsApp" badge="Nuovo">
        <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-2">
          <MessageCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-emerald-300">
            Inserisci il tuo numero WhatsApp e un pulsante verde apparira automaticamente sul tuo sito. I clienti potranno contattarti con un click.
          </p>
        </div>
        <EditableField
          label="Numero WhatsApp"
          value={content.whatsappNumber}
          onChange={(v) => update("whatsappNumber", v)}
          placeholder="+39 333 1234567 (con prefisso internazionale)"
          icon={Phone}
        />
        {content.whatsappNumber && (
          <div className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
            <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-white font-medium">Preview: pulsante WhatsApp attivo</p>
              <p className="text-xs text-slate-400">I visitatori vedranno questo pulsante in basso a destra</p>
            </div>
          </div>
        )}
      </Section>

      {/* ─── Menu / Listino ────────────────────────────────────────────────── */}
      <Section title="Menu / Listino Prezzi" badge={content.menuItems.length > 0 ? `${content.menuItems.length} prodotti` : undefined} defaultOpen={false}>
        <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 mb-2">
          <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-indigo-300">
            Aggiungi i tuoi prodotti, piatti o servizi con nome, prezzo e descrizione. Verranno mostrati come pagina dedicata sul tuo sito.
          </p>
        </div>

        <div className="space-y-3">
          {content.menuItems.map((item) => (
            <MenuItemEditor
              key={item.id}
              item={item}
              onUpdate={(updated) => updateMenuItem(item.id, updated)}
              onDelete={() => deleteMenuItem(item.id)}
            />
          ))}
        </div>

        <button
          onClick={addMenuItem}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-slate-700 rounded-xl text-sm text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Aggiungi prodotto
        </button>
      </Section>

      {/* ─── Galleria Foto ─────────────────────────────────────────────────── */}
      <Section title="Galleria Foto" badge={content.galleryPhotos.length > 0 ? `${content.galleryPhotos.length} foto` : undefined} defaultOpen={false}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {content.galleryPhotos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex items-center justify-center">
                {photo.url ? (
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <button
                onClick={() => deleteGalleryPhoto(photo.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <input
                type="text"
                value={photo.caption}
                onChange={(e) => update("galleryPhotos", content.galleryPhotos.map((p) => p.id === photo.id ? { ...p, caption: e.target.value } : p))}
                placeholder="Didascalia"
                className="mt-1 w-full bg-transparent border-none text-xs text-slate-400 placeholder-slate-600 focus:outline-none"
              />
            </div>
          ))}
          <button
            onClick={addGalleryPhoto}
            className="aspect-square border border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs">Aggiungi</span>
          </button>
        </div>
      </Section>

      {/* ─── Contatti ──────────────────────────────────────────────────────── */}
      <Section title="Contatti" defaultOpen={false}>
        <EditableField label="Telefono" value={content.phone} onChange={(v) => update("phone", v)} placeholder="+39 02 1234567" icon={Phone} />
        <EditableField label="Email" value={content.email} onChange={(v) => update("email", v)} placeholder="info@esempio.it" icon={Mail} />
        <EditableField label="Indirizzo" value={content.address} onChange={(v) => update("address", v)} placeholder="Via Roma 1, 20100 Milano" icon={MapPin} />
      </Section>

      {/* ─── Orari ─────────────────────────────────────────────────────────── */}
      <Section title="Orari di apertura" defaultOpen={false}>
        <HoursEditor hours={content.hours} onChange={(h) => update("hours", h)} />
      </Section>

      {/* ─── Action bar ────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-20 -mx-4 px-4 py-4 bg-slate-950/90 backdrop-blur-sm border-t border-slate-800">
        <div className="flex items-center gap-3 max-w-3xl">
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Salvataggio..." : saveStatus === "saved" ? "Salvato!" : "Salva modifiche"}
          </button>
          <button
            onClick={() => void handleRebuild()}
            disabled={rebuilding || rebuildStatus === "queued"}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {rebuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            {rebuildStatus === "queued" ? "In coda..." : "Pubblica"}
          </button>
        </div>
        {saveStatus === "error" && <p className="text-xs text-red-400 mt-2">Errore nel salvataggio. Riprova.</p>}
      </div>
    </div>
  );
}
