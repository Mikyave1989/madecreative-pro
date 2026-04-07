"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export interface EcommerceHeroProps {
  businessName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  badge?: string;
  colors: { primary: string; accent: string; background: string; text: string };
}

export function Hero({ businessName, heroTitle, heroSubtitle, heroImage, ctaLabel = "Scopri la collezione", onCtaClick, badge = "Spedizione gratuita", colors }: EcommerceHeroProps) {
  const [navSolid, setNavSolid] = useState(false);
  useEffect(() => {
    const h = () => setNavSolid(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      <motion.nav
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", height: "64px", background: navSolid ? "#ffffff" : "transparent", boxShadow: navSolid ? "0 1px 15px rgba(0,0,0,0.08)" : "none", transition: "background 0.3s, box-shadow 0.3s" }}
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 600, color: navSolid ? colors.primary : "#ffffff" }}>{businessName}</span>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          {["Collezione", "Novità", "Offerte", "Contatti"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: navSolid ? colors.primary : "rgba(255,255,255,0.9)", textDecoration: "none" }}>{item}</a>
          ))}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onCtaClick} style={{ background: colors.accent, color: "#ffffff", border: "none", borderRadius: "4px", padding: "0.5rem 1.2rem", fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>Shop</motion.button>
        </div>
      </motion.nav>

      <section id="hero" style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <motion.div initial={{ scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 1.5 }} style={{ position: "absolute", inset: 0 }}>
          <img src={heroImage} alt={businessName} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="eager" />
        </motion.div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(26,26,26,0.8) 0%, rgba(26,26,26,0.2) 70%)" }} />
        {badge && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ position: "absolute", top: "100px", left: "3rem", background: colors.accent, color: "#fff", fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", fontWeight: 700, padding: "0.35rem 1rem", borderRadius: "3px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{badge}</motion.div>
        )}
        <div style={{ position: "relative", zIndex: 2, maxWidth: "1200px", margin: "0 auto", padding: "0 3rem", width: "100%" }}>
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: [0.215, 0.61, 0.355, 1] }} style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.5rem, 5.5vw, 5rem)", fontWeight: 700, color: "#ffffff", lineHeight: 1.1, marginBottom: "1.25rem" }}>{heroTitle}</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.6 }} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "1.05rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, maxWidth: "460px", marginBottom: "2.5rem" }}>{heroSubtitle}</motion.p>
          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.6 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onCtaClick} style={{ background: colors.accent, color: "#ffffff", border: "none", borderRadius: "4px", padding: "1rem 2.5rem", fontFamily: "'Nunito', sans-serif", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}>{ctaLabel} →</motion.button>
        </div>
      </section>
    </>
  );
}
export default Hero;
