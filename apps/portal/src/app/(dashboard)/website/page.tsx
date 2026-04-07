"use client";

import { useState } from "react";
import {
  ExternalLink,
  Globe,
  Construction,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Clock,
  Send,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FileUpload } from "@/components/ui/FileUpload";
import { mockWebsite, type WebsiteStatus } from "@/lib/mockData";

// --- Lighthouse circle ---
function LighthouseCircle({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const color =
    score >= 90
      ? "#22c55e"
      : score >= 70
      ? "#f59e0b"
      : "#ef4444";

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="6"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900 tabular-nums">
          {score}
        </span>
      </div>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
    </div>
  );
}

// --- Website status badge ---
function WebsiteStatusBadge({ status }: { status: WebsiteStatus }) {
  if (status === "LIVE")
    return <Badge label="Live" variant="green" dot />;
  if (status === "BUILDING")
    return <Badge label="In costruzione" variant="yellow" dot />;
  return <Badge label="Manutenzione" variant="gray" dot />;
}

// --- Change request types ---
const changeTypes = [
  { value: "testo", label: "Testo / Contenuto" },
  { value: "foto", label: "Foto / Immagini" },
  { value: "orari", label: "Orari di apertura" },
  { value: "contatti", label: "Contatti / Indirizzo" },
  { value: "altro", label: "Altro" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function WebsitePage() {
  const website = mockWebsite;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [changeType, setChangeType] = useState("testo");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmitChange(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Inserisci una descrizione della modifica");
      return;
    }
    setSubmitting(true);
    try {
      // In produzione: await requestSiteChange(website.id, description, attachments)
      await new Promise((r) => setTimeout(r, 1200));
      toast.success(
        "Richiesta inviata! La modifica sara completata entro 4 ore."
      );
      setDrawerOpen(false);
      setDescription("");
      setFiles([]);
      setChangeType("testo");
    } catch {
      toast.error("Errore nell'invio della richiesta. Riprova.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Il Mio Sito</h2>
          <p className="text-sm text-gray-500 mt-1">
            Panoramica, performance e gestione del tuo sito web
          </p>
        </div>
        <Button
          onClick={() => setDrawerOpen(true)}
          icon={<Send className="w-4 h-4" />}
          iconPosition="left"
        >
          Richiedi modifica
        </Button>
      </div>

      {/* Main content */}
      {website.status === "BUILDING" ? (
        <BuildingState progress={website.buildProgress} domain={website.domain} />
      ) : (
        <>
          {/* Screenshot + info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Screenshot — 2/3 */}
            <Card className="lg:col-span-2" padding="none">
              <div className="relative bg-gray-100 rounded-t-xl overflow-hidden aspect-video flex items-center justify-center">
                {website.screenshotUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={website.screenshotUrl}
                    alt={`Screenshot di ${website.domain}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Globe className="w-16 h-16 opacity-30" />
                    <p className="text-sm">
                      Anteprima non disponibile
                    </p>
                  </div>
                )}
              </div>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{website.domain}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Attivato il {formatDate(website.activatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <WebsiteStatusBadge status={website.status} />
                  <a
                    href={`https://${website.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Visita il sito
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </Card>

            {/* Info sito — 1/3 */}
            <Card padding="md">
              <CardHeader title="Info sito" />
              <dl className="space-y-4">
                <InfoRow label="Dominio" value={website.domain} />
                <InfoRow
                  label="Status"
                  value={<WebsiteStatusBadge status={website.status} />}
                />
                <InfoRow
                  label="Attivazione"
                  value={formatDate(website.activatedAt)}
                />
                <InfoRow
                  label="Pannello Analytics"
                  value={
                    <a
                      href={website.plausibleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      Apri Plausible
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  }
                />
              </dl>
            </Card>
          </div>

          {/* Lighthouse */}
          <Card padding="md">
            <CardHeader
              title="Lighthouse Score"
              subtitle="Misurato su Google PageSpeed — dati aggiornati ogni settimana"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <LighthouseCircle
                score={website.lighthouse.performance}
                label="Performance"
              />
              <LighthouseCircle
                score={website.lighthouse.accessibility}
                label="Accessibilita"
              />
              <LighthouseCircle
                score={website.lighthouse.seo}
                label="SEO"
              />
              <LighthouseCircle
                score={website.lighthouse.bestPractices}
                label="Best Practices"
              />
            </div>
            <div className="mt-4 flex items-center gap-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                90–100: Ottimo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                70–89: Migliorabile
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                0–69: Critico
              </span>
            </div>
          </Card>

          {/* Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KPI analytics */}
            <div className="grid grid-cols-1 gap-4">
              <AnalyticsKpi
                label="Visite (7 giorni)"
                value={website.analytics.visite7d.toLocaleString("it-IT")}
                icon={<BarChart2 className="w-4 h-4" />}
              />
              <AnalyticsKpi
                label="Bounce rate"
                value={`${website.analytics.bounceRate}%`}
                icon={<AlertCircle className="w-4 h-4" />}
                note="Meno e meglio"
              />
              <AnalyticsKpi
                label="Durata media sessione"
                value={website.analytics.sessionAvg}
                icon={<Clock className="w-4 h-4" />}
              />
            </div>

            {/* Bar chart 7 giorni */}
            <Card className="lg:col-span-2" padding="md">
              <CardHeader
                title="Visite ultimi 7 giorni"
                subtitle="Dati Plausible Analytics"
              />
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={website.analytics.chart7d}
                    margin={{ top: 0, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                      }}
                      cursor={{ fill: "#f8fafc" }}
                    />
                    <Bar
                      dataKey="visite"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      name="Visite"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Change request drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Richiedi modifica"
        subtitle="La modifica sara completata entro 4 ore lavorative"
      >
        <form onSubmit={handleSubmitChange} className="space-y-6">
          {/* Info banner */}
          <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-700">
              Le modifiche vengono gestite dal nostro team entro{" "}
              <strong>4 ore lavorative</strong>. Riceverai una notifica via email
              al completamento.
            </p>
          </div>

          {/* Tipo modifica */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo di modifica
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {changeTypes.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setChangeType(ct.value)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors text-left ${
                    changeType === ct.value
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descrizione */}
          <div>
            <label
              htmlFor="change-description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Descrizione <span className="text-red-500">*</span>
            </label>
            <textarea
              id="change-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi in dettaglio la modifica che vorresti apportare al tuo sito..."
              rows={5}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allegati (opzionale)
            </label>
            <FileUpload
              onFilesChange={setFiles}
              accept="image/*,.pdf"
              maxFiles={5}
              maxSizeMb={10}
              label="Aggiungi immagini o PDF di riferimento"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitting}
              icon={<Send className="w-4 h-4" />}
            >
              Invia richiesta
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

// --- Helper components ---

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function AnalyticsKpi({
  label,
  value,
  icon,
  note,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  note?: string;
}) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-indigo-500">{icon}</span>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
    </Card>
  );
}

function BuildingState({
  progress,
  domain,
}: {
  progress: number;
  domain: string;
}) {
  return (
    <Card padding="lg">
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="p-5 bg-amber-50 rounded-full">
          <Construction className="w-12 h-12 text-amber-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Il tuo sito e in costruzione
          </h3>
          <p className="text-gray-500 mt-2 max-w-md">
            Il nostro team sta lavorando al tuo sito{" "}
            <strong>{domain}</strong>. Riceverai una notifica non appena sara
            online.
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Completamento</span>
            <span className="font-semibold text-gray-900 tabular-nums">
              {progress}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>Consegna stimata: entro 5 giorni lavorativi</span>
        </div>
      </div>
    </Card>
  );
}
