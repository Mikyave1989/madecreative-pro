"use client";
import React from "react";
import { motion } from "framer-motion";
import { Hero } from "./components/Hero.js";

export interface EcommerceTemplateProps {
  businessName: string;
  tagline: string;
  description: string;
  heroImage: string;
  galleryImages?: Array<{ url: string; alt?: string }>;
  googleRating?: number;
  reviewCount?: number;
  testimonials?: Array<{ name: string; text: string; rating: number; date?: string }>;
  address: string;
  phone: string;
  email: string;
  googleMapsEmbedUrl?: string;
  colors: { primary: string; accent: string; background: string; text: string };
  fonts: { heading: string; body: string };
  socialLinks?: { facebook?: string; instagram?: string };
  heroTitle?: string;
  heroSubtitle?: string;
  metaTitle?: string;
  metaDescription?: string;
  cta?: string;
}

export function EcommerceTemplate(props: EcommerceTemplateProps) {
  const { businessName, tagline, description, heroImage, heroTitle, heroSubtitle, colors, cta, address, phone, email } = props;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; font-family: sans-serif; }
        a { transition: opacity 0.2s ease; }
        a:hover { opacity: 0.85; }
      `}</style>

      <Hero
        businessName={businessName}
        tagline={tagline}
        heroTitle={heroTitle ?? businessName}
        heroSubtitle={heroSubtitle ?? description}
        heroImage={heroImage}
        ctaLabel={cta}
        colors={colors}
      />

      {/* About Section */}
      <section id="chi-siamo" style={{ padding: "6rem 2rem", background: colors.background, maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ fontSize: "0.75rem", color: colors.accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem" }}>Chi siamo</p>
        <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: colors.primary, marginBottom: "1.5rem" }}>{businessName}</h2>
        <p style={{ fontSize: "1rem", color: colors.text, lineHeight: 1.8 }}>{description}</p>
      </section>

      {/* Contact Section */}
      <section id="contatti" style={{ padding: "6rem 2rem", background: colors.primary, color: "#ffffff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "#ffffff", marginBottom: "2rem" }}>Contattaci</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }}>
            <div>
              <p style={{ fontSize: "0.72rem", color: colors.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Indirizzo</p>
              <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>{address}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.72rem", color: colors.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Telefono</p>
              <a href={`tel:${phone}`} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}>{phone}</a>
            </div>
            <div>
              <p style={{ fontSize: "0.72rem", color: colors.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Email</p>
              <a href={`mailto:${email}`} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}>{email}</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#0a0a0a", color: "rgba(255,255,255,0.4)", padding: "2rem", textAlign: "center" }}>
        <p style={{ fontFamily: "sans-serif", fontSize: "0.8rem" }}>
          © {new Date().getFullYear()} {businessName}. Tutti i diritti riservati.
        </p>
      </footer>
    </motion.div>
  );
}

export default EcommerceTemplate;
