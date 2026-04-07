"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export interface HotelHeroProps {
  businessName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  starRating?: number;
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export function Hero({
  businessName,
  tagline,
  heroTitle,
  heroSubtitle,
  heroImage,
  ctaLabel = "Prenota il tuo soggiorno",
  onCtaClick,
  starRating = 4,
  colors,
}: HotelHeroProps) {
  const [navSolid, setNavSolid] = useState(false);
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 600], [0, 100]);

  useEffect(() => {
    const h = () => setNavSolid(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      <motion.nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 3rem",
          height: "76px",
          background: navSolid ? colors.primary : "transparent",
          borderBottom: navSolid ? `1px solid rgba(201,168,76,0.15)` : "none",
          transition: "background 0.5s ease",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div>
          <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.15rem" }}>
            {Array.from({ length: starRating }).map((_, i) => (
              <svg key={i} width="10" height="10" viewBox="0 0 10 10" fill={colors.accent}>
                <path d="M5 0l1.12 2.26L8.5 2.62l-1.75 1.7.41 2.41L5 5.5 2.84 6.73l.41-2.41L1.5 2.62l2.38-.36z" />
              </svg>
            ))}
          </div>
          <span
            style={{
              fontFamily: "'Italiana', serif",
              fontSize: "1.4rem",
              color: "#ffffff",
              letterSpacing: "0.1em",
            }}
          >
            {businessName}
          </span>
        </div>
        <div style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
          {["Camere", "Esperienze", "Ristorante", "Contatti"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              style={{
                fontFamily: "'Crimson Text', serif",
                fontSize: "0.95rem",
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                letterSpacing: "0.05em",
              }}
            >
              {item}
            </a>
          ))}
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: `${colors.accent}dd` }}
            whileTap={{ scale: 0.97 }}
            onClick={onCtaClick}
            style={{
              background: colors.accent,
              color: colors.primary,
              border: "none",
              borderRadius: "2px",
              padding: "0.55rem 1.5rem",
              fontFamily: "'Crimson Text', serif",
              fontSize: "0.92rem",
              cursor: "pointer",
              letterSpacing: "0.06em",
              fontWeight: 600,
            }}
          >
            Prenota
          </motion.button>
        </div>
      </motion.nav>

      <section
        id="hero"
        style={{
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <motion.div style={{ position: "absolute", inset: "-10%", y: imageY }}>
          <img
            src={heroImage}
            alt={businessName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="eager"
          />
        </motion.div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(28,22,16,0.8) 0%, rgba(28,22,16,0.2) 70%)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 4rem",
            width: "100%",
          }}
        >
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{
              fontFamily: "'Crimson Text', serif",
              fontSize: "1rem",
              fontStyle: "italic",
              color: colors.accent,
              letterSpacing: "0.1em",
              marginBottom: "1rem",
            }}
          >
            {tagline}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 1, ease: [0.215, 0.61, 0.355, 1] }}
            style={{
              fontFamily: "'Italiana', serif",
              fontSize: "clamp(3rem, 7vw, 7rem)",
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 0.95,
              marginBottom: "1.5rem",
              letterSpacing: "0.02em",
            }}
          >
            {heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7 }}
            style={{
              fontFamily: "'Crimson Text', serif",
              fontSize: "1.2rem",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.7,
              maxWidth: "480px",
              marginBottom: "2.5rem",
              fontStyle: "italic",
            }}
          >
            {heroSubtitle}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            whileHover={{ scale: 1.02, boxShadow: `0 8px 40px rgba(201,168,76,0.4)` }}
            whileTap={{ scale: 0.97 }}
            onClick={onCtaClick}
            style={{
              background: colors.accent,
              color: colors.primary,
              border: "none",
              borderRadius: "2px",
              padding: "1.1rem 3rem",
              fontFamily: "'Crimson Text', serif",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.1em",
            }}
          >
            {ctaLabel}
          </motion.button>
        </div>

        <style>{`
          @media (max-width: 768px) {
            #hero > div:last-child { padding: 0 1.5rem !important; }
            #hero h1 { font-size: clamp(2.5rem, 12vw, 4rem) !important; }
          }
        `}</style>
      </section>
    </>
  );
}

export default Hero;
