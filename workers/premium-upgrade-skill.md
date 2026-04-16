---
name: premium-upgrade
description: Apply a premium design upgrade to an already-cloned website. Upgrades typography, colors, animations, header, hero, cards, footer — without changing any text content, images, or page structure. Use after /clone-website completes.
argument-hint: ""
user-invocable: true
---

# Premium Design Upgrade

You are upgrading the visual design of an already-cloned website to premium quality. The site is a Next.js project in the current directory with all content already in place.

## CRITICAL RULES
- Do NOT change any text content (business name, descriptions, phone numbers, addresses, menus)
- Do NOT delete or replace any images or videos
- Do NOT change page routes or navigation structure
- ONLY change: styling, fonts, animations, colors, spacing, hover effects, metadata
- After EVERY file edit, verify with: npx tsc --noEmit
- At the end, verify: npm run build (MUST pass with 0 errors)
- If npm run build fails, FIX the errors until it passes

## Step 1: Analyze Current Design
Read src/app/globals.css and src/app/layout.tsx to understand current fonts and colors.
Read 2-3 component files in src/components/ to understand the design language.

## Step 2: Upgrade Typography
Choose premium Google Fonts based on the business sector:
- Dental/Medical/Legal: DM Serif Display + DM Sans
- Restaurant/Hotel/Beauty: Playfair Display + Jost
- Fitness/Retail: Space Grotesk + Inter
Update src/app/layout.tsx with next/font/google imports.
Add CSS variables --font-display, --font-heading, --font-body to globals.css.

## Step 3: Upgrade Header
Make the header/nav component "use client" with scroll detection:
- Fixed position, z-50
- Transparent when at top, glassmorphism (backdrop-blur-md bg-white/85 shadow-sm) when scrolled
- Nav links: uppercase, tracking-wide, text-sm
- Mobile: hamburger menu

## Step 4: Upgrade Hero
- min-h-screen
- If video exists: autoPlay muted loop playsInline
- Dark gradient overlay: bg-gradient-to-b from-black/40 via-black/20 to-black/60
- Title: font-display, clamp(2.5rem, 6vw, 5rem), bold
- Add stagger fade-in animation (CSS transition-delay on children)

## Step 5: Install Framer Motion and Create FadeIn
Run: npm install framer-motion
Create src/components/FadeIn.tsx (use client component with motion.div, whileInView, viewport once)
Wrap each main section on the homepage in FadeIn

## Step 6: Upgrade Cards and Buttons
All card-like elements: rounded-lg, border, shadow-sm, hover:-translate-y-1 hover:shadow-md transition-all duration-300
Primary buttons: bg-primary text-white rounded-md px-6 py-3 hover:-translate-y-0.5 hover:shadow-lg

## Step 7: Upgrade Footer
Dark background (bg-neutral-900 text-white)
3-column grid on desktop

## Step 8: Add Schema.org JSON-LD
Add script type application/ld+json to layout.tsx with LocalBusiness schema

## Step 9: Final Verification
Run: npm run build
Fix ANY errors until build passes.
Common fixes: add "use client" to components using hooks/motion.
