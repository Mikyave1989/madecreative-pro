"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hero } from "./components/Hero.js";
import { Services } from "./components/Services.js";
import { Gallery } from "./components/Gallery.js";
import { Testimonials } from "./components/Testimonials.js";
import { Contact } from "./components/Contact.js";
import type { MenuCategory } from "./components/Services.js";
import type { Testimonial } from "./components/Testimonials.js";
import type { OpeningHours } from "./components/Contact.js";

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface RestaurantTemplateProps {
  // Business info
  businessName: string;
  tagline: string;
  description: string;
  aboutText?: string;

  // Media
  heroImage: string;
  galleryImages: Array<{ url: string; alt?: string; width?: number; height?: number }>;

  // Menu
  menuItems?: MenuCategory[];

  // Reviews
  googleRating?: number;
  reviewCount?: number;
  testimonials?: Testimonial[];
  featuredQuote?: string;
  featuredAuthor?: string;

  // Contact
  address: string;
  phone: string;
  email: string;
  website?: string;
  googleMapsEmbedUrl?: string;
  openingHours?: OpeningHours[];

  // Design
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };

  // Social
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tripadvisor?: string;
  };

  // Generated content
  heroTitle?: string;
  heroSubtitle?: string;
  metaTitle?: string;
  metaDescription?: string;
  cta?: string;
}

// ─── Scroll Progress Bar ───────────────────────────────────────────────────────

function ScrollProgressBar({ color }: { color: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        zIndex: 200,
        background: "rgba(0,0,0,0.1)",
      }}
    >
      <motion.div
        style={{
          height: "100%",
          background: color,
          transformOrigin: "left",
          scaleX: progress / 100,
        }}
        animate={{ scaleX: progress / 100 }}
        transition={{ duration: 0.05 }}
      />
    </div>
  );
}

// ─── About Section ─────────────────────────────────────────────────────────────

function AboutSection({
  businessName,
  description,
  aboutText,
  colors,
}: {
  businessName: string;
  description: string;
  aboutText?: string;
  colors: RestaurantTemplateProps["colors"];
}) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="chi-siamo"
      style={{
        background: "#ffffff",
        padding: "7rem 0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 2rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "5rem",
          alignItems: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.215, 0.61, 0.355, 1] }}
        >
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: colors.accent,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            La nostra storia
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 300,
              color: colors.primary,
              margin: "0 0 1rem",
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
            }}
          >
            Chi Siamo
          </h2>
          <div
            style={{
              width: "50px",
              height: "1px",
              background: colors.accent,
              marginBottom: "1.75rem",
            }}
          />
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "1rem",
              color: "#2d2419",
              lineHeight: 1.8,
              marginBottom: "1.25rem",
            }}
          >
            {description}
          </p>
          {aboutText && (
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.95rem",
                color: "#6b5c42",
                lineHeight: 1.8,
                marginBottom: "2rem",
              }}
            >
              {aboutText}
            </p>
          )}
          <motion.a
            href="#contatti"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.82rem",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: colors.primary,
              textDecoration: "none",
              borderBottom: `1px solid ${colors.accent}`,
              paddingBottom: "0.3rem",
            }}
          >
            Scopri di più
            <span>→</span>
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.215, 0.61, 0.355, 1] }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
        >
          {[
            { value: "15+", label: "Anni di esperienza" },
            { value: "4.9", label: "Rating Google" },
            { value: "200+", label: "Recensioni positive" },
            { value: "100%", label: "Ingredienti freschi" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
              style={{
                padding: "1.5rem",
                background: i % 2 === 0 ? colors.primary : colors.background,
                borderRadius: "4px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "2rem",
                  fontWeight: 500,
                  color: i % 2 === 0 ? "#ffffff" : colors.primary,
                  margin: "0 0 0.25rem",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.75rem",
                  color: i % 2 === 0 ? "rgba(255,255,255,0.7)" : "#6b5c42",
                  margin: 0,
                  letterSpacing: "0.05em",
                }}
              >
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Mobile */}
      <style>{`
        @media (max-width: 768px) {
          #chi-siamo > div {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
        }
      `}</style>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({
  businessName,
  phone,
  email,
  address,
  socialLinks,
  colors,
}: {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  socialLinks?: RestaurantTemplateProps["socialLinks"];
  colors: RestaurantTemplateProps["colors"];
}) {
  return (
    <footer
      style={{
        background: colors.primary,
        color: "rgba(255,255,255,0.7)",
        padding: "4rem 0 2rem",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 2rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: "3rem",
            marginBottom: "3rem",
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.5rem",
                fontWeight: 400,
                color: "#ffffff",
                margin: "0 0 1rem",
              }}
            >
              {businessName}
            </h3>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.85rem",
                lineHeight: 1.7,
                margin: "0 0 1.25rem",
              }}
            >
              {address}
            </p>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.85rem",
                margin: "0 0 0.4rem",
              }}
            >
              <a href={`tel:${phone}`} style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
                {phone}
              </a>
            </p>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.85rem",
                margin: 0,
              }}
            >
              <a href={`mailto:${email}`} style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
                {email}
              </a>
            </p>
          </div>

          <div>
            <h4
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.72rem",
                fontWeight: 500,
                color: colors.accent,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: "0 0 1.25rem",
              }}
            >
              Navigazione
            </h4>
            {["Chi Siamo", "Menu", "Galleria", "Recensioni", "Contatti"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                style={{
                  display: "block",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.6)",
                  textDecoration: "none",
                  marginBottom: "0.6rem",
                  transition: "color 0.2s",
                }}
              >
                {item}
              </a>
            ))}
          </div>

          <div>
            <h4
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.72rem",
                fontWeight: 500,
                color: colors.accent,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: "0 0 1.25rem",
              }}
            >
              Social
            </h4>
            {socialLinks?.instagram && (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.6)",
                  textDecoration: "none",
                  marginBottom: "0.6rem",
                }}
              >
                Instagram
              </a>
            )}
            {socialLinks?.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.6)",
                  textDecoration: "none",
                  marginBottom: "0.6rem",
                }}
              >
                Facebook
              </a>
            )}
            {socialLinks?.tripadvisor && (
              <a
                href={socialLinks.tripadvisor}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.6)",
                  textDecoration: "none",
                }}
              >
                TripAdvisor
              </a>
            )}
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.4)",
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} {businessName}. Tutti i diritti riservati.
          </p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {["Privacy Policy", "Cookie Policy"].map((link) => (
              <a
                key={link}
                href={`/${link.toLowerCase().replace(" ", "-")}`}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.4)",
                  textDecoration: "none",
                }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </footer>
  );
}

// ─── Main Page Template ────────────────────────────────────────────────────────

export function RestaurantTemplate({
  businessName,
  tagline,
  description,
  aboutText,
  heroImage,
  galleryImages,
  menuItems,
  googleRating = 4.8,
  reviewCount = 0,
  testimonials = [],
  featuredQuote,
  featuredAuthor,
  address,
  phone,
  email,
  website,
  googleMapsEmbedUrl,
  openingHours,
  colors,
  fonts,
  socialLinks,
  heroTitle,
  heroSubtitle,
  metaTitle,
  metaDescription,
  cta,
}: RestaurantTemplateProps) {
  const fontsUrl = `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap`;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={fontsUrl} rel="stylesheet" />

      {/* Meta */}
      {metaTitle && <title>{metaTitle}</title>}
      {metaDescription && <meta name="description" content={metaDescription} />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* CSS Reset + Global */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }
        img { max-width: 100%; }
        a { transition: color 0.2s ease, opacity 0.2s ease; }
        a:hover { opacity: 0.85; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
      `}</style>

      {/* Page transition */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Scroll progress */}
        <ScrollProgressBar color={colors.accent} />

        {/* Hero (includes Nav) */}
        <Hero
          businessName={businessName}
          tagline={tagline}
          heroTitle={heroTitle ?? businessName}
          heroSubtitle={heroSubtitle ?? description}
          heroImage={heroImage}
          ctaLabel={cta ?? "Prenota un tavolo"}
          onCtaClick={() => scrollToSection("contatti")}
          colors={colors}
        />

        {/* About */}
        <AboutSection
          businessName={businessName}
          description={description}
          aboutText={aboutText}
          colors={colors}
        />

        {/* Menu Preview */}
        <Services categories={menuItems} colors={colors} />

        {/* Gallery */}
        <Gallery images={galleryImages} colors={colors} />

        {/* Testimonials */}
        <Testimonials
          testimonials={testimonials}
          googleRating={googleRating}
          reviewCount={reviewCount}
          featuredQuote={featuredQuote}
          featuredAuthor={featuredAuthor}
          colors={colors}
        />

        {/* Contact */}
        <Contact
          address={address}
          phone={phone}
          email={email}
          googleMapsEmbedUrl={googleMapsEmbedUrl}
          openingHours={openingHours}
          socialLinks={socialLinks}
          colors={colors}
        />

        {/* Footer */}
        <Footer
          businessName={businessName}
          phone={phone}
          email={email}
          address={address}
          socialLinks={socialLinks}
          colors={colors}
        />
      </motion.div>
    </>
  );
}

export default RestaurantTemplate;
