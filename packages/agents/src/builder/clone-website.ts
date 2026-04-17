/**
 * JCodesMore Website Cloner Integration
 *
 * Flow:
 * 1. Copy cloner template to temp dir
 * 2. Run Claude Code CLI: /clone-website <url>  (phase 1 — structural clone via JCodesMore skill)
 * 3. Commit clean clone as rollback point
 * 4. Run Claude Code CLI: invoke `frontend-design` skill (phase 2 — design uplift)
 * 5. Run: npm run build  (revert to clean clone if build fails)
 * 6. Run: npx vercel --prod --yes  (deploy, capture URL)
 * 7. Return { previewUrl }
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

// ─── Phase boundary paths ──────────────────────────────────────────────────────
// These files define the contract between the two Claude Code sessions.

const CLONER_ROOT = "/app/cloner";
const CLONE_SKILL_PATH = `${CLONER_ROOT}/.claude/skills/clone-website/SKILL.md`;
const DESIGN_SKILL_PATH = `${CLONER_ROOT}/.claude/skills/frontend-design/SKILL.md`;

// ─── Design upgrade prompt ─────────────────────────────────────────────────────
// Invokes the official Anthropic `frontend-design` skill (installed at build time
// into /app/cloner/.claude/skills/frontend-design/SKILL.md). The skill drives all
// creative choices — we only supply the hard constraints that protect the cloned
// content from being mutated, and we forbid re-invoking the clone-website skill
// (both skills are visible in Phase 2; we must disambiguate explicitly).

const FRONTEND_DESIGN_UPGRADE_PROMPT = [
  "PHASE 2 — DESIGN UPGRADE. The website has already been cloned into the current directory by Phase 1. Your job is to redesign its aesthetics ONLY.",
  "",
  "FIRST, read the skill definition so you follow it exactly:",
  "  Read(.claude/skills/frontend-design/SKILL.md)",
  "",
  "Then engage the `frontend-design` skill to redesign this already-cloned Next.js project to premium, production-grade quality.",
  "",
  "DO NOT invoke the `clone-website` skill. The clone is already done — treat the existing files on disk as the ground truth and only edit their visual aesthetics.",
  "",
  "HARD CONSTRAINTS (override the skill's defaults where they conflict):",
  "- Do NOT change any text content (business name, descriptions, menu items, contact info, page titles, copy)",
  "- Do NOT change any image URLs or delete any media files under public/",
  "- Do NOT change page routes, navigation structure, or file layout under src/app/",
  "- Do NOT add new pages or remove existing ones — the route set is frozen",
  "- You MAY change: typography, colors, layout, spacing, motion, atmosphere, visual aesthetics, component internals",
  "- You MAY install npm packages you need (framer-motion, lucide-react, @fontsource/*, etc.)",
  "- Run `npx tsc --noEmit` after each major edit and fix errors as you go",
  "",
  "Pick a BOLD aesthetic direction that fits the business sector (restaurant, dental, beauty, hotel, legal, fitness, etc.) and execute it with precision per the skill's design-thinking guidelines. Vary between light and dark themes and use distinctive Google Fonts pairings — do NOT default to Inter, Space Grotesk, or generic purple gradients.",
  "",
  "EXIT CRITERIA: you MUST run `npm run build` and keep fixing errors until it exits with code 0. If you cannot reach a clean build, stop and report — do not declare success.",
].join("\n");

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
    // ── Preflight: verify both skills are installed in the cloner base ────────
    // If Docker build silently skipped a COPY step, we'd otherwise burn a
    // 30-min Claude run producing nothing. Fail fast with a clear error.
    const skillCheck = await verifySkillsInstalled();
    if (!skillCheck.ok) {
      return {
        previewUrl: null,
        projectDir: workDir,
        error: `Preflight failed: ${skillCheck.error}`,
      };
    }

    // ── Step 1: Copy cloner template ──────────────────────────────────────────
    await fs.cp(clonerBase, workDir, { recursive: true });
    console.log(`[CloneAndBuild] Copied cloner template to ${workDir}`);

    // ── Step 2: Clone the website (Phase 1 — `clone-website` skill) ───────────
    // Uses Haiku: clone is mechanical work (crawl, copy text, download assets,
    // generate routes). Sonnet would be wasteful here — Haiku is ~4x cheaper
    // and handles deterministic tasks fine.
    console.log(`[CloneAndBuild] Phase 1: cloning ${websiteUrl} (Haiku)`);
    const cloneResult = await runClaudeCLI(
      workDir,
      `/clone-website ${websiteUrl}`,
      cloneTimeoutMs,
      "claude-haiku-4-5",
    );

    if (!cloneResult.success) {
      return {
        previewUrl: null,
        projectDir: workDir,
        error: `Clone phase failed: ${cloneResult.error}`,
      };
    }
    console.log(`[CloneAndBuild] Phase 1 complete — clone done`);

    // ── Step 2a: Sanity-check the Phase 1 output ──────────────────────────────
    // Phase 2 (frontend-design) assumes a working Next.js project. If Phase 1
    // produced something broken, redesigning it wastes time. Check the handoff
    // contract: package.json + a page file must exist.
    const phase1Ok = await verifyClonedProject(workDir);
    if (!phase1Ok.ok) {
      return {
        previewUrl: null,
        projectDir: workDir,
        error: `Phase 1 output invalid — Phase 2 handoff aborted: ${phase1Ok.error}`,
      };
    }
    console.log(`[CloneAndBuild] Phase 1 handoff verified — ${phase1Ok.details}`);

    // ── Step 2b: Commit clean clone as rollback point ─────────────────────────
    // CRITICAL: without this commit, `git checkout .` below would revert
    // to the pristine cloner template (pre-clone), wiping out the entire clone.
    await runShell("git", ["config", "user.email", "bot@madecreative.pro"], workDir, 10_000).catch(() => {});
    await runShell("git", ["config", "user.name", "MadeCreative Bot"], workDir, 10_000).catch(() => {});
    await runShell("git", ["add", "-A"], workDir, 60_000).catch(() => {});
    const cleanCloneCommit = await runShell(
      "git",
      ["commit", "-m", "clean clone (pre-premium-upgrade rollback point)", "--allow-empty"],
      workDir,
      60_000,
    );
    if (!cleanCloneCommit.success) {
      console.warn(`[CloneAndBuild] Failed to commit clean clone rollback point: ${cleanCloneCommit.error}`);
    } else {
      console.log(`[CloneAndBuild] Clean clone committed as rollback point`);
    }

    // ── Step 3: Apply premium design upgrade via OFFICIAL Anthropic skill ────
    // Invokes Anthropic's `frontend-design` skill (installed at build time in
    // /app/cloner/.claude/skills/frontend-design/SKILL.md). The skill handles
    // creative direction; FRONTEND_DESIGN_UPGRADE_PROMPT supplies our hard
    // constraints (don't mutate cloned content, must build clean).
    // Phase 2 stays on Sonnet: creative/aesthetic work where model quality
    // directly translates to preview polish → higher conversion rate.
    console.log(`[CloneAndBuild] Phase 2: invoking frontend-design skill (Sonnet)`);
    const upgradeResult = await runClaudeCLI(
      workDir,
      FRONTEND_DESIGN_UPGRADE_PROMPT,
      upgradeTimeoutMs,
      "claude-sonnet-4-6",
    );

    if (!upgradeResult.success) {
      console.warn(`[CloneAndBuild] Phase 2 FAILED: ${upgradeResult.error}`);
    } else {
      console.log(`[CloneAndBuild] Phase 2 /frontend-design skill complete`);
    }

    // ── Step 4: Verify build passes — if not, revert to CLEAN CLONE COMMIT ──
    console.log(`[CloneAndBuild] Phase 3: verifying npm run build`);
    const buildResult = await runShell("npm", ["run", "build"], workDir, buildTimeoutMs);
    if (!buildResult.success) {
      console.warn(`[CloneAndBuild] Build failed after premium upgrade — reverting to clean clone commit`);
      console.warn(`[CloneAndBuild] Build error (first 1000 chars): ${buildResult.error?.slice(0, 1000)}`);
      // Revert to the clean-clone commit (not to pristine template).
      await runShell("git", ["reset", "--hard", "HEAD"], workDir, 30_000).catch(() => {});
      await runShell("git", ["clean", "-fd"], workDir, 30_000).catch(() => {});
      // Reinstall deps in case package.json was reverted (framer-motion etc.)
      await runShell("npm", ["install", "--no-audit", "--no-fund"], workDir, 300_000).catch(() => {});
      const retryBuild = await runShell("npm", ["run", "build"], workDir, buildTimeoutMs).catch(() => ({ success: false, error: "retry exception" }));
      if (retryBuild.success) {
        console.log(`[CloneAndBuild] Reverted to clean clone — build passes`);
      } else {
        console.warn(`[CloneAndBuild] Build still fails after revert — Vercel will retry on deploy`);
      }
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
 * Preflight: verify both skill files are present in the cloner base image.
 * If the Dockerfile drifted (e.g. a COPY step was renamed or a skill was
 * removed upstream), we catch it here instead of discovering it 30 min into
 * a Claude run.
 */
async function verifySkillsInstalled(): Promise<{ ok: boolean; error?: string }> {
  for (const p of [CLONE_SKILL_PATH, DESIGN_SKILL_PATH]) {
    try {
      const stat = await fs.stat(p);
      if (!stat.isFile() || stat.size < 100) {
        return { ok: false, error: `${p} exists but looks empty (${stat.size} bytes)` };
      }
    } catch {
      return { ok: false, error: `required skill missing: ${p}` };
    }
  }
  return { ok: true };
}

/**
 * Verify that Phase 1 produced a Next.js project Phase 2 can work with.
 * This is the contract between the two skills — if it fails, we do NOT
 * hand the project to frontend-design, because it would waste 15-30 min
 * redesigning nothing or producing a broken build.
 */
async function verifyClonedProject(
  workDir: string,
): Promise<{ ok: boolean; error?: string; details?: string }> {
  // 1. package.json must exist and be parseable
  const pkgPath = path.join(workDir, "package.json");
  let pkg: { dependencies?: Record<string, string>; name?: string };
  try {
    const raw = await fs.readFile(pkgPath, "utf-8");
    pkg = JSON.parse(raw) as typeof pkg;
  } catch (err) {
    return { ok: false, error: `package.json missing or invalid: ${err instanceof Error ? err.message : String(err)}` };
  }
  if (!pkg.dependencies?.["next"]) {
    return { ok: false, error: `package.json has no "next" dependency — Phase 1 did not produce a Next.js project` };
  }

  // 2. Some page entry must exist — either App Router or Pages Router
  const appPage = path.join(workDir, "src/app/page.tsx");
  const appPageJs = path.join(workDir, "src/app/page.jsx");
  const pagesIndex = path.join(workDir, "src/pages/index.tsx");
  const pagesIndexJs = path.join(workDir, "src/pages/index.jsx");
  const pagesRootIndex = path.join(workDir, "pages/index.tsx");
  let entryFound: string | null = null;
  for (const candidate of [appPage, appPageJs, pagesIndex, pagesIndexJs, pagesRootIndex]) {
    try {
      const s = await fs.stat(candidate);
      if (s.isFile() && s.size > 100) {
        entryFound = candidate;
        break;
      }
    } catch { /* keep looking */ }
  }
  if (!entryFound) {
    return { ok: false, error: `no page entry file found (src/app/page.tsx or src/pages/index.tsx)` };
  }

  // 3. Count asset files — if 0, the clone didn't actually download anything
  let assetCount = 0;
  try {
    const publicDir = path.join(workDir, "public");
    const walk = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) await walk(path.join(dir, entry.name));
        else if (entry.isFile()) assetCount++;
      }
    };
    await walk(publicDir).catch(() => { /* no public dir */ });
  } catch { /* non-fatal */ }

  return {
    ok: true,
    details: `entry=${path.relative(workDir, entryFound)} publicAssets=${assetCount} deps=${Object.keys(pkg.dependencies ?? {}).length}`,
  };
}

/**
 * Run Claude Code CLI headlessly with an arbitrary prompt.
 * Streams stdout line-by-line for Railway log visibility.
 *
 * @param model optional model override (e.g. "claude-haiku-4-5" for cheap
 *   mechanical work, "claude-sonnet-4-6" for creative/aesthetic work).
 *   Omit to use the CLI's default.
 */
function runClaudeCLI(
  workDir: string,
  prompt: string,
  timeoutMs: number,
  model?: string,
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const args = [
      "-p", prompt,
      "--allowedTools", "Bash,Read,Write,Edit,MultiEdit,Glob,Grep,Agent,WebFetch,mcp__playwright__browser_navigate,mcp__playwright__browser_snapshot,mcp__playwright__browser_click,mcp__playwright__browser_evaluate,mcp__playwright__browser_take_screenshot,mcp__playwright__browser_type",
      "--max-turns", "200",
      "--output-format", "text",
    ];
    if (model) args.push("--model", model);

    console.log(`[ClaudeCLI] Running in ${workDir}${model ? ` (model=${model})` : ""}`);
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
