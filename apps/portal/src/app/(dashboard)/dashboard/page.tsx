"use client";

import { type Metadata } from "next";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import {
  Globe,
  Users,
  Bot,
  Clock,
  Pencil,
  MessageSquarePlus,
  Download,
  HeadphonesIcon,
  Zap,
  CheckCircle2,
  CreditCard,
  FileBarChart2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  mockKpis,
  mockChart30d,
  mockActivities,
  type ActivityType,
} from "@/lib/mockData";

// --- Chart tooltip custom ---
interface CustomTooltipPayload {
  value: number;
  name: string;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-gray-700 mb-2">{label}</p>
      {(payload as CustomTooltipPayload[]).map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: p.color }}
          />
          <span className="text-gray-500">
            {p.name === "visite" ? "Visite" : "Lead"}:
          </span>
          <span className="font-semibold tabular-nums text-gray-900">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Activity icons ---
const activityConfig: Record<
  ActivityType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  nuovo_lead: { icon: Users, color: "text-green-600", bg: "bg-green-50" },
  conversazione_chatbot: { icon: Bot, color: "text-violet-600", bg: "bg-violet-50" },
  modifica_sito: { icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
  fattura_pagata: { icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50" },
  report_disponibile: { icon: FileBarChart2, color: "text-amber-600", bg: "bg-amber-50" },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  return `${days}g fa`;
}

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

// --- Quick actions ---
const quickActions = [
  {
    label: "Richiedi modifica sito",
    href: "/website",
    icon: Pencil,
    description: "Testo, foto, orari",
  },
  {
    label: "Aggiungi FAQ al chatbot",
    href: "/chatbot",
    icon: MessageSquarePlus,
    description: "Migliora le risposte",
  },
  {
    label: "Scarica report",
    href: "/reports",
    icon: Download,
    description: "Ultimo: Marzo 2026",
  },
  {
    label: "Contatta supporto",
    href: "/support",
    icon: HeadphonesIcon,
    description: "Risposta in < 2h",
  },
];

// Format x-axis tick to short date
function tickFormatter(value: string): string {
  const d = new Date(value);
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "numeric" });
}

export default function DashboardPage() {
  const { user } = useAuth();

  // KPI icons
  const kpiIcons = [
    <Globe key="globe" className="w-5 h-5" />,
    <Users key="users" className="w-5 h-5" />,
    <Bot key="bot" className="w-5 h-5" />,
    <Clock key="clock" className="w-5 h-5" />,
  ];

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Panoramica</h2>
        <p className="text-sm text-gray-500 mt-1">
          Aggiornato ogni ora — dati del mese corrente
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {mockKpis.map((kpi, i) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            previousValue={kpi.previousValue}
            unit={kpi.unit}
            prefix={kpi.prefix}
            icon={kpiIcons[i]}
          />
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Area chart — 2/3 width */}
        <Card className="xl:col-span-2" padding="md">
          <CardHeader
            title="Andamento ultimi 30 giorni"
            subtitle="Visite e lead giornalieri"
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={mockChart30d}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="gradientVisite"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="gradientLead"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={tickFormatter}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="visite"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#gradientVisite)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="lead"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#gradientLead)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-indigo-500 rounded" />
              <span className="text-xs text-gray-500">Visite</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-violet-500 rounded" />
              <span className="text-xs text-gray-500">Lead</span>
            </div>
          </div>
        </Card>

        {/* Activity feed — 1/3 width */}
        <Card padding="md">
          <CardHeader title="Ultime attivita" />
          <div className="space-y-4">
            {mockActivities.slice(0, 8).map((activity) => {
              const config = activityConfig[activity.type];
              const Icon = config.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${config.bg}`}
                  >
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card padding="md">
        <CardHeader title="Azioni rapide" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <div className="p-2 bg-gray-100 group-hover:bg-indigo-100 rounded-lg transition-colors">
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-400">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
