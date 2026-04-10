"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type KeyboardEvent,
} from "react";
import {
  Rocket,
  Activity,
  MailOpen,
  Trash2,
  RefreshCw,
  AlertTriangle,
  X,
  Plus,
  Play,
  Zap,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import {
  startScrape,
  getScrapeConfigs,
  deleteScrapeConfig,
  bulkAnalyze,
  buildPreview,
  sendOutreach,
  getOutreachStats,
  getAgentJobs,
  getProspects,
  type ScrapeConfig,
  type OutreachStats,
  type AgentJob,
  type AgentType,
  type JobStatus,
} from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────────────────

const COUNTRY_MAP: Record<string, string> = {
  DE: "Germania",
  AT: "Austria",
  CH: "Svizzera",
  IT: "Italia",
  FR: "Francia",
  ES: "Spagna",
  NL: "Paesi Bassi",
  BE: "Belgio",
  PL: "Polonia",
};

const COUNTRY_CODES = Object.keys(COUNTRY_MAP) as Array<keyof typeof COUNTRY_MAP>;

const SECTORS = [
  "restaurant",
  "dental",
  "legal",
  "fitness",
  "beauty",
  "hotel",
  "ecommerce",
  "realestate",
  "medical",
  "professional",
  "retail",
  "automotive",
  "education",
  "finance",
  "other",
] as const;

type Tab = "launch" | "monitor" | "stats";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "launch", label: "Launch Campaign", icon: Rocket },
  { id: "monitor", label: "Monitor", icon: Activity },
  { id: "stats", label: "Outreach Stats", icon: MailOpen },
];

// ─── Agent / Job Display Maps ──────────────────────────────────

const AGENT_COLOR: Record<AgentType, string> = {
  SCRAPER: "#00f0ff",
  ANALYZER: "#a855f7",
  BUILDER: "#f59e0b",
  OUTREACH: "#10b981",
  QA: "#ef4444",
};

const JOB_STATUS_BADGE: Record<
  JobStatus,
  "cyan" | "violet" | "amber" | "green" | "red" | "gray"
> = {
  QUEUED: "gray",
  RUNNING: "cyan",
  COMPLETED: "green",
  FAILED: "red",
  CANCELLED: "gray",
};

// ─── Toast ─────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-3 font-mono-tech text-xs uppercase tracking-wider shadow-lg",
            "animate-[fadeInUp_0.25s_ease-out]",
            t.type === "success"
              ? "border-neon-cyan/40 bg-bg-card text-neon-cyan"
              : "border-neon-red/40 bg-bg-card text-neon-red"
          )}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      const id = ++counterRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  return { toasts, addToast };
}

// ─── Skeleton ──────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-slate-800/60", className)}
      aria-hidden="true"
    />
  );
}

// ─── Error Banner ──────────────────────────────────────────────

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-neon-red/30 bg-neon-red/5 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-neon-red" />
      <p className="flex-1 font-mono-tech text-xs text-neon-red">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded border border-neon-red/30 px-3 py-1 font-mono-tech text-[10px] uppercase tracking-wider text-neon-red transition-colors hover:border-neon-red/60 hover:bg-neon-red/10"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </button>
    </div>
  );
}

// ─── Tag Input ─────────────────────────────────────────────────

interface TagInputProps {
  label: string;
  tags: string[];
  placeholder?: string;
  onChange: (tags: string[]) => void;
}

function TagInput({ label, tags, placeholder, onChange }: TagInputProps) {
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <div className="min-h-9 w-full rounded border border-border-subtle bg-bg-elevated px-3 py-1.5 transition-all duration-200 focus-within:border-neon-cyan/60 focus-within:shadow-neon-cyan">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 font-mono-tech text-[10px] text-neon-cyan"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="hover:text-white transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={input}
            placeholder={tags.length === 0 ? (placeholder ?? "Type and press Enter") : ""}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addTag}
            className="min-w-24 flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
          />
        </div>
      </div>
      <p className="font-mono-tech text-[10px] text-slate-700">
        Press Enter to add a tag
      </p>
    </div>
  );
}

// ─── Country Checkboxes ────────────────────────────────────────

interface CountrySelectProps {
  selected: string[];
  onChange: (codes: string[]) => void;
}

function CountrySelect({ selected, onChange }: CountrySelectProps) {
  function toggle(code: string) {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-400">
        Countries
      </span>
      <div className="flex flex-wrap gap-2">
        {COUNTRY_CODES.map((code) => {
          const active = selected.includes(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              aria-pressed={active}
              className={cn(
                "rounded border px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-wider transition-all duration-200",
                active
                  ? "border-neon-cyan/60 bg-neon-cyan/15 text-neon-cyan shadow-[0_0_8px_#00f0ff30]"
                  : "border-border-subtle bg-bg-elevated text-slate-500 hover:border-slate-500 hover:text-slate-300"
              )}
            >
              {code} — {COUNTRY_MAP[code]}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="font-mono-tech text-[10px] text-neon-red">
          Select at least one country
        </p>
      )}
    </div>
  );
}

// ─── ═══════════════════════════════════════════════════════════
// ─── TAB 1: Launch Campaign ────────────────────────────────────
// ─── ═══════════════════════════════════════════════════════════

interface LaunchFormState {
  name: string;
  sector: string;
  countries: string[];
  cities: string;
  keywords: string[];
  maxResults: number;
  minRating: string;
}

const LAUNCH_FORM_DEFAULT: LaunchFormState = {
  name: "",
  sector: "",
  countries: [],
  cities: "",
  keywords: [],
  maxResults: 100,
  minRating: "",
};

interface LaunchTabProps {
  addToast: (message: string, type?: "success" | "error") => void;
}

function LaunchTab({ addToast }: LaunchTabProps) {
  const [form, setForm] = useState<LaunchFormState>(LAUNCH_FORM_DEFAULT);
  const [launching, setLaunching] = useState(false);

  const [configs, setConfigs] = useState<ScrapeConfig[]>([]);
  const [configsLoading, setConfigsLoading] = useState(true);
  const [configsError, setConfigsError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [relaunchingId, setRelaunchingId] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setConfigsLoading(true);
    setConfigsError(null);
    try {
      const data = await getScrapeConfigs();
      setConfigs(data);
    } catch (err) {
      setConfigsError(err instanceof Error ? err.message : "Failed to load configs");
    } finally {
      setConfigsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  function setField<K extends keyof LaunchFormState>(
    key: K,
    value: LaunchFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Campaign name is required";
    if (!form.sector) return "Please select a sector";
    if (form.countries.length === 0) return "Select at least one country";
    if (form.keywords.length === 0) return "Add at least one keyword";
    return null;
  }

  async function handleLaunch() {
    const err = validate();
    if (err) {
      addToast(err, "error");
      return;
    }
    setLaunching(true);
    try {
      const cities = form.cities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      await startScrape({
        name: form.name.trim(),
        sector: form.sector,
        countries: form.countries,
        ...(cities.length > 0 ? { cities } : {}),
        keywords: form.keywords,
        maxResults: form.maxResults,
        ...(form.minRating ? { minRating: parseFloat(form.minRating) } : {}),
      });

      addToast("Campaign launched successfully", "success");
      setForm(LAUNCH_FORM_DEFAULT);
      fetchConfigs();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to launch campaign",
        "error"
      );
    } finally {
      setLaunching(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteScrapeConfig(id);
      addToast("Config deleted", "success");
      setConfigs((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to delete config",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRelaunch(config: ScrapeConfig) {
    setRelaunchingId(config.id);
    try {
      await startScrape({
        name: config.name,
        sector: config.sector,
        countries: config.countries,
        ...(config.cities && config.cities.length > 0 ? { cities: config.cities } : {}),
        keywords: config.keywords,
        ...(config.excludeKeywords && config.excludeKeywords.length > 0
          ? { excludeKeywords: config.excludeKeywords }
          : {}),
        maxResults: config.maxResults,
        ...(config.minRating != null ? { minRating: config.minRating } : {}),
      });
      addToast(`Re-launched: ${config.name}`, "success");
      fetchConfigs();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to re-launch",
        "error"
      );
    } finally {
      setRelaunchingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Campaign Form ── */}
      <Card neon="cyan">
        <CardHeader>
          <CardTitle>New Campaign</CardTitle>
          <span className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600">
            Configure & Launch
          </span>
        </CardHeader>

        <div className="space-y-5">
          {/* Row 1: Name + Sector */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Campaign Name"
              placeholder="e.g., Ristoranti Italiani — DE Q2"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
            <Select
              label="Sector"
              value={form.sector}
              onChange={(e) => setField("sector", e.target.value)}
            >
              <option value="">Select a sector…</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          {/* Row 2: Countries */}
          <CountrySelect
            selected={form.countries}
            onChange={(codes) => setField("countries", codes)}
          />

          {/* Row 3: Cities */}
          <Input
            label="Cities (optional — comma separated)"
            placeholder="Berlin, München, Hamburg"
            value={form.cities}
            onChange={(e) => setField("cities", e.target.value)}
          />

          {/* Row 4: Keywords */}
          <TagInput
            label="Keywords"
            tags={form.keywords}
            placeholder='e.g., "ristorante", "pizzeria", "trattoria"'
            onChange={(tags) => setField("keywords", tags)}
          />

          {/* Row 5: Max Results + Min Rating */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Max Results"
              type="number"
              min={1}
              max={5000}
              value={form.maxResults}
              onChange={(e) =>
                setField("maxResults", parseInt(e.target.value, 10) || 100)
              }
            />
            <Input
              label="Min Google Rating (optional)"
              type="number"
              min={0}
              max={5}
              step={0.1}
              placeholder="e.g., 3.5"
              value={form.minRating}
              onChange={(e) => setField("minRating", e.target.value)}
            />
          </div>

          {/* Launch Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLaunch}
              disabled={launching}
              className={cn(
                "relative w-full rounded-lg border border-neon-cyan/60 px-6 py-3.5",
                "font-orbitron text-sm font-bold uppercase tracking-widest text-neon-cyan",
                "transition-all duration-200",
                "disabled:cursor-not-allowed disabled:opacity-40",
                !launching && [
                  "hover:border-neon-cyan hover:bg-neon-cyan/10",
                  "hover:shadow-[0_0_24px_#00f0ff40]",
                ]
              )}
              style={{
                background: launching
                  ? undefined
                  : "linear-gradient(135deg, rgba(0,240,255,0.08) 0%, rgba(0,240,255,0.03) 100%)",
              }}
              aria-busy={launching}
            >
              <span className="flex items-center justify-center gap-2">
                {launching ? (
                  <>
                    <Spinner size="sm" />
                    Launching…
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Launch Campaign
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </Card>

      {/* ── Saved Configs ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-orbitron text-sm font-semibold uppercase tracking-widest text-slate-400">
            Saved Configs
          </h2>
          <button
            onClick={fetchConfigs}
            disabled={configsLoading}
            className="flex items-center gap-1.5 rounded border border-border-subtle px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-wider text-slate-500 transition-colors hover:border-slate-500 hover:text-slate-300 disabled:opacity-40"
            aria-label="Refresh saved configs"
          >
            <RefreshCw className={cn("h-3 w-3", configsLoading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {configsError && (
          <ErrorBanner message={configsError} onRetry={fetchConfigs} />
        )}

        {configsLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-3"
              >
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-12 rounded" />
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
                <div className="flex justify-between pt-1">
                  <Skeleton className="h-7 w-20 rounded" />
                  <Skeleton className="h-7 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : configs.length === 0 ? (
          <div className="rounded-lg border border-border-subtle bg-bg-card px-6 py-8 text-center">
            <p className="font-mono-tech text-xs text-slate-600">
              No saved configs yet — launch your first campaign above
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {configs.map((cfg) => (
              <ConfigCard
                key={cfg.id}
                config={cfg}
                isDeleting={deletingId === cfg.id}
                isRelaunching={relaunchingId === cfg.id}
                onDelete={() => handleDelete(cfg.id)}
                onRelaunch={() => handleRelaunch(cfg)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigCard({
  config,
  isDeleting,
  isRelaunching,
  onDelete,
  onRelaunch,
}: {
  config: ScrapeConfig;
  isDeleting: boolean;
  isRelaunching: boolean;
  onDelete: () => void;
  onRelaunch: () => void;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-card p-4 transition-all duration-200 hover:border-neon-cyan/30">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-orbitron text-xs font-semibold text-slate-200 leading-tight">
            {config.name}
          </p>
          <p className="mt-0.5 font-mono-tech text-[10px] text-slate-600 uppercase tracking-wider">
            {config.sector}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {config.totalFound > 0 && (
            <span className="rounded border border-neon-green/30 bg-neon-green/10 px-1.5 py-0.5 font-mono-tech text-[9px] text-neon-green">
              {config.totalFound.toLocaleString()} found
            </span>
          )}
        </div>
      </div>

      {/* Countries */}
      <div className="mb-2 flex flex-wrap gap-1">
        {config.countries.map((code) => (
          <span
            key={code}
            className="rounded border border-slate-700/60 bg-slate-800/50 px-1.5 py-0.5 font-mono-tech text-[9px] text-slate-400"
          >
            {code}
          </span>
        ))}
      </div>

      {/* Keywords */}
      <div className="mb-3 flex flex-wrap gap-1">
        {config.keywords.slice(0, 5).map((kw) => (
          <span
            key={kw}
            className="rounded border border-neon-cyan/20 bg-neon-cyan/5 px-1.5 py-0.5 font-mono-tech text-[9px] text-neon-cyan/70"
          >
            {kw}
          </span>
        ))}
        {config.keywords.length > 5 && (
          <span className="font-mono-tech text-[9px] text-slate-600">
            +{config.keywords.length - 5} more
          </span>
        )}
      </div>

      {/* Last run */}
      {config.lastRunAt && (
        <p className="mb-3 font-mono-tech text-[9px] text-slate-700">
          Last run: {timeAgo(config.lastRunAt)}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          color="cyan"
          variant="outline"
          size="sm"
          loading={isRelaunching}
          leftIcon={<Play className="h-3 w-3" />}
          onClick={onRelaunch}
          disabled={isRelaunching || isDeleting}
          className="flex-1"
        >
          Re-launch
        </Button>
        <Button
          color="red"
          variant="ghost"
          size="sm"
          loading={isDeleting}
          leftIcon={<Trash2 className="h-3 w-3" />}
          onClick={onDelete}
          disabled={isDeleting || isRelaunching}
          aria-label={`Delete config ${config.name}`}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

// ─── ═══════════════════════════════════════════════════════════
// ─── TAB 2: Monitor ────────────────────────────────────────────
// ─── ═══════════════════════════════════════════════════════════

interface FunnelCounts {
  SCRAPED: number;
  QUALIFIED: number;
  PREVIEW_READY: number;
  CONTACTED: number;
  FOLLOWED_UP: number;
}

interface MonitorTabProps {
  addToast: (message: string, type?: "success" | "error") => void;
}

function MonitorTab({ addToast }: MonitorTabProps) {
  const [counts, setCounts] = useState<FunnelCounts | null>(null);
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [buildingAll, setBuildingAll] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);

  // Auto-refresh every 10 s
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCounts = useCallback(async () => {
    setCountsError(null);
    try {
      const [scraped, qualified, preview, contacted, followed] =
        await Promise.all([
          getProspects({ status: "SCRAPED", limit: 1 }),
          getProspects({ status: "QUALIFIED", limit: 1 }),
          getProspects({ status: "PREVIEW_READY", limit: 1 }),
          getProspects({ status: "CONTACTED", limit: 1 }),
          getProspects({ status: "FOLLOWED_UP", limit: 1 }),
        ]);
      setCounts({
        SCRAPED: scraped.total,
        QUALIFIED: qualified.total,
        PREVIEW_READY: preview.total,
        CONTACTED: contacted.total,
        FOLLOWED_UP: followed.total,
      });
    } catch (err) {
      setCountsError(
        err instanceof Error ? err.message : "Failed to load pipeline counts"
      );
    } finally {
      setCountsLoading(false);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await getAgentJobs({ limit: 10 });
      setJobs(data.data);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setCountsLoading(true);
    setJobsLoading(true);
    await Promise.all([fetchCounts(), fetchJobs()]);
  }, [fetchCounts, fetchJobs]);

  useEffect(() => {
    refreshAll();
    intervalRef.current = setInterval(() => {
      fetchCounts();
      fetchJobs();
    }, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshAll, fetchCounts, fetchJobs]);

  async function handleAnalyzeAll() {
    setAnalyzingAll(true);
    try {
      const result = await bulkAnalyze();
      addToast(`Queued ${result.queued} prospects for analysis`, "success");
      fetchCounts();
      fetchJobs();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Bulk analyze failed",
        "error"
      );
    } finally {
      setAnalyzingAll(false);
    }
  }

  async function handleBuildAll() {
    setBuildingAll(true);
    try {
      // Fetch all QUALIFIED prospects and build previews
      const page1 = await getProspects({ status: "QUALIFIED", limit: 50 });
      const prospects = page1.data;
      if (prospects.length === 0) {
        addToast("No qualified prospects to build previews for", "error");
        setBuildingAll(false);
        return;
      }
      // Fire off all requests and count successes
      const results = await Promise.allSettled(
        prospects.map((p) => buildPreview(p.id))
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      addToast(`Building previews for ${succeeded} prospects`, "success");
      fetchCounts();
      fetchJobs();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Build all failed",
        "error"
      );
    } finally {
      setBuildingAll(false);
    }
  }

  async function handleSendAll() {
    setSendingAll(true);
    try {
      const page1 = await getProspects({ status: "PREVIEW_READY", limit: 50 });
      const prospects = page1.data;
      if (prospects.length === 0) {
        addToast("No preview-ready prospects to send outreach to", "error");
        setSendingAll(false);
        return;
      }
      const results = await Promise.allSettled(
        prospects.map((p) => sendOutreach(p.id))
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      addToast(`Sent outreach for ${succeeded} prospects`, "success");
      fetchCounts();
      fetchJobs();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Send all failed",
        "error"
      );
    } finally {
      setSendingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Funnel Steps */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-orbitron text-sm font-semibold uppercase tracking-widest text-slate-400">
            Campaign Pipeline
          </h2>
          <button
            onClick={refreshAll}
            disabled={countsLoading}
            className="flex items-center gap-1.5 rounded border border-border-subtle px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-wider text-slate-500 transition-colors hover:border-slate-500 hover:text-slate-300 disabled:opacity-40"
            aria-label="Refresh pipeline"
          >
            <RefreshCw className={cn("h-3 w-3", countsLoading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {countsError && (
          <div className="mb-4">
            <ErrorBanner message={countsError} onRetry={refreshAll} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {/* Step 1: Scraping */}
          <PipelineStep
            step={1}
            title="Scraping"
            description="Prospects found by scraper"
            icon={TrendingUp}
            color="#00f0ff"
            count={counts?.SCRAPED ?? null}
            loading={countsLoading}
          />

          {/* Step 2: Analyzing */}
          <PipelineStep
            step={2}
            title="Analyzing"
            description="AI-scored prospects"
            icon={Zap}
            color="#a855f7"
            count={counts?.QUALIFIED ?? null}
            loading={countsLoading}
            action={
              <Button
                color="violet"
                variant="outline"
                size="sm"
                loading={analyzingAll}
                leftIcon={<Zap className="h-3 w-3" />}
                onClick={handleAnalyzeAll}
                disabled={analyzingAll}
                className="w-full mt-3"
              >
                Analyze All
              </Button>
            }
          />

          {/* Step 3: Building Previews */}
          <PipelineStep
            step={3}
            title="Building Previews"
            description="Preview-ready prospects"
            icon={Eye}
            color="#f59e0b"
            count={counts?.PREVIEW_READY ?? null}
            loading={countsLoading}
            action={
              <Button
                color="amber"
                variant="outline"
                size="sm"
                loading={buildingAll}
                leftIcon={<Eye className="h-3 w-3" />}
                onClick={handleBuildAll}
                disabled={buildingAll}
                className="w-full mt-3"
              >
                Build All
              </Button>
            }
          />

          {/* Step 4: Outreach */}
          <PipelineStep
            step={4}
            title="Outreach"
            description="Contacted + followed up"
            icon={Send}
            color="#10b981"
            count={
              counts !== null
                ? counts.CONTACTED + counts.FOLLOWED_UP
                : null
            }
            loading={countsLoading}
            action={
              <Button
                color="green"
                variant="outline"
                size="sm"
                loading={sendingAll}
                leftIcon={<Send className="h-3 w-3" />}
                onClick={handleSendAll}
                disabled={sendingAll}
                className="w-full mt-3"
              >
                Send All
              </Button>
            }
          />
        </div>
      </div>

      {/* Active Jobs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-orbitron text-sm font-semibold uppercase tracking-widest text-slate-400">
            Active Jobs
          </h2>
          <span className="flex items-center gap-1.5 font-mono-tech text-[10px] text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse" />
            Auto-refresh every 10s
          </span>
        </div>

        <Card neon="subtle">
          {jobsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded border border-border-subtle/50 bg-bg-elevated/40 px-3 py-2"
                >
                  <Skeleton className="h-5 w-16 rounded" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-2.5 w-28" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-5 w-14 rounded" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <p className="py-8 text-center font-mono-tech text-xs text-slate-600">
              No recent agent jobs
            </p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function PipelineStep({
  step,
  title,
  description,
  icon: Icon,
  color,
  count,
  loading,
  action,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  count: number | null;
  loading: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border bg-bg-card p-4 transition-all duration-300"
      style={{
        borderColor: `${color}30`,
      }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600">
            Step {step}
          </p>
          <p
            className="font-orbitron text-xs font-semibold mt-0.5"
            style={{ color }}
          >
            {title}
          </p>
          <p className="mt-1 font-mono-tech text-[10px] text-slate-500">
            {description}
          </p>
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded border"
          style={{
            color,
            borderColor: `${color}40`,
            backgroundColor: `${color}10`,
          }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <p
          className="font-orbitron text-2xl font-bold"
          style={{
            color,
            textShadow: `0 0 12px ${color}60`,
          }}
        >
          {count !== null ? count.toLocaleString("it-IT") : "—"}
        </p>
      )}

      {action}
    </div>
  );
}

function JobRow({ job }: { job: AgentJob }) {
  const agentColor = AGENT_COLOR[job.agentType] ?? "#64748b";
  const statusColor = JOB_STATUS_BADGE[job.status] ?? "gray";
  const progress = job.progress ?? 0;

  return (
    <div className="flex items-center gap-3 rounded border border-border-subtle/50 bg-bg-elevated/40 px-3 py-2.5">
      {/* Agent type */}
      <span
        className="shrink-0 rounded border px-2 py-0.5 font-mono-tech text-[9px] uppercase tracking-wider"
        style={{
          color: agentColor,
          borderColor: `${agentColor}40`,
          backgroundColor: `${agentColor}10`,
        }}
      >
        {job.agentType}
      </span>

      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono-tech text-[10px] text-slate-500 truncate max-w-[120px]">
            {job.prospectId
              ? job.prospectId.slice(0, 8).toUpperCase()
              : job.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="font-mono-tech text-[9px] text-slate-700">
            {timeAgo(job.updatedAt)}
          </span>
        </div>
        {job.status === "RUNNING" && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-bg-elevated">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${agentColor}60, ${agentColor})`,
                boxShadow: `0 0 6px ${agentColor}60`,
              }}
            />
          </div>
        )}
      </div>

      {/* Progress % */}
      {job.status === "RUNNING" && (
        <span className="shrink-0 font-mono-tech text-[10px] text-slate-500">
          {progress}%
        </span>
      )}

      {/* Status badge */}
      <Badge color={statusColor} size="sm" pulse={job.status === "RUNNING"}>
        {job.status}
      </Badge>
    </div>
  );
}

// ─── ═══════════════════════════════════════════════════════════
// ─── TAB 3: Outreach Stats ─────────────────────────────────────
// ─── ═══════════════════════════════════════════════════════════

function OutreachStatsTab() {
  const [stats, setStats] = useState<OutreachStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOutreachStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={fetchStats} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-2"
            >
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-7 w-20" />
            </div>
          ))
        ) : stats ? (
          <>
            <StatKpiCard
              label="Sent Today"
              value={stats.today.sent.toLocaleString("it-IT")}
              color="#00f0ff"
            />
            <StatKpiCard
              label="Total Sent"
              value={stats.totals.sent.toLocaleString("it-IT")}
              color="#00f0ff"
            />
            <StatKpiCard
              label="Open Rate"
              value={`${stats.rates.openRate.toFixed(1)}%`}
              color="#a855f7"
            />
            <StatKpiCard
              label="Click Rate"
              value={`${stats.rates.clickRate.toFixed(1)}%`}
              color="#f59e0b"
            />
            <StatKpiCard
              label="Reply Rate"
              value={`${stats.rates.replyRate.toFixed(1)}%`}
              color="#10b981"
            />
            <StatKpiCard
              label="Bounce Rate"
              value={`${stats.rates.bounceRate.toFixed(1)}%`}
              color="#ef4444"
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Daily Sends Chart */}
        <Card neon="subtle" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Sends</CardTitle>
            <span className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600">
              Last 14 days
            </span>
          </CardHeader>

          {loading ? (
            <div className="flex items-end gap-1 h-32">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 animate-pulse rounded-t bg-slate-800/60"
                  style={{ height: `${20 + ((i * 7 + 11) % 70)}%` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : stats && stats.dailyChart.length > 0 ? (
            <DailyBarChart data={stats.dailyChart} />
          ) : (
            <p className="py-8 text-center font-mono-tech text-xs text-slate-600">
              No send data available yet
            </p>
          )}
        </Card>

        {/* Top Subjects */}
        <Card neon="subtle">
          <CardHeader>
            <CardTitle>Top Subjects</CardTitle>
          </CardHeader>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-1.5 w-3/4 rounded-full" />
                </div>
              ))}
            </div>
          ) : stats && stats.topSubjects.length > 0 ? (
            <div className="space-y-3">
              {stats.topSubjects.slice(0, 8).map((s, i) => {
                const max = stats.topSubjects[0]?.count ?? 1;
                const pct = (s.count / max) * 100;
                return (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p
                        className="truncate font-mono-tech text-[10px] text-slate-400"
                        title={s.subject}
                      >
                        {s.subject}
                      </p>
                      <span className="shrink-0 font-mono-tech text-[10px] text-neon-cyan">
                        {s.count}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-bg-elevated">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background:
                            "linear-gradient(90deg, #00f0ff40, #00f0ff)",
                          boxShadow: "0 0 4px #00f0ff40",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center font-mono-tech text-xs text-slate-600">
              No subject data yet
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatKpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border bg-bg-card p-4 transition-all duration-300"
      style={{
        borderColor: `${color}25`,
      }}
    >
      <p className="mb-2 font-mono-tech text-[9px] uppercase tracking-widest text-slate-600">
        {label}
      </p>
      <p
        className="font-orbitron text-xl font-bold"
        style={{
          color,
          textShadow: `0 0 10px ${color}50`,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function DailyBarChart({ data }: { data: { date: string; count: number }[] }) {
  // Show last 14 days, pad if needed
  const chartData = data.slice(-14);
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      <div
        className="flex items-end gap-1"
        style={{ height: "128px" }}
        role="img"
        aria-label="Daily sends bar chart"
      >
        {chartData.map((d) => {
          const heightPct = Math.max((d.count / maxCount) * 100, 4);
          const label = new Date(d.date).toLocaleDateString("it-IT", {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full mb-1.5 hidden rounded border border-neon-cyan/30 bg-bg-card px-2 py-1 group-hover:block z-10">
                <p className="whitespace-nowrap font-mono-tech text-[9px] text-neon-cyan">
                  {d.count} sent
                </p>
                <p className="whitespace-nowrap font-mono-tech text-[8px] text-slate-600">
                  {label}
                </p>
              </div>
              {/* Bar */}
              <div
                className="w-full rounded-t transition-all duration-700"
                style={{
                  height: `${heightPct}%`,
                  background: "linear-gradient(180deg, #00f0ff, #00f0ff40)",
                  boxShadow: "0 0 6px #00f0ff30",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels — show every 3rd */}
      <div className="flex gap-1">
        {chartData.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % 3 === 0 && (
              <span className="font-mono-tech text-[8px] text-slate-700">
                {new Date(d.date).toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ═══════════════════════════════════════════════════════════
// ─── Page ──────────────────────────────────────────────────────
// ─── ═══════════════════════════════════════════════════════════

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("launch");
  const { toasts, addToast } = useToast();

  return (
    <PageWrapper>
      {/* ── Page Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex h-8 w-8 items-center justify-center rounded border border-neon-cyan/40 bg-neon-cyan/10"
            aria-hidden="true"
          >
            <Rocket className="h-4 w-4 text-neon-cyan" />
          </div>
          <h1
            className="font-orbitron text-lg sm:text-xl md:text-2xl font-bold text-neon-cyan"
            style={{ textShadow: "0 0 14px #00f0ff40" }}
          >
            Campaign Control
          </h1>
        </div>
        <p className="font-mono-tech text-xs text-slate-500 ml-11">
          Configure targets, launch scrapes, monitor the pipeline and track
          outreach performance
        </p>
      </div>

      {/* ── Tab Navigation ── */}
      <div
        className="mb-6 flex flex-wrap border-b border-border-subtle"
        role="tablist"
        aria-label="Campaign management tabs"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-5 py-3 font-mono-tech text-xs uppercase tracking-wider transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neon-cyan/60",
                isActive
                  ? "text-neon-cyan"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {tab.label}
              {/* Active underline */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                  style={{
                    background: "#00f0ff",
                    boxShadow: "0 0 8px #00f0ff80",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ── */}
      <div
        id="tabpanel-launch"
        role="tabpanel"
        aria-labelledby="tab-launch"
        hidden={activeTab !== "launch"}
      >
        {activeTab === "launch" && <LaunchTab addToast={addToast} />}
      </div>

      <div
        id="tabpanel-monitor"
        role="tabpanel"
        aria-labelledby="tab-monitor"
        hidden={activeTab !== "monitor"}
      >
        {activeTab === "monitor" && <MonitorTab addToast={addToast} />}
      </div>

      <div
        id="tabpanel-stats"
        role="tabpanel"
        aria-labelledby="tab-stats"
        hidden={activeTab !== "stats"}
      >
        {activeTab === "stats" && <OutreachStatsTab />}
      </div>

      {/* ── Global Toast Container ── */}
      <ToastContainer toasts={toasts} />
    </PageWrapper>
  );
}
