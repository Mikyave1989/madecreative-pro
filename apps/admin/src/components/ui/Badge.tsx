import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type NeonColor = "cyan" | "violet" | "amber" | "green" | "blue" | "red" | "pink" | "gray";

interface BadgeProps {
  children: ReactNode;
  color?: NeonColor;
  size?: "sm" | "md";
  className?: string;
  pulse?: boolean;
}

const colorMap: Record<NeonColor, string> = {
  cyan: "border-neon-cyan/40 text-neon-cyan bg-neon-cyan/10 shadow-neon-cyan",
  violet: "border-neon-violet/40 text-neon-violet bg-neon-violet/10 shadow-neon-violet",
  amber: "border-neon-amber/40 text-neon-amber bg-neon-amber/10 shadow-neon-amber",
  green: "border-neon-green/40 text-neon-green bg-neon-green/10 shadow-neon-green",
  blue: "border-neon-blue/40 text-neon-blue bg-neon-blue/10 shadow-neon-blue",
  red: "border-neon-red/40 text-neon-red bg-neon-red/10 shadow-neon-red",
  pink: "border-neon-pink/40 text-neon-pink bg-neon-pink/10 shadow-neon-pink",
  gray: "border-slate-600/40 text-slate-400 bg-slate-800/50",
};

export function Badge({
  children,
  color = "gray",
  size = "sm",
  className,
  pulse = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border font-mono-tech uppercase tracking-wider",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        colorMap[color],
        pulse && "animate-pulse",
        className
      )}
    >
      {children}
    </span>
  );
}
