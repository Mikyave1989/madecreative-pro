import { cn } from "@/lib/utils";
import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes, HTMLAttributes } from "react";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-border-subtle", className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border-subtle bg-bg-elevated">{children}</thead>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border-subtle/50">{children}</tbody>;
}

export function Tr({
  children,
  className,
  onClick,
  selected,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "transition-colors duration-150",
        onClick && "cursor-pointer",
        "hover:bg-neon-cyan/5",
        selected && "bg-neon-cyan/10",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Th({
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th
      {...props}
      className={cn(
        "px-4 py-3 text-left font-mono-tech text-[10px] uppercase tracking-widest text-slate-500",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td
      {...props}
      className={cn("px-4 py-3 text-sm text-slate-300", className)}
    >
      {children}
    </td>
  );
}

export function TableEmpty({
  message = "No data found",
  colSpan = 8,
}: {
  message?: string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-12 text-center font-mono-tech text-xs text-slate-600"
      >
        {message}
      </td>
    </tr>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (i < 3) return i + 1;
    if (i === 3) return null; // ellipsis
    return totalPages - (6 - i);
  });

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
      <p className="font-mono-tech text-[10px] text-slate-500">
        Page {page} / {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-7 w-7 rounded border border-border-subtle text-xs text-slate-400 hover:border-neon-cyan/50 hover:text-neon-cyan disabled:opacity-30 transition-colors"
        >
          &lt;
        </button>
        {pages.map((p, i) =>
          p === null ? (
            <span key={`ellipsis-${i}`} className="px-1 text-slate-600">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "h-7 w-7 rounded border text-xs transition-colors",
                p === page
                  ? "border-neon-cyan/60 text-neon-cyan bg-neon-cyan/10"
                  : "border-border-subtle text-slate-400 hover:border-neon-cyan/50 hover:text-neon-cyan"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-7 w-7 rounded border border-border-subtle text-xs text-slate-400 hover:border-neon-cyan/50 hover:text-neon-cyan disabled:opacity-30 transition-colors"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
