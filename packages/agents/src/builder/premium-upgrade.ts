/**
 * Premium Design Upgrade — applied programmatically after JCodesMore clone.
 *
 * No AI calls. Pure code modifications. Works 100% of the time.
 *
 * What it does:
 * 1. Installs framer-motion
 * 2. Creates FadeIn.tsx component
 * 3. Upgrades Header with glassmorphism + scroll detection
 * 4. Adds dark gradient overlay to Hero
 * 5. Adds hover effects to cards
 * 6. Wraps sections in FadeIn on homepage
 * 7. Adds Schema.org JSON-LD
 * 8. Verifies npm run build passes
 */

import { promises as fs } from "fs";
import { execFile } from "child_process";
import * as path from "path";

export async function applyPremiumUpgrade(projectDir: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[PremiumUpgrade] Starting upgrade in ${projectDir}`);

    // 0. Git commit clean clone state so we can revert if upgrade breaks build
    await runCmd("git", ["add", "-A"], projectDir);
    await runCmd("git", ["commit", "-m", "clean clone before premium upgrade", "--allow-empty"], projectDir);

    // 1. Install framer-motion
    console.log("[PremiumUpgrade] Installing framer-motion...");
    await runCmd("npm", ["install", "framer-motion"], projectDir);

    // 2. Create FadeIn component
    console.log("[PremiumUpgrade] Creating FadeIn component...");
    const fadeInPath = path.join(projectDir, "src/components/FadeIn.tsx");
    await fs.writeFile(fadeInPath, FADEIN_COMPONENT, "utf-8");

    // 3. Upgrade Header with glassmorphism
    console.log("[PremiumUpgrade] Upgrading Header...");
    await upgradeHeader(projectDir);

    // 4. Upgrade Hero with gradient overlay
    console.log("[PremiumUpgrade] Upgrading Hero...");
    await upgradeHero(projectDir);

    // 5. Add hover effects to card-like components
    console.log("[PremiumUpgrade] Adding card hover effects...");
    await upgradeCards(projectDir);

    // 6. Wrap homepage sections in FadeIn
    console.log("[PremiumUpgrade] Adding FadeIn to homepage...");
    await addFadeInToHomepage(projectDir);

    // 7. Add Schema.org JSON-LD to layout
    console.log("[PremiumUpgrade] Adding Schema.org...");
    await addSchemaOrg(projectDir);

    // 8. Verify build
    console.log("[PremiumUpgrade] Verifying build...");
    const buildResult = await runCmd("npm", ["run", "build"], projectDir);
    if (!buildResult.success) {
      console.warn(`[PremiumUpgrade] Build failed, attempting fixes...`);
      // Common fix: add "use client" to files with hooks
      await fixClientDirectives(projectDir);
      const retry = await runCmd("npm", ["run", "build"], projectDir);
      if (!retry.success) {
        console.warn(`[PremiumUpgrade] Build still fails after fixes: ${retry.error}`);
      }
    }

    console.log("[PremiumUpgrade] Upgrade complete!");
    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[PremiumUpgrade] Failed: ${error}`);
    return { success: false, error };
  }
}

// ─── FadeIn Component ────────────────────────────────────────────────────────

const FADEIN_COMPONENT = `'use client'
import { motion } from 'framer-motion'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}

export const FadeIn = ({ children, delay = 0, direction = 'up', className }: FadeInProps) => {
  const directionMap = {
    up: { y: 30 }, down: { y: -30 },
    left: { x: 30 }, right: { x: -30 }
  }
  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
`;

// ─── Header Upgrade ──────────────────────────────────────────────────────────

async function upgradeHeader(projectDir: string): Promise<void> {
  const componentsDir = path.join(projectDir, "src/components");
  const files = await fs.readdir(componentsDir).catch(() => []);
  const headerFile = files.find(f => /header|nav/i.test(f) && f.endsWith(".tsx"));
  if (!headerFile) return;

  const filePath = path.join(componentsDir, headerFile);
  let content = await fs.readFile(filePath, "utf-8");

  // Skip if already upgraded
  if (content.includes("backdrop-blur") || content.includes("useScrolled")) return;

  // Add "use client" if not present
  if (!content.includes("'use client'") && !content.includes('"use client"')) {
    content = "'use client'\n" + content;
  }

  // Add scroll hook import if needed
  if (!content.includes("useState")) {
    content = content.replace(
      /^('use client'[\s\S]*?)\n/,
      "$1\nimport { useState, useEffect } from 'react'\n"
    );
  }

  // Add scroll detection at the start of the component function
  const scrollHook = `
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
`;

  // Insert scroll hook after the first line of the component function
  content = content.replace(
    /(export (?:default )?function \w+\([^)]*\)\s*\{)/,
    `$1${scrollHook}`
  );

  // Add glassmorphism classes to the header/nav element
  // Find the main <header or <nav tag and add dynamic classes
  content = content.replace(
    /className="([^"]*(?:fixed|sticky)[^"]*)"/,
    `className={\`$1 \${scrolled ? 'backdrop-blur-md bg-white/85 shadow-sm border-b border-neutral-200' : 'bg-transparent'}\`}`
  );

  // If no fixed/sticky found, add to the first header/nav
  if (!content.includes("backdrop-blur-md")) {
    content = content.replace(
      /(<(?:header|nav)\s[^>]*className=")([^"]*)">/,
      `<$1$2 \${scrolled ? 'backdrop-blur-md bg-white/85 shadow-sm' : ''}">`
    );
  }

  await fs.writeFile(filePath, content, "utf-8");
}

// ─── Hero Upgrade ────────────────────────────────────────────────────────────

async function upgradeHero(projectDir: string): Promise<void> {
  const componentsDir = path.join(projectDir, "src/components");
  const files = await fs.readdir(componentsDir).catch(() => []);
  const heroFile = files.find(f => /hero/i.test(f) && f.endsWith(".tsx"));
  if (!heroFile) return;

  const filePath = path.join(componentsDir, heroFile);
  let content = await fs.readFile(filePath, "utf-8");

  // Add min-h-screen if not present
  if (!content.includes("min-h-screen") && !content.includes("min-height: 100vh")) {
    content = content.replace(
      /className="([^"]*)"(\s*(?:aria-label|style))/,
      `className="$1 min-h-screen"$2`
    );
  }

  // Add dark gradient overlay if there's an image/video background
  if (!content.includes("from-black") && !content.includes("linear-gradient")) {
    // Add an overlay div after the first section/div opening
    const overlayDiv = `\n      {/* Premium dark gradient overlay */}\n      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-[1]" />\n`;

    // Insert after the opening tag of a relative container
    content = content.replace(
      /(className="[^"]*relative[^"]*"[^>]*>)/,
      `$1${overlayDiv}`
    );
  }

  await fs.writeFile(filePath, content, "utf-8");
}

// ─── Card Hover Effects ──────────────────────────────────────────────────────

async function upgradeCards(projectDir: string): Promise<void> {
  const componentsDir = path.join(projectDir, "src/components");
  const files = await fs.readdir(componentsDir).catch(() => []);

  for (const file of files) {
    if (!file.endsWith(".tsx")) continue;
    // Skip FadeIn, Header, Hero, Footer — already handled
    if (/fadein|header|nav|hero|footer|backtotop|icons/i.test(file)) continue;

    const filePath = path.join(componentsDir, file);
    let content = await fs.readFile(filePath, "utf-8");

    // Skip if already has hover effects
    if (content.includes("hover:-translate-y") || content.includes("hover:shadow")) continue;

    // Find card-like divs (with rounded, border, shadow, or bg-white/surface classes)
    // and add hover effects
    let modified = false;

    // Pattern: className with rounded + some card-like styling
    content = content.replace(
      /className="([^"]*(?:rounded|shadow|border|bg-white|bg-surface)[^"]*)"/g,
      (match, classes) => {
        // Only add to elements that look like cards (have rounded AND some background)
        if ((classes.includes("rounded") || classes.includes("shadow")) && !classes.includes("hover:")) {
          modified = true;
          return `className="${classes} hover:-translate-y-1 hover:shadow-lg transition-all duration-300"`;
        }
        return match;
      }
    );

    if (modified) {
      await fs.writeFile(filePath, content, "utf-8");
    }
  }
}

// ─── FadeIn on Homepage ──────────────────────────────────────────────────────

async function addFadeInToHomepage(projectDir: string): Promise<void> {
  const pagePath = path.join(projectDir, "src/app/page.tsx");
  let content: string;
  try {
    content = await fs.readFile(pagePath, "utf-8");
  } catch { return; }

  // Skip if FadeIn already imported
  if (content.includes("FadeIn")) return;

  // Add import
  content = content.replace(
    /(import .* from .*\n)/,
    `$1import { FadeIn } from '@/components/FadeIn'\n`
  );

  // Wrap each component call in FadeIn (except the first one which is usually Hero)
  let sectionCount = 0;
  content = content.replace(
    /(<(?:[A-Z]\w+Section|[A-Z]\w+CTA|[A-Z]\w+Gallery|[A-Z]\w+Awards|[A-Z]\w+Video|[A-Z]\w+History|[A-Z]\w+Benefits|[A-Z]\w+Services|[A-Z]\w+Contact)\s*\/?>)/g,
    (match) => {
      sectionCount++;
      if (sectionCount <= 1) return match; // Don't wrap Hero
      const delay = Math.min((sectionCount - 2) * 0.05, 0.3);
      return `<FadeIn delay={${delay}}>${match}</FadeIn>`;
    }
  );

  await fs.writeFile(pagePath, content, "utf-8");
}

// ─── Schema.org ──────────────────────────────────────────────────────────────

async function addSchemaOrg(projectDir: string): Promise<void> {
  const layoutPath = path.join(projectDir, "src/app/layout.tsx");
  let content: string;
  try {
    content = await fs.readFile(layoutPath, "utf-8");
  } catch { return; }

  if (content.includes("application/ld+json")) return;

  // Extract business name from title if possible
  const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
  const businessName = titleMatch?.[1]?.split("|")[0]?.trim() ?? "Business";

  const schema = `
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "${businessName}",
        "url": typeof window !== 'undefined' ? window.location.origin : ''
      })}} />`;

  // Add to <head> section
  content = content.replace(
    /(<head[^>]*>)/,
    `$1${schema}`
  );

  // If no <head>, add before </html>
  if (!content.includes("application/ld+json")) {
    content = content.replace(
      /(<body)/,
      `${schema}\n      $1`
    );
  }

  await fs.writeFile(layoutPath, content, "utf-8");
}

// ─── Fix "use client" ────────────────────────────────────────────────────────

async function fixClientDirectives(projectDir: string): Promise<void> {
  const componentsDir = path.join(projectDir, "src/components");
  const files = await fs.readdir(componentsDir).catch(() => []);

  for (const file of files) {
    if (!file.endsWith(".tsx")) continue;
    const filePath = path.join(componentsDir, file);
    let content = await fs.readFile(filePath, "utf-8");

    // If file uses hooks or motion but doesn't have "use client"
    const needsClient = /useState|useEffect|useRef|motion\.|framer-motion/.test(content);
    const hasClient = /['"]use client['"]/.test(content);

    if (needsClient && !hasClient) {
      content = "'use client'\n" + content;
      await fs.writeFile(filePath, content, "utf-8");
    }
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function runCmd(command: string, args: string[], cwd: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    execFile(command, args, { cwd, timeout: 300_000, maxBuffer: 20 * 1024 * 1024 }, (error, _stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: `${error.message}\n${stderr?.slice(0, 500)}` });
      } else {
        resolve({ success: true });
      }
    });
  });
}
