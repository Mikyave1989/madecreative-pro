import { Hono } from "hono";
import { generatePaymentLink } from "../../lib/stripe.js";

const app = new Hono();

// GET /admin/prospects
app.get("/", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { ProspectFilterSchema, PAGINATION } = await import("@madecreative/shared");
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
  const { prisma } = await import("@madecreative/db");
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
  const { prisma } = await import("@madecreative/db");
  const { ProspectCreateSchema } = await import("@madecreative/shared");
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
  const { prisma } = await import("@madecreative/db");
  const { ProspectUpdateSchema } = await import("@madecreative/shared");
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
  const { prisma } = await import("@madecreative/db");
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
  const { prisma } = await import("@madecreative/db");
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
  const { prisma } = await import("@madecreative/db");
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
      input: JSON.parse(JSON.stringify({
        prospectId: id,
        templateSlug,
        ...(customizations ? { customizations } : {}),
      })),
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

// POST /admin/prospects/:id/send-outreach — Avvia sequenza email manualmente
app.post("/:id/send-outreach", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");
  const { enqueueAgentJob } = await import("../../lib/queue.js");

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      contactEmail: true,
      status: true,
      country: true,
      previewSiteUrl: true,
    },
  });

  if (!prospect) {
    return c.json({ success: false, error: "Prospect not found" }, 404);
  }

  // Prerequisite checks
  if (!prospect.contactEmail) {
    return c.json(
      { success: false, error: "Prospect has no contact email" },
      422
    );
  }

  const blockedStatuses = ["BLACKLISTED"];
  if (blockedStatuses.includes(prospect.status)) {
    return c.json(
      { success: false, error: `Cannot send outreach to prospect with status: ${prospect.status}` },
      422
    );
  }

  const readyStatuses = ["ANALYZED", "PREVIEW_GENERATED", "PREVIEW_READY"];
  const allStatuses = [
    "SCRAPED", "ANALYZED", "PREVIEW_GENERATED", "EMAIL_QUEUED",
    "EMAIL_SENT", "REPLIED", "CALL_SCHEDULED", "CONVERTED", "LOST", "BLACKLISTED"
  ];
  const statusIndex = allStatuses.indexOf(prospect.status);
  if (statusIndex < 1) {
    return c.json(
      {
        success: false,
        error: `Prospect must be at least ANALYZED before outreach. Current status: ${prospect.status}`,
      },
      422
    );
  }

  void readyStatuses; // suppress unused variable

  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
  const language = (body["language"] as string | undefined) ?? undefined;

  const job = await prisma.agentJob.create({
    data: {
      agentType: "OUTREACH",
      status: "QUEUED",
      input: {
        prospectId: id,
        stepNumber: 1,
        ...(language ? { language } : {}),
      },
      prospectId: id,
    },
  });

  await enqueueAgentJob({
    agentType: "OUTREACH",
    jobId: job.id,
    input: {
      prospectId: id,
      stepNumber: 1,
      ...(language ? { language } : {}),
    },
  });

  return c.json(
    {
      success: true,
      data: {
        jobId: job.id,
        message: `Outreach sequence queued for ${prospect.companyName}`,
        estimatedDuration: "1-2 minutes",
      },
    },
    202
  );
});

// GET /admin/outreach/stats — Email statistics
// NOTE: registered as /outreach/stats on the sub-router (mounted at /admin/prospects)
// Full path: GET /admin/prospects/outreach/stats
app.get("/outreach/stats", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Aggregations
  const [
    sentToday,
    totalSent,
    totalOpened,
    totalClicked,
    totalBounced,
    totalReplied,
    recentEmails,
    topSubjects,
  ] = await Promise.all([
    // Sent today
    prisma.outreachEmail.count({
      where: { status: { in: ["sent", "opened", "clicked", "replied"] }, sentAt: { gte: todayStart } },
    }),

    // Total sent (all time)
    prisma.outreachEmail.count({
      where: { status: { in: ["sent", "opened", "clicked", "replied", "bounced"] } },
    }),

    // Total opened
    prisma.outreachEmail.count({
      where: { openedAt: { not: null } },
    }),

    // Total clicked
    prisma.outreachEmail.count({
      where: { clickedAt: { not: null } },
    }),

    // Total bounced
    prisma.outreachEmail.count({
      where: { status: "bounced" },
    }),

    // Total replied
    prisma.outreachEmail.count({
      where: { repliedAt: { not: null } },
    }),

    // Last 7 days — daily send counts
    prisma.outreachEmail.findMany({
      where: {
        sentAt: { gte: sevenDaysAgo },
        status: { in: ["sent", "opened", "clicked", "replied", "bounced"] },
      },
      select: { sentAt: true },
    }),

    // Top performing subjects (by open rate)
    prisma.outreachEmail.groupBy({
      by: ["subject"],
      where: { status: { in: ["sent", "opened", "clicked", "replied"] } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
  ]);

  // Build daily chart
  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const email of recentEmails) {
    if (email.sentAt) {
      const key = email.sentAt.toISOString().slice(0, 10);
      if (key in dailyMap) {
        dailyMap[key] = (dailyMap[key] ?? 0) + 1;
      }
    }
  }

  const dailyChart = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
  const bounceRate = totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0;
  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

  return c.json({
    success: true,
    data: {
      today: {
        sent: sentToday,
      },
      totals: {
        sent: totalSent,
        opened: totalOpened,
        clicked: totalClicked,
        bounced: totalBounced,
        replied: totalReplied,
      },
      rates: {
        openRate,
        clickRate,
        bounceRate,
        replyRate,
      },
      topSubjects: topSubjects.map((s: { subject: string; _count: { id: number } }) => ({
        subject: s.subject,
        count: s._count.id,
      })),
      dailyChart,
    },
  });
});

// POST /admin/prospects/:id/analyze
app.post("/:id/analyze", async (c) => {
  const { prisma } = await import("@madecreative/db");
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

// GET /admin/pipeline — Prospects grouped by status with counters
app.get("/pipeline", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const PIPELINE_STATUSES = [
    "PREVIEW_GENERATED",
    "EMAIL_SENT",
    "REPLIED",
    "CALL_SCHEDULED",
    "CONVERTED",
    "LOST",
  ] as const;

  // Fetch prospects for pipeline-relevant statuses
  const [prospects, countsByStatus] = await Promise.all([
    prisma.prospect.findMany({
      where: {
        status: {
          in: [
            "PREVIEW_GENERATED",
            "EMAIL_SENT",
            "REPLIED",
            "CALL_SCHEDULED",
            "CONVERTED",
            "LOST",
          ],
        },
      },
      select: {
        id: true,
        companyName: true,
        country: true,
        sector: true,
        leadScore: true,
        status: true,
        lastContactedAt: true,
        repliedAt: true,
        convertedAt: true,
        createdAt: true,
        updatedAt: true,
        outreachEmails: {
          orderBy: { sentAt: "desc" },
          take: 1,
          select: { sentAt: true, subject: true, status: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.prospect.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  // Build counts map
  const counts: Record<string, number> = {};
  for (const row of countsByStatus) {
    counts[row.status] = row._count.id;
  }

  // Group prospects by status column
  const columns: Record<string, typeof prospects> = {};
  for (const s of PIPELINE_STATUSES) {
    columns[s] = [];
  }
  for (const p of prospects) {
    if (p.status in columns) {
      columns[p.status]!.push(p);
    }
  }

  return c.json({ success: true, data: { columns, counts } });
});

// POST /admin/prospects/:id/generate-payment-link
app.post("/:id/generate-payment-link", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");
  const prospect = await prisma.prospect.findUnique({
    where: { id },
    select: { id: true, companyName: true, contactEmail: true, status: true },
  });

  if (!prospect) {
    return c.json({ success: false, error: "Prospect not found" }, 404);
  }

  if (!prospect.contactEmail) {
    return c.json({ success: false, error: "Prospect has no contact email" }, 422);
  }

  if (prospect.status === "BLACKLISTED") {
    return c.json({ success: false, error: "Cannot generate payment link for blacklisted prospect" }, 422);
  }

  try {
    const { checkoutUrl, expiresAt } = await generatePaymentLink({
      prospectId: id,
      email: prospect.contactEmail,
    });

    return c.json({ success: true, data: { checkoutUrl, expiresAt } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: msg }, 500);
  }
});

// POST /admin/prospects/:id/analyze-reply
app.post("/:id/analyze-reply", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null) as { replyText?: string } | null;

  if (!body?.replyText) {
    return c.json({ success: false, error: "replyText is required" }, 400);
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      contactEmail: true,
      status: true,
      sector: true,
      country: true,
    },
  });

  if (!prospect) {
    return c.json({ success: false, error: "Prospect not found" }, 404);
  }

  // Update prospect status to REPLIED
  await prisma.prospect.update({
    where: { id },
    data: { status: "REPLIED", repliedAt: new Date() },
  });

  // Analyze sentiment with Claude
  try {
    const { analyzeReply } = await import("@madecreative/agents");
    const result = await analyzeReply(id, body.replyText);

    // If OPT_OUT, blacklist automatically
    if (result.sentiment === "OPT_OUT" && prospect.contactEmail) {
      const { getRedisConnection } = await import("../../lib/queue.js");
      const redis = getRedisConnection();
      await redis.sadd("blacklist:emails", prospect.contactEmail);
      await prisma.prospect.update({
        where: { id },
        data: { status: "BLACKLISTED" },
      });
    }

    return c.json({ success: true, data: result });
  } catch (err) {
    // Fallback: basic keyword analysis if agent fails
    const text = body.replyText.toLowerCase();
    let sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "OPT_OUT" = "NEUTRAL";

    const positiveKeywords = ["interessato", "voglio", "procediamo", "sì", "ok", "perfetto", "quanto", "quando", "interested", "yes", "proceed", "like to", "would like"];
    const negativeKeywords = ["non interessato", "no grazie", "troppo caro", "not interested", "no thanks", "too expensive", "pass"];
    const optOutKeywords = ["rimuovi", "cancella", "unsubscribe", "remove me", "opt out", "stop"];

    if (optOutKeywords.some((kw) => text.includes(kw))) sentiment = "OPT_OUT";
    else if (negativeKeywords.some((kw) => text.includes(kw))) sentiment = "NEGATIVE";
    else if (positiveKeywords.some((kw) => text.includes(kw))) sentiment = "POSITIVE";

    if (sentiment === "OPT_OUT" && prospect.contactEmail) {
      const { getRedisConnection } = await import("../../lib/queue.js");
      const redis = getRedisConnection();
      await redis.sadd("blacklist:emails", prospect.contactEmail);
      await prisma.prospect.update({
        where: { id },
        data: { status: "BLACKLISTED" },
      });
    }

    return c.json({
      success: true,
      data: {
        sentiment,
        confidence: 0.6,
        suggestedAction: sentiment === "POSITIVE" ? "Send payment link" : sentiment === "OPT_OUT" ? "Blacklisted" : "No action",
        keyPhrases: [],
        fallback: true,
        error: err instanceof Error ? err.message : String(err),
      },
    });
  }
});

// POST /admin/prospects/:id/mark-lost
app.post("/:id/mark-lost", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");
  const existing = await prisma.prospect.findUnique({ where: { id } });
  if (!existing) return c.json({ success: false, error: "Prospect not found" }, 404);

  const updated = await prisma.prospect.update({
    where: { id },
    data: { status: "LOST" },
  });
  return c.json({ success: true, data: updated });
});

// POST /admin/prospects/:id/blacklist
app.post("/:id/blacklist", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");
  const prospect = await prisma.prospect.findUnique({
    where: { id },
    select: { id: true, contactEmail: true },
  });
  if (!prospect) return c.json({ success: false, error: "Prospect not found" }, 404);

  if (prospect.contactEmail) {
    const { getRedisConnection } = await import("../../lib/queue.js");
    const redis = getRedisConnection();
    await redis.sadd("blacklist:emails", prospect.contactEmail);
  }

  const updated = await prisma.prospect.update({
    where: { id },
    data: { status: "BLACKLISTED" },
  });
  return c.json({ success: true, data: updated });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scrape management endpoints  /admin/scrape/*
// ─────────────────────────────────────────────────────────────────────────────

// POST /admin/scrape/start — ad-hoc scrape run
app.post("/scrape/start", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { ScrapeConfigCreateSchema } = await import("@madecreative/shared");
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
  const { prisma } = await import("@madecreative/db");
  const configs = await prisma.scrapeConfig.findMany({
    orderBy: { createdAt: "desc" },
  });
  return c.json({ success: true, data: configs });
});

// POST /admin/scrape/configs — create a new ScrapeConfig
app.post("/scrape/configs", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { ScrapeConfigCreateSchema } = await import("@madecreative/shared");
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
  const { prisma } = await import("@madecreative/db");
  const { ScrapeConfigCreateSchema } = await import("@madecreative/shared");
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
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");

  const existing = await prisma.scrapeConfig.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ success: false, error: "ScrapeConfig not found" }, 404);
  }

  await prisma.scrapeConfig.delete({ where: { id } });

  return c.json({ success: true, message: "ScrapeConfig deleted" });
});

export default app;
