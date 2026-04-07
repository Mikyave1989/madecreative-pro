"use client";

import { useRef } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import type { Translations } from "@/lib/i18n";

interface ProblemSectionProps {
  t: Translations;
}

function CounterCard({
  stat,
  index,
  inView,
}: {
  stat: Translations["problem"]["stats"][0];
  index: number;
  inView: boolean;
}) {
  const count = useMotionValue(0);
  const isDecimal = !Number.isInteger(stat.numericValue);
  const displayCount = useTransform(count, (v) =>
    isDecimal ? v.toFixed(1) : Math.round(v).toLocaleString("de-DE")
  );

  useEffect(() => {
    if (inView) {
      const controls = animate(count, stat.numericValue, {
        duration: 2,
        delay: index * 0.2,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [inView, count, stat.numericValue, index]);

  const colors = ["#00f0ff", "#a855f7", "#f59e0b"] as const;
  const color = colors[index % colors.length]!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden"
    >
      {/* Color accent top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />

      {/* Value */}
      <div className="mb-4">
        <div
          className="font-heading text-6xl font-bold leading-none"
          style={{ color }}
        >
          <motion.span>{displayCount}</motion.span>
          <span className="text-4xl">{stat.suffix}</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{stat.label}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{stat.description}</p>

      {/* Background decoration */}
      <div
        className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
        style={{ background: color }}
      />
    </motion.div>
  );
}

export function ProblemSection({ t }: ProblemSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold uppercase tracking-widest border border-red-100">
            {t.problem.sectionLabel}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading text-4xl sm:text-5xl font-bold text-gray-900 text-center mb-4"
        >
          {t.problem.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-500 text-center max-w-2xl mx-auto mb-16"
        >
          {t.problem.subtitle}
        </motion.p>

        <div className="grid md:grid-cols-3 gap-6">
          {t.problem.stats.map((stat, i) => (
            <CounterCard key={i} stat={stat} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
