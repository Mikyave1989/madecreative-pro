import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import {
  ProspectFilterSchema,
  ProspectCreateSchema,
  ProspectUpdateSchema,
} from "@madecreative/shared";
import { PAGINATION } from "@madecreative/shared";

const app = new Hono();

// GET /admin/prospects
app.get("/", async (c) => {
  const query = c.req.query();
  const parsed = ProspectFilterSchema.safeParse(query);

  if (!parsed.success) {
    return c.json(
      { success: false, error: "Validation error", details: parsed.error.flatten() },
      400
    );
  }

  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    sortBy = "createdAt",
    sortOrder = "desc",
    country,
    sector,
    status,
    minLeadScore,
    maxLeadScore,
    hasWebsite,
    search,
  } = parsed.data;

  const where: Record<string, unknown> = {
    ...(country ? { country } : {}),
    ...(sector ? { sector } : {}),
    ...(status ? { status } : {}),
    ...(hasWebsite !== undefined ? { hasWebsite } : {}),
    ...(minLeadScore !== undefined || maxLeadScore !== undefined
      ? {
          leadScore: {
            ...(minLeadScore !== undefined ? { gte: minLeadScore } : {}),
            ...(maxLeadScore !== undefined ? { lte: maxLeadScore } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { companyName: { contains: search, mode: "insensitive" } },
            { contactEmail: { contains: search, mode: "insensitive" } },
            { contactName: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.prospect.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        outreachEmails: {
          select: { id: true, stepNumber: true, status: true, sentAt: true },
          orderBy: { stepNumber: "asc" },
        },
      },
    }),
    prisma.prospect.count({ where }),
  ]);

  return c.json({
    success: true,
    data: {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /admin/prospects/:id
app.get("/:id", async (c) => {
  const id = c.req.param("id");

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      outreachEmails: { orderBy: { stepNumber: "asc" } },
      client: {
        select: {
          id: true,
          companyName: true,
          email: true,
          status: true,
          plan: true,
        },
      },
    },
  });

  if (!prospect) {
    return c.json({ success: false, error: "Prospect not found" }, 404);
  }

  return c.json({ success: true, data: prospect });
});

// POST /admin/prospects
app.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = ProspectCreateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: "Validation error", details: parsed.error.flatten() },
      400
    );
  }

  const prospect = await prisma.prospect.create({ data: parsed.data });

  return c.json({ success: true, data: prospect }, 201);
});

// PATCH /admin/prospects/:id
app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = ProspectUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: "Validation error", details: parsed.error.flatten() },
      400
    );
  }

  const existing = await prisma.prospect.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ success: false, error: "Prospect not found" }, 404);
  }

  const prospect = await prisma.prospect.update({
    where: { id },
    data: parsed.data,
  });

  return c.json({ success: true, data: prospect });
});

// DELETE /admin/prospects/:id
app.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await prisma.prospect.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ success: false, error: "Prospect not found" }, 404);
  }

  await prisma.prospect.delete({ where: { id } });

  return c.json({ success: true, message: "Prospect deleted" });
});

// POST /admin/prospects/:id/analyze
app.post("/:id/analyze", async (c) => {
  const id = c.req.param("id");
  const { enqueueAgentJob } = await import("../../lib/queue.js");

  const prospect = await prisma.prospect.findUnique({ where: { id } });
  if (!prospect) {
    return c.json({ success: false, error: "Prospect not found" }, 404);
  }

  const job = await prisma.agentJob.create({
    data: {
      agentType: "ANALYZER",
      status: "QUEUED",
      input: { prospectId: id },
      prospectId: id,
    },
  });

  await enqueueAgentJob({
    agentType: "ANALYZER",
    jobId: job.id,
    input: { prospectId: id },
  });

  return c.json({ success: true, data: { jobId: job.id } }, 202);
});

export default app;
