"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bot,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Menu,
  X,
  TrendingUp,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "#00f0ff",
  },
  {
    label: "Prospects",
    href: "/prospects",
    icon: Users,
    badge: 0,
    color: "#a855f7",
  },
  {
    label: "Agents",
    href: "/agents",
    icon: Bot,
    badge: 0,
    color: "#f59e0b",
  },
  {
    label: "Campaigns",
    href: "/campaigns",
    icon: Rocket,
    color: "#00f0ff",
  },
  {
    label: "Pipeline",
    href: "/pipeline",
    icon: TrendingUp,
    color: "#22c55e",
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Briefcase,
    color: "#10b981",
  },
  {
    label: "Metrics",
    href: "/metrics",
    icon: BarChart3,
    color: "#3b82f6",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    color: "#ec4899",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded border border-border-subtle bg-bg-sidebar p-2 text-slate-400 hover:text-neon-cyan md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-bg-base/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border-subtle bg-bg-sidebar",
          "transition-all duration-300 ease-out",
          // Desktop
          collapsed ? "md:w-16" : "md:w-60",
          // Mobile
          mobileOpen ? "w-60 max-w-[85vw] translate-x-0" : "w-60 max-w-[85vw] -translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border border-neon-cyan/60 bg-neon-cyan/10 flex items-center justify-center">
                <span className="font-orbitron text-[10px] font-bold text-neon-cyan">MC</span>
              </div>
              <span
                className="font-orbitron text-xs font-bold tracking-widest text-neon-cyan"
                style={{ textShadow: "0 0 8px #00f0ff80" }}
              >
                MADECREATIVE
              </span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto h-6 w-6 rounded border border-neon-cyan/60 bg-neon-cyan/10 flex items-center justify-center">
              <span className="font-orbitron text-[10px] font-bold text-neon-cyan">MC</span>
            </div>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="text-slate-500 hover:text-slate-200 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden text-slate-500 hover:text-neon-cyan transition-colors md:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded px-3 py-2.5 transition-all duration-200",
                      isActive
                        ? "bg-bg-elevated text-slate-100"
                        : "text-slate-500 hover:bg-bg-elevated/60 hover:text-slate-300"
                    )}
                    style={isActive ? { color: item.color } : undefined}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
                        style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
                      />
                    )}

                    <Icon
                      className="h-4 w-4 shrink-0 transition-all duration-200"
                      style={isActive ? { filter: `drop-shadow(0 0 4px ${item.color})` } : undefined}
                    />

                    {!collapsed && (
                      <span className="flex-1 font-mono-tech text-xs uppercase tracking-wider">
                        {item.label}
                      </span>
                    )}

                    {/* Badge */}
                    {!collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className="flex h-4 min-w-4 items-center justify-center rounded border px-1 font-mono-tech text-[9px] font-bold"
                        style={{
                          borderColor: `${item.color}60`,
                          color: item.color,
                          backgroundColor: `${item.color}15`,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border-subtle p-3">
          {!collapsed && (
            <p className="font-mono-tech text-[9px] uppercase tracking-widest text-slate-700 text-center">
              v1.0.0 — SYSTEM
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
