"use client";

import { useRef, useEffect } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import type { Translations } from "@/lib/i18n";

interface ResultsSectionProps {
  t: Translations;
}

function MetricCounter({
  metric,
  index,
  inView,
}: {
  metric: Translations["results"]["metrics"][0];
  index: number;
  inView: boolean;
}) {
  const count = useMotionValue(0);
  const isDecimal = metric.numericValue < 10 && !Number.isInteger(metric.numericValue);
  const displayCount = useTransform(count, (v) =>
    isDecimal ? v.toFixed(1) : Math.round(v).toLocaleString()
  );

  useEffect(() => {
    if (inView) {
      const controls = animate(count, metric.numericValue, {
        duration: 2.5,
        delay: index * 0.3,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [inView, count, metric.numericValue, index]);

  const colors = ["#00f0ff", "#f59e0b", "#a855f7"] as const;
  const color = colors[index % colors.length]!;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="text-center"
    >
      <div
        className="font-heading text-6xl sm:text-8xl font-bold mb-3"
        style={{ color }}
      >
        <span>{metric.prefix}</span>
        <motion.span>{displayCount}</motion.span>
        <span>{metric.suffix}</span>
      </div>
      <p className="text-white/50 text-base font-medium">{metric.label}</p>
    </motion.div>
  );
}

export function ResultsSection({ t }: ResultsSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="results" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-900/30 text-green-400 text-xs font-semibold uppercase tracking-widest border border-green-800/40">
            {t.results.sectionLabel}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading text-4xl sm:text-5xl font-bold text-white text-center mb-4"
        >
          {t.results.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-white/50 text-center max-w-xl mx-auto mb-20"
        >
          {t.results.subtitle}
        </motion.p>

        {/* Metrics */}
        <div className="grid md:grid-cols-3 gap-16 relative">
          {/* Dividers */}
          <div className="hidden md:block absolute inset-y-0 left-1/3 w-px bg-white/10" />
          <div className="hidden md:block absolute inset-y-0 left-2/3 w-px bg-white/10" />

          {t.results.metrics.map((metric, i) => (
            <MetricCounter key={i} metric={metric} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
