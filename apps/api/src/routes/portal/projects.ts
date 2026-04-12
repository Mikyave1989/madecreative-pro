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

export default app;
