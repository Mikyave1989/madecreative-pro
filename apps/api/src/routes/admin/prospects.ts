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

// GET /admin/pipeline — Prospects grouped by status with counters
// NOTE: registered BEFORE /:id to avoid param conflict
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
        contactName: true,
        contactEmail: true,
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

  const counts: Record<string, number> = {};
  for (const row of countsByStatus) {
    counts[row.status] = row._count.id;
  }

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

// GET /admin/prospects/stats — MUST be before /:id
app.get("/stats", async (c) => {
  const { prisma } = await import("@madecreative/db");
  try {
    const byStatus = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT status, COUNT(*)::bigint as count FROM "Prospect" GROUP BY status`;
    const avgScore = await prisma.$queryRaw<Array<{ avg: number | null; count: bigint }>>`
      SELECT AVG("leadScore")::float as avg, COUNT(*)::bigint as count FROM "Prospect" WHERE "leadScore" > 0`;
    const topSectors = await prisma.$queryRaw<Array<{ sector: string; count: bigint }>>`
      SELECT sector, COUNT(*)::bigint as count FROM "Prospect" GROUP BY sector ORDER BY count DESC LIMIT 10`;
    const topCountries = await prisma.$queryRaw<Array<{ country: string; count: bigint }>>`
      SELECT country, COUNT(*)::bigint as count FROM "Prospect" GROUP BY country ORDER BY count DESC LIMIT 10`;
    return c.json({
      success: true,
      data: {
        byStatus: byStatus.map(s => ({ status: s.status, count: Number(s.count) })),
        averageLeadScore: avgScore[0]?.avg ?? 0,
        scoredProspects: Number(avgScore[0]?.count ?? 0),
        topSectors: topSectors.map(s => ({ sector: s.sector, count: Number(s.count) })),
        topCountries: topCountries.map(r => ({ country: r.country, count: Number(r.count) })),
      },
    });
  } catch (err) {
    console.error("[prospects/stats]", err instanceof Error ? err.message : String(err));
    return c.json({ success: false, error: "Stats query failed" }, 500);
  }
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

// GET /admin/prospects/:id/files — Return generated site files from latest completed build job
app.get("/:id/files", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    select: { id: true, companyName: true, previewSiteUrl: true },
  });

  if (!prospect) {
    return c.json({ success: false, error: "Prospect not found" }, 404);
  }

  // Find the most recent completed BUILDER job for this prospect
  const job = await prisma.agentJob.findFirst({
    where: { prospectId: id, agentType: "BUILDER", status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { id: true, output: true, completedAt: true },
  });

  if (!job) {
    return c.json({ success: false, error: "No completed build job found for this prospect" }, 404);
  }

  const output = job.output as Record<string, unknown> | null;
  const files = (output?.["files"] ?? output?.["generatedFiles"] ?? null) as Record<string, string> | null;

  return c.json({
    success: true,
    data: {
      jobId: job.id,
      completedAt: job.completedAt,
      previewSiteUrl: prospect.previewSiteUrl,
      files,
    },
  });
});

// POST /admin/prospects/:id/open-in-editor — Return editor redirect URL for this prospect
app.post("/:id/open-in-editor", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      website: true,
      previewSiteUrl: true,
      scrapedContent: true,
    },
  });

  if (!prospect) {
    return c.json({ success: false, error: "Prospect not found" }, 404);
  }

  // Build editor URL with query params that auto-trigger scraping on open
  const editorBase = "https://madecreative.pro";
  const params = new URLSearchParams({ prospectId: id });

  // If there's an existing preview site, pass it so the editor can load/rebuild it
  if (prospect.previewSiteUrl) {
    params.set("rebuild", prospect.previewSiteUrl);
  }

  // If there's a source website, also pass it for re-scraping
  if (prospect.website) {
    params.set("scrapeUrl", prospect.website);
  }

  const redirectUrl = `${editorBase}?${params.toString()}`;

  return c.json({
    success: true,
    data: {
      redirectUrl,
      prospectId: id,
      companyName: prospect.companyName,
      hasScrapedContent: prospect.scrapedContent !== null,
      previewSiteUrl: prospect.previewSiteUrl ?? null,
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

  const agentInput = { prospectId: id, templateSlug, ...(customizations ? { customizations } : {}) };

  const job = await prisma.agentJob.create({
    data: {
      agentType: "BUILDER",
      status: "RUNNING",
      startedAt: new Date(),
      input: JSON.parse(JSON.stringify(agentInput)),
      prospectId: id,
    },
  });

  // Always use BullMQ queue — agents run on Railway, not on Vercel serverless
  await enqueueAgentJob({ agentType: "BUILDER", jobId: job.id, input: agentInput }).catch(async () => {
    await prisma.agentJob.update({ where: { id: job.id }, data: { status: "QUEUED" } }).catch(() => {});
  });

  return c.json(
    {
      success: true,
      data: {
        jobId: job.id,
        message: `Builder Agent started for prospect: ${prospect.companyName}`,
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
    "SCRAPED", "QUALIFIED", "ANALYZED", "PREVIEW_READY", "PREVIEW_GENERATED", "EMAIL_QUEUED",
    "CONTACTED", "EMAIL_SENT", "FOLLOWED_UP", "REPLIED", "CALL_SCHEDULED", "CONVERTED", "LOST", "BLACKLISTED"
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
      status: "RUNNING",
      startedAt: new Date(),
      input: {
        prospectId: id,
        stepNumber: 1,
        ...(language ? { language } : {}),
      },
      prospectId: id,
    },
  });

  // Run agent INLINE (no BullMQ worker needed — works on serverless)
  // Fire-and-forget: respond immediately, agent runs in background
  const agentInput = { prospectId: id, stepNumber: 1, ...(language ? { language } : {}) };

  // Always use BullMQ queue — agents run on Railway, not on Vercel serverless
  await enqueueAgentJob({ agentType: "OUTREACH", jobId: job.id, input: agentInput }).catch(() => {});

  return c.json(
    {
      success: true,
      data: {
        jobId: job.id,
        message: `Outreach sequence started for ${prospect.companyName}`,
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

  const agentInput = { prospectId: id };
  const job = await prisma.agentJob.create({
    data: { agentType: "ANALYZER", status: "RUNNING", startedAt: new Date(), input: agentInput, prospectId: id },
  });

  // Always queue — agents run on Railway, not Vercel serverless
  await enqueueAgentJob({ agentType: "ANALYZER", jobId: job.id, input: agentInput }).catch(() => {});

  return c.json({ success: true, data: { jobId: job.id } }, 202);
});

// (pipeline route moved before /:id to avoid param conflict)

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

  // Analyze sentiment with keyword fallback (no direct agent import on Vercel)
  try {
    throw new Error("Use fallback"); // always use keyword analysis
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

// POST /admin/prospects/:id/send-preview-email — Lightweight: send preview email directly via Resend (no Claude, no timeout)
app.post("/:id/send-preview-email", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    select: { id: true, companyName: true, contactEmail: true, previewSiteUrl: true, city: true, sector: true, country: true },
  });

  if (!prospect) return c.json({ success: false, error: "Prospect not found" }, 404);
  if (!prospect.contactEmail) return c.json({ success: false, error: "No contact email" }, 422);
  if (!prospect.previewSiteUrl) return c.json({ success: false, error: "No preview site URL. Build preview first." }, 422);

  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) return c.json({ success: false, error: "RESEND_API_KEY not configured" }, 503);

  const body = (await c.req.json().catch(() => ({}))) as { language?: string };
  const lang = body.language ?? (prospect.country === "DE" || prospect.country === "AT" || prospect.country === "CH" ? "de" : prospect.country === "IT" ? "it" : prospect.country === "ES" ? "es" : prospect.country === "FR" ? "fr" : "en");

  const name = prospect.companyName;
  const apiBase = process.env["API_URL"] ?? "https://api.madecreative.pro";
  // Use our own API to serve preview (no Vercel login required)
  const previewUrl = `${apiBase}/preview/${prospect.id}`;
  const city = prospect.city ?? "";

  // Language-specific email templates — engaging, professional, high conversion
  const waLink = "https://wa.me/393317389918";
  const templates: Record<string, { subject: string; body: string }> = {
    de: {
      subject: `${name} — so könnte Ihre neue Website aussehen`,
      body: `<p>Sehr geehrtes Team von <strong>${name}</strong>,</p>
<p>wir haben uns Ihre Online-Präsenz${city ? ` in ${city}` : ""} genau angesehen — und waren beeindruckt von dem, was Sie aufgebaut haben. Gleichzeitig ist uns aufgefallen, dass Ihre Website das Potenzial Ihres Unternehmens noch nicht voll widerspiegelt.</p>
<p>Deshalb haben wir uns erlaubt, <strong>einen komplett neuen Website-Entwurf für ${name} zu erstellen</strong> — kostenlos und unverbindlich. Dieser Entwurf basiert auf Ihren echten Inhalten, Fotos und Informationen:</p>
<ul style="margin:16px 0;padding-left:20px;color:#555">
<li>✅ <strong>Premium-Design</strong> — modern, elegant, auf Ihre Branche zugeschnitten</li>
<li>📱 <strong>Perfekt auf allen Geräten</strong> — Smartphone, Tablet, Laptop, Desktop</li>
<li>🔍 <strong>SEO-optimiert</strong> — bessere Sichtbarkeit bei Google</li>
<li>⚡ <strong>Blitzschnell</strong> — gebaut mit modernster Technologie (Next.js + React)</li>
<li>🎨 <strong>Ihre echten Fotos & Texte</strong> — kein generischer Template-Look</li>
</ul>
<p style="text-align:center;margin:32px 0"><a href="${previewUrl}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:17px;box-shadow:0 4px 14px rgba(99,102,241,0.4)">🖥️ Ihren Website-Entwurf ansehen</a></p>
<p>Überzeugt Sie das Ergebnis? Dann können Sie Ihre neue Website <strong>ab €997 (einmalig) + €49/Monat</strong> sofort live schalten — inklusive Hosting, SSL, Domain und laufende Updates.</p>
<p><strong>Keine versteckten Kosten. Keine Vertragsbindung. 14 Tage Geld-zurück-Garantie.</strong></p>
<p>Haben Sie Fragen? Schreiben Sie mir direkt — ich antworte persönlich:</p>
<p>📱 <a href="${waLink}" style="color:#25D366;font-weight:bold">WhatsApp: Jetzt schreiben</a><br>
📧 Oder antworten Sie einfach auf diese E-Mail</p>
<p style="margin-top:28px">Mit freundlichen Grüßen,<br><strong>Marco Bianchi</strong><br>Gründer & Geschäftsführer, MadeCreative<br><span style="color:#888">AI-Webdesign für anspruchsvolle Unternehmen</span></p>`,
    },
    it: {
      subject: `${name} — ecco come potrebbe essere il vostro nuovo sito`,
      body: `<p>Gentile team di <strong>${name}</strong>,</p>
<p>abbiamo analizzato attentamente la vostra presenza online${city ? ` a ${city}` : ""} — e siamo rimasti colpiti da ciò che avete costruito. Allo stesso tempo, abbiamo notato che il vostro sito web non riflette ancora appieno il potenziale della vostra attività.</p>
<p>Per questo ci siamo permessi di creare <strong>un nuovo design completo per il sito di ${name}</strong> — completamente gratuito e senza impegno. Il progetto si basa sui vostri contenuti reali, foto e informazioni:</p>
<ul style="margin:16px 0;padding-left:20px;color:#555">
<li>✅ <strong>Design premium</strong> — moderno, elegante, su misura per il vostro settore</li>
<li>📱 <strong>Perfetto su ogni dispositivo</strong> — smartphone, tablet, laptop, desktop</li>
<li>🔍 <strong>Ottimizzato SEO</strong> — maggiore visibilità su Google</li>
<li>⚡ <strong>Velocità estrema</strong> — costruito con tecnologia all'avanguardia (Next.js + React)</li>
<li>🎨 <strong>Le vostre foto e testi reali</strong> — nessun aspetto da template generico</li>
</ul>
<p style="text-align:center;margin:32px 0"><a href="${previewUrl}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:17px;box-shadow:0 4px 14px rgba(99,102,241,0.4)">🖥️ Guarda l'anteprima del vostro sito</a></p>
<p>Vi piace il risultato? Potete pubblicare il vostro nuovo sito <strong>da €997 (una tantum) + €49/mese</strong> — hosting, SSL, dominio e aggiornamenti inclusi.</p>
<p><strong>Nessun costo nascosto. Nessun vincolo. Garanzia soddisfatti o rimborsati 14 giorni.</strong></p>
<p>Avete domande? Scrivetemi direttamente — rispondo personalmente:</p>
<p>📱 <a href="${waLink}" style="color:#25D366;font-weight:bold">WhatsApp: Scrivici ora</a><br>
📧 Oppure rispondete a questa email</p>
<p style="margin-top:28px">Cordiali saluti,<br><strong>Marco Bianchi</strong><br>Fondatore & CEO, MadeCreative<br><span style="color:#888">Web design AI per aziende ambiziose</span></p>`,
    },
    en: {
      subject: `${name} — here's what your new website could look like`,
      body: `<p>Dear <strong>${name}</strong> team,</p>
<p>We took a close look at your online presence${city ? ` in ${city}` : ""} — and we were impressed by what you've built. At the same time, we noticed that your website doesn't yet fully reflect the potential of your business.</p>
<p>That's why we took the liberty of creating <strong>a complete new website design for ${name}</strong> — completely free and with no obligation. This design is based on your real content, photos and information:</p>
<ul style="margin:16px 0;padding-left:20px;color:#555">
<li>✅ <strong>Premium design</strong> — modern, elegant, tailored to your industry</li>
<li>📱 <strong>Perfect on every device</strong> — smartphone, tablet, laptop, desktop</li>
<li>🔍 <strong>SEO optimized</strong> — better visibility on Google</li>
<li>⚡ <strong>Lightning fast</strong> — built with cutting-edge technology (Next.js + React)</li>
<li>🎨 <strong>Your real photos & text</strong> — no generic template look</li>
</ul>
<p style="text-align:center;margin:32px 0"><a href="${previewUrl}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:17px;box-shadow:0 4px 14px rgba(99,102,241,0.4)">🖥️ View your website preview</a></p>
<p>Like what you see? Launch your new website <strong>from €997 (one-time) + €49/month</strong> — including hosting, SSL, domain, and ongoing updates.</p>
<p><strong>No hidden costs. No contracts. 14-day money-back guarantee.</strong></p>
<p>Questions? Write to me directly — I reply personally:</p>
<p>📱 <a href="${waLink}" style="color:#25D366;font-weight:bold">WhatsApp: Chat now</a><br>
📧 Or simply reply to this email</p>
<p style="margin-top:28px">Best regards,<br><strong>Marco Bianchi</strong><br>Founder & CEO, MadeCreative<br><span style="color:#888">AI web design for ambitious businesses</span></p>`,
    },
    es: {
      subject: `${name} — así podría ser su nueva web`,
      body: `<p>Estimado equipo de <strong>${name}</strong>,</p>
<p>Hemos analizado su presencia online${city ? ` en ${city}` : ""} y nos ha impresionado lo que han construido. Al mismo tiempo, hemos notado que su sitio web aún no refleja todo el potencial de su negocio.</p>
<p>Por eso nos hemos tomado la libertad de crear <strong>un diseño web completamente nuevo para ${name}</strong> — gratis y sin compromiso:</p>
<ul style="margin:16px 0;padding-left:20px;color:#555">
<li>✅ <strong>Diseño premium</strong> — moderno, elegante, adaptado a su sector</li>
<li>📱 <strong>Perfecto en cada dispositivo</strong></li>
<li>🔍 <strong>Optimizado para SEO</strong></li>
<li>⚡ <strong>Ultrarrápido</strong> — construido con Next.js + React</li>
<li>🎨 <strong>Sus fotos y textos reales</strong></li>
</ul>
<p style="text-align:center;margin:32px 0"><a href="${previewUrl}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:17px;box-shadow:0 4px 14px rgba(99,102,241,0.4)">🖥️ Ver vista previa de su web</a></p>
<p>Desde <strong>€997 + €49/mes</strong>. Sin costes ocultos. Garantía de 14 días.</p>
<p>📱 <a href="${waLink}" style="color:#25D366;font-weight:bold">WhatsApp: Escribir ahora</a></p>
<p style="margin-top:28px">Saludos cordiales,<br><strong>Marco Bianchi</strong><br>Fundador & CEO, MadeCreative</p>`,
    },
    fr: {
      subject: `${name} — voici à quoi pourrait ressembler votre nouveau site`,
      body: `<p>Chère équipe de <strong>${name}</strong>,</p>
<p>Nous avons analysé votre présence en ligne${city ? ` à ${city}` : ""} et avons été impressionnés par ce que vous avez construit. En même temps, nous avons remarqué que votre site web ne reflète pas encore tout le potentiel de votre activité.</p>
<p>C'est pourquoi nous nous sommes permis de créer <strong>un nouveau design complet pour ${name}</strong> — entièrement gratuit et sans engagement :</p>
<ul style="margin:16px 0;padding-left:20px;color:#555">
<li>✅ <strong>Design premium</strong> — moderne, élégant, adapté à votre secteur</li>
<li>📱 <strong>Parfait sur chaque appareil</strong></li>
<li>🔍 <strong>Optimisé SEO</strong></li>
<li>⚡ <strong>Ultra rapide</strong> — construit avec Next.js + React</li>
<li>🎨 <strong>Vos vraies photos et textes</strong></li>
</ul>
<p style="text-align:center;margin:32px 0"><a href="${previewUrl}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:17px;box-shadow:0 4px 14px rgba(99,102,241,0.4)">🖥️ Voir l'aperçu de votre site</a></p>
<p>À partir de <strong>€997 + €49/mois</strong>. Sans frais cachés. Garantie 14 jours.</p>
<p>📱 <a href="${waLink}" style="color:#25D366;font-weight:bold">WhatsApp : Écrire maintenant</a></p>
<p style="margin-top:28px">Cordialement,<br><strong>Marco Bianchi</strong><br>Fondateur & CEO, MadeCreative</p>`,
    },
  };

  const tpl = templates[lang] ?? templates["en"]!;
  const htmlEmail = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">${tpl.body}<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0"><p style="font-size:11px;color:#999;text-align:center">MadeCreative \u00b7 madecreative.pro</p></body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Marco Bianchi <marco@madecreative.pro>",
        to: [prospect.contactEmail],
        reply_to: "info@madecreative.pro",
        subject: tpl.subject,
        html: htmlEmail,
      }),
    });

    const data = await res.json() as { id?: string; error?: unknown };

    if (!res.ok) {
      return c.json({ success: false, error: "Resend error", details: data }, 500);
    }

    // Save outreach email record
    await prisma.outreachEmail.create({
      data: {
        prospectId: id,
        stepNumber: 1,
        subject: tpl.subject,
        body: htmlEmail,
        bodyPlain: `${name} - Preview: ${previewUrl}`,
        language: lang,
        fromName: "Marco Bianchi",
        fromEmail: "marco@madecreative.pro",
        resendMessageId: data.id ?? null,
        sentAt: new Date(),
        status: "sent",
      },
    });

    // Update prospect status
    await prisma.prospect.update({
      where: { id },
      data: { status: "CONTACTED", firstContactedAt: new Date(), lastContactedAt: new Date() },
    });

    return c.json({ success: true, data: { messageId: data.id, sentTo: prospect.contactEmail, subject: tpl.subject, previewUrl } });
  } catch (err) {
    return c.json({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
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
