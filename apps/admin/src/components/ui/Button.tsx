import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type NeonColor = "cyan" | "violet" | "amber" | "green" | "blue" | "red" | "pink";
type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  color?: NeonColor;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
}

const colorConfig: Record<
  NeonColor,
  { solid: string; outline: string; ghost: string }
> = {
  cyan: {
    solid: "bg-neon-cyan/20 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/30 hover:shadow-neon-cyan",
    outline: "border-neon-cyan/50 text-neon-cyan hover:border-neon-cyan hover:bg-neon-cyan/10 hover:shadow-neon-cyan",
    ghost: "text-neon-cyan hover:bg-neon-cyan/10",
  },
  violet: {
    solid: "bg-neon-violet/20 border-neon-violet text-neon-violet hover:bg-neon-violet/30 hover:shadow-neon-violet",
    outline: "border-neon-violet/50 text-neon-violet hover:border-neon-violet hover:bg-neon-violet/10 hover:shadow-neon-violet",
    ghost: "text-neon-violet hover:bg-neon-violet/10",
  },
  amber: {
    solid: "bg-neon-amber/20 border-neon-amber text-neon-amber hover:bg-neon-amber/30 hover:shadow-neon-amber",
    outline: "border-neon-amber/50 text-neon-amber hover:border-neon-amber hover:bg-neon-amber/10 hover:shadow-neon-amber",
    ghost: "text-neon-amber hover:bg-neon-amber/10",
  },
  green: {
    solid: "bg-neon-green/20 border-neon-green text-neon-green hover:bg-neon-green/30 hover:shadow-neon-green",
    outline: "border-neon-green/50 text-neon-green hover:border-neon-green hover:bg-neon-green/10 hover:shadow-neon-green",
    ghost: "text-neon-green hover:bg-neon-green/10",
  },
  blue: {
    solid: "bg-neon-blue/20 border-neon-blue text-neon-blue hover:bg-neon-blue/30 hover:shadow-neon-blue",
    outline: "border-neon-blue/50 text-neon-blue hover:border-neon-blue hover:bg-neon-blue/10 hover:shadow-neon-blue",
    ghost: "text-neon-blue hover:bg-neon-blue/10",
  },
  red: {
    solid: "bg-neon-red/20 border-neon-red text-neon-red hover:bg-neon-red/30 hover:shadow-neon-red",
    outline: "border-neon-red/50 text-neon-red hover:border-neon-red hover:bg-neon-red/10 hover:shadow-neon-red",
    ghost: "text-neon-red hover:bg-neon-red/10",
  },
  pink: {
    solid: "bg-neon-pink/20 border-neon-pink text-neon-pink hover:bg-neon-pink/30 hover:shadow-neon-pink",
    outline: "border-neon-pink/50 text-neon-pink hover:border-neon-pink hover:bg-neon-pink/10 hover:shadow-neon-pink",
    ghost: "text-neon-pink hover:bg-neon-pink/10",
  },
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-7 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export function Button({
  children,
  color = "cyan",
  variant = "outline",
  size = "md",
  loading = false,
  leftIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded border font-mono-tech uppercase tracking-wider",
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        colorConfig[color][variant],
        sizeMap[size],
        className
      )}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      {children}
    </button>
  );
}
