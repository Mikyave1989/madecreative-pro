import { Hono } from "hono";

const app = new Hono();

// ─── Redis helper with fallback ─────────────────────────────────────────────

const WARMING_LIMITS = [5, 10, 20, 50, 100, 200];

// DB-backed warming state (works on serverless — no Redis needed)

const WARMING_CONFIG_NAME = "__warming_state__";

async function getWarmingDay(): Promise<number> {
  // Try Redis first, fallback to DB
  try {
    const { getRedisConnection } = await import("../../lib/queue.js");
    const r = getRedisConnection();
    await r.ping();
    const val = await r.get("outreach:warming:day");
    if (val !== null) return parseInt(val, 10);
  } catch { /* Redis unavailable */ }

  // Fallback: read from DB (ScrapeConfig marker)
  const { prisma } = await import("@madecreative/db");
  const config = await prisma.scrapeConfig.findFirst({ where: { name: WARMING_CONFIG_NAME } });
  if (!config) return -1;
  // Store warming day in maxResults field and sentToday in totalFound
  return config.maxResults;
}

async function setWarmingDay(day: number): Promise<void> {
  // Save to Redis if available
  try {
    const { getRedisConnection } = await import("../../lib/queue.js");
    const r = getRedisConnection();
    await r.ping();
    await r.set("outreach:warming:day", String(day));
  } catch { /* Redis unavailable */ }

  // Always save to DB as persistent fallback
  const { prisma } = await import("@madecreative/db");
  await prisma.scrapeConfig.upsert({
    where: { id: (await prisma.scrapeConfig.findFirst({ where: { name: WARMING_CONFIG_NAME } }))?.id ?? "nonexistent" },
    update: { maxResults: day },
    create: { name: WARMING_CONFIG_NAME, sector: "system", countries: [], keywords: [], maxResults: day, isActive: false },
  });
}

async function getSentToday(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  // Try Redis
  try {
    const { getRedisConnection } = await import("../../lib/queue.js");
    const r = getRedisConnection();
    await r.ping();
    const val = await r.get(`outreach:daily:${today}`);
    if (val !== null) return parseInt(val, 10);
  } catch { /* Redis unavailable */ }

  // Fallback: count today's outreach emails from DB
  const { prisma } = await import("@madecreative/db");
  const startOfDay = new Date(today + "T00:00:00Z");
  const endOfDay = new Date(today + "T23:59:59Z");
  return prisma.outreachEmail.count({ where: { sentAt: { gte: startOfDay, lte: endOfDay } } });
}

function getWarmingLimit(day: number): number {
  if (day < 0) return 5;
  const idx = Math.min(Math.floor(day / 5), WARMING_LIMITS.length - 1);
  return WARMING_LIMITS[idx] ?? 200;
}

// ─── GET /admin/launch/warming/status ────────────────────────────────────────

app.get("/warming/status", async (c) => {
  const day = await getWarmingDay();
  const limit = getWarmingLimit(day);
  const sentToday = await getSentToday();
  const configLimit = parseInt(process.env["EMAIL_DAILY_LIMIT"] ?? "200", 10);
  const effectiveLimit = Math.min(configLimit, limit);
  const phase = day < 0 ? 0 : Math.min(Math.floor(day / 5), WARMING_LIMITS.length - 1);
  const daysInPhase = day < 0 ? 0 : day % 5;

  return c.json({
    success: true,
    data: {
      warmingDay: Math.max(day, 0),
      phase,
      currentLimit: effectiveLimit,
      sentToday,
      remaining: Math.max(0, effectiveLimit - sentToday),
      initialized: day >= 0,
      daysUntilNextPhase: phase < WARMING_LIMITS.length - 1 ? 5 - daysInPhase : 0,
      nextPhaseLimit: phase < WARMING_LIMITS.length - 1 ? WARMING_LIMITS[phase + 1] : limit,
      warmingSchedule: WARMING_LIMITS.map((l, i) => ({
        phase: i, days: `${i * 5}-${(i + 1) * 5 - 1}`, dailyLimit: l, active: i === phase,
      })),
    },
  });
});

// ─── POST /admin/launch/warming/init ─────────────────────────────────────────

app.post("/warming/init", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { startDay?: number };
  const startDay = body.startDay ?? 0;

  await setWarmingDay(startDay);
  const limit = getWarmingLimit(startDay);

  return c.json({
    success: true,
    data: {
      warmingDay: startDay,
      currentLimit: limit,
      message: `Warming initialized at day ${startDay} (limit: ${limit} emails/day)`,
    },
  });
});

// ─── POST /admin/launch/bulk-analyze — queue ANALYZER for all SCRAPED prospects ─
// Use this to recover prospects saved by a timed-out SCRAPER job.

app.post("/bulk-analyze", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { enqueueAgentJob } = await import("../../lib/queue.js");

  const body = (await c.req.json().catch(() => ({}))) as { limit?: number; sector?: string; country?: string };
  const batchLimit = Math.min(body.limit ?? 100, 500);

  const prospects = await prisma.prospect.findMany({
    where: {
      status: "SCRAPED",
      leadScore: 0,
      ...(body.sector ? { sector: body.sector } : {}),
      ...(body.country ? { country: body.country } : {}),
    },
    take: batchLimit,
    orderBy: { createdAt: "desc" },
    select: { id: true, companyName: true },
  });

  if (prospects.length === 0) {
    return c.json({ success: true, data: { enqueued: 0, message: "No SCRAPED prospects with leadScore=0 found" } });
  }

  const jobIds: string[] = [];
  for (let i = 0; i < prospects.length; i++) {
    const prospect = prospects[i]!;
    const job = await prisma.agentJob.create({
      data: { agentType: "ANALYZER", status: "QUEUED", input: { prospectId: prospect.id }, prospectId: prospect.id },
    });
    await enqueueAgentJob({ agentType: "ANALYZER", jobId: job.id, input: { prospectId: prospect.id }, delay: i * 5_000 });
    jobIds.push(job.id);
  }

  return c.json({ success: true, data: { enqueued: jobIds.length, message: `Queued ANALYZER for ${jobIds.length} SCRAPED prospects (staggered 5s apart)` } });
});

// ─── POST /admin/launch/bulk-build ───────────────────────────────────────────

app.post("/bulk-build", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { enqueueAgentJob } = await import("../../lib/queue.js");

  const body = (await c.req.json().catch(() => ({}))) as { limit?: number; sector?: string; country?: string };
  const batchLimit = Math.min(body.limit ?? 50, 100);

  const prospects = await prisma.prospect.findMany({
    where: {
      status: { in: ["ANALYZED", "SCRAPED"] },
      previewSiteUrl: null,
      leadScore: { gt: 0 },
      ...(body.sector ? { sector: body.sector } : {}),
      ...(body.country ? { country: body.country } : {}),
    },
    take: batchLimit,
    orderBy: { leadScore: "desc" },
    select: { id: true, companyName: true, sector: true, country: true, leadScore: true },
  });

  if (prospects.length === 0) {
    return c.json({ success: true, data: { enqueued: 0, message: "No eligible prospects found" } });
  }

  const jobIds: string[] = [];
  for (const prospect of prospects) {
    const job = await prisma.agentJob.create({
      data: { agentType: "BUILDER", status: "QUEUED", input: { prospectId: prospect.id, templateSlug: prospect.sector }, prospectId: prospect.id },
    });
    await enqueueAgentJob({ agentType: "BUILDER", jobId: job.id, input: { prospectId: prospect.id, templateSlug: prospect.sector }, delay: jobIds.length * 30_000 });
    jobIds.push(job.id);
  }

  return c.json({ success: true, data: { enqueued: jobIds.length, jobIds, message: `Queued BUILDER for ${jobIds.length} prospects (staggered 30s apart)` } });
});

// ─── POST /admin/launch/bulk-outreach ────────────────────────────────────────

app.post("/bulk-outreach", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { enqueueAgentJob } = await import("../../lib/queue.js");

  const body = (await c.req.json().catch(() => ({}))) as { limit?: number; sector?: string; country?: string };

  const day = await getWarmingDay();
  if (day < 0) {
    return c.json({ success: false, error: "Warming not initialized. Call POST /admin/launch/warming/init first." }, 422);
  }

  const warmingLimit = getWarmingLimit(day);
  const sentToday = await getSentToday();
  const remaining = Math.max(0, warmingLimit - sentToday);
  const batchLimit = Math.min(body.limit ?? remaining, remaining, 100);

  if (batchLimit <= 0) {
    return c.json({ success: true, data: { enqueued: 0, message: `Daily warming limit reached (${sentToday}/${warmingLimit}). Try again tomorrow.` } });
  }

  const prospects = await prisma.prospect.findMany({
    where: {
      status: { in: ["ANALYZED", "PREVIEW_GENERATED", "PREVIEW_READY"] },
      previewSiteUrl: { not: null },
      contactEmail: { not: null },
      ...(body.sector ? { sector: body.sector } : {}),
      ...(body.country ? { country: body.country } : {}),
      outreachEmails: { none: {} },
    },
    take: batchLimit,
    orderBy: { leadScore: "desc" },
    select: { id: true, companyName: true, contactEmail: true, country: true, leadScore: true },
  });

  if (prospects.length === 0) {
    return c.json({ success: true, data: { enqueued: 0, message: "No eligible prospects with preview sites found" } });
  }

  const jobIds: string[] = [];
  for (const prospect of prospects) {
    const job = await prisma.agentJob.create({
      data: { agentType: "OUTREACH", status: "QUEUED", input: { prospectId: prospect.id, stepNumber: 1 }, prospectId: prospect.id },
    });
    await enqueueAgentJob({ agentType: "OUTREACH", jobId: job.id, input: { prospectId: prospect.id, stepNumber: 1 }, delay: jobIds.length * 60_000 });
    jobIds.push(job.id);
  }

  return c.json({
    success: true,
    data: { enqueued: jobIds.length, jobIds, warmingStatus: { day, limit: warmingLimit, sentToday, remaining: remaining - jobIds.length }, message: `Queued OUTREACH for ${jobIds.length} prospects (staggered 1min apart)` },
  });
});

// ─── POST /admin/launch/munich ───────────────────────────────────────────────

app.post("/munich", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { enqueueAgentJob } = await import("../../lib/queue.js");

  const body = (await c.req.json().catch(() => ({}))) as { maxResults?: number; minRating?: number; keywords?: string[] };

  const existing = await prisma.scrapeConfig.findFirst({ where: { name: { contains: "M\u00fcnchen", mode: "insensitive" } } });
  let config = existing;

  if (!config) {
    config = await prisma.scrapeConfig.create({
      data: {
        name: "M\u00fcnchen Restaurants \u2014 Launch Wave 1",
        sector: "restaurant",
        countries: ["DE"],
        cities: ["M\u00fcnchen", "Munich"],
        keywords: body.keywords ?? ["restaurant m\u00fcnchen", "ristorante m\u00fcnchen", "trattoria m\u00fcnchen", "pizzeria m\u00fcnchen", "biergarten m\u00fcnchen"],
        excludeKeywords: ["mcdonald", "burger king", "subway", "starbucks"],
        minRating: body.minRating ?? 3.5,
        maxResults: body.maxResults ?? 50,
        schedule: "0 2 * * *",
        isActive: true,
      },
    });
  }

  const job = await prisma.agentJob.create({
    data: {
      agentType: "SCRAPER", status: "QUEUED",
      input: { scrapeConfigId: config.id, configId: config.id, sector: config.sector, countries: config.countries as string[], cities: (config.cities as string[] | null) ?? ["M\u00fcnchen"], keywords: config.keywords as string[], maxResults: config.maxResults, minRating: config.minRating ?? undefined },
    },
  });

  await enqueueAgentJob({ agentType: "SCRAPER", jobId: job.id, input: job.input as Record<string, unknown> });

  return c.json({ success: true, data: { scrapeConfigId: config.id, jobId: job.id, message: `M\u00fcnchen restaurant scrape launched \u2014 targeting ${config.maxResults} prospects` } }, 202);
});

// ─── GET /admin/launch/status ────────────────────────────────────────────────

app.get("/status", async (c) => {
  const { prisma } = await import("@madecreative/db");

  const [prospectsByStatus, totalProspects, withPreview, withEmail, activeJobs, recentOutreach] = await Promise.all([
    prisma.prospect.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.prospect.count(),
    prisma.prospect.count({ where: { previewSiteUrl: { not: null } } }),
    prisma.prospect.count({ where: { contactEmail: { not: null } } }),
    prisma.agentJob.count({ where: { status: { in: ["QUEUED", "RUNNING"] } } }),
    prisma.outreachEmail.count({ where: { sentAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, status: { in: ["sent", "opened", "clicked", "replied"] } } }),
  ]);

  const day = await getWarmingDay();
  const warming = { day: Math.max(day, 0), limit: getWarmingLimit(day), sentToday: await getSentToday(), initialized: day >= 0 };

  const statusMap: Record<string, number> = {};
  for (const row of prospectsByStatus) statusMap[row.status] = row._count.id;

  return c.json({
    success: true,
    data: {
      funnel: { totalProspects, scraped: statusMap["SCRAPED"] ?? 0, analyzed: statusMap["ANALYZED"] ?? 0, previewReady: withPreview, contacted: statusMap["CONTACTED"] ?? 0, replied: statusMap["REPLIED"] ?? 0, converted: statusMap["CONVERTED"] ?? 0, lost: statusMap["LOST"] ?? 0 },
      readiness: { withPreview, withEmail, readyForOutreach: withPreview },
      warming, activeJobs, emailsLast7Days: recentOutreach,
    },
  });
});

// ─── GET /admin/launch/dns-guide ─────────────────────────────────────────────

app.get("/dns-guide", (c) => {
  const domain = process.env["EMAIL_DOMAIN"] ?? "madecreative.pro";
  return c.json({
    success: true,
    data: {
      domain,
      records: [
        { type: "TXT", name: "@", value: "v=spf1 include:resend.com ~all", purpose: "SPF", priority: "CRITICAL" },
        { type: "CNAME", name: "resend._domainkey", value: "Check Resend dashboard > Domains", purpose: "DKIM", priority: "CRITICAL" },
        { type: "TXT", name: "_dmarc", value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; pct=100`, purpose: "DMARC", priority: "CRITICAL" },
        { type: "MX", name: "@", value: "Check Resend dashboard for MX record", purpose: "Reply receiving", priority: "RECOMMENDED" },
      ],
    },
  });
});

// ─── POST /admin/launch/campaign — one-click full pipeline launcher ───────────
//
// Body: { city, country, sector, maxResults?, minRating?, keywords? }
//
// Creates (or finds) a ScrapeConfig for the city+country+sector combo, then
// creates a SCRAPER AgentJob and enqueues it.  The orchestrator automatically
// chains: SCRAPER → ANALYZER → BUILDER → OUTREACH + QA.

app.post("/campaign", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { enqueueAgentJob } = await import("../../lib/queue.js");

  const body = (await c.req.json().catch(() => ({}))) as {
    city?: string;
    country?: string;
    sector?: string;
    maxResults?: number;
    minRating?: number;
    keywords?: string[];
  };

  const city = (body.city ?? "").trim();
  const country = (body.country ?? "DE").toUpperCase();
  const sector = (body.sector ?? "restaurant").toLowerCase();
  const maxResults = Math.min(body.maxResults ?? 50, 5000);
  const minRating = Math.max(1, Math.min(5, body.minRating ?? 3.5));

  if (!city) {
    return c.json({ success: false, error: "city is required" }, 422);
  }

  // Derive default search keywords from city + sector
  const defaultKeywords = body.keywords ?? [`${sector} ${city}`, `${city} ${sector}`];

  // Find or create the ScrapeConfig for this city+country+sector
  const configName = `${city} ${sector.charAt(0).toUpperCase() + sector.slice(1)} — ${country}`;

  let config = await prisma.scrapeConfig.findFirst({
    where: {
      name: { equals: configName, mode: "insensitive" },
    },
  });

  if (!config) {
    config = await prisma.scrapeConfig.create({
      data: {
        name: configName,
        sector,
        countries: [country],
        cities: [city],
        keywords: defaultKeywords,
        excludeKeywords: ["mcdonald", "burger king", "subway", "starbucks", "kfc", "dominos"],
        minRating,
        maxResults,
        schedule: null,
        isActive: true,
      },
    });
  }

  // Create the SCRAPER job — orchestrator handles the rest of the chain
  const job = await prisma.agentJob.create({
    data: {
      agentType: "SCRAPER",
      status: "QUEUED",
      input: {
        scrapeConfigId: config.id,
        configId: config.id,
        sector: config.sector,
        countries: config.countries as string[],
        cities: (config.cities as string[] | null) ?? [city],
        keywords: config.keywords as string[],
        maxResults: config.maxResults,
        minRating: config.minRating ?? minRating,
      },
    },
  });

  await enqueueAgentJob({
    agentType: "SCRAPER",
    jobId: job.id,
    input: job.input as Record<string, unknown>,
  });

  // Auto-initialize warming at day 0 if it has never been set up.
  // Without this, getWarmingDay() returns -1 → getWarmingLimit(-1) = 5 → outreach is
  // capped at 5 emails forever, which is confusing and blocks the pipeline.
  const warmingDay = await getWarmingDay();
  if (warmingDay < 0) {
    await setWarmingDay(0);
    console.log("[campaign] Warming auto-initialized at day 0 (limit: 5 emails/day)");
  }

  return c.json(
    {
      success: true,
      data: {
        scrapeConfigId: config.id,
        jobId: job.id,
        message: `Campaign launched — targeting up to ${maxResults} ${sector} businesses in ${city}, ${country}. Pipeline: SCRAPER → ANALYZER → BUILDER → OUTREACH → QA`,
      },
    },
    202
  );
});

// ─── GET /admin/launch/campaigns — list active campaigns with live stats ──────
//
// Returns all ScrapeConfigs (excluding the internal warming marker) with
// counts of currently active/queued jobs and total prospects found.

app.get("/campaigns", async (c) => {
  const { prisma } = await import("@madecreative/db");

  // Load all real scrape configs (exclude the internal warming state marker)
  const configs = await prisma.scrapeConfig.findMany({
    where: {
      NOT: { name: { equals: "__warming_state__", mode: "insensitive" } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  if (configs.length === 0) {
    return c.json({ success: true, data: [] });
  }

  // For each config, count active/queued jobs whose input references this configId,
  // and count the prospects that were created by a scraper job for this config.
  // We do two aggregate queries to keep it efficient.

  const [activeJobRows, prospectCountRows, sitesBuiltRows, emailsSentRows] = await Promise.all([
    // Count RUNNING or QUEUED SCRAPER jobs per configId stored in input JSON
    prisma.$queryRaw<{ configId: string; count: bigint }[]>`
      SELECT
        input->>'configId' AS "configId",
        COUNT(*)::bigint      AS count
      FROM "AgentJob"
      WHERE status IN ('RUNNING', 'QUEUED')
        AND "agentType" = 'SCRAPER'
        AND input->>'configId' IS NOT NULL
      GROUP BY input->>'configId'
    `.catch(() => [] as { configId: string; count: bigint }[]),

    // Count prospects per scrapeJobId — we link via the agentJob that has input.configId
    prisma.$queryRaw<{ configId: string; count: bigint }[]>`
      SELECT
        j.input->>'configId' AS "configId",
        COUNT(DISTINCT p.id)::bigint AS count
      FROM "Prospect" p
      JOIN "AgentJob" j
        ON j.id = p."scrapeJobId"
      WHERE j.input->>'configId' IS NOT NULL
      GROUP BY j.input->>'configId'
    `.catch(() => [] as { configId: string; count: bigint }[]),

    // Count prospects with preview sites built (BUILDER completed)
    prisma.$queryRaw<{ configId: string; count: bigint }[]>`
      SELECT
        j.input->>'configId' AS "configId",
        COUNT(DISTINCT p.id)::bigint AS count
      FROM "Prospect" p
      JOIN "AgentJob" j
        ON j.id = p."scrapeJobId"
      WHERE j.input->>'configId' IS NOT NULL
        AND p."previewSiteUrl" IS NOT NULL
      GROUP BY j.input->>'configId'
    `.catch(() => [] as { configId: string; count: bigint }[]),

    // Count prospects that were emailed (firstContactedAt set or CONTACTED/EMAIL_SENT status)
    prisma.$queryRaw<{ configId: string; count: bigint }[]>`
      SELECT
        j.input->>'configId' AS "configId",
        COUNT(DISTINCT p.id)::bigint AS count
      FROM "Prospect" p
      JOIN "AgentJob" j
        ON j.id = p."scrapeJobId"
      WHERE j.input->>'configId' IS NOT NULL
        AND (p."firstContactedAt" IS NOT NULL OR p.status IN ('CONTACTED', 'EMAIL_SENT', 'FOLLOWED_UP', 'REPLIED', 'CALL_SCHEDULED', 'CONVERTED'))
      GROUP BY j.input->>'configId'
    `.catch(() => [] as { configId: string; count: bigint }[]),
  ]);

  // Build lookup maps
  const activeJobMap: Record<string, number> = {};
  for (const row of activeJobRows) {
    activeJobMap[row.configId] = Number(row.count);
  }

  const prospectMap: Record<string, number> = {};
  for (const row of prospectCountRows) {
    prospectMap[row.configId] = Number(row.count);
  }

  const sitesBuiltMap: Record<string, number> = {};
  for (const row of sitesBuiltRows) {
    sitesBuiltMap[row.configId] = Number(row.count);
  }

  const emailsSentMap: Record<string, number> = {};
  for (const row of emailsSentRows) {
    emailsSentMap[row.configId] = Number(row.count);
  }

  const data = configs.map((cfg) => ({
    id: cfg.id,
    name: cfg.name,
    sector: cfg.sector,
    countries: cfg.countries as string[],
    cities: cfg.cities as string[] | null,
    maxResults: cfg.maxResults,
    isActive: cfg.isActive,
    lastRunAt: cfg.lastRunAt?.toISOString() ?? null,
    totalFound: cfg.totalFound,
    createdAt: cfg.createdAt.toISOString(),
    activeJobs: activeJobMap[cfg.id] ?? 0,
    prospectsFound: prospectMap[cfg.id] ?? cfg.totalFound,
    sitesBuilt: sitesBuiltMap[cfg.id] ?? 0,
    emailsSent: emailsSentMap[cfg.id] ?? 0,
  }));

  return c.json({ success: true, data });
});

export default app;
