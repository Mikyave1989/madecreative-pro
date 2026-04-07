import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#06080d",
          sidebar: "#0a0d14",
          card: "#0d1117",
          elevated: "#111827",
        },
        neon: {
          cyan: "#00f0ff",
          violet: "#a855f7",
          amber: "#f59e0b",
          green: "#10b981",
          blue: "#3b82f6",
          red: "#ef4444",
          pink: "#ec4899",
        },
        border: {
          subtle: "#1e2533",
          neon: "#1e3a4a",
        },
      },
      fontFamily: {
        orbitron: ["var(--font-orbitron)", "monospace"],
        mono: ["var(--font-share-tech-mono)", "monospace"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
      animation: {
        scanline: "scanline 8s linear infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "grid-shimmer": "gridShimmer 4s ease-in-out infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 5px currentColor" },
          "50%": { boxShadow: "0 0 20px currentColor, 0 0 40px currentColor" },
        },
        gridShimmer: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
      },
      boxShadow: {
        "neon-cyan": "0 0 10px #00f0ff40, 0 0 20px #00f0ff20",
        "neon-violet": "0 0 10px #a855f740, 0 0 20px #a855f720",
        "neon-amber": "0 0 10px #f59e0b40, 0 0 20px #f59e0b20",
        "neon-green": "0 0 10px #10b98140, 0 0 20px #10b98120",
        "neon-blue": "0 0 10px #3b82f640, 0 0 20px #3b82f620",
        "neon-red": "0 0 10px #ef444440, 0 0 20px #ef444420",
        "neon-pink": "0 0 10px #ec489940, 0 0 20px #ec489920",
      },
    },
  },
  plugins: [],
};

export default config;
