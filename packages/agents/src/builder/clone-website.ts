/**
 * JCodesMore Website Cloner Integration
 *
 * Uses the ai-website-cloner-template to clone a website completely,
 * then applies the premium design upgrade, builds, and deploys to Vercel.
 *
 * Flow:
 * 1. Copy cloner template to temp dir
 * 2. Run Claude Code CLI: /clone-website <url>  (phase 1 — structural clone)
 * 3. Run Claude Code CLI: premium upgrade prompt (phase 2 — design uplift)
 * 4. Run: npm run build  (verify it compiles)
 * 5. Run: npx vercel --prod --yes  (deploy, capture URL)
 * 6. Return { previewUrl }
 */

import { execFile } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";

export interface CloneResult {
  success: boolean;
  projectDir: string;
  files: Record<string, string>;
  error?: string;
}

export interface CloneAndBuildResult {
  previewUrl: string | null;
  projectDir: string;
  error?: string;
}

// ─── Premium upgrade prompt ────────────────────────────────────────────────────
// Applied as a second Claude Code CLI call after the structural clone.
// Does NOT change any text content — only upgrades the visual design.

const PREMIUM_UPGRADE_PROMPT = `Apply premium design upgrade to this cloned website. Follow these steps exactly:

STEP 2: Create docs/brand-analysis.json with:
- sector: detect from business type (dental|restaurant|legal|fitness|beauty|hotel|ecommerce|realestate|medical|professional)
- colors: extract primary, accent, background, text from existing globals.css or Tailwind config
- tone: choose one of luxury|modern|warm|bold based on the sector and colors

STEP 3: Upgrade fonts. Choose ONE of these combinations based on sector:
- Professional/Dental/Legal/Medical: DM Serif Display (400,700) + DM Sans (300,400,600)
- Restaurant/Hotel/Beauty: Playfair Display (300,400,700) + Jost (300,400,600)
- Fitness/Ecommerce: Space Grotesk (400,600,700) + Inter (300,400,500)
Update src/app/layout.tsx to use next/font/google for the chosen fonts.
Update src/app/globals.css: add CSS variables --font-heading and --font-body, apply them to html/body.

STEP 4: Upgrade each component file found in src/components/:
- Header/Nav: add "use client". Apply backdrop-blur-md + bg-white/80 or bg-primary/90 when scrolled (useScrolled hook with window.scrollY > 60). Fixed position, z-50. Add hamburger button for mobile (useState for open/close).
- Hero section: ensure min-h-screen. If any <video> or <Image> is used as background, make it autoPlay muted loop playsInline with a dark gradient overlay (from-black/70 via-black/40 to-transparent). Add staggered fade-in animation classes to heading, subtitle, CTA button.
- Cards (service cards, feature cards, etc.): add rounded-md border border-neutral-200 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300.
- Buttons: primary button gets bg-primary text-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200. Ghost button gets border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200.
- Images: ensure all <Image> or <img> tags have className including object-cover and appropriate rounded-* class. Add loading="lazy" where missing.
- Footer: ensure dark background (bg-neutral-900 or bg-primary). If footer has multiple link groups, use a 3-column grid (grid-cols-1 md:grid-cols-3 gap-8).

STEP 5: Install framer-motion if not already in package.json.
Create src/components/FadeIn.tsx — a client component that wraps children in a motion.div with:
- initial={{ opacity: 0, y: 24 }}
- whileInView={{ opacity: 1, y: 0 }}
- viewport={{ once: true, margin: "-60px" }}
- transition={{ duration: 0.6, ease: "easeOut" }}
Import and wrap each major section (hero content, about section, services/cards sections, contact section, footer inner content) in <FadeIn>.

STEP 6: Add metadata and SEO to src/app/layout.tsx:
- Set title, description, openGraph (title, description, type: "website", locale), twitter card metadata.
- Use existing businessName and description from the site content.
Add Schema.org JSON-LD to src/app/page.tsx:
- Use LocalBusiness or the appropriate schema type
- Include name, description, telephone, address if found in the content

STEP 7: Run: npm run build
- If it fails due to TypeScript errors, fix them. Do NOT skip — the build MUST pass.
- Common issues: missing "use client" on components using hooks, missing types, wrong import paths.
- Fix all errors until npm run build exits with code 0.

IMPORTANT CONSTRAINTS:
- Do NOT change any text content (business name, descriptions, phone numbers, addresses, menu items, etc.)
- Do NOT replace any images — keep all existing public/ assets
- Do NOT change page routes or navigation structure
- Only modify: styling, animations, font imports, metadata, Schema.org JSON-LD
- After every file edit that touches a .tsx or .ts file, mentally verify it still type-checks
`;

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Full pipeline: clone → premium upgrade → build → Vercel deploy.
 * Returns the live Vercel preview URL, or null on failure.
 */
export async function cloneAndBuildSite(
  websiteUrl: string,
  slug: string,
  prospectId: string,
  options?: { timeoutMs?: number }
): Promise<CloneAndBuildResult> {
  // Phase 1 clone: 20 min. Phase 2 upgrade: 10 min. Build+deploy: 10 min.
  const cloneTimeoutMs = options?.timeoutMs ?? 1_200_000; // 20 min for clone
  const upgradeTimeoutMs = 600_000; // 10 min for upgrade
  const buildTimeoutMs = 300_000;   // 5 min for npm run build
  const deployTimeoutMs = 300_000;  // 5 min for vercel deploy

  const workDir = `/tmp/clone-${slug}-${Date.now()}`;
  const clonerBase = "/app/cloner"; // Pre-installed in Docker

  try {
    // ── Step 1: Copy cloner template ──────────────────────────────────────────
    await fs.cp(clonerBase, workDir, { recursive: true });
    console.log(`[CloneAndBuild] Copied cloner template to ${workDir}`);

    // ── Step 2: Clone the website ─────────────────────────────────────────────
    console.log(`[CloneAndBuild] Phase 1: cloning ${websiteUrl}`);
    const cloneResult = await runClaudeCLI(
      workDir,
      `/clone-website ${websiteUrl}`,
      cloneTimeoutMs
    );

    if (!cloneResult.success) {
      return {
        previewUrl: null,
        projectDir: workDir,
        error: `Clone phase failed: ${cloneResult.error}`,
      };
    }
    console.log(`[CloneAndBuild] Phase 1 complete — clone done`);

    // ── Step 3: Apply premium design upgrade ──────────────────────────────────
    console.log(`[CloneAndBuild] Phase 2: applying premium design upgrade`);
    const upgradeResult = await runClaudeCLI(
      workDir,
      PREMIUM_UPGRADE_PROMPT,
      upgradeTimeoutMs
    );

    if (!upgradeResult.success) {
      // Upgrade failure is non-fatal — we still deploy the raw clone
      console.warn(`[CloneAndBuild] Phase 2 upgrade failed (continuing): ${upgradeResult.error}`);
    } else {
      console.log(`[CloneAndBuild] Phase 2 complete — premium upgrade done`);
    }

    // ── Step 4: Verify build passes ───────────────────────────────────────────
    console.log(`[CloneAndBuild] Phase 3: verifying npm run build`);
    const buildResult = await runShell("npm", ["run", "build"], workDir, buildTimeoutMs);
    if (!buildResult.success) {
      console.warn(`[CloneAndBuild] npm run build failed: ${buildResult.error}`);
      // Non-fatal — Vercel will run its own build; local build failure may be env-related
    } else {
      console.log(`[CloneAndBuild] Phase 3 complete — build passed`);
    }

    // ── Step 5: Deploy to Vercel ──────────────────────────────────────────────
    console.log(`[CloneAndBuild] Phase 4: deploying to Vercel`);
    const projectName = `mc-preview-${slug}`.slice(0, 52);
    const deployResult = await deployViaVercelCLI(
      workDir,
      projectName,
      deployTimeoutMs
    );

    if (!deployResult.url) {
      return {
        previewUrl: null,
        projectDir: workDir,
        error: `Vercel deploy failed: ${deployResult.error}`,
      };
    }

    console.log(`[CloneAndBuild] Deployed: ${deployResult.url}`);
    return { previewUrl: deployResult.url, projectDir: workDir };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[CloneAndBuild] Unexpected error: ${error}`);
    return { previewUrl: null, projectDir: workDir, error };
  } finally {
    // Best-effort cleanup — leave dir if it may be needed for debugging
    // In production, /tmp is ephemeral anyway (Railway ephemeral filesystem)
  }
}

/**
 * Clone a website using JCodesMore ai-website-cloner-template + Claude Code CLI.
 * Runs headlessly on Railway — no human interaction needed.
 * @deprecated Use cloneAndBuildSite() for the full pipeline.
 */
export async function cloneWebsite(
  url: string,
  slug: string,
  options?: { timeoutMs?: number }
): Promise<CloneResult> {
  const timeoutMs = options?.timeoutMs ?? 600_000; // 10 min default
  const workDir = `/tmp/clone-${slug}-${Date.now()}`;
  const clonerBase = "/app/cloner"; // Pre-installed in Docker

  try {
    // Step 1: Copy cloner template to work directory
    await fs.cp(clonerBase, workDir, { recursive: true });
    console.log(`[CloneWebsite] Copied cloner to ${workDir}`);

    // Step 2: Run Claude Code CLI headlessly
    const claudeResult = await runClaudeCLI(workDir, `/clone-website ${url}`, timeoutMs);

    if (!claudeResult.success) {
      return { success: false, projectDir: workDir, files: {}, error: claudeResult.error };
    }

    // Step 3: Read all generated files from the cloned project
    const files = await readProjectFiles(workDir);
    console.log(`[CloneWebsite] Cloned ${Object.keys(files).length} files from ${url}`);

    return { success: true, projectDir: workDir, files };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[CloneWebsite] Failed: ${error}`);
    return { success: false, projectDir: workDir, files: {}, error };
  }
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Run Claude Code CLI headlessly with an arbitrary prompt.
 * Streams stdout line-by-line for Railway log visibility.
 */
function runClaudeCLI(
  workDir: string,
  prompt: string,
  timeoutMs: number
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const args = [
      "-p", prompt,
      "--allowedTools", "Bash,Read,Write,Edit,Glob,Grep,Agent,WebFetch,mcp__playwright__browser_navigate,mcp__playwright__browser_snapshot,mcp__playwright__browser_click,mcp__playwright__browser_evaluate,mcp__playwright__browser_take_screenshot,mcp__playwright__browser_type",
      "--max-turns", "200",
      "--output-format", "text",
    ];

    console.log(`[ClaudeCLI] Running in ${workDir}`);
    console.log(`[ClaudeCLI] Prompt preview: ${prompt.slice(0, 120).replace(/\n/g, " ")}...`);

    const proc = execFile("claude", args, {
      cwd: workDir,
      timeout: timeoutMs,
      maxBuffer: 50 * 1024 * 1024, // 50 MB output buffer
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: process.env["ANTHROPIC_API_KEY"],
        HOME: process.env["HOME"] ?? "/root",
        PATH: process.env["PATH"],
      },
    }, (error, stdout, stderr) => {
      if (error) {
        // ETIMEDOUT or non-zero exit
        const msg = error.message ?? String(error);
        console.error(`[ClaudeCLI] Error: ${msg}`);
        resolve({ success: false, error: msg });
        return;
      }
      if (stderr) {
        console.warn(`[ClaudeCLI] stderr (first 500): ${stderr.slice(0, 500)}`);
      }
      console.log(`[ClaudeCLI] Completed. Output length: ${stdout.length} chars`);
      resolve({ success: true });
    });

    proc.stdout?.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      if (line) console.log(`[ClaudeCLI] ${line.slice(0, 200)}`);
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      if (line) console.warn(`[ClaudeCLI/err] ${line.slice(0, 200)}`);
    });
  });
}

/**
 * Run a shell command and return success/failure.
 */
function runShell(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number
): Promise<{ success: boolean; stdout?: string; error?: string }> {
  return new Promise((resolve) => {
    const proc = execFile(command, args, {
      cwd,
      timeout: timeoutMs,
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env },
    }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: `${error.message}\n${stderr?.slice(0, 1000)}` });
        return;
      }
      resolve({ success: true, stdout });
    });

    proc.stdout?.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      if (line) console.log(`[Shell:${command}] ${line.slice(0, 200)}`);
    });
  });
}

/**
 * Deploy the project directory to Vercel using the Vercel CLI.
 * Parses the deploy URL from CLI output.
 */
async function deployViaVercelCLI(
  workDir: string,
  projectName: string,
  timeoutMs: number
): Promise<{ url: string | null; error?: string }> {
  const token = process.env["VERCEL_TOKEN"];
  if (!token) {
    return { url: null, error: "VERCEL_TOKEN not set — cannot deploy via CLI" };
  }

  // Ensure vercel.json is minimal (no git integration, correct project name)
  const vercelConfig = {
    name: projectName,
    public: true,
  };
  try {
    await fs.writeFile(
      path.join(workDir, "vercel.json"),
      JSON.stringify(vercelConfig, null, 2),
      "utf-8"
    );
  } catch { /* non-fatal */ }

  return new Promise((resolve) => {
    const args = [
      "vercel",
      "--prod",
      "--yes",
      "--token", token,
      "--name", projectName,
    ];

    // Optional team scope
    const teamId = process.env["VERCEL_TEAM_ID"];
    if (teamId) {
      args.push("--scope", teamId);
    }

    let outputBuffer = "";

    const proc = execFile("npx", args, {
      cwd: workDir,
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        VERCEL_TOKEN: token,
        // Suppress Vercel CLI update prompts
        VERCEL_CLI_NO_UPDATE_NOTIFIER: "1",
        CI: "1",
      },
    }, (error, stdout, stderr) => {
      outputBuffer = (stdout ?? "") + "\n" + (stderr ?? "");

      if (error) {
        console.error(`[Vercel CLI] Error: ${error.message}`);
        // Still try to parse a URL from output — partial deploys sometimes succeed
      }

      // Parse Vercel URL from output — it looks like:
      //   https://mc-preview-slug-abc123.vercel.app
      // or   Production: https://mc-preview-slug.vercel.app [5s]
      const urlMatch = outputBuffer.match(/https:\/\/[a-z0-9-]+\.vercel\.app/);
      if (urlMatch) {
        resolve({ url: urlMatch[0] });
      } else if (error) {
        resolve({ url: null, error: `${error.message}\n${outputBuffer.slice(0, 1000)}` });
      } else {
        resolve({ url: null, error: `No Vercel URL in output:\n${outputBuffer.slice(0, 1000)}` });
      }
    });

    proc.stdout?.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      if (line) console.log(`[Vercel CLI] ${line.slice(0, 200)}`);
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      if (line) console.warn(`[Vercel CLI/err] ${line.slice(0, 200)}`);
    });
  });
}

/**
 * Read all project files from the cloned directory.
 * Returns: { "src/app/page.tsx": "...", "public/images/hero.jpg": "..." }
 */
async function readProjectFiles(dir: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const ignorePatterns = [
    "node_modules", ".git", ".next", ".claude", "docs/research",
    "docs/design-references", ".turbo", "dist",
  ];

  async function walk(currentDir: string, prefix: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (ignorePatterns.some(p => relativePath.includes(p))) continue;

      if (entry.isDirectory()) {
        await walk(fullPath, relativePath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const textExts = [".tsx", ".ts", ".jsx", ".js", ".css", ".html", ".json", ".md", ".svg", ".mjs"];

        if (textExts.includes(ext)) {
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            files[relativePath] = content;
          } catch { /* skip unreadable files */ }
        }
      }
    }
  }

  await walk(dir, "");
  return files;
}
