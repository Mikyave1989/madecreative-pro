"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export interface ProfessionalHeroProps {
  businessName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  keySkills?: string[];
  colors: { primary: string; accent: string; background: string; text: string };
}

export function Hero({ businessName, heroTitle, heroSubtitle, heroImage, ctaLabel = "Richiedi una consulenza", onCtaClick, keySkills = [], colors }: ProfessionalHeroProps) {
  const [navSolid, setNavSolid] = useState(false);
  useEffect(() => {
    const h = () => setNavSolid(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const words = heroTitle.split(" ");

  return (
    <>
      <motion.nav
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", height: "68px", background: navSolid ? "#ffffff" : "transparent", boxShadow: navSolid ? "0 1px 20px rgba(0,0,0,0.1)" : "none", transition: "all 0.3s" }}
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 600, color: navSolid ? colors.primary : "#ffffff" }}>{businessName}</span>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          {["Servizi", "Chi Siamo", "Portfolio", "Contatti"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: navSolid ? colors.primary : "rgba(255,255,255,0.9)", textDecoration: "none" }}>{item}</a>
          ))}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onCtaClick} style={{ background: colors.accent, color: "#ffffff", border: "none", borderRadius: "4px", padding: "0.5rem 1.3rem", fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>Consulenza</motion.button>
        </div>
      </motion.nav>

      <section id="hero" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: colors.primary, overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "8rem 3rem 4rem 5rem", zIndex: 2 }}>
          {keySkills.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {keySkills.slice(0, 4).map(s => (
                <span key={s} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", fontWeight: 700, color: colors.accent, border: `1px solid rgba(37,99,235,0.3)`, borderRadius: "4px", padding: "0.2rem 0.7rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{s}</span>
              ))}
            </motion.div>
          )}
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.2rem, 4vw, 3.8rem)", fontWeight: 700, color: "#ffffff", lineHeight: 1.2, marginBottom: "1.5rem" }}>
            {words.map((w, i) => (
              <motion.span key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }} style={{ display: "inline-block", marginRight: "0.3em" }}>{w}</motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "1.05rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.7, maxWidth: "420px", marginBottom: "2.5rem" }}>{heroSubtitle}</motion.p>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} style={{ display: "flex", gap: "1rem" }}>
            <motion.button whileHover={{ scale: 1.03, boxShadow: `0 8px 30px ${colors.accent}40` }} whileTap={{ scale: 0.97 }} onClick={onCtaClick} style={{ background: colors.accent, color: "#ffffff", border: "none", borderRadius: "6px", padding: "0.9rem 2rem", fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>{ctaLabel}</motion.button>
            <motion.a href="#portfolio" whileHover={{ scale: 1.02 }} style={{ display: "inline-flex", alignItems: "center", padding: "0.9rem 2rem", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", color: "rgba(255,255,255,0.85)", fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem", textDecoration: "none" }}>Guarda il portfolio</motion.a>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1 }} style={{ position: "relative", overflow: "hidden" }}>
          <img src={heroImage} alt={businessName} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="eager" />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${colors.primary} 0%, transparent 40%)` }} />
        </motion.div>
        <style>{`@media (max-width: 768px) { #hero { grid-template-columns: 1fr !important; } #hero > div:first-child { padding: 6rem 1.5rem 3rem !important; } #hero > div:last-child { display: none; } }`}</style>
      </section>
    </>
  );
}
export default Hero;
