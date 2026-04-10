"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Rocket,
  Mail,
  Globe,
  Shield,
  RefreshCw,
  Play,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  getLaunchStatus,
  getWarmingStatus,
  initWarming,
  bulkBuild,
  bulkOutreach,
  launchMunich,
  getDnsGuide,
  type LaunchStatus,
  type WarmingStatus,
} from "@/lib/api";

export default function LaunchPage() {
  const [status, setStatus] = useState<LaunchStatus | null>(null);
  const [warming, setWarming] = useState<WarmingStatus | null>(null);
  const [dnsGuide, setDnsGuide] = useState<Awaited<ReturnType<typeof getDnsGuide>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, w] = await Promise.all([getLaunchStatus(), getWarmingStatus()]);
      setStatus(s);
      setWarming(w);
    } catch {
      try {
        const s = await getLaunchStatus();
        setStatus(s);
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAction = async (action: string, fn: () => Promise<unknown>) => {
    setActionLoading(action);
    try {
      const result = await fn();
      const msg = (result as Record<string, unknown>)?.message ?? `${action} completed`;
      showMessage("success", String(msg));
      await refresh();
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </PageWrapper>
    );
  }

  const funnel = status?.funnel;
  const warmingData = status?.warming;

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Launch Control</h1>
          <p className="text-xs text-slate-500">SCRAPE &gt; ANALYZE &gt; BUILD &gt; OUTREACH pipeline</p>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Message Toast */}
      {message && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Funnel Overview */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {[
          { label: "Total", value: funnel?.totalProspects ?? 0, icon: Globe, color: "#6366f1" },
          { label: "Scraped", value: funnel?.scraped ?? 0, icon: Globe, color: "#a855f7" },
          { label: "Analyzed", value: funnel?.analyzed ?? 0, icon: TrendingUp, color: "#f59e0b" },
          { label: "Preview", value: funnel?.previewGenerated ?? 0, icon: CheckCircle2, color: "#22c55e" },
          { label: "Emailed", value: funnel?.emailSent ?? 0, icon: Mail, color: "#3b82f6" },
          { label: "Replied", value: funnel?.replied ?? 0, icon: Mail, color: "#00f0ff" },
          { label: "Converted", value: funnel?.converted ?? 0, icon: Zap, color: "#10b981" },
          { label: "Lost", value: funnel?.lost ?? 0, icon: AlertTriangle, color: "#ef4444" },
          { label: "Active Jobs", value: status?.activeJobs ?? 0, icon: Clock, color: "#f59e0b" },
          { label: "Emails 7d", value: status?.emailsLast7Days ?? 0, icon: Mail, color: "#6366f1" },
        ].map((item) => (
          <Card key={item.label}>
            <div className="flex items-center gap-3 p-4">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <item.icon className="h-4 w-4" style={{ color: item.color }} />
              </div>
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-wider text-slate-500">
                  {item.label}
                </p>
                <p className="text-lg font-bold text-slate-100">{item.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Warming Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-400" />
            Email Warming
          </CardTitle>
        </CardHeader>
        <div className="p-4 pt-0">
          {warmingData?.initialized ? (
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="font-mono-tech text-[10px] uppercase text-slate-500">Day</p>
                  <p className="text-2xl font-bold text-slate-100">{warming?.warmingDay ?? warmingData.day}</p>
                </div>
                <div>
                  <p className="font-mono-tech text-[10px] uppercase text-slate-500">Limit</p>
                  <p className="text-2xl font-bold text-orange-400">{warming?.currentLimit ?? warmingData.limit}/day</p>
                </div>
                <div>
                  <p className="font-mono-tech text-[10px] uppercase text-slate-500">Sent Today</p>
                  <p className="text-2xl font-bold text-green-400">{warming?.sentToday ?? warmingData.sentToday}</p>
                </div>
                <div>
                  <p className="font-mono-tech text-[10px] uppercase text-slate-500">Remaining</p>
                  <p className="text-2xl font-bold text-cyan-400">{warming?.remaining ?? 0}</p>
                </div>
              </div>
              {warming?.warmingSchedule && (
                <div className="flex gap-2">
                  {warming.warmingSchedule.map((phase) => (
                    <div
                      key={phase.phase}
                      className={`flex-1 rounded-lg border p-2 text-center text-xs ${
                        phase.active
                          ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                          : "border-border-subtle text-slate-600"
                      }`}
                    >
                      <p className="font-bold">{phase.dailyLimit}/d</p>
                      <p className="text-[10px]">Day {phase.days}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <p className="text-sm text-slate-400">Warming not initialized</p>
              <Button
                size="sm"
                color="amber"
                variant="solid"
                onClick={() => handleAction("Init Warming", () => initWarming(0))}
                disabled={actionLoading !== null}
              >
                {actionLoading === "Init Warming" ? <Spinner /> : "Initialize Warming"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Launch Actions */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Munich Launch */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-red-400" />
              Launch: Munchen Restaurants
            </CardTitle>
          </CardHeader>
          <div className="space-y-3 p-4 pt-0">
            <p className="text-xs text-slate-400">
              One-click: scrape 50 restaurants in Munchen from Google Maps.
              Creates ScrapeConfig + starts SCRAPER agent.
            </p>
            <Button
              color="red"
              variant="solid"
              className="w-full"
              onClick={() => handleAction("Munich Launch", () => launchMunich({ maxResults: 50, minRating: 3.5 }))}
              disabled={actionLoading !== null}
            >
              {actionLoading === "Munich Launch" ? (
                <Spinner />
              ) : (
                <>
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                  Launch Munchen Scrape
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Pipeline Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-cyan-400" />
              Pipeline Actions
            </CardTitle>
          </CardHeader>
          <div className="space-y-2 p-4 pt-0">
            <Button
              variant="ghost"
              color="green"
              className="w-full justify-start"
              onClick={() => handleAction("Bulk Build", () => bulkBuild({ country: "DE" }))}
              disabled={actionLoading !== null}
            >
              {actionLoading === "Bulk Build" ? <Spinner /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
              Bulk Build Previews
            </Button>
            <Button
              variant="ghost"
              color="blue"
              className="w-full justify-start"
              onClick={() => handleAction("Bulk Outreach", () => bulkOutreach({ country: "DE" }))}
              disabled={actionLoading !== null}
            >
              {actionLoading === "Bulk Outreach" ? <Spinner /> : <Mail className="mr-2 h-3.5 w-3.5" />}
              Bulk Outreach
            </Button>
            {!warmingData?.initialized && (
              <Button
                variant="ghost"
                color="amber"
                className="w-full justify-start"
                onClick={() => handleAction("Init Warming", () => initWarming(0))}
                disabled={actionLoading !== null}
              >
                {actionLoading === "Init Warming" ? <Spinner /> : <Shield className="mr-2 h-3.5 w-3.5" />}
                Initialize Email Warming (Day 0)
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* DNS Guide */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              DNS Setup (SPF/DKIM/DMARC)
            </CardTitle>
            {!dnsGuide && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    const guide = await getDnsGuide();
                    setDnsGuide(guide);
                  } catch {
                    showMessage("error", "Failed to load DNS guide");
                  }
                }}
              >
                Load Guide
              </Button>
            )}
          </div>
        </CardHeader>
        {dnsGuide && (
          <div className="space-y-3 p-4 pt-0">
            <p className="text-xs text-slate-400">
              Domain: <Badge color="blue">{dnsGuide.domain}</Badge>
            </p>
            <div className="space-y-2">
              {dnsGuide.records.map((record, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 text-xs ${
                    record.priority === "CRITICAL"
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-border-subtle"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge color={record.priority === "CRITICAL" ? "red" : "blue"}>
                      {record.type}
                    </Badge>
                    <span className="font-mono text-slate-400">{record.name}</span>
                    <Badge color={record.priority === "CRITICAL" ? "red" : "cyan"}>
                      {record.priority}
                    </Badge>
                  </div>
                  <p className="font-mono text-[11px] text-slate-300 break-all">{record.value}</p>
                  <p className="mt-1 text-slate-500">{record.purpose}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border-subtle p-3">
              <p className="text-xs font-bold text-slate-300 mb-2">Verification Steps:</p>
              {Object.entries(dnsGuide.verification).map(([key, value]) => (
                <p key={key} className="text-[11px] text-slate-400">{value}</p>
              ))}
            </div>
          </div>
        )}
      </Card>
    </PageWrapper>
  );
}
