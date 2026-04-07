"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export interface RealestateHeroProps {
  businessName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  totalListings?: number;
  colors: { primary: string; accent: string; background: string; text: string };
}

export function Hero({ businessName, heroTitle, heroSubtitle, heroImage, ctaLabel = "Scopri le proprietà", onCtaClick, totalListings, colors }: RealestateHeroProps) {
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
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 3rem", height: "74px", background: navSolid ? "#ffffff" : "transparent", boxShadow: navSolid ? "0 1px 20px rgba(0,0,0,0.1)" : "none", transition: "background 0.4s, box-shadow 0.4s" }}
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      >
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 600, color: navSolid ? colors.primary : "#ffffff" }}>{businessName}</span>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          {["Proprietà", "Servizi", "Chi Siamo", "Contatti"].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: navSolid ? colors.primary : "rgba(255,255,255,0.9)", textDecoration: "none" }}>{item}</a>
          ))}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onCtaClick} style={{ background: colors.accent, color: "#ffffff", border: "none", borderRadius: "3px", padding: "0.5rem 1.3rem", fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>Valutazione gratuita</motion.button>
        </div>
      </motion.nav>

      <section id="hero" style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", overflow: "hidden", background: colors.primary }}>
        <motion.div initial={{ clipPath: "inset(0 50% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 1.2, delay: 0.3, ease: [0.76, 0, 0.24, 1] }} style={{ position: "absolute", right: 0, top: 0, width: "55%", height: "100%" }}>
          <img src={heroImage} alt={businessName} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="eager" />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(26,39,68,0.8) 0%, transparent 60%)" }} />
        </motion.div>
        <div style={{ position: "relative", zIndex: 2, maxWidth: "1200px", margin: "0 auto", padding: "0 4rem", width: "100%", display: "grid", gridTemplateColumns: "55% 45%" }}>
          <div style={{ paddingTop: "5rem" }}>
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", fontWeight: 700, color: colors.accent, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: "1.25rem" }}>Agenzia Immobiliare</motion.p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.2rem, 4.5vw, 4rem)", fontWeight: 700, color: "#ffffff", lineHeight: 1.15, marginBottom: "1.5rem" }}>
              {words.map((w, i) => (
                <motion.span key={i} initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1, duration: 0.7 }} style={{ display: "inline-block", marginRight: "0.3em" }}>{w}</motion.span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "1rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, maxWidth: "440px", marginBottom: "2.5rem" }}>{heroSubtitle}</motion.p>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }} style={{ display: "flex", gap: "1rem" }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onCtaClick} style={{ background: colors.accent, color: "#ffffff", border: "none", borderRadius: "3px", padding: "1rem 2.5rem", fontFamily: "'Nunito', sans-serif", fontSize: "0.92rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}>{ctaLabel}</motion.button>
            </motion.div>
            {totalListings !== undefined && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", marginTop: "2.5rem" }}>{totalListings}+ proprietà disponibili</motion.p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
export default Hero;
