"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Pencil,
  FileText,
  CreditCard,
  Settings,
  Sparkles,
  X,
  Menu,
  LogOut,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth";
import { PlanBadge } from "@/components/ui/Badge";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Il tuo sito", icon: LayoutDashboard },
  { href: "/editor", label: "AI Editor", icon: Pencil },
  { href: "/templates", label: "Template", icon: Sparkles },
  { href: "/reports", label: "Report", icon: FileText },
  { href: "/billing", label: "Account", icon: CreditCard },
  { href: "/settings", label: "Impostazioni", icon: Settings },
];

function NavLink({
  item,
  onClick,
}: {
  item: NavItem;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-indigo-600/20 text-indigo-400"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      )}
    >
      <Icon
        className={clsx(
          "w-5 h-5 flex-shrink-0",
          isActive ? "text-indigo-400" : "text-slate-500"
        )}
      />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </Link>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-white">
              made<span className="text-indigo-400">creative</span>
            </span>
            <p className="text-xs text-slate-500 mt-0.5">Il tuo partner digitale</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg lg:hidden"
              aria-label="Chiudi menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}
      </nav>

      {/* User info */}
      {user && (
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              {user.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.companyName}
              </p>
              <div className="mt-0.5">
                <PlanBadge plan={user.plan} />
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-slate-800 rounded-lg shadow-md border border-slate-700 text-slate-300"
        aria-label="Apri menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={clsx(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 shadow-2xl transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-64 bg-slate-900 border-r border-slate-800">
        <SidebarContent />
      </aside>
    </>
  );
}
