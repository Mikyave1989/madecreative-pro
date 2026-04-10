"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";

export function Header() {
  const { user, logout } = useAuth();
  const firstName = user?.contactName?.split(" ")[0] ?? "Cliente";

  return (
    <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">
        {/* Logo + company */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="text-base font-bold text-white">
            made<span className="text-indigo-400">creative</span>
          </span>
          {user && (
            <span className="hidden sm:inline text-xs text-slate-500 border-l border-slate-700 pl-2.5">
              {user.companyName}
            </span>
          )}
        </Link>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 hidden sm:inline">
            Ciao, {firstName}
          </span>
          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            aria-label="Esci"
            title="Esci"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
