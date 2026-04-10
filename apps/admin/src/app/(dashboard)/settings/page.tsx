"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  LogOut,
  Server,
  Globe,
  Shield,
  Info,
  Copy,
  Check,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";

// ─── Copy Button ───────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded p-1 text-slate-600 hover:text-neon-cyan transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3 w-3 text-neon-green" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

// ─── Info Row ──────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  copyable = false,
  mono = true,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border-subtle/50 last:border-0">
      <span className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <span
          className={
            mono
              ? "font-mono-tech text-xs text-slate-400"
              : "text-sm text-slate-300"
          }
        >
          {value}
        </span>
        {copyable && <CopyButton value={value} />}
      </div>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  iconColor,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card neon="subtle">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded border"
              style={{
                borderColor: `${iconColor}30`,
                backgroundColor: `${iconColor}10`,
              }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
            </div>
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        {children}
      </Card>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [apiUrl, setApiUrl] = useState<string>("—");
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  useEffect(() => {
    // Resolve at runtime to avoid SSR issues
    setApiUrl(
      process.env.NEXT_PUBLIC_API_URL ?? "https://api.madecreative.pro"
    );
  }, []);

  const handleLogout = () => {
    if (logoutConfirm) {
      logout();
    } else {
      setLogoutConfirm(true);
      setTimeout(() => setLogoutConfirm(false), 3000);
    }
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6">
        <h1
          className="font-orbitron text-2xl font-bold text-neon-pink"
          style={{ textShadow: "0 0 12px #ec489940" }}
        >
          Settings
        </h1>
        <p className="mt-1 font-mono-tech text-xs text-slate-500">
          Account, system info, and configuration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Account */}
        <Section title="Account" icon={User} iconColor="#ec4899" delay={0}>
          <div className="space-y-0">
            <InfoRow
              label="Email"
              value={user?.email ?? "—"}
              copyable
              mono={false}
            />
            <InfoRow
              label="Role"
              value={user?.role ?? "—"}
              mono={false}
            />
            <InfoRow
              label="User ID"
              value={user?.id ?? "—"}
              copyable
            />
          </div>

          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between">
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
                Session
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
                <span className="font-mono-tech text-[10px] text-neon-green">Active</span>
              </div>
            </div>
            <Button
              color="red"
              variant="outline"
              size="sm"
              leftIcon={<LogOut className="h-3 w-3" />}
              onClick={handleLogout}
            >
              {logoutConfirm ? "Confirm Logout" : "Logout"}
            </Button>
          </div>
        </Section>

        {/* Security */}
        <Section title="Security" icon={Shield} iconColor="#a855f7" delay={0.05}>
          <div className="space-y-0">
            <InfoRow label="Auth Method" value="JWT + Refresh Token" mono={false} />
            <InfoRow label="Token Storage" value="localStorage" mono={false} />
            <InfoRow label="Token Expiry" value="15 minutes (access)" mono={false} />
            <InfoRow label="Refresh Expiry" value="7 days" mono={false} />
          </div>
          <div className="mt-4 rounded border border-neon-violet/20 bg-neon-violet/5 px-3 py-2.5">
            <p className="font-mono-tech text-[10px] text-slate-500 leading-relaxed">
              Tokens are automatically refreshed on 401 responses. On failed
              refresh, you will be redirected to the login page.
            </p>
          </div>
        </Section>

        {/* System */}
        <Section title="System" icon={Server} iconColor="#00f0ff" delay={0.1}>
          <div className="space-y-0">
            <InfoRow label="App Version" value="1.0.0" />
            <InfoRow label="Environment" value={process.env.NODE_ENV ?? "production"} />
            <InfoRow label="Build Target" value="Next.js 14 (App Router)" mono={false} />
            <InfoRow label="Runtime" value="Edge / Node.js" mono={false} />
          </div>
        </Section>

        {/* API */}
        <Section title="API" icon={Globe} iconColor="#10b981" delay={0.15}>
          <div className="space-y-0">
            <InfoRow label="Base URL" value={apiUrl} copyable />
            <InfoRow label="Auth Endpoint" value={`${apiUrl}/admin/auth`} copyable />
            <InfoRow label="Timeout" value="15 000 ms" />
            <InfoRow label="Retry on 401" value="1 automatic refresh" mono={false} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge color="green" size="sm">Connected</Badge>
            <Badge color="gray" size="sm">REST / JSON</Badge>
          </div>
        </Section>

        {/* About */}
        <div className="lg:col-span-2">
          <Section title="About" icon={Info} iconColor="#3b82f6" delay={0.2}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded border border-border-subtle bg-bg-elevated/40 p-3">
                <p className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600 mb-2">
                  Platform
                </p>
                <p className="font-orbitron text-sm font-bold text-neon-cyan">MadeCreative</p>
                <p className="font-mono-tech text-[10px] text-slate-600 mt-1">
                  AI-powered B2B outreach platform
                </p>
              </div>

              <div className="rounded border border-border-subtle bg-bg-elevated/40 p-3">
                <p className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600 mb-2">
                  Stack
                </p>
                <ul className="space-y-1">
                  {[
                    "Next.js 14",
                    "Tailwind CSS",
                    "TypeScript",
                    "Prisma + PostgreSQL",
                  ].map((item) => (
                    <li
                      key={item}
                      className="font-mono-tech text-[10px] text-slate-400 flex items-center gap-1.5"
                    >
                      <span className="h-1 w-1 rounded-full bg-neon-cyan/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded border border-border-subtle bg-bg-elevated/40 p-3">
                <p className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-600 mb-2">
                  Agents
                </p>
                <ul className="space-y-1">
                  {[
                    { name: "Scraper", color: "#00f0ff" },
                    { name: "Analyzer", color: "#a855f7" },
                    { name: "Builder", color: "#f59e0b" },
                    { name: "Outreach", color: "#10b981" },
                    { name: "QA", color: "#ef4444" },
                  ].map((agent) => (
                    <li
                      key={agent.name}
                      className="font-mono-tech text-[10px] flex items-center gap-1.5"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: agent.color, boxShadow: `0 0 4px ${agent.color}` }}
                      />
                      <span style={{ color: agent.color }}>{agent.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </PageWrapper>
  );
}
