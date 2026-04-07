"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export interface BeautyHeroProps {
  businessName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
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
  ctaLabel = "Prenota il tuo trattamento",
  onCtaClick,
  colors,
}: BeautyHeroProps) {
  const [navSolid, setNavSolid] = useState(false);
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
          height: "72px",
          background: navSolid ? colors.background : "transparent",
          borderBottom: navSolid ? `1px solid ${colors.border}` : "none",
          transition: "background 0.4s ease",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <span
          style={{
            fontFamily: "'Tenor Sans', sans-serif",
            fontSize: "1.3rem",
            color: navSolid ? colors.primary : "#ffffff",
            letterSpacing: "0.12em",
            transition: "color 0.3s",
          }}
        >
          {businessName}
        </span>
        <div style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
          {["Trattamenti", "Chi Siamo", "Galleria", "Contatti"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              style={{
                fontFamily: "'Questrial', sans-serif",
                fontSize: "0.85rem",
                color: navSolid ? colors.text : "rgba(255,255,255,0.85)",
                textDecoration: "none",
                letterSpacing: "0.05em",
                transition: "color 0.3s",
              }}
            >
              {item}
            </a>
          ))}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCtaClick}
            style={{
              background: "transparent",
              color: navSolid ? colors.primary : "#ffffff",
              border: `1px solid ${navSolid ? colors.primary : "rgba(255,255,255,0.6)"}`,
              borderRadius: "20px",
              padding: "0.5rem 1.4rem",
              fontFamily: "'Questrial', sans-serif",
              fontSize: "0.82rem",
              cursor: "pointer",
              letterSpacing: "0.06em",
              transition: "all 0.3s",
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
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Background */}
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          style={{ position: "absolute", inset: 0 }}
        >
          <img
            src={heroImage}
            alt={businessName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="eager"
          />
        </motion.div>

        {/* Soft overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(42,31,26,0.55) 0%, rgba(42,31,26,0.35) 50%, rgba(42,31,26,0.65) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            padding: "0 2rem",
            maxWidth: "700px",
          }}
        >
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{
              fontFamily: "'Questrial', sans-serif",
              fontSize: "0.78rem",
              color: colors.accent,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            {tagline}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.9, ease: [0.215, 0.61, 0.355, 1] }}
            style={{
              fontFamily: "'Tenor Sans', sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 1.1,
              marginBottom: "1.25rem",
              letterSpacing: "0.03em",
            }}
          >
            {heroTitle}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            style={{ width: "40px", height: "1px", background: colors.accent, margin: "0 auto 1.25rem" }}
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.7 }}
            style={{
              fontFamily: "'Questrial', sans-serif",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.8,
              marginBottom: "2.5rem",
            }}
          >
            {heroSubtitle}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            whileHover={{ scale: 1.04, boxShadow: `0 8px 30px rgba(201,150,122,0.4)` }}
            whileTap={{ scale: 0.97 }}
            onClick={onCtaClick}
            style={{
              background: colors.accent,
              color: "#ffffff",
              border: "none",
              borderRadius: "30px",
              padding: "1rem 2.5rem",
              fontFamily: "'Questrial', sans-serif",
              fontSize: "0.9rem",
              cursor: "pointer",
              letterSpacing: "0.08em",
            }}
          >
            {ctaLabel}
          </motion.button>
        </div>

        <style>{`
          @media (max-width: 768px) {
            #hero > div:last-child { padding: 0 1.25rem !important; }
          }
        `}</style>
      </section>
    </>
  );
}

export default Hero;
