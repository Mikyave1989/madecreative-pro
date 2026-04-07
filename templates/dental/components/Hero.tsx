"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export interface DentalHeroProps {
  businessName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  googleRating?: number;
  reviewCount?: number;
  yearsExperience?: number;
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
}

const wordVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.215, 0.61, 0.355, 1] },
  }),
};

export function Hero({
  businessName,
  heroTitle,
  heroSubtitle,
  heroImage,
  ctaLabel = "Prenota una visita",
  onCtaClick,
  googleRating = 4.9,
  reviewCount = 0,
  yearsExperience = 15,
  colors,
}: DentalHeroProps) {
  const [navSolid, setNavSolid] = useState(false);
  useEffect(() => {
    const h = () => setNavSolid(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const words = heroTitle.split(" ");

  return (
    <>
      {/* Nav */}
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
          height: "70px",
          background: navSolid ? "#ffffff" : "transparent",
          boxShadow: navSolid ? "0 1px 20px rgba(0,0,0,0.08)" : "none",
          transition: "background 0.3s ease, box-shadow 0.3s ease",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "1.2rem",
            fontWeight: 600,
            color: navSolid ? colors.primary : "#ffffff",
          }}
        >
          {businessName}
        </span>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          {["Servizi", "Chi Siamo", "Team", "Contatti"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "0.88rem",
                color: navSolid ? colors.primary : "rgba(255,255,255,0.9)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
            >
              {item}
            </a>
          ))}
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: `0 4px 20px ${colors.accent}40` }}
            whileTap={{ scale: 0.97 }}
            onClick={onCtaClick}
            style={{
              background: colors.accent,
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "0.55rem 1.2rem",
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Prenota
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section
        id="hero"
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: colors.primary,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Left */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "8rem 3rem 4rem 5rem",
            position: "relative",
            zIndex: 2,
          }}
        >
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: colors.accent,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            Studio Dentistico
          </motion.p>

          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(2.4rem, 4.5vw, 4rem)",
              fontWeight: 300,
              color: "#ffffff",
              lineHeight: 1.15,
              marginBottom: "1.5rem",
            }}
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={wordVariants}
                initial="hidden"
                animate="visible"
                style={{ display: "inline-block", marginRight: "0.3em" }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            style={{
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: "1.05rem",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.7,
              maxWidth: "420px",
              marginBottom: "2.5rem",
            }}
          >
            {heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: `0 8px 30px ${colors.accent}40` }}
              whileTap={{ scale: 0.97 }}
              onClick={onCtaClick}
              style={{
                background: colors.accent,
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.9rem 2rem",
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.03em",
              }}
            >
              {ctaLabel}
            </motion.button>
            <motion.a
              href="#servizi"
              whileHover={{ scale: 1.02 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0.9rem 2rem",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                color: "rgba(255,255,255,0.85)",
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              Scopri i servizi
            </motion.a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            style={{
              display: "flex",
              gap: "2.5rem",
              marginTop: "3.5rem",
              paddingTop: "2rem",
              borderTop: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {[
              { value: `${yearsExperience}+`, label: "Anni esperienza" },
              { value: googleRating.toFixed(1), label: "Rating Google" },
              { value: reviewCount > 0 ? `${reviewCount}+` : "500+", label: "Pazienti felici" },
            ].map((stat) => (
              <div key={stat.label}>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "1.75rem",
                    fontWeight: 600,
                    color: colors.accent,
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.5)",
                    margin: "0.25rem 0 0",
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: image */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ position: "relative", overflow: "hidden" }}
        >
          <img
            src={heroImage}
            alt={businessName}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            loading="eager"
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to right, ${colors.primary} 0%, transparent 40%)`,
            }}
          />
        </motion.div>

        <style>{`
          @media (max-width: 768px) {
            #hero { grid-template-columns: 1fr !important; grid-template-rows: 55vh auto !important; }
            #hero > div:first-child { order: 2; padding: 3rem 1.5rem 3rem !important; }
            #hero > div:last-child { order: 1; }
          }
        `}</style>
      </section>
    </>
  );
}

export default Hero;
