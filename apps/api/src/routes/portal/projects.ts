/**
 * Portal Projects API — multi-project support (Lovable-style)
 *
 * GET    /portal/projects          — list all projects
 * POST   /portal/projects          — create new project
 * GET    /portal/projects/:id      — get project details + files
 * PATCH  /portal/projects/:id      — rename / update project
 * DELETE /portal/projects/:id      — delete project and all files
 * POST   /portal/projects/:id/duplicate — duplicate a project
 */

import { Hono } from "hono";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// ─── GET /portal/projects ────────────────────────────────────────────────────

app.get("/", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;

  const projects = await prisma.clientWebsite.findMany({
    where: { clientId, isActive: true },
    select: {
      id: true,
      name: true,
      domain: true,
      subdomain: true,
      deployUrl: true,
      deployStatus: true,
      createdAt: true,
      updatedAt: true,
      client: { select: { sector: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return c.json({
    success: true,
    data: projects.map((p) => ({
      id: p.id,
      name: p.name,
      domain: p.domain,
      subdomain: p.subdomain,
      deployUrl: p.deployUrl,
      deployStatus: p.deployStatus,
      sector: p.client.sector,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  });
});

// ─── POST /portal/projects ───────────────────────────────────────────────────

app.post("/", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;

  const body = await c.req.json().catch(() => null);
  if (!body?.name || typeof body.name !== "string") {
    return c.json({ success: false, error: "Project name is required" }, 400);
  }

  const projectName = (body.name as string).trim().slice(0, 100);
  if (!projectName) {
    return c.json({ success: false, error: "Project name cannot be empty" }, 400);
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { companyName: true },
  });
  if (!client) return c.json({ success: false, error: "Client not found" }, 404);

  // Count existing active projects
  const count = await prisma.clientWebsite.count({
    where: { clientId, isActive: true },
  });
  if (count >= 10) {
    return c.json({ success: false, error: "Maximum 10 projects allowed" }, 400);
  }

  // Generate a unique subdomain slug from project name
  const baseSlug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "project";

  // Ensure subdomain uniqueness by appending a random suffix
  const suffix = Math.random().toString(36).slice(2, 7);
  const subdomain = `${baseSlug}-${suffix}`;

  const project = await prisma.clientWebsite.create({
    data: {
      clientId,
      name: projectName,
      domain: `${subdomain}.madecreative.pro`,
      subdomain,
      pages: {},
      files: {},
      deployStatus: "NONE",
    },
  });

  return c.json(
    {
      success: true,
      data: {
        id: project.id,
        name: project.name,
        domain: project.domain,
        subdomain: project.subdomain,
        deployStatus: project.deployStatus,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    },
    201
  );
});

// ─── GET /portal/projects/:id ────────────────────────────────────────────────

app.get("/:id", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const project = await prisma.clientWebsite.findFirst({
    where: { id, clientId, isActive: true },
    include: { client: { select: { sector: true, companyName: true, language: true } } },
  });

  if (!project) {
    return c.json({ success: false, error: "Project not found" }, 404);
  }

  return c.json({
    success: true,
    data: {
      id: project.id,
      name: project.name,
      domain: project.domain,
      subdomain: project.subdomain,
      deployUrl: project.deployUrl,
      deployStatus: project.deployStatus,
      files: project.files ?? {},
      designTokens: project.designTokens,
      sector: project.client.sector,
      companyName: project.client.companyName,
      language: project.client.language,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
  });
});

// ─── PATCH /portal/projects/:id ─────────────────────────────────────────────

app.patch("/:id", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const project = await prisma.clientWebsite.findFirst({
    where: { id, clientId, isActive: true },
  });
  if (!project) return c.json({ success: false, error: "Project not found" }, 404);

  const body = await c.req.json().catch(() => null);
  const updates: { name?: string } = {};

  if (body?.name && typeof body.name === "string") {
    const trimmed = body.name.trim().slice(0, 100);
    if (trimmed) updates.name = trimmed;
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, error: "No valid fields to update" }, 400);
  }

  const updated = await prisma.clientWebsite.update({
    where: { id },
    data: updates,
    select: { id: true, name: true, updatedAt: true },
  });

  return c.json({ success: true, data: updated });
});

// ─── DELETE /portal/projects/:id ─────────────────────────────────────────────

app.delete("/:id", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const project = await prisma.clientWebsite.findFirst({
    where: { id, clientId, isActive: true },
  });
  if (!project) return c.json({ success: false, error: "Project not found" }, 404);

  // Soft-delete: mark as inactive, wipe files to save storage
  await prisma.clientWebsite.update({
    where: { id },
    data: { isActive: false, files: {}, pages: {} },
  });

  return c.json({ success: true, data: { deleted: true, id } });
});

// ─── POST /portal/projects/:id/duplicate ─────────────────────────────────────

app.post("/:id/duplicate", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const project = await prisma.clientWebsite.findFirst({
    where: { id, clientId, isActive: true },
  });
  if (!project) return c.json({ success: false, error: "Project not found" }, 404);

  // Count existing to enforce limit
  const count = await prisma.clientWebsite.count({ where: { clientId, isActive: true } });
  if (count >= 10) {
    return c.json({ success: false, error: "Maximum 10 projects allowed" }, 400);
  }

  const baseName = `${project.name} (Copy)`.slice(0, 100);
  const suffix = Math.random().toString(36).slice(2, 7);
  const baseSlug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "copy";
  const subdomain = `${baseSlug}-${suffix}`;

  const duplicate = await prisma.clientWebsite.create({
    data: {
      clientId,
      name: baseName,
      domain: `${subdomain}.madecreative.pro`,
      subdomain,
      pages: project.pages as object,
      files: (project.files ?? {}) as object,
      designTokens: project.designTokens as object | undefined,
      deployStatus: "NONE",
    },
  });

  return c.json(
    {
      success: true,
      data: {
        id: duplicate.id,
        name: duplicate.name,
        domain: duplicate.domain,
        createdAt: duplicate.createdAt,
      },
    },
    201
  );
});

// ─── POST /portal/projects/:id/deploy ────────────────────────────────────────
//
// Routing logic:
//   - Files that include a "package.json" key are treated as a full Next.js
//     project and deployed via deployProjectFiles (Vercel v13 API).
//   - Files that contain only HTML (no package.json) fall back to the original
//     deploySite function for backward compatibility.

app.post("/:id/deploy", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const project = await prisma.clientWebsite.findFirst({
    where: { id, clientId, isActive: true },
    include: { client: { select: { companyName: true, sector: true } } },
  });
  if (!project) return c.json({ success: false, error: "Project not found" }, 404);

  const body = await c.req.json().catch(() => null);
  const files = body?.files as Record<string, string> | undefined;

  if (!files || Object.keys(files).length === 0) {
    return c.json({ success: false, error: "No files to deploy" }, 400);
  }

  // Persist files and mark deployment as in-progress before the async work.
  await prisma.clientWebsite.update({
    where: { id },
    data: { files: files as object, deployStatus: "DEPLOYING" },
  });

  const subdomain = project.subdomain || project.id.slice(0, 12);

  // Detect project type from the files map:
  //   forceStatic=true  → caller explicitly wants no-build (pure HTML/CSS/JS)
  //   package.json with "next" dep → Next.js project
  //   package.json with "vite" dep → Vite/React project (needs npm run build → dist/)
  //   no package.json   → plain static HTML
  const forceStatic = Boolean(body?.forceStatic);

  type Framework = "nextjs" | "vite" | "static";
  let framework: Framework = "static";

  if (!forceStatic && "package.json" in files) {
    try {
      const pkg = JSON.parse(files["package.json"]!) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if ("next" in allDeps) {
        framework = "nextjs";
      } else if ("vite" in allDeps) {
        framework = "vite";
      }
    } catch {
      // Malformed package.json — fall back to static
    }
  }

  try {
    let deployUrl: string;
    let vercelProjectId: string;
    let deploymentId: string | undefined;

    {
      // ── Deploy with detected framework ────────────────────────────────────
      const { deployProjectFiles } = await import("../../lib/deploy-project.js");

      const result = await deployProjectFiles({
        files,
        projectName: subdomain,
        subdomain,
        framework,
      });

      deployUrl = result.deployUrl;
      vercelProjectId = result.vercelProjectId;
      deploymentId = result.deploymentId;
    }

    await prisma.clientWebsite.update({
      where: { id },
      data: {
        deployUrl,
        vercelProjectId,
        deployStatus: "DEPLOYED",
        lastDeployedAt: new Date(),
      },
    });

    return c.json({
      success: true,
      data: {
        deployUrl,
        vercelProjectId,
        ...(deploymentId ? { deploymentId } : {}),
        deployStatus: "DEPLOYED",
      },
    });
  } catch (err) {
    await prisma.clientWebsite.update({
      where: { id },
      data: { deployStatus: "FAILED" },
    });

    const message = err instanceof Error ? err.message : "Deploy failed";
    console.error(`[deploy /:id/deploy] project=${id} error:`, message);

    return c.json({ success: false, error: message }, 500);
  }
});

// ─── POST /portal/projects/:id/files ─────────────────────────────────────────

app.post("/:id/files", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const project = await prisma.clientWebsite.findFirst({
    where: { id, clientId, isActive: true },
  });
  if (!project) return c.json({ success: false, error: "Project not found" }, 404);

  const body = await c.req.json().catch(() => null);
  const files = body?.files as Record<string, string> | undefined;

  if (!files) {
    return c.json({ success: false, error: "No files provided" }, 400);
  }

  await prisma.clientWebsite.update({
    where: { id },
    data: { files: files as object },
  });

  return c.json({ success: true, data: { saved: Object.keys(files).length } });
});

// ─── POST /portal/projects/:id/domain — Set custom domain ──────────────────

app.post("/:id/domain", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const project = await prisma.clientWebsite.findFirst({
    where: { id, clientId, isActive: true },
  });
  if (!project) return c.json({ success: false, error: "Project not found" }, 404);

  // Only Growth and Pro can use custom domains
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { plan: true },
  });
  if (client?.plan === "STARTER") {
    return c.json({ success: false, error: "Custom domains require Growth or Pro plan" }, 403);
  }

  const body = await c.req.json().catch(() => null);
  const domain = (body?.domain as string)?.trim().toLowerCase();

  if (!domain || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/.test(domain)) {
    return c.json({ success: false, error: "Invalid domain format" }, 400);
  }

  const vercelToken = process.env["VERCEL_TOKEN"];
  const teamId = process.env["VERCEL_TEAM_ID"];
  if (!vercelToken) {
    return c.json({ success: false, error: "Deployment not configured" }, 500);
  }

  if (!project.vercelProjectId) {
    return c.json({ success: false, error: "Deploy your project first before adding a custom domain" }, 400);
  }

  try {
    const addRes = await fetch(
      `https://api.vercel.com/v10/projects/${project.vercelProjectId}/domains${teamId ? `?teamId=${teamId}` : ""}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      }
    );

    const addData = await addRes.json() as { name?: string; error?: { code?: string; message?: string } };

    if (!addRes.ok) {
      return c.json({ success: false, error: addData.error?.message || "Failed to add domain" }, 400);
    }

    await prisma.clientWebsite.update({
      where: { id },
      data: { domain },
    });

    const isSubdomain = domain.split(".").length > 2;

    return c.json({
      success: true,
      data: {
        domain,
        dns: isSubdomain
          ? { type: "CNAME", name: domain.split(".")[0], value: "cname.vercel-dns.com" }
          : { type: "A", name: "@", value: "76.76.21.21" },
        message: `Add the DNS record below, then your site will be live at https://${domain}`,
      },
    });
  } catch (err) {
    return c.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to add domain" },
      500
    );
  }
});

// ─── POST /portal/projects/dedup — Delete duplicate projects (same name, keep newest) ─

app.post("/dedup", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;

  // Find all active projects for this client
  const all = await prisma.clientWebsite.findMany({
    where: { clientId, isActive: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true, deployUrl: true },
  });

  // Group by name — keep the first (newest), soft-delete the rest
  const seen = new Map<string, string>(); // name → kept id
  const toDelete: string[] = [];

  for (const p of all) {
    const key = p.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, p.id);
    } else {
      toDelete.push(p.id);
    }
  }

  if (toDelete.length > 0) {
    await prisma.clientWebsite.updateMany({
      where: { id: { in: toDelete }, clientId },
      data: { isActive: false, files: {}, pages: {} },
    });
  }

  return c.json({
    success: true,
    data: { deleted: toDelete.length, kept: seen.size },
  });
});

export default app;
