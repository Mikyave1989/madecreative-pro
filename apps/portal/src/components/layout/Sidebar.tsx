"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Pencil,
  FileText,
  CreditCard,
  Settings,
  Globe,
} from "lucide-react";
import { clsx } from "clsx";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/editor", label: "Editor", icon: Pencil },
  { href: "/website", label: "Sito", icon: Globe },
  { href: "/reports", label: "Report", icon: FileText },
  { href: "/billing", label: "Account", icon: CreditCard },
  { href: "/settings", label: "Altro", icon: Settings },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={clsx(
        "flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-0 flex-1",
        isActive
          ? "text-indigo-400"
          : "text-slate-500 hover:text-slate-300"
      )}
    >
      <Icon
        className={clsx(
          "w-5 h-5",
          isActive ? "text-indigo-400" : "text-slate-500"
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>
    </nav>
  );
}
