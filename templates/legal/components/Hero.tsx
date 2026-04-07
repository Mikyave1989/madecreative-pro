"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export interface LegalHeroProps {
  businessName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  credentials?: string[];
  foundedYear?: number;
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
  ctaLabel = "Consulenza gratuita",
  onCtaClick,
  credentials = ["Iscritto all'Albo", "Patrocinante Corte di Cassazione"],
  foundedYear,
  colors,
}: LegalHeroProps) {
  const [navSolid, setNavSolid] = useState(false);
  useEffect(() => {
    const h = () => setNavSolid(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const words = heroTitle.split(" ");
  const yearsActive = foundedYear ? new Date().getFullYear() - foundedYear : undefined;

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
          background: navSolid ? colors.primary : "transparent",
          borderBottom: navSolid ? `1px solid rgba(197,160,40,0.15)` : "none",
          transition: "background 0.4s ease",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <span
          style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "0.04em",
          }}
        >
          {businessName}
        </span>
        <div style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
          {["Aree di pratica", "Chi siamo", "Team", "Contatti"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              style={{
                fontFamily: "'Karla', sans-serif",
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.8)",
                textDecoration: "none",
                letterSpacing: "0.05em",
              }}
            >
              {item}
            </a>
          ))}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCtaClick}
            style={{
              background: "transparent",
              color: colors.accent,
              border: `1px solid ${colors.accent}`,
              borderRadius: "2px",
              padding: "0.5rem 1.25rem",
              fontFamily: "'Karla', sans-serif",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.06em",
            }}
          >
            Consulenza
          </motion.button>
        </div>
      </motion.nav>

      <section
        id="hero"
        style={{
          minHeight: "100vh",
          background: colors.primary,
          display: "grid",
          gridTemplateColumns: "55% 45%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "9rem 4rem 5rem 6rem",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.75rem" }}
          >
            {credentials.map((cred) => (
              <span
                key={cred}
                style={{
                  fontFamily: "'Karla', sans-serif",
                  fontSize: "0.72rem",
                  color: colors.accent,
                  border: `1px solid rgba(197,160,40,0.35)`,
                  borderRadius: "2px",
                  padding: "0.25rem 0.7rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {cred}
              </span>
            ))}
          </motion.div>

          <h1
            style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: "clamp(2.2rem, 4vw, 3.5rem)",
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 1.2,
              marginBottom: "1.5rem",
            }}
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.7, ease: [0.215, 0.61, 0.355, 1] }}
                style={{ display: "inline-block", marginRight: "0.3em" }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            style={{ width: "60px", height: "2px", background: colors.accent, marginBottom: "1.5rem" }}
          />

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            style={{
              fontFamily: "'Karla', sans-serif",
              fontSize: "1.05rem",
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.8,
              maxWidth: "460px",
              marginBottom: "2.5rem",
            }}
          >
            {heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
          >
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: `${colors.accent}ee` }}
              whileTap={{ scale: 0.97 }}
              onClick={onCtaClick}
              style={{
                background: colors.accent,
                color: colors.primary,
                border: "none",
                borderRadius: "2px",
                padding: "1rem 2.5rem",
                fontFamily: "'Karla', sans-serif",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {ctaLabel}
            </motion.button>
          </motion.div>

          {yearsActive && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.8 }}
              style={{
                fontFamily: "'Karla', sans-serif",
                fontSize: "0.82rem",
                color: "rgba(255,255,255,0.4)",
                marginTop: "3rem",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: "1.5rem",
              }}
            >
              {yearsActive} anni di esperienza legale
            </motion.p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          style={{ position: "relative", overflow: "hidden" }}
        >
          <img
            src={heroImage}
            alt={businessName}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to right, ${colors.primary} 0%, rgba(26,26,46,0.2) 100%)`,
            }}
          />
        </motion.div>

        <style>{`
          @media (max-width: 768px) {
            #hero { grid-template-columns: 1fr !important; }
            #hero > div:first-child { padding: 6rem 1.5rem 3rem !important; }
            #hero > div:last-child { display: none; }
          }
        `}</style>
      </section>
    </>
  );
}

export default Hero;
