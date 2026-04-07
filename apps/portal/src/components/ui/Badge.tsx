import React from "react";
import { clsx } from "clsx";
import { type Plan, type ClientStatus } from "@/lib/mockData";

export type BadgeVariant =
  | "indigo"
  | "violet"
  | "amber"
  | "green"
  | "red"
  | "yellow"
  | "gray"
  | "blue"
  | "default"
  | "success";

interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const variantMap: Record<BadgeVariant, string> = {
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  yellow: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  gray: "bg-gray-50 text-gray-700 ring-gray-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  default: "bg-gray-100 text-gray-600 ring-gray-200",
  success: "bg-green-50 text-green-700 ring-green-200",
};

const dotColorMap: Record<BadgeVariant, string> = {
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  gray: "bg-gray-500",
  blue: "bg-blue-500",
  default: "bg-gray-400",
  success: "bg-green-500",
};

export function Badge({
  label,
  variant = "gray",
  size = "sm",
  dot = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset",
        variantMap[variant],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
    >
      {dot && (
        <span
          className={clsx("h-1.5 w-1.5 rounded-full", dotColorMap[variant])}
        />
      )}
      {children ?? label}
    </span>
  );
}

// Badge per piano
export function PlanBadge({ plan, size = "sm" }: { plan: Plan; size?: "sm" | "md" }) {
  const map: Record<Plan, { label: string; variant: BadgeVariant }> = {
    STARTER: { label: "Starter", variant: "indigo" },
    GROWTH: { label: "Growth", variant: "violet" },
    ENTERPRISE: { label: "Enterprise", variant: "amber" },
  };
  const { label, variant } = map[plan];
  return <Badge label={label} variant={variant} size={size} />;
}

// Badge per status cliente
export function StatusBadge({
  status,
}: {
  status: ClientStatus | "ACTIVE" | "AT_RISK" | "PAUSED";
}) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    ACTIVE: { label: "Attivo", variant: "green" },
    AT_RISK: { label: "A rischio", variant: "yellow" },
    PAUSED: { label: "Sospeso", variant: "red" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "gray" };
  return <Badge label={label} variant={variant} dot />;
}

// Badge per status fattura
export function InvoiceStatusBadge({
  status,
}: {
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
}) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    PAID: { label: "Pagata", variant: "green" },
    PENDING: { label: "In attesa", variant: "yellow" },
    FAILED: { label: "Fallita", variant: "red" },
    REFUNDED: { label: "Rimborsata", variant: "blue" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "gray" };
  return <Badge label={label} variant={variant} />;
}
