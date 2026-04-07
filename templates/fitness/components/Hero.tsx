"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export interface FitnessHeroProps {
  businessName: string;
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
  heroTitle,
  heroSubtitle,
  heroImage,
  ctaLabel = "Inizia ora — gratis",
  onCtaClick,
  colors,
}: FitnessHeroProps) {
  const [navSolid, setNavSolid] = useState(false);
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 500], [0, 60]);

  useEffect(() => {
    const h = () => setNavSolid(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const letters = heroTitle.split("").map((ch) => (ch === " " ? "\u00A0" : ch));

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
          padding: "0 2.5rem",
          height: "68px",
          background: navSolid ? "rgba(13,13,13,0.95)" : "transparent",
          backdropFilter: navSolid ? "blur(10px)" : "none",
          transition: "background 0.3s ease",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span
          style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: "1.6rem",
            color: "#ffffff",
            letterSpacing: "0.08em",
          }}
        >
          {businessName}
        </span>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          {["Programmi", "Trainer", "Prezzi", "Contatti"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: "0.88rem",
                fontWeight: 500,
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {item}
            </a>
          ))}
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: `${colors.accent}dd` }}
            whileTap={{ scale: 0.95 }}
            onClick={onCtaClick}
            style={{
              background: colors.accent,
              color: "#ffffff",
              border: "none",
              borderRadius: "3px",
              padding: "0.55rem 1.3rem",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Inizia
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
          background: "#000",
        }}
      >
        {/* Background image with parallax */}
        <motion.div
          style={{
            position: "absolute",
            inset: "-10%",
            y: imageY,
          }}
        >
          <img
            src={heroImage}
            alt={businessName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="eager"
          />
        </motion.div>

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%)",
          }}
        />

        {/* Accent diagonal stripe */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "4px",
            background: colors.accent,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 3rem",
            width: "100%",
          }}
        >
          <motion.p
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: colors.accent,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            {businessName}
          </motion.p>

          <h1
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: "clamp(4rem, 10vw, 9rem)",
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 0.9,
              marginBottom: "1.5rem",
              letterSpacing: "0.02em",
            }}
          >
            {letters.map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.03, duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
                style={{ display: "inline-block" }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "1.15rem",
              fontWeight: 300,
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.6,
              maxWidth: "500px",
              marginBottom: "2.5rem",
            }}
          >
            {heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: `0 0 40px ${colors.accent}60` }}
              whileTap={{ scale: 0.96 }}
              onClick={onCtaClick}
              style={{
                background: colors.accent,
                color: "#ffffff",
                border: "none",
                borderRadius: "3px",
                padding: "1rem 2.5rem",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {ctaLabel}
            </motion.button>
            <motion.a
              href="#programmi"
              whileHover={{ scale: 1.02, borderColor: colors.accent, color: colors.accent }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1rem 2rem",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "3px",
                color: "rgba(255,255,255,0.85)",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "0.9rem",
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                transition: "border-color 0.2s, color 0.2s",
              }}
            >
              I programmi →
            </motion.a>
          </motion.div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            #hero > div:last-child { padding: 0 1.5rem !important; }
            #hero h1 { font-size: clamp(3rem, 15vw, 5rem) !important; }
          }
        `}</style>
      </section>
    </>
  );
}

export default Hero;
