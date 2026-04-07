"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "./Card";

interface KpiCardProps {
  label: string;
  value: number;
  previousValue: number;
  unit?: string;
  prefix?: string;
  icon?: React.ReactNode;
  animate?: boolean;
}

function useCountUp(target: number, duration = 1200, enabled = true) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setCount(target);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, enabled]);

  return count;
}

export function KpiCard({
  label,
  value,
  previousValue,
  unit,
  prefix,
  icon,
  animate = true,
}: KpiCardProps) {
  const displayValue = useCountUp(value, 1200, animate);

  const diff = value - previousValue;
  const pct =
    previousValue > 0 ? Math.round((diff / previousValue) * 100) : 0;
  const isUp = diff > 0;
  const isDown = diff < 0;
  const isNeutral = diff === 0;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums tracking-tight">
            {prefix}
            {displayValue.toLocaleString("it-IT")}
            {unit && (
              <span className="ml-1 text-base font-medium text-gray-400">
                {unit}
              </span>
            )}
          </p>
        </div>
        {icon && (
          <div className="ml-4 p-2 bg-indigo-50 rounded-lg text-indigo-600">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {isNeutral ? (
          <Minus className="w-4 h-4 text-gray-400" />
        ) : isUp ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span
          className={clsx(
            "text-sm font-medium tabular-nums",
            isNeutral && "text-gray-500",
            isUp && "text-green-600",
            isDown && "text-red-600"
          )}
        >
          {isUp ? "+" : ""}
          {pct}%
        </span>
        <span className="text-xs text-gray-400">vs mese scorso</span>
      </div>
    </Card>
  );
}
