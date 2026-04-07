"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

export interface MenuItem {
  name: string;
  description?: string;
  price?: string;
  image?: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
  image?: string;
}

export interface ServicesProps {
  categories?: MenuCategory[];
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
}

const DEFAULT_CATEGORIES: MenuCategory[] = [
  {
    name: "Antipasti",
    items: [
      { name: "Antipasto della casa", description: "Selezione di salumi, formaggi e verdure grigliate", price: "14" },
      { name: "Bruschette al pomodoro", description: "Pane tostato, pomodorini, basilico, olio EVO", price: "8" },
      { name: "Carpaccio di manzo", description: "Con rucola, parmigiano e limone", price: "16" },
    ],
  },
  {
    name: "Primi Piatti",
    items: [
      { name: "Spaghetti alla carbonara", description: "Guanciale, pecorino, tuorlo d'uovo", price: "16" },
      { name: "Risotto ai funghi porcini", description: "Con parmigiano e tartufo nero", price: "18" },
      { name: "Pappardelle al ragù", description: "Ragù di cinghiale, rosmarino", price: "17" },
    ],
  },
  {
    name: "Secondi Piatti",
    items: [
      { name: "Tagliata di manzo", description: "Con rucola, parmigiano e balsamico", price: "26" },
      { name: "Branzino all'acqua pazza", description: "Con pomodori, olive e capperi", price: "24" },
      { name: "Pollo alla cacciatora", description: "Con olive, capperi e pomodoro", price: "20" },
    ],
  },
  {
    name: "Dolci",
    items: [
      { name: "Tiramisù della casa", description: "Ricetta tradizionale, mascarpone e caffè", price: "8" },
      { name: "Panna cotta", description: "Con coulis di frutti di bosco", price: "7" },
      { name: "Cannoli siciliani", description: "Ricotta fresca, pistacchio", price: "9" },
    ],
  },
];

const categoryVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.7,
      ease: [0.215, 0.61, 0.355, 1],
    },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.07,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

function CategoryCard({
  category,
  index,
  colors,
}: {
  category: MenuCategory;
  index: number;
  colors: ServicesProps["colors"];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      custom={index}
      variants={categoryVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      style={{
        background: "#ffffff",
        borderRadius: "4px",
        overflow: "hidden",
        boxShadow: "0 2px 20px rgba(26,18,8,0.06)",
        border: `1px solid rgba(26,18,8,0.07)`,
      }}
    >
      {category.image && (
        <div
          style={{
            height: "180px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <motion.img
            src={category.image}
            alt={category.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            loading="lazy"
          />
        </div>
      )}
      <div style={{ padding: "1.75rem 2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "1px",
              background: colors.accent,
            }}
          />
          <h3
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.4rem",
              fontWeight: 500,
              color: colors.primary,
              margin: 0,
              letterSpacing: "0.02em",
            }}
          >
            {category.name}
          </h3>
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {category.items.map((item, i) => (
            <motion.li
              key={item.name}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "0.8rem 0",
                borderBottom: i < category.items.length - 1 ? `1px solid rgba(26,18,8,0.07)` : "none",
                gap: "1rem",
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    color: colors.primary,
                    margin: "0 0 0.2rem",
                  }}
                >
                  {item.name}
                </p>
                {item.description && (
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.82rem",
                      color: "#6b5c42",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.description}
                  </p>
                )}
              </div>
              {item.price && (
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: colors.accent,
                    whiteSpace: "nowrap",
                    paddingTop: "2px",
                  }}
                >
                  € {item.price}
                </span>
              )}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export function Services({ categories, colors }: ServicesProps) {
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-60px" });
  const displayCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <section
      id="menu"
      style={{
        background: colors.background,
        padding: "6rem 0",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 2rem",
        }}
      >
        {/* Section header */}
        <div ref={headingRef} style={{ textAlign: "center", marginBottom: "4rem" }}>
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
            La nostra cucina
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
              margin: "0 0 1rem",
              letterSpacing: "-0.01em",
            }}
          >
            Il Nostro Menu
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={headingInView ? { scaleX: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              width: "50px",
              height: "1px",
              background: colors.accent,
              margin: "0 auto",
            }}
          />
        </div>

        {/* Categories grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "2rem",
          }}
        >
          {displayCategories.map((cat, i) => (
            <CategoryCard key={cat.name} category={cat} index={i} colors={colors} />
          ))}
        </div>

        {/* Mobile override */}
        <style>{`
          @media (max-width: 768px) {
            #menu > div > div:last-child {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}

export default Services;
