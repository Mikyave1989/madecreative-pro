"use client";

import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PlanBadge } from "@/components/ui/Badge";

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Buongiorno, ${name}`;
  if (hour < 18) return `Buon pomeriggio, ${name}`;
  return `Buonasera, ${name}`;
}

export function Header() {
  const { user } = useAuth();
  const firstName = user?.contactName?.split(" ")[0] ?? "Cliente";

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Greeting — offset for mobile hamburger */}
        <div className="pl-10 lg:pl-0">
          <h1 className="text-base font-semibold text-gray-900">
            {getGreeting(firstName)}
          </h1>
          {user && (
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
              {user.companyName}
            </p>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user && <PlanBadge plan={user.plan} size="sm" />}

          {/* Notification bell */}
          <button
            className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Notifiche"
          >
            <Bell className="w-5 h-5" />
            {/* Indicatore notifiche non lette */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
