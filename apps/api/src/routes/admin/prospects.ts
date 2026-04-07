import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import {
  ProspectFilterSchema,
  ProspectCreateSchema,
  ProspectUpdateSchema,
  ScrapeConfigCreateSchema,
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

// GET /admin/prospects/stats — must be registered BEFORE /:id to avoid param conflict
app.get("/stats", async (c) => {
  const [byStatus, avgScore, topSectors, topCountries] = await Promise.all([
    prisma.prospect.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.prospect.aggregate({
      where: { leadScore: { gt: 0 } },
      _avg: { leadScore: true },
      _count: { id: true },
    }),
    prisma.prospect.groupBy({
      by: ["sector"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.prospect.groupBy({
      by: ["country"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
  ]);

  return c.json({
    success: true,
    data: {
      byStatus: byStatus.map((s: { status: string; _count: { id: number } }) => ({
        status: s.status,
        count: s._count.id,
      })),
      averageLeadScore: avgScore._avg.leadScore ?? 0,
      scoredProspects: avgScore._count.id,
      topSectors: topSectors.map((s: { sector: string; _count: { id: number } }) => ({
        sector: s.sector,
        count: s._count.id,
      })),
      topCountries: topCountries.map((c: { country: string; _count: { id: number } }) => ({
        country: c.country,
        count: c._count.id,
      })),
    },
  });
});

// POST /admin/prospects/:id/build-preview — Avvia Builder Agent per un prospect
app.post("/:id/build-preview", async (c) => {
  const id = c.req.param("id");
  const { enqueueAgentJob } = await import("../../lib/queue.js");

  const prospect = await prisma.prospect.findUnique({ where: { id } });
  if (!prospect) {
    return c.json({ success: false, error: "Prospect not found" }, 404);
  }

  // Validate that we have enough data to build
  if (!prospect.sector || !prospect.country) {
    return c.json(
      {
        success: false,
        error: "Prospect is missing required fields: sector and country are required for preview generation",
      },
      422
    );
  }

  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
  const templateSlug = (body["templateSlug"] as string | undefined) ?? prospect.sector;
  const customizations = body["customizations"] as Record<string, unknown> | undefined;

  const job = await prisma.agentJob.create({
    data: {
      agentType: "BUILDER",
      status: "QUEUED",
      input: {
        prospectId: id,
        templateSlug,
        ...(customizations ? { customizations } : {}),
      },
      prospectId: id,
    },
  });

  await enqueueAgentJob({
    agentType: "BUILDER",
    jobId: job.id,
    input: {
      prospectId: id,
      templateSlug,
      ...(customizations ? { customizations } : {}),
    },
  });

  return c.json(
    {
      success: true,
      data: {
        jobId: job.id,
        message: `Builder Agent queued for prospect: ${prospect.companyName}`,
        estimatedDuration: "2-5 minutes",
      },
    },
    202
  );
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

// ─────────────────────────────────────────────────────────────────────────────
// Scrape management endpoints  /admin/scrape/*
// ─────────────────────────────────────────────────────────────────────────────

// POST /admin/scrape/start — ad-hoc scrape run
app.post("/scrape/start", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = ScrapeConfigCreateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: "Validation error",
        details: parsed.error.flatten(),
      },
      400
    );
  }

  const { enqueueAgentJob } = await import("../../lib/queue.js");

  // Persist a transient ScrapeConfig (isActive=false for ad-hoc runs)
  const config = await prisma.scrapeConfig.create({
    data: {
      name: parsed.data.name,
      sector: parsed.data.sector,
      countries: parsed.data.countries,
      cities: parsed.data.cities ?? [],
      keywords: parsed.data.keywords,
      excludeKeywords: parsed.data.excludeKeywords ?? [],
      minRating: parsed.data.minRating ?? null,
      maxResults: parsed.data.maxResults,
      schedule: parsed.data.schedule ?? null,
      isActive: false,
    },
  });

  const job = await prisma.agentJob.create({
    data: {
      agentType: "SCRAPER",
      status: "QUEUED",
      input: {
        scrapeConfigId: config.id,
        configId: config.id,
        sector: config.sector,
        countries: config.countries as string[],
        cities: (config.cities as string[] | null) ?? undefined,
        keywords: config.keywords as string[],
        maxResults: config.maxResults,
        minRating: config.minRating ?? undefined,
      },
    },
  });

  await enqueueAgentJob({
    agentType: "SCRAPER",
    jobId: job.id,
    input: job.input as Record<string, unknown>,
  });

  return c.json(
    { success: true, data: { jobId: job.id, scrapeConfigId: config.id } },
    202
  );
});

// GET /admin/scrape/configs — list all ScrapeConfig entries
app.get("/scrape/configs", async (c) => {
  const configs = await prisma.scrapeConfig.findMany({
    orderBy: { createdAt: "desc" },
  });
  return c.json({ success: true, data: configs });
});

// POST /admin/scrape/configs — create a new ScrapeConfig
app.post("/scrape/configs", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = ScrapeConfigCreateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: "Validation error",
        details: parsed.error.flatten(),
      },
      400
    );
  }

  const config = await prisma.scrapeConfig.create({
    data: {
      name: parsed.data.name,
      sector: parsed.data.sector,
      countries: parsed.data.countries,
      cities: parsed.data.cities ?? [],
      keywords: parsed.data.keywords,
      excludeKeywords: parsed.data.excludeKeywords ?? [],
      minRating: parsed.data.minRating ?? null,
      maxResults: parsed.data.maxResults,
      schedule: parsed.data.schedule ?? null,
      isActive: true,
    },
  });

  return c.json({ success: true, data: config }, 201);
});

// PATCH /admin/scrape/configs/:id — update a ScrapeConfig
app.patch("/scrape/configs/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = ScrapeConfigCreateSchema.partial()
    .extend({ isActive: (await import("zod")).z.boolean().optional() })
    .safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: "Validation error",
        details: parsed.error.flatten(),
      },
      400
    );
  }

  const existing = await prisma.scrapeConfig.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ success: false, error: "ScrapeConfig not found" }, 404);
  }

  const updated = await prisma.scrapeConfig.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.sector !== undefined ? { sector: parsed.data.sector } : {}),
      ...(parsed.data.countries !== undefined
        ? { countries: parsed.data.countries }
        : {}),
      ...(parsed.data.cities !== undefined ? { cities: parsed.data.cities } : {}),
      ...(parsed.data.keywords !== undefined
        ? { keywords: parsed.data.keywords }
        : {}),
      ...(parsed.data.excludeKeywords !== undefined
        ? { excludeKeywords: parsed.data.excludeKeywords }
        : {}),
      ...(parsed.data.minRating !== undefined
        ? { minRating: parsed.data.minRating }
        : {}),
      ...(parsed.data.maxResults !== undefined
        ? { maxResults: parsed.data.maxResults }
        : {}),
      ...(parsed.data.schedule !== undefined
        ? { schedule: parsed.data.schedule }
        : {}),
      ...((parsed.data as { isActive?: boolean }).isActive !== undefined
        ? { isActive: (parsed.data as { isActive?: boolean }).isActive }
        : {}),
    },
  });

  return c.json({ success: true, data: updated });
});

// DELETE /admin/scrape/configs/:id — delete a ScrapeConfig
app.delete("/scrape/configs/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await prisma.scrapeConfig.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ success: false, error: "ScrapeConfig not found" }, 404);
  }

  await prisma.scrapeConfig.delete({ where: { id } });

  return c.json({ success: true, message: "ScrapeConfig deleted" });
});

export default app;
