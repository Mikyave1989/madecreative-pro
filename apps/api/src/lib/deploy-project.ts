/**
 * deploy-project.ts
 *
 * Deploys a multi-file React/Next.js project to Vercel using the v13
 * Deployments API, then assigns a custom subdomain alias.
 *
 * Each file is base64-encoded and accompanied by its SHA-1 digest, which
 * Vercel uses for content-addressed deduplication.
 */

import { createHash } from "crypto";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface DeployProjectResult {
  deployUrl: string;
  vercelProjectId: string;
  deploymentId: string;
}

export interface DeployProjectParams {
  /** Map of file paths (relative, e.g. "app/page.tsx") → file contents (UTF-8). */
  files: Record<string, string>;
  /**
   * Vercel project name. Will be prefixed with "mc-" to avoid collisions.
   * Must consist only of lowercase letters, digits, and hyphens.
   */
  projectName: string;
  /** Subdomain segment only — the function appends ".madecreative.pro". */
  subdomain: string;
  /**
   * Vercel framework preset.
   * Defaults to "nextjs" when package.json is present; caller may override.
   */
  framework?: "nextjs" | "static";
}

// ─── Internal Vercel response shapes ─────────────────────────────────────────

interface VercelDeploymentResponse {
  id: string;
  url: string;
  name: string;
  readyState?: string;
}

interface VercelDomainResponse {
  name?: string;
  error?: { code: string; message: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute the SHA-1 hex digest of a UTF-8 string.
 * Vercel uses this for file-level content-addressed deduplication.
 */
function sha1(content: string): string {
  return createHash("sha1").update(content, "utf8").digest("hex");
}

/**
 * Build the Vercel `files` array expected by POST /v13/deployments.
 *
 * Each entry carries:
 *   file     — the path as it should appear in the deployment
 *   data     — base64-encoded file content
 *   encoding — always "base64"
 *   sha      — SHA-1 hex digest (used by Vercel for deduplication)
 *   size     — byte length of the raw (pre-encoded) content
 */
function buildVercelFiles(
  files: Record<string, string>
): Array<{ file: string; data: string; encoding: "base64"; sha: string; size: number }> {
  return Object.entries(files).map(([filePath, content]) => {
    const raw = Buffer.from(content, "utf8");
    return {
      file: filePath,
      data: raw.toString("base64"),
      encoding: "base64" as const,
      sha: sha1(content),
      size: raw.byteLength,
    };
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Deploy a collection of project files to Vercel and assign a custom
 * subdomain alias on madecreative.pro.
 *
 * Steps:
 *   1. POST /v13/deployments — create the deployment with all files
 *   2. POST /v10/projects/{name}/domains — assign the custom subdomain
 *   3. PATCH /v9/projects/{name} — disable Vercel authentication protection
 *
 * Steps 2 and 3 are non-fatal: a failure is logged but does not throw,
 * because the primary deployment URL is already functional.
 *
 * @throws {Error} when VERCEL_TOKEN is missing or the deployment API call fails.
 */
export async function deployProjectFiles(
  params: DeployProjectParams
): Promise<DeployProjectResult> {
  const { files, projectName, subdomain, framework = "nextjs" } = params;

  const VERCEL_TOKEN = process.env["VERCEL_TOKEN"];
  const VERCEL_TEAM_ID = process.env["VERCEL_TEAM_ID"];

  if (!VERCEL_TOKEN) {
    throw new Error(
      "VERCEL_TOKEN environment variable is not set — cannot deploy to Vercel"
    );
  }

  if (Object.keys(files).length === 0) {
    throw new Error("deployProjectFiles: files map is empty — nothing to deploy");
  }

  // Vercel project names must be lowercase, alphanumeric + hyphens only.
  const vercelProjectName = `mc-${projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/, "")
    .slice(0, 50)}`;

  const teamQuery = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
  const teamQueryAmp = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : "";

  const vercelFiles = buildVercelFiles(files);

  // Vercel framework setting: null means "no framework" (static).
  const vercelFramework: string | null = framework === "nextjs" ? "nextjs" : null;

  // ── Step 1: Create deployment ──────────────────────────────────────────────

  const deployRes = await fetch(
    `https://api.vercel.com/v13/deployments${teamQuery}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: vercelProjectName,
        target: "production",
        files: vercelFiles,
        public: true,
        projectSettings: {
          framework: vercelFramework,
          ...(vercelFramework === null ? { buildCommand: "", installCommand: "", outputDirectory: "." } : {}),
        },
      }),
    }
  );

  if (!deployRes.ok) {
    const errBody = await deployRes.text().catch(() => "");
    throw new Error(
      `Vercel deployment API error (HTTP ${deployRes.status}): ${errBody.slice(0, 500)}`
    );
  }

  const deployment = (await deployRes.json()) as VercelDeploymentResponse;

  if (!deployment.id) {
    throw new Error(
      "Vercel deployment API returned a response without an id — deployment state unknown"
    );
  }

  const deploymentId = deployment.id;
  const vercelProjectId = deployment.name ?? vercelProjectName;
  const customDomain = `${subdomain}.madecreative.pro`;

  // ── Step 2: Assign custom subdomain ───────────────────────────────────────

  try {
    const domainRes = await fetch(
      `https://api.vercel.com/v10/projects/${encodeURIComponent(vercelProjectName)}/domains?upsert=true${teamQueryAmp}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: customDomain }),
      }
    );

    if (!domainRes.ok) {
      const domainBody = (await domainRes
        .json()
        .catch(() => ({}))) as VercelDomainResponse;
      console.warn(
        `[deployProjectFiles] Domain alias warning (HTTP ${domainRes.status}):`,
        domainBody?.error?.message ?? JSON.stringify(domainBody).slice(0, 200)
      );
    }
  } catch (domainErr) {
    // Non-fatal: the deployment URL is valid regardless of domain aliasing.
    console.warn("[deployProjectFiles] Domain alias error (non-fatal):", domainErr);
  }

  // ── Step 3: Disable Vercel authentication protection ──────────────────────
  // Without this, Vercel's "Deployment Protection" would require visitors to
  // authenticate with their Vercel account — unusable for public sites.

  try {
    const protectionQuery = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
    await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(vercelProjectName)}${protectionQuery}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vercelAuthentication: { deploymentType: "none" },
          ssoProtection: null,
        }),
      }
    );
  } catch {
    // Non-fatal
  }

  // Prefer the Vercel-issued deployment URL; fall back to the custom domain.
  const deployUrl = deployment.url
    ? `https://${deployment.url}`
    : `https://${customDomain}`;

  return { deployUrl, vercelProjectId, deploymentId };
}
