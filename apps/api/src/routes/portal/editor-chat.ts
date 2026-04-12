/**
 * Editor Chat — Lovable-style AI code generation
 *
 * The AI generates real React/Next.js/Tailwind code via universal file tools:
 *   write_file  — create or overwrite a project file
 *   edit_file   — surgical edit (find & replace) in a file
 *   read_file   — read current file contents
 *   search_photos — Pexels API for stock photos
 *   list_files  — list all project files
 *
 * Project files stored in ClientWebsite.files (JSON Record<string,string>)
 * Sandpack renders them in real-time on the frontend.
 */

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { JwtPayload } from "@madecreative/shared";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/index";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// ─── Credit system ──────────────────────────────────────────────────────────

const PLAN_CREDITS: Record<string, number> = {
  STARTER: 200,
  GROWTH: 500,
  PRO: 1000,
};

function estimateCreditCost(toolCalls: string[], isFullBuild = false): number {
  if (toolCalls.length === 0) return 0.5;
  if (isFullBuild) return 5.0;
  if (toolCalls.filter(t => t === "write_file").length >= 5) return 3.0;
  if (toolCalls.length >= 3) return 1.5;
  return 1.0;
}

// In-memory cache: fast path to avoid hitting DB on every credit check
const creditStore = new Map<string, { used: number; purchased: number; resetAt: number }>();

function nextMonthReset(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getCredits(clientId: string, plan = "STARTER"): { remaining: number; used: number; total: number; purchased: number } {
  const now = Date.now();
  let entry = creditStore.get(clientId);
  if (!entry || now > entry.resetAt) {
    // Cache miss — caller must have populated from DB; default to 0 used
    const purchased = entry?.purchased ?? 0;
    entry = { used: 0, purchased, resetAt: nextMonthReset().getTime() };
    creditStore.set(clientId, entry);
  }
  const planCredits = PLAN_CREDITS[plan] ?? 200;
  const total = planCredits + entry.purchased;
  return { remaining: Math.max(0, total - entry.used), used: entry.used, total, purchased: entry.purchased };
}

/** Populate in-memory cache from DB record. Call once per request after DB load. */
function hydrateCreditsFromDB(clientId: string, dbUsed: number, dbPurchased: number, dbResetAt: Date | null): void {
  const now = Date.now();
  const resetAt = dbResetAt ? dbResetAt.getTime() : nextMonthReset().getTime();
  // If the DB reset date has passed, treat as fresh period
  const used = now > resetAt ? 0 : dbUsed;
  const purchased = dbPurchased;
  creditStore.set(clientId, { used, purchased, resetAt: now > resetAt ? nextMonthReset().getTime() : resetAt });
}

async function deductCredits(clientId: string, amount: number): Promise<boolean> {
  const credits = getCredits(clientId);
  if (credits.remaining < amount) return false;
  const entry = creditStore.get(clientId)!;
  entry.used += amount;
  // Persist to DB asynchronously (fire-and-forget, non-blocking)
  try {
    const { prisma } = await import("@madecreative/db");
    await prisma.client.update({
      where: { id: clientId },
      data: { creditsUsed: entry.used, creditsResetAt: new Date(entry.resetAt) },
    });
  } catch (err) {
    console.error("[EditorChat] Failed to persist credits to DB:", err instanceof Error ? err.message : String(err));
  }
  return true;
}

async function addPurchasedCredits(clientId: string, amount: number): Promise<void> {
  const entry = creditStore.get(clientId);
  if (entry) {
    entry.purchased += amount;
  } else {
    creditStore.set(clientId, { used: 0, purchased: amount, resetAt: nextMonthReset().getTime() });
  }
  // Persist to DB
  try {
    const { prisma } = await import("@madecreative/db");
    await prisma.client.update({
      where: { id: clientId },
      data: { creditsPurchased: { increment: amount } },
    });
  } catch (err) {
    console.error("[EditorChat] Failed to persist purchased credits to DB:", err instanceof Error ? err.message : String(err));
  }
}

// ─── Extract project files from DB (handles old wrapper format) ─────────────

function extractProjectFiles(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  // New format: flat Record<string, string> where keys are file paths
  // Old format: { files: Record<string, string>, version: "...", framework: "..." }
  if (obj["files"] && typeof obj["files"] === "object" && !obj["app/page.tsx"]) {
    return obj["files"] as Record<string, string>;
  }
  // Check if it's already a flat file map (has file-path-looking keys)
  const keys = Object.keys(obj);
  if (keys.some(k => k.includes("/") || k.endsWith(".tsx") || k.endsWith(".ts") || k.endsWith(".css") || k.endsWith(".json"))) {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string") result[k] = v;
    }
    return result;
  }
  return {};
}

// ─── Universal file tools ───────────────────────────────────────────────────

const EDITOR_TOOLS: Tool[] = [
  {
    name: "write_file",
    description: "Create or overwrite a file in the project. Use this to create new components, pages, styles, or any file. The path is relative to the project root (e.g. 'app/page.tsx', 'components/Hero.tsx', 'app/globals.css').",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path relative to project root (e.g. 'app/page.tsx', 'components/Pricing.tsx')" },
        content: { type: "string", description: "Complete file content" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "edit_file",
    description: "Make a surgical edit to an existing file. Finds the old_content string and replaces it with new_content. Use this for small changes instead of rewriting the whole file. If the file doesn't exist or old_content isn't found, it fails.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path to edit" },
        old_content: { type: "string", description: "Exact string to find (must match exactly, including whitespace)" },
        new_content: { type: "string", description: "Replacement string" },
      },
      required: ["path", "old_content", "new_content"],
    },
  },
  {
    name: "read_file",
    description: "Read the contents of a project file. Use this to understand what's currently in a file before editing it.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path to read" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description: "List all files in the project. Returns an array of file paths.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "search_photos",
    description: "Search for professional stock photos via Pexels. Returns URLs. Use descriptive queries in English.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query in English, e.g. 'italian restaurant interior'" },
        count: { type: "number", description: "Number of photos (1-8, default 4)" },
      },
      required: ["query"],
    },
  },
];

// ─── System prompt ──────────────────────────────────────────────────────────

function buildSystemPrompt(businessName: string, sector: string, language: string, projectFiles: Record<string, string>): string {
  const lang = language === "de" ? "German" : language === "it" ? "Italian" : language === "fr" ? "French" : language === "es" ? "Spanish" : language === "nl" ? "Dutch" : language === "pt" ? "Portuguese" : "English";

  const fileList = Object.keys(projectFiles);
  const hasFiles = fileList.length > 0;

  return `You are a world-class AI full-stack developer. You build stunning, production-ready websites using React, Next.js 14 (App Router), and Tailwind CSS. Always respond in ${lang}.

PROJECT: "${businessName}" (sector: ${sector})
${hasFiles ? `\nEXISTING FILES (${fileList.length}):\n${fileList.map(f => `  - ${f}`).join("\n")}\n\nUse read_file to see the contents of any file before editing.` : "\nThis is a NEW project with no files yet."}

═══════════════════════════════════════════════
ARCHITECTURE & TECH STACK
═══════════════════════════════════════════════

You build with:
- **Next.js 14** App Router (app/ directory, page.tsx for routes, layout.tsx for shared UI)
- **React 18** with hooks (useState, useEffect, useRef, useCallback)
- **Tailwind CSS** for all styling (never inline styles, never CSS modules)
- **Framer Motion** for animations (motion.div, AnimatePresence, useInView, useScroll, useTransform)
- **GSAP** for advanced scroll animations (ScrollTrigger, timeline, parallax, pin sections, text reveals)
- **Three.js + React Three Fiber + Drei** for 3D elements (floating objects, particle backgrounds, 3D product viewers)
- **Lucide React** for icons (import { Heart, Star, ShoppingCart, etc } from "lucide-react")
- **TypeScript** (.tsx files)

When to use each animation library:
- **Framer Motion**: page transitions, scroll reveals, hover/tap effects, layout animations
- **GSAP + ScrollTrigger**: parallax sections, pinned scroll, text split animations, complex timelines
- **Three.js / R3F**: hero 3D backgrounds, floating shapes, product 3D viewers, particle effects
- For simple sites (restaurants, dentists): Framer Motion + Tailwind is enough
- For premium sites (e-commerce, SaaS, portfolios): add GSAP scroll effects + Three.js hero

Project structure:
\`\`\`
app/layout.tsx          — Root layout (html, body, fonts, shared nav/footer)
app/page.tsx            — Homepage
app/[route]/page.tsx    — Additional pages
app/globals.css         — Tailwind directives + custom CSS
components/*.tsx        — Reusable React components
lib/*.ts                — Utilities, data, types
tailwind.config.ts      — Tailwind configuration
package.json            — Dependencies
\`\`\`

═══════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════

1. **NEVER ask questions. NEVER say you can't. BUILD IMMEDIATELY.**
   If the user says "build me an e-commerce", you create ALL the files right now.

2. **ALWAYS use Tailwind CSS classes.** Never use inline styles. Use responsive prefixes (sm:, md:, lg:). Use dark: for dark mode support.

3. **Use "use client" directive** on components that use hooks, event handlers, or browser APIs. Server components by default.

4. **For images**, use the search_photos tool to find real photos, then use <img> with the URL. Use Tailwind classes for sizing/styling.

5. **File-first approach:** Each component in its own file. Import and compose in page.tsx.

6. **When editing existing code**, use edit_file for small changes (swap a text, change a color). Use write_file to rewrite entire files when making big structural changes.

7. **When building a full site from scratch**, create files in this order:
   a) tailwind.config.ts
   b) app/globals.css (with @tailwind directives)
   c) lib/data.ts (business data, content)
   d) components/ (Nav, Hero, Footer, etc.)
   e) app/layout.tsx (imports Nav, Footer)
   f) app/page.tsx (imports components)
   g) Additional pages (app/about/page.tsx, etc.)

8. **Code quality:** Production-ready. Proper TypeScript types. Accessible (aria labels, semantic HTML). Mobile-first responsive. Performance-optimized (lazy loading, proper image sizes).

9. **You can build ANYTHING:** Landing pages, multi-page sites, e-commerce with product grids and cart, dashboards, blogs, portfolios, SaaS landing pages, booking systems — ANYTHING the user asks for.

10. **After building**, respond with a SHORT summary (2-3 lines) of what you created/changed.

═══════════════════════════════════════════════
TAILWIND CONFIG (always include this in new projects)
═══════════════════════════════════════════════

\`\`\`typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
export default config;
\`\`\`

═══════════════════════════════════════════════
DESIGN PRINCIPLES
═══════════════════════════════════════════════

- **€10k+ visual quality**: generous whitespace, professional typography scale, subtle shadows and borders
- **Micro-interactions**: hover effects on buttons/cards, smooth transitions, scroll reveals
- **Premium color palettes**: sector-appropriate colors with accent for CTAs
- **Mobile-first**: every section must look perfect on 375px screens
- **Performance**: lazy load images below the fold, minimize re-renders
- **Accessibility**: proper heading hierarchy, focus states, color contrast

═══════════════════════════════════════════════
PREMIUM UI PATTERNS (Magic UI / Aceternity-style)
═══════════════════════════════════════════════

When building premium sites, use these animation patterns (implement directly with Framer Motion + Tailwind — no external library needed):

**Text Effects:**
- **Animated Gradient Text**: bg-gradient with animate background-position
- **Aurora Text**: multi-color gradient with blur behind
- **Hyper Text**: letters scramble then resolve on hover
- **Typing Animation**: typewriter effect with cursor blink
- **Blur Fade**: text fades in with blur-to-sharp transition
- **Number Ticker**: counts from 0 to target number on scroll

**Background Effects:**
- **Dot Pattern**: subtle SVG dot grid background
- **Grid Pattern**: animated grid lines
- **Flickering Grid**: grid cells that flicker randomly
- **Retro Grid**: perspective grid fading into distance
- **Particles**: floating particle effect with framer-motion
- **Meteors**: animated streaks across background
- **Aurora/Warp Background**: flowing gradient blobs

**Card & Container Effects:**
- **Magic Card**: spotlight follows mouse on hover (radial-gradient)
- **Bento Grid**: asymmetric grid layout (col-span-2, row-span-2)
- **Neon Gradient Card**: glowing border animation
- **Border Beam**: light beam traveling along card border
- **Shine Border**: shimmering border effect
- **Lens**: magnifying glass effect on hover

**Interactive Elements:**
- **Marquee**: infinite scroll ticker (logos, testimonials)
- **Orbiting Circles**: items orbiting a center point
- **Dock**: macOS-style dock with magnification on hover
- **Pulsating Button**: CTA with pulse ring animation
- **Rainbow Button**: animated rainbow gradient border
- **Shimmer Button**: shimmer sweep effect

**Scroll Effects:**
- **Scroll Progress**: progress bar tied to scroll position
- **Scroll-Based Velocity**: text speed changes with scroll
- **Blur Fade In**: elements fade in from blur on scroll
- **Parallax Sections**: different scroll speeds via useTransform

**Implementation pattern** (example — Magic Card):
\`\`\`tsx
function MagicCard({ children }: { children: React.ReactNode }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouse = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  return (
    <div onMouseMove={handleMouse} className="relative overflow-hidden rounded-xl border border-white/10 bg-gray-900 p-6">
      <div className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: \`radial-gradient(400px circle at \${mousePos.x}px \${mousePos.y}px, rgba(99,102,241,.15), transparent 40%)\` }} />
      {children}
    </div>
  );
}
\`\`\`

**When to use which effect:**
- Hero sections: Aurora/Warp background, Animated Gradient Text, Particles
- Feature cards: Magic Card, Bento Grid, Border Beam
- CTAs: Pulsating Button, Rainbow Button, Shimmer Button
- Testimonials: Marquee (infinite scroll), Blur Fade in
- Stats: Number Ticker, Animated Circular Progress
- E-commerce: Lens (product zoom), Dock (quick actions)
- SaaS: Orbiting Circles (integrations), Grid Pattern background

═══════════════════════════════════════════════
PREMIUM EFFECTS (use when building high-end sites)
═══════════════════════════════════════════════

**GSAP ScrollTrigger examples** (import gsap and ScrollTrigger):
\`\`\`tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// Parallax section
useEffect(() => {
  gsap.to(".parallax-bg", { yPercent: -30, ease: "none", scrollTrigger: { trigger: ".hero", scrub: true } });
}, []);

// Text reveal on scroll
useEffect(() => {
  gsap.from(".reveal-text", { y: 60, opacity: 0, duration: 1, stagger: 0.15, scrollTrigger: { trigger: ".reveal-section", start: "top 80%" } });
}, []);

// Pin section while scrolling
useEffect(() => {
  ScrollTrigger.create({ trigger: ".pin-section", pin: true, start: "top top", end: "+=500" });
}, []);
\`\`\`

**Three.js / React Three Fiber examples** (for 3D hero backgrounds):
\`\`\`tsx
"use client";
import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment } from "@react-three/drei";

function FloatingShape() {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh><sphereGeometry args={[1, 64, 64]} /><MeshDistortMaterial color="#6366f1" distort={0.4} speed={2} /></mesh>
    </Float>
  );
}

// In your hero: <div className="absolute inset-0"><Canvas><FloatingShape /><Environment preset="city" /></Canvas></div>
\`\`\`

**When to use premium effects:**
- E-commerce: 3D product viewer, parallax product sections, GSAP cart animations
- SaaS landing: 3D hero with floating shapes, pinned feature sections, text reveal
- Portfolio: GSAP scroll-driven gallery, Three.js background
- Restaurant/dental/beauty: keep it simple — Framer Motion + Tailwind only (fast, clean)

You are the best website builder in the world. Build something incredible.`;
}

// ─── Tool handler ───────────────────────────────────────────────────────────

function buildToolHandler(
  projectFiles: Record<string, string>,
  fileUpdates: Record<string, string | null>,
): (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown> {
  return async (toolName: string, toolInput: Record<string, unknown>) => {
    switch (toolName) {
      case "write_file": {
        const path = toolInput["path"] as string;
        const content = toolInput["content"] as string;
        if (!path || content === undefined) return { error: "path and content required" };
        // Store the update
        fileUpdates[path] = content;
        projectFiles[path] = content;
        return { success: true, path, size: content.length };
      }

      case "edit_file": {
        const path = toolInput["path"] as string;
        const oldContent = toolInput["old_content"] as string;
        const newContent = toolInput["new_content"] as string;
        if (!path || !oldContent) return { error: "path and old_content required" };

        const current = projectFiles[path];
        if (!current) return { error: `File not found: ${path}` };
        if (!current.includes(oldContent)) return { error: `old_content not found in ${path}. Use read_file first to see the current content.` };

        const updated = current.replace(oldContent, newContent);
        fileUpdates[path] = updated;
        projectFiles[path] = updated;
        return { success: true, path, size: updated.length };
      }

      case "read_file": {
        const path = toolInput["path"] as string;
        const content = projectFiles[path];
        if (!content) return { error: `File not found: ${path}`, availableFiles: Object.keys(projectFiles) };
        return { path, content, size: content.length };
      }

      case "list_files": {
        return { files: Object.keys(projectFiles), count: Object.keys(projectFiles).length };
      }

      case "search_photos": {
        const input = toolInput as { query: string; count?: number };
        const count = Math.min(input.count ?? 4, 8);
        const apiKey = process.env["PEXELS_API_KEY"];
        if (!apiKey) return { photos: [], error: "Photo search not configured" };
        try {
          const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(input.query)}&per_page=${count}&size=medium`, {
            headers: { Authorization: apiKey },
          });
          const data = await res.json() as { photos: Array<{ src: { large: string; medium: string }; alt: string }> };
          return { photos: (data.photos ?? []).map(p => ({ url: p.src.large, alt: p.alt || input.query })) };
        } catch {
          return { photos: [], error: "Search failed" };
        }
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  };
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /portal/editor/chat/credits
app.get("/credits", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const { prisma } = await import("@madecreative/db");
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { plan: true, creditsUsed: true, creditsPurchased: true, creditsResetAt: true } });
  if (client) {
    hydrateCreditsFromDB(clientId, client.creditsUsed, client.creditsPurchased, client.creditsResetAt);
  }
  const credits = getCredits(clientId, client?.plan ?? "STARTER");
  return c.json({ success: true, data: { ...credits, topUpOptions: [
    { credits: 100, price: "\u20ac4.90", priceId: "price_topup_100" },
    { credits: 300, price: "\u20ac9.90", priceId: "price_topup_300" },
    { credits: 1000, price: "\u20ac24.90", priceId: "price_topup_1000" },
  ] } });
});

// POST /portal/editor/chat/buy-credits
app.post("/buy-credits", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const body = await c.req.json().catch(() => null);
  const pack = body?.pack as string;
  const PACKS: Record<string, { credits: number; amount: number }> = {
    "100": { credits: 100, amount: 490 },
    "300": { credits: 300, amount: 990 },
    "1000": { credits: 1000, amount: 2490 },
  };
  const selected = PACKS[pack];
  if (!selected) return c.json({ success: false, error: "Invalid credit pack" }, 400);

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { stripeCustomerId: true, email: true } });
  if (!client) return c.json({ success: false, error: "Client not found" }, 404);

  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  if (!stripeKey) {
    await addPurchasedCredits(clientId, selected.credits);
    return c.json({ success: true, data: { credits: getCredits(clientId), added: selected.credits } });
  }

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: client.stripeCustomerId ?? undefined,
      customer_email: !client.stripeCustomerId ? client.email : undefined,
      line_items: [{ price_data: { currency: "eur", product_data: { name: `${selected.credits} Crediti AI` }, unit_amount: selected.amount }, quantity: 1 }],
      metadata: { clientId, credits: String(selected.credits) },
      success_url: `${process.env["PORTAL_URL"] ?? "https://app.madecreative.pro"}/editor?credits=purchased`,
      cancel_url: `${process.env["PORTAL_URL"] ?? "https://app.madecreative.pro"}/editor`,
    });
    return c.json({ success: true, data: { checkoutUrl: session.url, credits: selected.credits } });
  } catch {
    return c.json({ success: false, error: "Payment error" }, 500);
  }
});

// ─── POST /portal/editor/chat/stream — main streaming chat ─────────────────

app.post("/stream", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { getClaudeClient } = await import("@madecreative/ai");
  const clientId = c.get("jwtPayload").sub;

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, companyName: true, sector: true, language: true, plan: true, creditsUsed: true, creditsPurchased: true, creditsResetAt: true } });
  if (!client) return c.json({ success: false, error: "Client not found" }, 404);

  // Hydrate in-memory cache from DB so credits survive cold starts
  hydrateCreditsFromDB(clientId, client.creditsUsed, client.creditsPurchased, client.creditsResetAt);

  const credits = getCredits(clientId, client.plan);
  if (credits.remaining < 0.5) return c.json({ success: false, error: "Crediti esauriti.", credits }, 402);

  const body = await c.req.json().catch(() => null);
  if (!body?.message || typeof body.message !== "string") return c.json({ success: false, error: "Message is required" }, 400);

  const userMessage = body.message as string;
  const conversationHistory = (body.history ?? []) as MessageParam[];
  const projectId = body.projectId as string | undefined;

  // Load specific project by ID, or fall back to most recently updated one
  let website = projectId
    ? await prisma.clientWebsite.findFirst({ where: { id: projectId, clientId, isActive: true } })
    : await prisma.clientWebsite.findFirst({ where: { clientId, isActive: true }, orderBy: { updatedAt: "desc" } });

  // Load project files from DB
  let projectFiles: Record<string, string> = {};
  if (website?.files) {
    try {
      const raw = typeof website.files === "string"
        ? JSON.parse(website.files as string)
        : website.files;
      projectFiles = extractProjectFiles(raw);
    } catch (parseErr) {
      console.error("[EditorChat] Failed to parse website.files JSON for project", website?.id, ":", parseErr instanceof Error ? parseErr.message : String(parseErr));
      return c.json({ success: false, error: "Dati del progetto corrotti. Crea un nuovo progetto o contatta il supporto." }, 500);
    }
  }

  const systemPrompt = buildSystemPrompt(client.companyName, client.sector, client.language, projectFiles);
  const messages: MessageParam[] = [...conversationHistory.slice(-30), { role: "user", content: userMessage }];

  // Use Opus for full builds, Sonnet for edits
  const isFullBuild = /\b(crea|costruisci|build|make|genera|fai|create)\b.*\b(sito|site|website|pagina|page|app|ecommerce|e-commerce|shop|negozio|blog|portfolio|dashboard)\b/i.test(userMessage);
  const editorModel = isFullBuild ? "claude-sonnet-4-6" as const : "claude-sonnet-4-6" as const;

  const claude = getClaudeClient();
  const fileUpdates: Record<string, string | null> = {};

  c.header("X-Accel-Buffering", "no");

  return streamSSE(c, async (stream) => {
    const toolNames: string[] = [];

    try {
      const generator = claude.streamToolUseLoop(
        messages,
        async (toolName, toolInput) => {
          toolNames.push(toolName);
          const handler = buildToolHandler(projectFiles, fileUpdates);
          const result = await handler(toolName, toolInput);

          // Stream file updates to frontend for real-time Sandpack preview
          if (toolName === "write_file" || toolName === "edit_file") {
            const path = toolInput["path"] as string;
            await stream.writeSSE({ data: JSON.stringify({
              type: "file_update",
              path,
              content: projectFiles[path],
            }) });
          }

          return result;
        },
        { system: systemPrompt, tools: EDITOR_TOOLS, model: editorModel, maxTokens: 16384 }
      );

      for await (const event of generator) {
        if (event.type === "done") {
          // Persist file updates to DB
          let deployUrl: string | null = website?.deployUrl ?? null;

          if (Object.keys(fileUpdates).length > 0) {
            // Auto-create project if needed (e.g., first chat with no projectId)
            if (!website) {
              const slug = client.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
              const suffix = Math.random().toString(36).slice(2, 7);
              const subdomain = `${slug}-${suffix}`;
              website = await prisma.clientWebsite.create({
                data: { clientId, name: client.companyName, domain: `${subdomain}.madecreative.pro`, subdomain, pages: {}, files: projectFiles as unknown as object, deployStatus: "NONE" },
              });
            }

            // Snapshot previous state for rollback
            const previousFiles = website.files ?? {};
            const tokens = (website.designTokens ?? {}) as Record<string, unknown>;
            const snapshots = ((tokens._snapshots as Array<{ ts: string; data: object }>) ?? []).slice(-19);
            snapshots.push({ ts: new Date().toISOString(), data: previousFiles as object });

            // Save updated project files
            await prisma.clientWebsite.update({
              where: { id: website.id },
              data: {
                files: projectFiles as unknown as object,
                designTokens: { ...tokens, _snapshots: snapshots },
                deployStatus: "DEPLOYING",
              },
            });

            // Deploy to Vercel
            try {
              const { deploySite } = await import("../../lib/deploy-site.js");
              const subdomain = website.subdomain ?? client.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

              const deployResult = await deploySite({
                clientId,
                companyName: client.companyName,
                sector: client.sector,
                content: projectFiles,
                subdomain,
              });

              deployUrl = deployResult.deployUrl;
              await prisma.clientWebsite.update({
                where: { id: website.id },
                data: { deployUrl: deployResult.deployUrl, vercelProjectId: deployResult.vercelProjectId, deployStatus: "DEPLOYED", lastDeployedAt: new Date() },
              });
            } catch (deployErr) {
              console.warn("[EditorChat] Deploy failed:", deployErr instanceof Error ? deployErr.message : String(deployErr));
              await prisma.clientWebsite.update({ where: { id: website.id }, data: { deployStatus: "FAILED" } }).catch(() => {});
            }
          }

          const creditCost = estimateCreditCost(toolNames, isFullBuild);
          await deductCredits(clientId, creditCost);

          await stream.writeSSE({ data: JSON.stringify({
            type: "complete",
            deployUrl,
            projectId: website?.id ?? null,
            credits: getCredits(clientId, client.plan),
            files: Object.keys(projectFiles),
            updatedFiles: Object.keys(fileUpdates),
            usage: event.usage,
          }) });
        } else {
          await stream.writeSSE({ data: JSON.stringify(event) });
        }
      }
    } catch (err) {
      console.error("[EditorChat] Error:", err instanceof Error ? err.message : String(err));
      await stream.writeSSE({ data: JSON.stringify({ type: "error", message: "AI editor error. Please try again." }) });
    }
  });
});

// POST /portal/editor/chat — non-streaming fallback
app.post("/", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { getClaudeClient } = await import("@madecreative/ai");
  const clientId = c.get("jwtPayload").sub;

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, companyName: true, sector: true, language: true, plan: true, creditsUsed: true, creditsPurchased: true, creditsResetAt: true } });
  if (!client) return c.json({ success: false, error: "Client not found" }, 404);

  // Hydrate in-memory cache from DB so credits survive cold starts
  hydrateCreditsFromDB(clientId, client.creditsUsed, client.creditsPurchased, client.creditsResetAt);

  const credits = getCredits(clientId, client.plan);
  if (credits.remaining < 0.5) return c.json({ success: false, error: "Crediti esauriti.", credits }, 402);

  const body = await c.req.json().catch(() => null);
  if (!body?.message) return c.json({ success: false, error: "Message is required" }, 400);

  const userMessage = body.message as string;
  const conversationHistory = (body.history ?? []) as MessageParam[];
  const projectId = body.projectId as string | undefined;

  let website = projectId
    ? await prisma.clientWebsite.findFirst({ where: { id: projectId, clientId, isActive: true } })
    : await prisma.clientWebsite.findFirst({ where: { clientId, isActive: true }, orderBy: { updatedAt: "desc" } });

  let projectFiles: Record<string, string> = {};
  if (website?.files) {
    try {
      projectFiles = extractProjectFiles(website.files);
    } catch (parseErr) {
      console.error("[EditorChat] Failed to parse website.files JSON for project", website?.id, ":", parseErr instanceof Error ? parseErr.message : String(parseErr));
      return c.json({ success: false, error: "Dati del progetto corrotti. Crea un nuovo progetto o contatta il supporto." }, 500);
    }
  }

  const systemPrompt = buildSystemPrompt(client.companyName, client.sector, client.language, projectFiles);
  const messages: MessageParam[] = [...conversationHistory.slice(-30), { role: "user", content: userMessage }];

  const isFullBuild = /\b(crea|costruisci|build|make|genera|fai|create)\b/i.test(userMessage);
  const claude = getClaudeClient();
  const fileUpdates: Record<string, string | null> = {};

  try {
    const result = await claude.toolUseLoop(
      messages,
      buildToolHandler(projectFiles, fileUpdates),
      { system: systemPrompt, tools: EDITOR_TOOLS, model: "claude-sonnet-4-6" as const, maxTokens: 16384 }
    );

    // Save if files changed
    if (Object.keys(fileUpdates).length > 0) {
      if (!website) {
        const slug = client.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
        const suffix = Math.random().toString(36).slice(2, 7);
        const subdomain = `${slug}-${suffix}`;
        website = await prisma.clientWebsite.create({
          data: { clientId, name: client.companyName, domain: `${subdomain}.madecreative.pro`, subdomain, pages: {}, files: projectFiles as unknown as object, deployStatus: "NONE" },
        });
      }
      await prisma.clientWebsite.update({
        where: { id: website.id },
        data: { files: projectFiles as unknown as object },
      });
    }

    const toolNames: string[] = [];
    for (const m of result.messages) {
      if (m.role === "assistant" && Array.isArray(m.content)) {
        for (const b of m.content) {
          if (typeof b === "object" && "type" in b && b.type === "tool_use" && "name" in b) toolNames.push(b.name as string);
        }
      }
    }
    await deductCredits(clientId, estimateCreditCost(toolNames, isFullBuild));

    const assistantText = result.finalContent.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("\n");

    return c.json({
      success: true,
      data: {
        response: assistantText,
        files: projectFiles,
        updatedFiles: Object.keys(fileUpdates),
        deployUrl: website?.deployUrl ?? null,
        projectId: website?.id ?? null,
        credits: getCredits(clientId, client.plan),
      },
    });
  } catch (err) {
    console.error("[EditorChat] Error:", err instanceof Error ? err.message : String(err));
    return c.json({ success: false, error: "AI editor error" }, 500);
  }
});

// GET /portal/editor/chat/history — version history
app.get("/history", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const projectId = c.req.query("projectId");

  let website;
  if (projectId) {
    website = await prisma.clientWebsite.findFirst({ where: { id: projectId, clientId }, select: { designTokens: true } });
  } else {
    // Fallback: most recently updated project
    website = await prisma.clientWebsite.findFirst({ where: { clientId, isActive: true }, orderBy: { updatedAt: "desc" }, select: { designTokens: true } });
  }

  const snapshots = ((website?.designTokens as { _snapshots?: Array<{ ts: string }> })?._snapshots ?? []).map((s, i) => ({ index: i, timestamp: s.ts })).reverse();
  return c.json({ success: true, data: { versions: snapshots, count: snapshots.length } });
});

// POST /portal/editor/chat/rollback — restore previous version
app.post("/rollback", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const body = await c.req.json().catch(() => null);
  const index = body?.index as number | undefined;
  const projectId = body?.projectId as string | undefined;

  let website;
  if (projectId) {
    website = await prisma.clientWebsite.findFirst({ where: { id: projectId, clientId }, select: { id: true, designTokens: true, files: true } });
  } else {
    website = await prisma.clientWebsite.findFirst({ where: { clientId, isActive: true }, orderBy: { updatedAt: "desc" }, select: { id: true, designTokens: true, files: true } });
  }
  if (!website) return c.json({ success: false, error: "Website not found" }, 404);

  const snapshots = ((website.designTokens as { _snapshots?: Array<{ ts: string; data: object }> })?._snapshots ?? []).slice();
  const targetIndex = index ?? snapshots.length - 1;
  const snapshot = snapshots[targetIndex];
  if (!snapshot) return c.json({ success: false, error: "No version to restore" }, 404);

  // Save current as new snapshot before restoring
  const currentFiles = website.files ?? {};
  const updatedSnapshots = snapshots.filter((_, i) => i !== targetIndex);
  updatedSnapshots.push({ ts: new Date().toISOString(), data: currentFiles as object });

  await prisma.clientWebsite.update({
    where: { id: website.id },
    data: {
      files: snapshot.data,
      designTokens: { ...(website.designTokens as object ?? {}), _snapshots: updatedSnapshots },
    },
  });

  return c.json({ success: true, data: { restoredTo: snapshot.ts, files: snapshot.data } });
});

// GET /portal/editor/chat/files — get current project files (for code panel)
app.get("/files", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const projectId = c.req.query("projectId");

  let website;
  if (projectId) {
    website = await prisma.clientWebsite.findFirst({ where: { id: projectId, clientId }, select: { id: true, name: true, files: true, deployUrl: true } });
  } else {
    // Fallback: most recently updated project
    website = await prisma.clientWebsite.findFirst({ where: { clientId, isActive: true }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, files: true, deployUrl: true } });
  }

  if (!website) return c.json({ success: true, data: { files: {}, deployUrl: null, projectId: null, projectName: null } });
  return c.json({ success: true, data: { files: extractProjectFiles(website.files), deployUrl: website.deployUrl, projectId: website.id, projectName: website.name } });
});

export default app;
