"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

export interface GalleryProps {
  images: Array<{
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  }>;
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
}

const wipeVariants = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  visible: (i: number) => ({
    clipPath: "inset(0 0% 0 0)",
    transition: {
      delay: i * 0.08,
      duration: 0.8,
      ease: [0.76, 0, 0.24, 1],
    },
  }),
};

// Distribute images into 5 columns for masonry
function distributeToColumns<T>(items: T[], numCols: number): T[][] {
  const cols: T[][] = Array.from({ length: numCols }, () => []);
  items.forEach((item, i) => {
    cols[i % numCols]!.push(item);
  });
  return cols;
}

function LightboxModal({
  images,
  initialIndex,
  onClose,
  colors,
}: {
  images: GalleryProps["images"];
  initialIndex: number;
  onClose: () => void;
  colors: GalleryProps["colors"];
}) {
  const [current, setCurrent] = useState(initialIndex);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % images.length);
      if (e.key === "ArrowLeft") setCurrent((c) => (c - 1 + images.length) % images.length);
      if (e.key === "Escape") onClose();
    },
    [images.length, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  const img = images[current];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(10, 7, 3, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "zoom-out",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "1.5rem",
          right: "1.5rem",
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.7)",
          fontSize: "2rem",
          cursor: "pointer",
          lineHeight: 1,
          zIndex: 10,
        }}
        aria-label="Chiudi"
      >
        ×
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c - 1 + images.length) % images.length); }}
        style={{
          position: "absolute",
          left: "1.5rem",
          background: "transparent",
          border: `1px solid rgba(201,168,76,0.3)`,
          color: colors.accent,
          width: "48px",
          height: "48px",
          borderRadius: "2px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
        }}
        aria-label="Precedente"
      >
        ‹
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.35 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "min(90vw, 1100px)",
            maxHeight: "85vh",
            cursor: "default",
          }}
        >
          <img
            src={img?.url ?? ""}
            alt={img?.alt ?? "Gallery image"}
            style={{
              maxWidth: "100%",
              maxHeight: "85vh",
              objectFit: "contain",
              display: "block",
              borderRadius: "2px",
            }}
          />
        </motion.div>
      </AnimatePresence>

      <button
        onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c + 1) % images.length); }}
        style={{
          position: "absolute",
          right: "1.5rem",
          background: "transparent",
          border: `1px solid rgba(201,168,76,0.3)`,
          color: colors.accent,
          width: "48px",
          height: "48px",
          borderRadius: "2px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
        }}
        aria-label="Successivo"
      >
        ›
      </button>

      <div
        style={{
          position: "absolute",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.8rem",
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.1em",
        }}
      >
        {current + 1} / {images.length}
      </div>
    </motion.div>
  );
}

export function Gallery({ images, colors }: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-60px" });

  const displayImages =
    images.length > 0
      ? images
      : Array.from({ length: 10 }, (_, i) => ({
          url: `https://images.unsplash.com/photo-${1414235077428 + i * 1000}?w=600&auto=format`,
          alt: `Foto ristorante ${i + 1}`,
        }));

  const columns = distributeToColumns(displayImages, 5);

  return (
    <>
      <section
        ref={sectionRef}
        id="galleria"
        style={{
          background: colors.primary,
          padding: "6rem 0",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 2rem" }}>
          {/* Header */}
          <div ref={headingRef} style={{ textAlign: "center", marginBottom: "3.5rem" }}>
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
              Il nostro mondo
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={headingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.7 }}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 300,
                color: "#ffffff",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Galleria
            </motion.h2>
          </div>

          {/* Masonry grid — 5 columns desktop */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "0.75rem",
            }}
          >
            {columns.map((col, colIndex) => (
              <div key={colIndex} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {col.map((img, imgIndex) => {
                  const globalIndex = columns
                    .slice(0, colIndex)
                    .reduce((acc, c) => acc + c.length, 0) + imgIndex;
                  return (
                    <GalleryImage
                      key={globalIndex}
                      img={img}
                      globalIndex={globalIndex}
                      onClick={() => setLightboxIndex(globalIndex)}
                      colors={colors}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Mobile override */}
          <style>{`
            @media (max-width: 768px) {
              #galleria .masonry-grid {
                grid-template-columns: repeat(2, 1fr) !important;
              }
            }
          `}</style>
        </div>
      </section>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <LightboxModal
            images={displayImages}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            colors={colors}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function GalleryImage({
  img,
  globalIndex,
  onClick,
  colors,
}: {
  img: { url: string; alt?: string };
  globalIndex: number;
  onClick: () => void;
  colors: GalleryProps["colors"];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      custom={globalIndex % 5}
      variants={wipeVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      onClick={onClick}
      style={{
        position: "relative",
        cursor: "zoom-in",
        overflow: "hidden",
        borderRadius: "2px",
        aspectRatio: globalIndex % 3 === 0 ? "4/5" : "4/3",
      }}
    >
      <motion.img
        src={img.url}
        alt={img.alt ?? "Foto ristorante"}
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
        whileHover={{ scale: 1.06 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, transparent, rgba(26,18,8,0.5))`,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          padding: "0.75rem",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: `1px solid ${colors.accent}`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.accent,
            fontSize: "1.1rem",
          }}
        >
          +
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Gallery;
