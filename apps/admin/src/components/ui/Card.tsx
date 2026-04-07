import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

type NeonColor = "cyan" | "violet" | "amber" | "green" | "blue" | "red" | "pink" | "subtle";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  neon?: NeonColor;
  hover?: boolean;
}

const neonBorder: Record<NeonColor, string> = {
  cyan: "border-neon-cyan/30 hover:border-neon-cyan/60 hover:shadow-neon-cyan",
  violet: "border-neon-violet/30 hover:border-neon-violet/60 hover:shadow-neon-violet",
  amber: "border-neon-amber/30 hover:border-neon-amber/60 hover:shadow-neon-amber",
  green: "border-neon-green/30 hover:border-neon-green/60 hover:shadow-neon-green",
  blue: "border-neon-blue/30 hover:border-neon-blue/60 hover:shadow-neon-blue",
  red: "border-neon-red/30 hover:border-neon-red/60 hover:shadow-neon-red",
  pink: "border-neon-pink/30 hover:border-neon-pink/60 hover:shadow-neon-pink",
  subtle: "border-border-subtle",
};

export function Card({ children, neon = "subtle", hover = false, className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-lg border bg-bg-card p-4",
        "transition-all duration-300",
        neonBorder[neon],
        hover && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("font-orbitron text-sm font-semibold uppercase tracking-widest text-slate-300", className)}>
      {children}
    </h3>
  );
}
