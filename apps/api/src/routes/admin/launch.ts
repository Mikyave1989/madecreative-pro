import { Hono } from "hono";

const app = new Hono();

// ─── GET /admin/launch/warming/status ────────────────────────────────────────
// Returns current warming state: day, limit, emails sent today

app.get("/warming/status", async (c) => {
  const { getRedisConnection } = await import("../../lib/queue.js");

  try {
    const redis = getRedisConnection();
    const dayStr = await redis.get("outreach:warming:day");
    const day = parseInt(dayStr ?? "0", 10);

    const WARMING_LIMITS = [5, 10, 20, 50, 100, 200];
    const idx = Math.min(Math.floor(day / 5), WARMING_LIMITS.length - 1);
    const limit = WARMING_LIMITS[idx] ?? 200;

    const today = new Date().toISOString().slice(0, 10);
    const sentTodayStr = await redis.get(`outreach:daily:${today}`);
    const sentToday = parseInt(sentTodayStr ?? "0", 10);

    const configLimit = parseInt(process.env["EMAIL_DAILY_LIMIT"] ?? "200", 10);
    const effectiveLimit = Math.min(configLimit, limit);

    // Calculate warming phase info
    const phase = Math.min(idx, WARMING_LIMITS.length - 1);
    const daysInPhase = day % 5;
    const daysUntilNextPhase = phase < WARMING_LIMITS.length - 1 ? 5 - daysInPhase : 0;
    const nextLimit = phase < WARMING_LIMITS.length - 1 ? WARMING_LIMITS[phase + 1] : limit;

    return c.json({
      success: true,
      data: {
        warmingDay: day,
        phase,
        currentLimit: effectiveLimit,
        sentToday,
        remaining: Math.max(0, effectiveLimit - sentToday),
        daysUntilNextPhase,
        nextPhaseLimit: nextLimit,
        warmingSchedule: WARMING_LIMITS.map((l, i) => ({
          phase: i,
          days: `${i * 5}-${(i + 1) * 5 - 1}`,
          dailyLimit: l,
          active: i === phase,
        })),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `Redis error: ${msg}` }, 500);
  }
});

// ─── POST /admin/launch/warming/init ─────────────────────────────────────────
// Initialize or reset warming counter. Optionally set starting day.

app.post("/warming/init", async (c) => {
  const { getRedisConnection } = await import("../../lib/queue.js");
  const body = (await c.req.json().catch(() => ({}))) as { startDay?: number };
  const startDay = body.startDay ?? 0;

  try {
    const redis = getRedisConnection();
    await redis.set("outreach:warming:day", String(startDay));

    const WARMING_LIMITS = [5, 10, 20, 50, 100, 200];
    const idx = Math.min(Math.floor(startDay / 5), WARMING_LIMITS.length - 1);
    const limit = WARMING_LIMITS[idx] ?? 200;

    return c.json({
      success: true,
      data: {
        warmingDay: startDay,
        currentLimit: limit,
        message: `Warming initialized at day ${startDay} (limit: ${limit} emails/day)`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `Redis error: ${msg}` }, 500);
  }
});

// ─── POST /admin/launch/bulk-build ───────────────────────────────────────────
// Queue BUILDER agent for all ANALYZED prospects that don't have a preview yet

app.post("/bulk-build", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { enqueueAgentJob } = await import("../../lib/queue.js");

  const body = (await c.req.json().catch(() => ({}))) as {
    limit?: number;
    sector?: string;
    country?: string;
  };

  const batchLimit = Math.min(body.limit ?? 50, 100);

  const where: Record<string, unknown> = {
    status: { in: ["ANALYZED", "SCRAPED"] },
    previewSiteUrl: null,
    leadScore: { gt: 0 },
    ...(body.sector ? { sector: body.sector } : {}),
    ...(body.country ? { country: body.country } : {}),
  };

  const prospects = await prisma.prospect.findMany({
    where,
    take: batchLimit,
    orderBy: { leadScore: "desc" },
    select: { id: true, companyName: true, sector: true, country: true, leadScore: true },
  });

  if (prospects.length === 0) {
    return c.json({
      success: true,
      data: { enqueued: 0, message: "No eligible prospects found" },
    });
  }

  const jobIds: string[] = [];
  for (const prospect of prospects) {
    const job = await prisma.agentJob.create({
      data: {
        agentType: "BUILDER",
        status: "QUEUED",
        input: { prospectId: prospect.id, templateSlug: prospect.sector },
        prospectId: prospect.id,
      },
    });

    await enqueueAgentJob({
      agentType: "BUILDER",
      jobId: job.id,
      input: { prospectId: prospect.id, templateSlug: prospect.sector },
      delay: jobIds.length * 30_000, // stagger 30s apart
    });

    jobIds.push(job.id);
  }

  return c.json({
    success: true,
    data: {
      enqueued: jobIds.length,
      jobIds,
      message: `Queued BUILDER for ${jobIds.length} prospects (staggered 30s apart)`,
    },
  });
});

// ─── POST /admin/launch/bulk-outreach ────────────────────────────────────────
// Queue OUTREACH agent for all prospects with preview sites ready

app.post("/bulk-outreach", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { enqueueAgentJob } = await import("../../lib/queue.js");
  const { getRedisConnection } = await import("../../lib/queue.js");

  const body = (await c.req.json().catch(() => ({}))) as {
    limit?: number;
    sector?: string;
    country?: string;
  };

  // Check warming status first
  const redis = getRedisConnection();
  const dayStr = await redis.get("outreach:warming:day");
  const day = parseInt(dayStr ?? "-1", 10);

  if (day < 0) {
    return c.json({
      success: false,
      error: "Warming not initialized. Call POST /admin/launch/warming/init first.",
    }, 422);
  }

  const WARMING_LIMITS = [5, 10, 20, 50, 100, 200];
  const idx = Math.min(Math.floor(day / 5), WARMING_LIMITS.length - 1);
  const warmingLimit = WARMING_LIMITS[idx] ?? 200;

  const today = new Date().toISOString().slice(0, 10);
  const sentTodayStr = await redis.get(`outreach:daily:${today}`);
  const sentToday = parseInt(sentTodayStr ?? "0", 10);
  const remaining = Math.max(0, warmingLimit - sentToday);

  const batchLimit = Math.min(body.limit ?? remaining, remaining, 100);

  if (batchLimit <= 0) {
    return c.json({
      success: true,
      data: {
        enqueued: 0,
        message: `Daily warming limit reached (${sentToday}/${warmingLimit}). Try again tomorrow.`,
      },
    });
  }

  const prospects = await prisma.prospect.findMany({
    where: {
      status: { in: ["ANALYZED", "PREVIEW_GENERATED", "PREVIEW_READY"] },
      previewSiteUrl: { not: null },
      contactEmail: { not: null },
      ...(body.sector ? { sector: body.sector } : {}),
      ...(body.country ? { country: body.country } : {}),
      // Exclude prospects that already have outreach emails
      outreachEmails: { none: {} },
    },
    take: batchLimit,
    orderBy: { leadScore: "desc" },
    select: {
      id: true,
      companyName: true,
      contactEmail: true,
      country: true,
      leadScore: true,
    },
  });

  if (prospects.length === 0) {
    return c.json({
      success: true,
      data: { enqueued: 0, message: "No eligible prospects with preview sites found" },
    });
  }

  const jobIds: string[] = [];
  for (const prospect of prospects) {
    const job = await prisma.agentJob.create({
      data: {
        agentType: "OUTREACH",
        status: "QUEUED",
        input: { prospectId: prospect.id, stepNumber: 1 },
        prospectId: prospect.id,
      },
    });

    await enqueueAgentJob({
      agentType: "OUTREACH",
      jobId: job.id,
      input: { prospectId: prospect.id, stepNumber: 1 },
      delay: jobIds.length * 60_000, // stagger 1 min apart (warming-friendly)
    });

    jobIds.push(job.id);
  }

  return c.json({
    success: true,
    data: {
      enqueued: jobIds.length,
      jobIds,
      warmingStatus: { day, limit: warmingLimit, sentToday, remaining: remaining - jobIds.length },
      message: `Queued OUTREACH for ${jobIds.length} prospects (staggered 1min apart)`,
    },
  });
});

// ─── POST /admin/launch/munich ───────────────────────────────────────────────
// One-click launch: create ScrapeConfig for München restaurants and start scraping

app.post("/munich", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { enqueueAgentJob } = await import("../../lib/queue.js");

  const body = (await c.req.json().catch(() => ({}))) as {
    maxResults?: number;
    minRating?: number;
    keywords?: string[];
  };

  // Check if a München config already exists
  const existing = await prisma.scrapeConfig.findFirst({
    where: { name: { contains: "München", mode: "insensitive" } },
  });

  let config;

  if (existing) {
    config = existing;
    console.log(`[Launch] Reusing existing München config: ${config.id}`);
  } else {
    config = await prisma.scrapeConfig.create({
      data: {
        name: "München Restaurants — Launch Wave 1",
        sector: "restaurant",
        countries: ["DE"],
        cities: ["München", "Munich"],
        keywords: body.keywords ?? [
          "restaurant münchen",
          "ristorante münchen",
          "trattoria münchen",
          "pizzeria münchen",
          "biergarten münchen",
          "gasthaus münchen",
          "cafe münchen",
        ],
        excludeKeywords: ["mcdonald", "burger king", "subway", "starbucks"],
        minRating: body.minRating ?? 3.5,
        maxResults: body.maxResults ?? 50,
        schedule: "0 2 * * *",
        isActive: true,
      },
    });
  }

  // Create and enqueue the scraper job
  const job = await prisma.agentJob.create({
    data: {
      agentType: "SCRAPER",
      status: "QUEUED",
      input: {
        scrapeConfigId: config.id,
        configId: config.id,
        sector: config.sector,
        countries: config.countries as string[],
        cities: (config.cities as string[] | null) ?? ["München"],
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
    {
      success: true,
      data: {
        scrapeConfigId: config.id,
        jobId: job.id,
        message: `München restaurant scrape launched — targeting ${config.maxResults} prospects`,
        nextSteps: [
          "1. Scraper will find prospects on Google Maps (est. 15-30 min)",
          "2. Call POST /admin/agents/bulk-analyze to score them",
          "3. Call POST /admin/launch/bulk-build to generate previews",
          "4. Call POST /admin/launch/warming/init to start email warming",
          "5. Call POST /admin/launch/bulk-outreach to send emails",
        ],
      },
    },
    202
  );
});

// ─── GET /admin/launch/status ────────────────────────────────────────────────
// Overall launch dashboard: prospect funnel + warming + outreach stats

app.get("/status", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { getRedisConnection } = await import("../../lib/queue.js");

  const [
    prospectsByStatus,
    totalProspects,
    withPreview,
    withEmail,
    activeJobs,
    recentOutreach,
  ] = await Promise.all([
    prisma.prospect.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.prospect.count(),
    prisma.prospect.count({ where: { previewSiteUrl: { not: null } } }),
    prisma.prospect.count({ where: { contactEmail: { not: null } } }),
    prisma.agentJob.count({ where: { status: { in: ["QUEUED", "RUNNING"] } } }),
    prisma.outreachEmail.count({
      where: {
        sentAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        status: { in: ["sent", "opened", "clicked", "replied"] },
      },
    }),
  ]);

  // Warming status from Redis
  let warming = { day: 0, limit: 5, sentToday: 0, initialized: false };
  try {
    const redis = getRedisConnection();
    const dayStr = await redis.get("outreach:warming:day");
    if (dayStr !== null) {
      const day = parseInt(dayStr, 10);
      const WARMING_LIMITS = [5, 10, 20, 50, 100, 200];
      const idx = Math.min(Math.floor(day / 5), WARMING_LIMITS.length - 1);
      const today = new Date().toISOString().slice(0, 10);
      const sentStr = await redis.get(`outreach:daily:${today}`);
      warming = {
        day,
        limit: WARMING_LIMITS[idx] ?? 200,
        sentToday: parseInt(sentStr ?? "0", 10),
        initialized: true,
      };
    }
  } catch {
    // Redis unavailable — continue with defaults
  }

  const statusMap: Record<string, number> = {};
  for (const row of prospectsByStatus) {
    statusMap[row.status] = row._count.id;
  }

  return c.json({
    success: true,
    data: {
      funnel: {
        totalProspects,
        scraped: statusMap["SCRAPED"] ?? 0,
        analyzed: statusMap["ANALYZED"] ?? 0,
        previewGenerated: statusMap["PREVIEW_GENERATED"] ?? 0,
        emailSent: statusMap["EMAIL_SENT"] ?? 0,
        replied: statusMap["REPLIED"] ?? 0,
        converted: statusMap["CONVERTED"] ?? 0,
        lost: statusMap["LOST"] ?? 0,
        blacklisted: statusMap["BLACKLISTED"] ?? 0,
      },
      readiness: {
        withPreview,
        withEmail,
        readyForOutreach: withPreview, // simplification
      },
      warming,
      activeJobs,
      emailsLast7Days: recentOutreach,
    },
  });
});

// ─── GET /admin/launch/dns-guide ─────────────────────────────────────────────
// Returns DNS records needed for email deliverability

app.get("/dns-guide", (c) => {
  const domain = process.env["EMAIL_DOMAIN"] ?? "madecreative.pro";

  return c.json({
    success: true,
    data: {
      domain,
      instructions: "Add these DNS records to your domain registrar for email deliverability",
      records: [
        {
          type: "TXT",
          name: "@",
          value: "v=spf1 include:resend.com ~all",
          purpose: "SPF — authorizes Resend to send email from your domain",
          priority: "CRITICAL",
        },
        {
          type: "CNAME",
          name: "resend._domainkey",
          value: "Check Resend dashboard > Domains > madecreative.pro > DNS Records",
          purpose: "DKIM — cryptographic signature for email authentication",
          priority: "CRITICAL",
        },
        {
          type: "TXT",
          name: "_dmarc",
          value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; pct=100`,
          purpose: "DMARC — policy for handling unauthenticated email",
          priority: "CRITICAL",
        },
        {
          type: "MX",
          name: "@",
          value: "Check Resend dashboard if you want to receive replies",
          purpose: "MX — for receiving reply emails (optional if using forwarding)",
          priority: "RECOMMENDED",
        },
      ],
      verification: {
        step1: "Add all DNS records in your domain registrar (Cloudflare, GoDaddy, etc.)",
        step2: "Wait 15-60 minutes for DNS propagation",
        step3: "Go to Resend dashboard > Domains > Verify",
        step4: "Once verified, call POST /admin/launch/warming/init to start warming",
      },
      resendDashboard: "https://resend.com/domains",
    },
  });
});

export default app;
