"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

function LiveClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Intl.DateTimeFormat("it-IT", {
          timeZone: "Europe/Rome",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono-tech text-xs text-neon-cyan/80">
      {time} <span className="text-slate-600">CET</span>
    </span>
  );
}

function buildBreadcrumb(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
}

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const breadcrumbs = buildBreadcrumb(pathname);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-bg-sidebar/80 px-6 backdrop-blur-sm">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 font-mono-tech text-[10px] uppercase tracking-widest">
          <li className="text-slate-600">Admin</li>
          {breadcrumbs.map((crumb, i) => (
            <li key={crumb} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-slate-700" />
              <span
                className={
                  i === breadcrumbs.length - 1 ? "text-neon-cyan" : "text-slate-500"
                }
              >
                {crumb}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-5">
        {/* Live clock */}
        <LiveClock />

        {/* System status */}
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full bg-neon-green system-online"
            aria-hidden="true"
          />
          <span className="font-mono-tech text-[10px] uppercase tracking-widest text-neon-green/80">
            System Online
          </span>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded border border-border-subtle px-3 py-1.5 text-slate-400 hover:border-neon-cyan/40 hover:text-slate-200 transition-colors"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neon-cyan/10 border border-neon-cyan/30">
              <span className="font-orbitron text-[8px] font-bold text-neon-cyan">
                {user?.name?.charAt(0) ?? "A"}
              </span>
            </div>
            <span className="font-mono-tech text-[10px] uppercase tracking-wider">
              {user?.name ?? "Admin"}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded border border-border-subtle bg-bg-card shadow-neon-cyan z-20">
              <div className="border-b border-border-subtle px-3 py-2">
                <p className="font-mono-tech text-[9px] text-slate-500 uppercase">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:bg-neon-red/10 hover:text-neon-red transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="font-mono-tech text-[10px] uppercase tracking-wider">
                  Logout
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
