"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

export interface HeroProps {
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

function splitToChars(text: string): string[] {
  return text.split("").map((char) => (char === " " ? "\u00A0" : char));
}

const charVariants = {
  hidden: { opacity: 0, y: 30, rotateX: -40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: 0.05 * i,
      duration: 0.6,
      ease: [0.215, 0.61, 0.355, 1],
    },
  }),
};

const imageWipeVariants = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  visible: {
    clipPath: "inset(0 0% 0 0)",
    transition: { duration: 1.2, delay: 0.3, ease: [0.76, 0, 0.24, 1] },
  },
};

const subtitleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 1.2, duration: 0.7, ease: "easeOut" },
  },
};

const ctaVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 1.5, duration: 0.6, ease: "easeOut" },
  },
};

export function Hero({
  businessName,
  tagline,
  heroTitle,
  heroSubtitle,
  heroImage,
  ctaLabel = "Prenota un tavolo",
  onCtaClick,
  colors,
}: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Scroll-based parallax
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 600], [0, 80]);
  const textY = useTransform(scrollY, [0, 600], [0, -40]);

  // Nav transparency
  const [navSolid, setNavSolid] = useState(false);
  useEffect(() => {
    const handleScroll = () => setNavSolid(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mouse reactive parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;
    mouseX.set(cx * 0.015);
    mouseY.set(cy * 0.015);
  };

  // Magnetic CTA
  const ctaRef = useRef<HTMLButtonElement>(null);
  const ctaMagnetX = useMotionValue(0);
  const ctaMagnetY = useMotionValue(0);
  const ctaSpringX = useSpring(ctaMagnetX, { stiffness: 200, damping: 15 });
  const ctaSpringY = useSpring(ctaMagnetY, { stiffness: 200, damping: 15 });

  const handleCtaMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    ctaMagnetX.set((e.clientX - rect.left - rect.width / 2) * 0.4);
    ctaMagnetY.set((e.clientY - rect.top - rect.height / 2) * 0.4);
  };
  const handleCtaMouseLeave = () => {
    ctaMagnetX.set(0);
    ctaMagnetY.set(0);
  };

  const headingChars = splitToChars(heroTitle);

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
          height: "72px",
          backgroundColor: navSolid ? colors.primary : "transparent",
          backdropFilter: navSolid ? "blur(12px)" : "none",
          borderBottom: navSolid ? `1px solid rgba(201,168,76,0.15)` : "none",
          transition: "background-color 0.4s ease, backdrop-filter 0.4s ease, border-bottom 0.4s ease",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.4rem",
            fontWeight: 500,
            color: "#ffffff",
            letterSpacing: "0.05em",
          }}
        >
          {businessName}
        </span>
        <div
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          {["Menu", "Chi Siamo", "Galleria", "Contatti"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.85rem",
                fontWeight: 400,
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "color 0.2s ease",
              }}
            >
              {item}
            </a>
          ))}
          <motion.button
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: colors.primary,
              background: colors.accent,
              border: "none",
              borderRadius: "2px",
              padding: "0.55rem 1.2rem",
              cursor: "pointer",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCtaClick}
          >
            Prenota
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        ref={sectionRef}
        onMouseMove={handleMouseMove}
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          overflow: "hidden",
          background: colors.primary,
        }}
        id="hero"
      >
        {/* Left: Text */}
        <motion.div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "8rem 4rem 4rem 5rem",
            position: "relative",
            zIndex: 2,
            y: textY,
            x: springX,
          }}
        >
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: colors.accent,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            {tagline}
          </motion.p>

          {/* Heading with character reveal */}
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.8rem, 5vw, 5rem)",
              fontWeight: 300,
              lineHeight: 1.05,
              color: "#ffffff",
              marginBottom: "1.5rem",
              letterSpacing: "-0.02em",
              overflow: "hidden",
            }}
          >
            {headingChars.map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={charVariants}
                initial="hidden"
                animate="visible"
                style={{ display: "inline-block" }}
              >
                {char}
              </motion.span>
            ))}
          </h1>

          {/* Accent line */}
          <motion.div
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
            style={{
              width: "60px",
              height: "1px",
              background: colors.accent,
              marginBottom: "1.5rem",
            }}
          />

          {/* Subtitle */}
          <motion.p
            variants={subtitleVariants}
            initial="hidden"
            animate="visible"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "1.05rem",
              fontWeight: 300,
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.7,
              maxWidth: "420px",
              marginBottom: "2.5rem",
            }}
          >
            {heroSubtitle}
          </motion.p>

          {/* CTA */}
          <motion.div variants={ctaVariants} initial="hidden" animate="visible">
            <motion.button
              ref={ctaRef}
              onMouseMove={handleCtaMouseMove}
              onMouseLeave={handleCtaMouseLeave}
              onClick={onCtaClick}
              style={{
                x: ctaSpringX,
                y: ctaSpringY,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.85rem",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: colors.primary,
                background: colors.accent,
                border: "none",
                borderRadius: "2px",
                padding: "1rem 2rem",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {ctaLabel}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            style={{
              position: "absolute",
              bottom: "2.5rem",
              left: "5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              style={{
                width: "1px",
                height: "40px",
                background: `linear-gradient(to bottom, ${colors.accent}, transparent)`,
              }}
            />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                writingMode: "vertical-rl",
              }}
            >
              Scopri
            </span>
          </motion.div>
        </motion.div>

        {/* Right: Image */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
          }}
        >
          <motion.div
            variants={imageWipeVariants}
            initial="hidden"
            animate="visible"
            style={{
              position: "absolute",
              inset: 0,
            }}
          >
            <motion.div
              ref={imageRef}
              style={{
                position: "absolute",
                inset: "-10%",
                y: imageY,
                x: springX,
              }}
            >
              <img
                src={heroImage}
                alt={`${businessName} - ristorante`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
                loading="eager"
              />
            </motion.div>

            {/* Grain texture overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
                backgroundSize: "200px 200px",
                mixBlendMode: "overlay",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />

            {/* Gradient overlay for text readability on mobile */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to right, rgba(26,18,8,0.3) 0%, transparent 60%)",
                zIndex: 2,
              }}
            />
          </motion.div>
        </div>

        {/* Mobile: stacked layout override via style tag */}
        <style>{`
          @media (max-width: 768px) {
            #hero {
              grid-template-columns: 1fr !important;
              grid-template-rows: 60vh auto !important;
            }
            #hero > div:first-child {
              order: 2;
              padding: 3rem 1.5rem 4rem !important;
              align-items: center;
              text-align: center;
            }
            #hero > div:first-child h1 {
              font-size: clamp(2.2rem, 8vw, 3rem) !important;
            }
            #hero > div:last-child {
              order: 1;
              min-height: 60vh;
            }
            #hero nav {
              padding: 0 1.5rem !important;
            }
          }
        `}</style>
      </motion.section>
    </>
  );
}

export default Hero;
