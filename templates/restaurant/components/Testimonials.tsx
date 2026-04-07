"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

export interface Testimonial {
  name: string;
  text: string;
  rating: number;
  date?: string;
  avatar?: string;
}

export interface TestimonialsProps {
  testimonials: Testimonial[];
  googleRating?: number;
  reviewCount?: number;
  featuredQuote?: string;
  featuredAuthor?: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
}

function StarRating({ rating, color }: { rating: number; color: string }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill={i < Math.round(rating) ? color : "transparent"}
          stroke={color}
          strokeWidth="1"
        >
          <path d="M7 1l1.545 3.09L12 4.654l-2.5 2.446.59 3.454L7 8.915l-3.09 1.64.59-3.455L2 4.654l3.455-.563z" />
        </svg>
      ))}
    </div>
  );
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    transition: { duration: 0.4, ease: "easeIn" },
  }),
};

function truncate(text: string, max = 150): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export function Testimonials({
  testimonials,
  googleRating = 4.8,
  reviewCount = 127,
  featuredQuote,
  featuredAuthor,
  colors,
}: TestimonialsProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-60px" });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayTestimonials =
    testimonials.length > 0
      ? testimonials
      : [
          {
            name: "Marco B.",
            text: "Un'esperienza gastronomica indimenticabile. La cucina è autentica, il servizio impeccabile. Torneremo sicuramente!",
            rating: 5,
            date: "Marzo 2024",
          },
          {
            name: "Giulia R.",
            text: "Ottima scelta per una cena romantica. I piatti sono curati in ogni dettaglio, sapori intensi e genuini.",
            rating: 5,
            date: "Febbraio 2024",
          },
          {
            name: "Luca M.",
            text: "Il miglior ristorante della zona! Personale gentilissimo, ambiente accogliente e prezzi onesti.",
            rating: 5,
            date: "Gennaio 2024",
          },
          {
            name: "Alessandra P.",
            text: "Finalmente un posto dove si mangia davvero bene. Ingredienti freschi e ricette tradizionali rivisitate con creatività.",
            rating: 5,
            date: "Dicembre 2023",
          },
        ];

  const advance = useCallback(
    (dir: number) => {
      setDirection(dir);
      setCurrent((c) => (c + dir + displayTestimonials.length) % displayTestimonials.length);
    },
    [displayTestimonials.length]
  );

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => advance(1), 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, advance]);

  const defaultFeaturedQuote =
    featuredQuote ??
    '"Ogni piatto racconta una storia, ogni visita diventa un ricordo. Questo è il nostro impegno verso di voi."';
  const defaultFeaturedAuthor = featuredAuthor ?? "— Lo Chef";

  return (
    <section
      id="recensioni"
      style={{
        background: colors.background,
        padding: "6rem 0",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem" }}>
        {/* Header + Aggregate Rating */}
        <div
          ref={headingRef}
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "4rem",
            flexWrap: "wrap",
            gap: "2rem",
          }}
        >
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={headingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
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
              Cosa dicono i nostri ospiti
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={headingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.7 }}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 300,
                color: colors.primary,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Le Recensioni
            </motion.h2>
          </div>

          {/* Google Rating Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={headingInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
              padding: "1.25rem 2rem",
              background: colors.primary,
              borderRadius: "4px",
            }}
          >
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2.5rem",
                fontWeight: 500,
                color: "#ffffff",
                lineHeight: 1,
              }}
            >
              {googleRating.toFixed(1)}
            </span>
            <StarRating rating={googleRating} color={colors.accent} />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.6)",
                letterSpacing: "0.05em",
              }}
            >
              {reviewCount} recensioni Google
            </span>
          </motion.div>
        </div>

        {/* Featured Quote */}
        <motion.blockquote
          initial={{ opacity: 0, y: 30 }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{
            borderLeft: `3px solid ${colors.accent}`,
            paddingLeft: "2rem",
            margin: "0 0 4rem",
            maxWidth: "700px",
          }}
        >
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.3rem, 2.5vw, 1.7rem)",
              fontWeight: 400,
              fontStyle: "italic",
              color: colors.primary,
              lineHeight: 1.5,
              margin: "0 0 0.75rem",
            }}
          >
            {defaultFeaturedQuote}
          </p>
          <cite
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.85rem",
              color: colors.accent,
              fontStyle: "normal",
              letterSpacing: "0.08em",
            }}
          >
            {defaultFeaturedAuthor}
          </cite>
        </motion.blockquote>

        {/* Carousel */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{ position: "relative" }}
        >
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              minHeight: "220px",
              display: "flex",
              alignItems: "stretch",
            }}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "1.5rem",
                }}
              >
                {Array.from({ length: Math.min(3, displayTestimonials.length) }).map((_, i) => {
                  const t = displayTestimonials[(current + i) % displayTestimonials.length]!;
                  return (
                    <div
                      key={i}
                      style={{
                        background: "#ffffff",
                        borderRadius: "4px",
                        padding: "1.75rem",
                        border: "1px solid rgba(26,18,8,0.07)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      <StarRating rating={t.rating} color={colors.accent} />
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.9rem",
                          color: "#2d2419",
                          lineHeight: 1.7,
                          margin: 0,
                          flex: 1,
                        }}
                      >
                        &ldquo;{truncate(t.text)}&rdquo;
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: colors.primary,
                          }}
                        >
                          {t.name}
                        </span>
                        {t.date && (
                          <span
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: "0.75rem",
                              color: "#6b5c42",
                            }}
                          >
                            {t.date}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              marginTop: "2.5rem",
            }}
          >
            <button
              onClick={() => advance(-1)}
              style={{
                background: "transparent",
                border: `1px solid ${colors.primary}`,
                color: colors.primary,
                width: "40px",
                height: "40px",
                borderRadius: "2px",
                cursor: "pointer",
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Precedente"
            >
              ‹
            </button>

            {/* Dots */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {displayTestimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                  style={{
                    width: i === current ? "24px" : "6px",
                    height: "6px",
                    borderRadius: "3px",
                    background: i === current ? colors.accent : "rgba(26,18,8,0.2)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width 0.3s ease, background 0.3s ease",
                  }}
                  aria-label={`Vai a recensione ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => advance(1)}
              style={{
                background: "transparent",
                border: `1px solid ${colors.primary}`,
                color: colors.primary,
                width: "40px",
                height: "40px",
                borderRadius: "2px",
                cursor: "pointer",
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Successivo"
            >
              ›
            </button>
          </div>
        </div>

        {/* Mobile override */}
        <style>{`
          @media (max-width: 768px) {
            #recensioni .carousel-inner {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}

export default Testimonials;
