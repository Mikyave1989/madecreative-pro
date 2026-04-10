"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Plug,
  Database,
  Mail,
  BarChart3,
  MessageSquare,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DomainStatus {
  domain: string | null;
  verified: boolean;
  dnsRecords: Array<{ type: string; name: string; value: string }>;
}

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  configKey: string;
  placeholder: string;
  helpUrl: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_token");
}

function authHeaders(json = true): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children, icon: Icon }: {
  title: string;
  description: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

// ─── DNS Record row ───────────────────────────────────────────────────────────

function DnsRecord({ type, name, value }: { type: string; name: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/60 border border-slate-700 rounded-xl text-xs">
      <span className="font-mono font-bold text-indigo-400 w-14">{type}</span>
      <span className="font-mono text-slate-300 flex-1 truncate">{name}</span>
      <span className="font-mono text-white flex-1 truncate">{value}</span>
      <button
        onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="p-1 hover:bg-slate-700 rounded transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
      </button>
    </div>
  );
}

// ─── Connector card ───────────────────────────────────────────────────────────

function ConnectorCard({ connector, onSave }: { connector: Connector; onSave: (key: string, value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(connector.configKey, value);
    setSaving(false);
    setOpen(false);
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${connector.color}15`, color: connector.color }}>
          {connector.icon}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-white">{connector.name}</p>
          <p className="text-xs text-slate-400">{connector.description}</p>
        </div>
        {connector.connected ? (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full">Connesso</span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full">Non connesso</span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-700 space-y-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={connector.placeholder}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <div className="flex items-center justify-between">
            <a href={connector.helpUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Come ottenere la chiave
            </a>
            <button
              onClick={() => void save()}
              disabled={!value.trim() || saving}
              className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Salva
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [domain, setDomain] = useState("");
  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);

  const connectors: Connector[] = [
    {
      id: "google_analytics",
      name: "Google Analytics",
      description: "Traccia le visite e il comportamento degli utenti",
      icon: <BarChart3 className="w-4 h-4" />,
      color: "#F9AB00",
      connected: false,
      configKey: "googleAnalyticsId",
      placeholder: "G-XXXXXXXXXX",
      helpUrl: "https://support.google.com/analytics/answer/9539598",
    },
    {
      id: "google_maps",
      name: "Google Maps",
      description: "Mostra la tua posizione con una mappa interattiva",
      icon: <Globe className="w-4 h-4" />,
      color: "#4285F4",
      connected: false,
      configKey: "googleMapsApiKey",
      placeholder: "AIzaSy...",
      helpUrl: "https://developers.google.com/maps/documentation/javascript/get-api-key",
    },
    {
      id: "meta_pixel",
      name: "Meta Pixel",
      description: "Traccia le conversioni da Facebook e Instagram",
      icon: <Database className="w-4 h-4" />,
      color: "#1877F2",
      connected: false,
      configKey: "metaPixelId",
      placeholder: "123456789012345",
      helpUrl: "https://www.facebook.com/business/help/952192354843755",
    },
    {
      id: "custom_email",
      name: "Email personalizzata",
      description: "Usa il tuo dominio email per le notifiche (es. info@tuodominio.it)",
      icon: <Mail className="w-4 h-4" />,
      color: "#EA4335",
      connected: false,
      configKey: "customEmailFrom",
      placeholder: "info@tuodominio.it",
      helpUrl: "https://resend.com/docs/send-with-custom-domain",
    },
    {
      id: "tawk_to",
      name: "Tawk.to / Crisp",
      description: "Livechat alternativa al chatbot AI",
      icon: <MessageSquare className="w-4 h-4" />,
      color: "#03C75A",
      connected: false,
      configKey: "livechatWidgetId",
      placeholder: "Widget ID o snippet code",
      helpUrl: "https://www.tawk.to/knowledgebase/getting-started/adding-a-widget-to-your-website/",
    },
    {
      id: "ssl_custom",
      name: "SSL Certificato custom",
      description: "Usa un certificato SSL personalizzato per il tuo dominio",
      icon: <Shield className="w-4 h-4" />,
      color: "#10B981",
      connected: false,
      configKey: "customSslCert",
      placeholder: "Certificato fornito automaticamente con il dominio",
      helpUrl: "https://vercel.com/docs/security/encryption",
    },
  ];

  async function handleAddDomain() {
    if (!domain.trim() || addingDomain) return;
    setAddingDomain(true);
    setDomainError(null);

    try {
      const res = await fetch(`${API_URL}/portal/settings/domain`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const json = await res.json() as { success: boolean; data?: DomainStatus; error?: string };
      if (!json.success) throw new Error(json.error ?? "Errore");
      setDomainStatus(json.data ?? null);
    } catch (e) {
      setDomainError(e instanceof Error ? e.message : "Errore nella configurazione del dominio");
    } finally {
      setAddingDomain(false);
    }
  }

  async function handleSaveConnector(key: string, value: string) {
    try {
      await fetch(`${API_URL}/portal/settings/connectors`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ key, value }),
      });
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-white">Impostazioni</h2>
        <p className="text-sm text-slate-400 mt-1">Dominio personalizzato, integrazioni e connettori</p>
      </div>

      {/* ─── Custom Domain ─────────────────────────────────────────────── */}
      <Section
        title="Dominio personalizzato"
        description="Connetti il tuo dominio al sito (es. www.tuodominio.it)"
        icon={Globe}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="www.tuodominio.it"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            onKeyDown={(e) => { if (e.key === "Enter") void handleAddDomain(); }}
          />
          <button
            onClick={() => void handleAddDomain()}
            disabled={!domain.trim() || addingDomain}
            className="px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {addingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Connetti
          </button>
        </div>

        {domainError && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">{domainError}</p>
          </div>
        )}

        {domainStatus && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-300">Configura i record DNS</p>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Aggiungi questi record nel pannello DNS del tuo provider di dominio (GoDaddy, Namecheap, Aruba, ecc.)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {domainStatus.dnsRecords.map((r, i) => (
                <DnsRecord key={i} type={r.type} name={r.name} value={r.value} />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {domainStatus.verified ? (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Dominio verificato e attivo
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  Dopo aver configurato i DNS, la verifica avviene automaticamente entro 24h.
                </span>
              )}
            </div>
          </div>
        )}

        {!domainStatus && (
          <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
            <p className="text-xs text-slate-400">
              Il tuo sito e attualmente su <span className="text-indigo-400 font-mono">tuonome.madecreative.pro</span>. Connetti un dominio personalizzato per un aspetto piu professionale.
            </p>
          </div>
        )}
      </Section>

      {/* ─── Connectors ────────────────────────────────────────────────── */}
      <Section
        title="Integrazioni e Connettori"
        description="Collega servizi esterni al tuo sito"
        icon={Plug}
      >
        <div className="space-y-2">
          {connectors.map((c) => (
            <ConnectorCard key={c.id} connector={c} onSave={handleSaveConnector} />
          ))}
        </div>
      </Section>
    </div>
  );
}
