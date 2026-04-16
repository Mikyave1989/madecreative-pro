/**
 * JCodesMore Website Cloner Integration
 *
 * Uses the ai-website-cloner-template to clone a website completely,
 * then the builder applies premium design upgrade.
 *
 * Flow:
 * 1. Copy cloner template to temp dir
 * 2. Run Claude Code CLI headlessly: /clone-website <url>
 * 3. Claude Code clones everything (assets, CSS, components, pages)
 * 4. Return the cloned project files
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

/**
 * Clone a website using JCodesMore ai-website-cloner-template + Claude Code CLI.
 * Runs headlessly on Railway — no human interaction needed.
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
    const claudeResult = await runClaudeCLI(workDir, url, timeoutMs);

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

/**
 * Run Claude Code CLI headlessly with /clone-website skill
 */
function runClaudeCLI(
  workDir: string,
  url: string,
  timeoutMs: number
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const args = [
      "-p", `/clone-website ${url}`,
      "--allowedTools", "Bash,Read,Write,Edit,Glob,Grep,Agent",
      "--max-turns", "200",
      "--output-format", "text",
    ];

    console.log(`[CloneWebsite] Running: claude ${args.join(" ")}`);
    console.log(`[CloneWebsite] Working dir: ${workDir}`);

    const proc = execFile("claude", args, {
      cwd: workDir,
      timeout: timeoutMs,
      maxBuffer: 50 * 1024 * 1024, // 50MB output buffer
      env: {
        ...process.env,
        // Claude Code needs these
        ANTHROPIC_API_KEY: process.env["ANTHROPIC_API_KEY"],
        HOME: process.env["HOME"] ?? "/root",
        PATH: process.env["PATH"],
      },
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[CloneWebsite] Claude CLI error: ${error.message}`);
        resolve({ success: false, error: error.message });
        return;
      }

      console.log(`[CloneWebsite] Claude CLI completed. Output: ${stdout.length} chars`);
      if (stderr) console.warn(`[CloneWebsite] stderr: ${stderr.slice(0, 500)}`);

      resolve({ success: true });
    });

    // Log progress
    proc.stdout?.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      if (line) console.log(`[CloneWebsite] ${line.slice(0, 200)}`);
    });
  });
}

/**
 * Read all project files from the cloned directory
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
        // Read text files, skip large binaries
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
