import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  label?: string;
  error?: string;
}

export function Input({ leftIcon, label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-400"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          {...props}
          className={cn(
            "h-9 w-full rounded border border-border-subtle bg-bg-elevated px-3 text-sm text-slate-200",
            "placeholder:text-slate-600",
            "transition-all duration-200",
            "focus:outline-none focus:border-neon-cyan/60 focus:shadow-neon-cyan focus:bg-bg-elevated",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            leftIcon && "pl-9",
            error && "border-neon-red/60",
            className
          )}
        />
      </div>
      {error && (
        <p className="font-mono-tech text-[10px] text-neon-red">{error}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, children, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={selectId}
          className="font-mono-tech text-[10px] uppercase tracking-widest text-slate-400"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        {...props}
        className={cn(
          "h-9 w-full rounded border border-border-subtle bg-bg-elevated px-3 text-sm text-slate-200",
          "transition-all duration-200",
          "focus:outline-none focus:border-neon-cyan/60 focus:shadow-neon-cyan",
          "disabled:opacity-40",
          className
        )}
      >
        {children}
      </select>
    </div>
  );
}
