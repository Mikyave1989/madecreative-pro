"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import type { Translations } from "@/lib/i18n";

interface HeroSectionProps {
  t: Translations;
  locale: string;
}

function CharReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className} aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.03,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="inline-block"
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

export function HeroSection({ t, locale }: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 80 };
  const bgX = useSpring(useTransform(mouseX, [0, 1], [-30, 30]), springConfig);
  const bgY = useSpring(useTransform(mouseY, [0, 1], [-20, 20]), springConfig);
  const orb1X = useSpring(useTransform(mouseX, [0, 1], [-60, 60]), springConfig);
  const orb1Y = useSpring(useTransform(mouseY, [0, 1], [-40, 40]), springConfig);
  const orb2X = useSpring(useTransform(mouseX, [0, 1], [40, -40]), springConfig);
  const orb2Y = useSpring(useTransform(mouseY, [0, 1], [30, -30]), springConfig);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]"
    >
      {/* Parallax grid */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{ x: bgX, y: bgY }}
      >
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#f59e0b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </motion.div>

      {/* Ambient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
          x: orb1X,
          y: orb1Y,
          filter: "blur(80px)",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, #a855f7 0%, transparent 70%)",
          x: orb2X,
          y: orb2Y,
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5"
        style={{
          background: "radial-gradient(circle, #f59e0b 0%, transparent 60%)",
          filter: "blur(120px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b] text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
          {t.hero.badge}
        </motion.div>

        {/* Title */}
        <h1 className="font-heading text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold leading-none mb-6 text-white">
          <CharReveal text={t.hero.title} delay={0.2} />
          <br />
          <CharReveal
            text={t.hero.titleHighlight}
            className="text-[#f59e0b]"
            delay={0.5}
          />
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {t.hero.subtitle}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
        >
          <a
            href={`/${locale}#demo`}
            className="group relative inline-flex items-center gap-2 bg-[#f59e0b] text-[#0a0a0a] px-8 py-4 rounded-2xl text-base font-semibold hover:bg-[#fcd34d] transition-all duration-300 shadow-2xl shadow-amber-500/30 hover:shadow-amber-400/50 hover:-translate-y-0.5"
          >
            <span>{t.hero.cta}</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a
            href={`/${locale}#how-it-works`}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white px-6 py-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all text-sm"
          >
            {t.hero.ctaSecondary}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </motion.div>

        {/* Trust note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="text-sm text-white/30"
        >
          {t.hero.trustNote}
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2"
        >
          <div className="w-1 h-2 rounded-full bg-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
