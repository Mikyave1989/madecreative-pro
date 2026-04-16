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

const PREMIUM_UPGRADE_PROMPT = `You MUST upgrade this cloned website's visual design to premium quality. Execute these commands IN ORDER. Do NOT skip any step. After EACH step, verify it worked.

STEP 1: Read the project structure.
Run: ls src/components/ && ls src/app/ && cat src/app/globals.css | head -30
This tells you what files exist.

STEP 2: Install framer-motion.
Run: npm install framer-motion
Verify: grep framer-motion package.json

STEP 3: Create the FadeIn animation component.
Write this EXACT file to src/components/FadeIn.tsx:

'use client'
import { motion } from 'framer-motion'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export const FadeIn = ({ children, delay = 0, direction = 'up' }: FadeInProps) => {
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
    >
      {children}
    </motion.div>
  )
}

Verify: cat src/components/FadeIn.tsx

STEP 4: Upgrade the Header/Nav component.
Read the header file: cat src/components/Header.tsx (or whatever the nav component is called — check ls src/components/)
Then edit it to add:
- Add "use client" at the top
- Add useState and useEffect imports from react
- Add scroll detection: const [scrolled, setScrolled] = useState(false) + useEffect with window scroll listener
- When scrolled: apply className "backdrop-blur-md bg-white/85 shadow-sm border-b border-neutral-200"
- When not scrolled: apply "bg-transparent"
- Make it position: fixed, top: 0, left: 0, right: 0, z-index: 50
- Nav links: add uppercase tracking-wide text-sm
- Add a hamburger button for mobile (hidden on md+)
Verify: npx tsc --noEmit (must have 0 errors)

STEP 5: Upgrade the Hero section.
Read: cat src/components/HeroSection.tsx (or similar name)
Edit it to:
- Set min-h-screen on the container
- If there's a video, make sure it has autoPlay muted loop playsInline
- Add a dark gradient overlay: linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7))
- Make the title font-size clamp(2.5rem, 6vw, 5rem), font-weight bold, tracking-wide
- Add primary CTA button (gold/brand color background) + ghost button (transparent with border)
- Import and use FadeIn to stagger-animate the heading (delay=0), subtitle (delay=0.15), buttons (delay=0.3)
Verify: npx tsc --noEmit

STEP 6: Upgrade ALL card-like components.
For EVERY file in src/components/ that renders cards, items, or grid elements, add:
- rounded-lg border border-neutral-200 shadow-sm
- hover:-translate-y-1 hover:shadow-md transition-all duration-300
- padding p-6
- background bg-white
Read each file, edit it, verify.

STEP 7: Upgrade the Footer.
Read the footer component and edit:
- Dark background: bg-neutral-900 text-white
- 3-column grid layout on desktop: grid grid-cols-1 md:grid-cols-3 gap-8
- Copyright separator: border-t border-white/10 mt-8 pt-6
Verify: npx tsc --noEmit

STEP 8: Wrap all sections in FadeIn.
Read src/app/page.tsx (the homepage).
Import FadeIn from "@/components/FadeIn".
Wrap EACH section component call in <FadeIn> tags. For items in a grid, use delay={0}, delay={0.1}, delay={0.2}.
Do the same for ALL sub-pages: read each file in src/app/*/page.tsx and add FadeIn wrapping.
Verify: npx tsc --noEmit

STEP 9: Add SEO metadata.
Edit src/app/layout.tsx:
- Add openGraph object to metadata with title, description, type: "website"
- Add a <script type="application/ld+json"> with Schema.org LocalBusiness data (name, telephone, address from the site content)
Verify: npx tsc --noEmit

STEP 10: Final build verification.
Run: npm run build
If it fails, FIX the errors. Common fixes:
- Add "use client" to files that use useState/useEffect/motion
- Fix import paths
- Remove unused variables
Keep fixing until: npm run build exits with 0

STEP 11: Verify premium features are applied.
Run: grep -r "FadeIn" src/app/ | wc -l
Run: grep -r "backdrop-blur" src/components/ | wc -l
Run: grep -r "framer-motion" src/components/ | wc -l
Run: grep -r "hover:" src/components/ | wc -l
ALL counts must be > 0. If any is 0, go back and fix that step.

ABSOLUTE RULES:
- Do NOT change any text content
- Do NOT delete any images
- Do NOT change page routes
- ONLY change visual design, animations, fonts, metadata
- VERIFY after every edit with npx tsc --noEmit
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
  // NO TIME LIMITS — each phase takes as long as it needs
  const cloneTimeoutMs = 0;    // unlimited
  const upgradeTimeoutMs = 0;  // unlimited
  const buildTimeoutMs = 0;    // unlimited
  const deployTimeoutMs = 0;   // unlimited

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

    // ── Step 3: Apply premium design upgrade (programmatic — no AI) ─────────
    console.log(`[CloneAndBuild] Phase 2: applying premium design upgrade (code-based)`);
    const { applyPremiumUpgrade } = await import("./premium-upgrade.js");
    const upgradeResult = await applyPremiumUpgrade(workDir);

    if (!upgradeResult.success) {
      console.warn(`[CloneAndBuild] Phase 2 upgrade warning: ${upgradeResult.error}`);
    } else {
      console.log(`[CloneAndBuild] Phase 2 complete — premium upgrade applied`);
    }

    // ── Step 4: Verify build passes — if not, revert premium upgrade ────────
    console.log(`[CloneAndBuild] Phase 3: verifying npm run build`);
    const buildResult = await runShell("npm", ["run", "build"], workDir, buildTimeoutMs);
    if (!buildResult.success) {
      console.warn(`[CloneAndBuild] Build failed after premium upgrade — reverting to clean clone`);
      // Revert: re-run clone without upgrade by doing a fresh git checkout
      await runShell("git", ["checkout", "."], workDir, 30_000).catch(() => {});
      await runShell("npm", ["run", "build"], workDir, buildTimeoutMs).catch(() => {});
      console.log(`[CloneAndBuild] Reverted to clean clone`);
    } else {
      console.log(`[CloneAndBuild] Phase 3 complete — build passed with premium upgrade`);
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
