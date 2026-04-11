// ─── Premium UI Component Registry ───────────────────────────────────────────
// Curated collection of premium UI patterns inspired by Aceternity UI, Magic UI,
// and other top-tier design libraries. These are injected into generated sites
// to create extraordinary visual experiences.
//
// Components are defined as injectable CSS/JS snippets + HTML patterns that
// the Build Agent uses when constructing final output.
// ─────────────────────────────────────────────────────────────────────────────

import type { AnimationPreset, ComponentVariant } from "./types.js";

// ─── Premium Animation Presets ────────────────────────────────────────────────

export const PREMIUM_ANIMATIONS: Record<string, AnimationPreset> = {
  // ─── Spotlight Effect (Aceternity-inspired) ─────────────────────────────
  spotlight: {
    name: "spotlight",
    type: "spotlight",
    config: {
      css: `
.spotlight-container {
  position: relative;
  overflow: hidden;
}
.spotlight-container::before {
  content: '';
  position: absolute;
  inset: -50%;
  background: radial-gradient(
    600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(var(--accent-rgb), 0.12),
    transparent 60%
  );
  pointer-events: none;
  z-index: 1;
  transition: opacity 0.3s;
}`,
      js: `
document.querySelectorAll('.spotlight-container').forEach(el => {
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', ((e.clientX - rect.left) / rect.width * 100) + '%');
    el.style.setProperty('--mouse-y', ((e.clientY - rect.top) / rect.height * 100) + '%');
  });
});`,
    },
    appliesTo: ["hero", "services", "features"],
  },

  // ─── Aurora Background (Aceternity-inspired) ────────────────────────────
  aurora: {
    name: "aurora",
    type: "aurora",
    config: {
      css: `
.aurora-bg {
  position: absolute; inset: 0; overflow: hidden; z-index: 0;
}
.aurora-bg::after {
  content: '';
  position: absolute;
  inset: -50%;
  background: conic-gradient(
    from 180deg at 50% 50%,
    var(--color-primary) 0deg,
    var(--color-accent) 60deg,
    var(--color-secondary) 120deg,
    var(--color-primary) 180deg,
    var(--color-accent) 240deg,
    var(--color-secondary) 300deg,
    var(--color-primary) 360deg
  );
  filter: blur(80px);
  opacity: 0.15;
  animation: aurora-rotate 20s linear infinite;
}
@keyframes aurora-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`,
    },
    appliesTo: ["hero", "cta"],
  },

  // ─── Magnetic CTA Button ────────────────────────────────────────────────
  magnetic_cta: {
    name: "magnetic_cta",
    type: "magnetic",
    config: {
      css: `
.magnetic-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2.5rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.85rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.2s;
  will-change: transform;
}
.magnetic-btn:hover {
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}
.magnetic-btn::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--color-accent), transparent);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
}
.magnetic-btn:hover::after { opacity: 0.3; }`,
      js: `
document.querySelectorAll('.magnetic-btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
    btn.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0)';
  });
});`,
    },
    appliesTo: ["hero", "cta", "contact"],
  },

  // ─── Character-by-Character Text Reveal ─────────────────────────────────
  character_reveal: {
    name: "character_reveal",
    type: "text_reveal",
    config: {
      css: `
.char-reveal { overflow: hidden; }
.char-reveal .char {
  display: inline-block;
  opacity: 0;
  transform: translateY(100%);
  animation: char-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}
@keyframes char-in {
  to { opacity: 1; transform: translateY(0); }
}`,
      js: `
function initCharReveal() {
  document.querySelectorAll('.char-reveal').forEach(el => {
    const text = el.textContent || '';
    el.innerHTML = '';
    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.style.animationDelay = (i * 0.03) + 's';
      span.textContent = char === ' ' ? '\\u00A0' : char;
      el.appendChild(span);
    });
  });
}
const charObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { initCharReveal(); charObserver.disconnect(); }});
}, { threshold: 0.3 });
document.querySelectorAll('.char-reveal').forEach(el => charObserver.observe(el));`,
    },
    appliesTo: ["hero"],
  },

  // ─── Smooth Scroll Reveal (Enhanced) ────────────────────────────────────
  scroll_reveal_premium: {
    name: "scroll_reveal_premium",
    type: "scroll_reveal",
    config: {
      css: `
.reveal-up { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.reveal-up.visible { opacity: 1; transform: translateY(0); }
.reveal-left { opacity: 0; transform: translateX(-40px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.reveal-left.visible { opacity: 1; transform: translateX(0); }
.reveal-right { opacity: 0; transform: translateX(40px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.reveal-right.visible { opacity: 1; transform: translateX(0); }
.reveal-scale { opacity: 0; transform: scale(0.92); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.reveal-scale.visible { opacity: 1; transform: scale(1); }
.stagger-children > * { transition-delay: calc(var(--stagger-index, 0) * 0.1s); }`,
      js: `
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Stagger children
      entry.target.querySelectorAll('.stagger-children > *').forEach((child, i) => {
        child.style.setProperty('--stagger-index', i.toString());
      });
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('[class*="reveal-"]').forEach(el => revealObserver.observe(el));`,
    },
    appliesTo: ["about", "services", "gallery", "testimonials", "team", "contact"],
  },

  // ─── Image Hover Scale + Overlay ────────────────────────────────────────
  image_hover: {
    name: "image_hover",
    type: "hover_effect",
    config: {
      css: `
.img-hover-container {
  position: relative; overflow: hidden; border-radius: var(--radius-md, 8px);
}
.img-hover-container img {
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
}
.img-hover-container:hover img { transform: scale(1.08); }
.img-hover-container::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.4s;
}
.img-hover-container:hover::after { opacity: 1; }`,
    },
    appliesTo: ["gallery", "team", "portfolio"],
  },

  // ─── Glassmorphism Nav ──────────────────────────────────────────────────
  glass_nav: {
    name: "glass_nav",
    type: "blur_reveal",
    config: {
      css: `
.glass-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 clamp(1rem, 3vw, 2.5rem); height: 72px;
  background: transparent;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.glass-nav.scrolled {
  background: rgba(var(--bg-rgb), 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 1px 0 rgba(0,0,0,0.06);
}`,
      js: `
const glassNav = document.querySelector('.glass-nav');
if (glassNav) {
  window.addEventListener('scroll', () => {
    glassNav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}`,
    },
    appliesTo: ["hero"],
  },

  // ─── Gradient Shift Background ──────────────────────────────────────────
  gradient_shift: {
    name: "gradient_shift",
    type: "gradient_shift",
    config: {
      css: `
.gradient-shift {
  background: linear-gradient(-45deg, var(--color-primary), var(--color-accent), var(--color-secondary), var(--color-primary));
  background-size: 400% 400%;
  animation: gradient-flow 15s ease infinite;
}
@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`,
    },
    appliesTo: ["cta", "footer"],
  },

  // ─── Smooth Counter Animation ───────────────────────────────────────────
  counter: {
    name: "counter",
    type: "counter",
    config: {
      js: `
function animateCounter(el) {
  const target = parseInt(el.dataset.count || el.textContent.replace(/[^0-9]/g, '') || '0');
  const suffix = el.dataset.suffix || el.textContent.replace(/[0-9]/g, '').trim();
  const duration = 2000;
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = Math.round(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateCounter(e.target); counterObserver.unobserve(e.target); }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.count-up').forEach(el => counterObserver.observe(el));`,
    },
    appliesTo: ["stats", "about"],
  },

  // ─── Parallax Scroll ───────────────────────────────────────────────────
  parallax: {
    name: "parallax",
    type: "parallax",
    config: {
      css: `
.parallax-container { overflow: hidden; position: relative; }
.parallax-bg {
  position: absolute; inset: -20%;
  background-size: cover; background-position: center;
  will-change: transform;
}`,
      js: `
const parallaxElements = document.querySelectorAll('.parallax-bg');
if (parallaxElements.length > 0) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        parallaxElements.forEach(el => {
          const rect = el.parentElement.getBoundingClientRect();
          const scrolled = (rect.top + rect.height / 2 - window.innerHeight / 2) * 0.15;
          el.style.transform = 'translateY(' + scrolled + 'px)';
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}`,
    },
    appliesTo: ["hero", "gallery", "cta"],
  },

  // ─── Scroll Progress Bar ────────────────────────────────────────────────
  scroll_progress: {
    name: "scroll_progress",
    type: "scroll_reveal",
    config: {
      css: `
.scroll-progress {
  position: fixed; top: 0; left: 0; height: 2px;
  background: var(--color-accent);
  z-index: 200; width: 0%;
  transition: width 0.08s linear;
}`,
      js: `
const progressBar = document.querySelector('.scroll-progress');
if (progressBar) {
  window.addEventListener('scroll', () => {
    const scrolled = document.documentElement.scrollTop;
    const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    progressBar.style.width = (scrolled / total * 100) + '%';
  }, { passive: true });
}`,
    },
    appliesTo: [],
  },

  // ─── Grain Texture Overlay ──────────────────────────────────────────────
  grain_overlay: {
    name: "grain_overlay",
    type: "morph",
    config: {
      css: `
.grain-overlay::before {
  content: '';
  position: fixed; inset: -200%; z-index: 9999;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  mix-blend-mode: multiply;
  animation: grain-shift 8s steps(10) infinite;
}
@keyframes grain-shift {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  30% { transform: translate(3%, -15%); }
  50% { transform: translate(12%, 9%); }
  70% { transform: translate(9%, 4%); }
  90% { transform: translate(-1%, 7%); }
}`,
    },
    appliesTo: [],
  },
};

// ─── Component Variant Registry ───────────────────────────────────────────────
// Defines premium variants for each section type.

export const PREMIUM_COMPONENT_VARIANTS: Record<string, ComponentVariant[]> = {
  hero: [
    {
      component: "hero",
      variant: "fullscreen_parallax",
      premiumLevel: "ultra",
      effects: ["parallax", "character_reveal", "glass_nav", "aurora", "grain_overlay"],
      uiLibrary: "aceternity",
      uiComponent: "spotlight-hero",
      config: { fullscreen: true, overlay: "gradient", grainOverlay: true },
    },
    {
      component: "hero",
      variant: "split_editorial",
      premiumLevel: "premium",
      effects: ["scroll_reveal_premium", "magnetic_cta", "glass_nav"],
      uiLibrary: "magic_ui",
      config: { layout: "split", imagePosition: "right" },
    },
    {
      component: "hero",
      variant: "minimal_centered",
      premiumLevel: "premium",
      effects: ["character_reveal", "gradient_shift", "glass_nav"],
      config: { layout: "centered", hasBackgroundPattern: true },
    },
  ],

  about: [
    {
      component: "about",
      variant: "split_story",
      premiumLevel: "premium",
      effects: ["scroll_reveal_premium", "image_hover", "counter"],
      config: { layout: "split", hasStats: true, imageOverlap: true },
    },
    {
      component: "about",
      variant: "timeline",
      premiumLevel: "ultra",
      effects: ["scroll_reveal_premium", "counter"],
      uiLibrary: "aceternity",
      uiComponent: "timeline",
      config: { layout: "timeline" },
    },
  ],

  services: [
    {
      component: "services",
      variant: "bento_grid",
      premiumLevel: "ultra",
      effects: ["spotlight", "scroll_reveal_premium", "image_hover"],
      uiLibrary: "aceternity",
      uiComponent: "bento-grid",
      config: { layout: "bento", columns: 3, hasIcons: true },
    },
    {
      component: "services",
      variant: "cards_hover",
      premiumLevel: "premium",
      effects: ["scroll_reveal_premium", "spotlight"],
      uiLibrary: "magic_ui",
      uiComponent: "magic-card",
      config: { layout: "grid", columns: 3, hoverEffect: "3d" },
    },
  ],

  gallery: [
    {
      component: "gallery",
      variant: "masonry_lightbox",
      premiumLevel: "ultra",
      effects: ["scroll_reveal_premium", "image_hover"],
      config: { layout: "masonry", columns: 4, hasLightbox: true, hasFilter: true },
    },
    {
      component: "gallery",
      variant: "editorial_scroll",
      premiumLevel: "premium",
      effects: ["parallax", "scroll_reveal_premium"],
      uiLibrary: "aceternity",
      uiComponent: "parallax-scroll",
      config: { layout: "editorial", fullWidth: true },
    },
  ],

  testimonials: [
    {
      component: "testimonials",
      variant: "carousel_premium",
      premiumLevel: "premium",
      effects: ["scroll_reveal_premium"],
      uiLibrary: "magic_ui",
      uiComponent: "marquee",
      config: { autoPlay: true, interval: 5000, hasStars: true },
    },
    {
      component: "testimonials",
      variant: "cards_grid",
      premiumLevel: "premium",
      effects: ["scroll_reveal_premium", "spotlight"],
      config: { layout: "grid", columns: 3 },
    },
  ],

  contact: [
    {
      component: "contact",
      variant: "split_dark",
      premiumLevel: "premium",
      effects: ["scroll_reveal_premium", "magnetic_cta"],
      config: { layout: "split", darkBackground: true, hasMap: true },
    },
  ],

  team: [
    {
      component: "team",
      variant: "photo_grid",
      premiumLevel: "premium",
      effects: ["scroll_reveal_premium", "image_hover"],
      config: { layout: "grid", columns: 4, hoverReveal: true },
    },
  ],

  cta: [
    {
      component: "cta",
      variant: "gradient_bold",
      premiumLevel: "ultra",
      effects: ["gradient_shift", "magnetic_cta"],
      config: { fullWidth: true },
    },
  ],

  footer: [
    {
      component: "footer",
      variant: "minimal_elegant",
      premiumLevel: "standard",
      effects: [],
      config: { columns: 4, hasNewsletter: true },
    },
  ],

  stats: [
    {
      component: "stats",
      variant: "counter_cards",
      premiumLevel: "premium",
      effects: ["counter", "scroll_reveal_premium"],
      config: { layout: "grid", columns: 4 },
    },
  ],
};

// ─── Sector → Component Variant Mapping ───────────────────────────────────────
// Best variant choices by sector for maximum impact.

export const SECTOR_VARIANT_PREFERENCES: Record<string, Record<string, string>> = {
  restaurant: {
    hero: "fullscreen_parallax",
    about: "split_story",
    services: "bento_grid",         // menu as bento
    gallery: "masonry_lightbox",
    testimonials: "carousel_premium",
    contact: "split_dark",
  },
  dental: {
    hero: "minimal_centered",
    about: "split_story",
    services: "cards_hover",
    team: "photo_grid",
    testimonials: "cards_grid",
    contact: "split_dark",
  },
  legal: {
    hero: "split_editorial",
    about: "timeline",
    services: "cards_hover",
    team: "photo_grid",
    testimonials: "cards_grid",
    contact: "split_dark",
  },
  fitness: {
    hero: "fullscreen_parallax",
    about: "split_story",
    services: "bento_grid",
    gallery: "editorial_scroll",
    testimonials: "carousel_premium",
    contact: "split_dark",
  },
  beauty: {
    hero: "fullscreen_parallax",
    about: "split_story",
    services: "cards_hover",
    gallery: "masonry_lightbox",
    testimonials: "carousel_premium",
    contact: "split_dark",
  },
  hotel: {
    hero: "fullscreen_parallax",
    about: "timeline",
    services: "bento_grid",
    gallery: "editorial_scroll",
    testimonials: "carousel_premium",
    contact: "split_dark",
  },
  ecommerce: {
    hero: "split_editorial",
    about: "split_story",
    services: "bento_grid",
    gallery: "masonry_lightbox",
    testimonials: "cards_grid",
    cta: "gradient_bold",
  },
  realestate: {
    hero: "fullscreen_parallax",
    about: "split_story",
    services: "cards_hover",
    gallery: "masonry_lightbox",
    testimonials: "carousel_premium",
    contact: "split_dark",
  },
  medical: {
    hero: "minimal_centered",
    about: "split_story",
    services: "cards_hover",
    team: "photo_grid",
    testimonials: "cards_grid",
    contact: "split_dark",
  },
  professional: {
    hero: "split_editorial",
    about: "split_story",
    services: "cards_hover",
    testimonials: "cards_grid",
    contact: "split_dark",
    cta: "gradient_bold",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get the best component variant for a sector + section type.
 */
export function getVariantForSection(
  sector: string,
  sectionType: string,
): ComponentVariant {
  const preferredVariant = SECTOR_VARIANT_PREFERENCES[sector]?.[sectionType];
  const variants = PREMIUM_COMPONENT_VARIANTS[sectionType] ?? [];

  if (preferredVariant) {
    const found = variants.find((v) => v.variant === preferredVariant);
    if (found) return found;
  }

  // Default to first premium variant
  return variants.find((v) => v.premiumLevel === "premium") ??
    variants[0] ?? {
      component: sectionType,
      variant: "default",
      premiumLevel: "standard",
      effects: ["scroll_reveal_premium"],
      config: {},
    };
}

/**
 * Collect all CSS snippets needed for a set of effects.
 */
export function collectEffectsCss(effectNames: string[]): string {
  const cssBlocks: string[] = [];
  const seen = new Set<string>();

  for (const name of effectNames) {
    if (seen.has(name)) continue;
    seen.add(name);

    const preset = PREMIUM_ANIMATIONS[name];
    if (preset?.config?.["css"]) {
      cssBlocks.push(preset.config["css"] as string);
    }
  }

  return cssBlocks.join("\n\n");
}

/**
 * Collect all JS snippets needed for a set of effects.
 */
export function collectEffectsJs(effectNames: string[]): string {
  const jsBlocks: string[] = [];
  const seen = new Set<string>();

  for (const name of effectNames) {
    if (seen.has(name)) continue;
    seen.add(name);

    const preset = PREMIUM_ANIMATIONS[name];
    if (preset?.config?.["js"]) {
      jsBlocks.push(preset.config["js"] as string);
    }
  }

  return jsBlocks.join("\n\n");
}

/**
 * Get all effects needed for a complete site based on sections.
 */
export function getAllEffectsForSite(
  sections: Array<{ type: string; variant: ComponentVariant }>,
): { css: string; js: string } {
  const allEffects = new Set<string>();

  // Always include base effects
  allEffects.add("scroll_reveal_premium");
  allEffects.add("glass_nav");
  allEffects.add("scroll_progress");
  allEffects.add("grain_overlay");

  for (const section of sections) {
    for (const effect of section.variant.effects) {
      allEffects.add(effect);
    }
  }

  return {
    css: collectEffectsCss([...allEffects]),
    js: collectEffectsJs([...allEffects]),
  };
}
