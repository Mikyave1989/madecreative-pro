import { Hono } from "hono";

const app = new Hono();

// GET /admin/metrics — Platform KPIs
app.get("/", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalClients,
    activeClients,
    newClientsThisMonth,
    newClientsLastMonth,
    totalProspects,
    prospectsThisMonth,
    convertedProspects,
    mrr,
    recentInvoices,
    agentStats,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.client.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.client.count({
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),
    prisma.prospect.count(),
    prisma.prospect.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.prospect.count({ where: { status: "CONVERTED" } }),
    // MRR: activeClients × plan price
    prisma.client.count({ where: { status: "ACTIVE" } }),
    // Revenue from paid invoices this month
    prisma.clientInvoice.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: startOfMonth },
      },
      select: { amount: true },
    }),
    // Agent job stats
    prisma.agentJob.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { createdAt: { gte: startOfMonth } },
    }),
  ]);

  const { PLAN_PRICE } = await import("@madecreative/shared");
  const monthlyRevenue = recentInvoices.reduce((sum: number, inv: { amount: number }) => sum + inv.amount, 0);
  const conversionPct =
    totalProspects > 0
      ? Math.round((convertedProspects / totalProspects) * 100 * 100) / 100
      : 0;

  const agentStatMap = Object.fromEntries(
    agentStats.map((s: { status: string; _count: { id: number } }) => [s.status, s._count.id])
  );

  return c.json({
    success: true,
    data: {
      clients: {
        total: totalClients,
        active: activeClients,
        newThisMonth: newClientsThisMonth,
        newLastMonth: newClientsLastMonth,
        growth:
          newClientsLastMonth > 0
            ? Math.round(
                ((newClientsThisMonth - newClientsLastMonth) /
                  newClientsLastMonth) *
                  100
              )
            : 0,
      },
      revenue: {
        mrr: mrr * PLAN_PRICE,
        monthlyRevenue,
      },
      prospects: {
        total: totalProspects,
        newThisMonth: prospectsThisMonth,
        converted: convertedProspects,
        conversionRate: conversionPct,
      },
      agents: {
        queued: agentStatMap["QUEUED"] ?? 0,
        running: agentStatMap["RUNNING"] ?? 0,
        completed: agentStatMap["COMPLETED"] ?? 0,
        failed: agentStatMap["FAILED"] ?? 0,
      },
    },
  });
});

// GET /admin/metrics/revenue-chart
app.get("/revenue-chart", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const months = 12;
  const data: Array<{ month: string; revenue: number; clients: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    const [revenue, newClients] = await Promise.all([
      prisma.clientInvoice.aggregate({
        where: {
          status: "PAID",
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      prisma.client.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
    ]);

    data.push({
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      revenue: revenue._sum.amount ?? 0,
      clients: newClients,
    });
  }

  return c.json({ success: true, data });
});

// GET /admin/metrics/prospects-funnel
app.get("/prospects-funnel", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const statuses = [
    "SCRAPED",
    "QUALIFIED",
    "PREVIEW_READY",
    "CONTACTED",
    "FOLLOWED_UP",
    "REPLIED",
    "CONVERTED",
  ];

  const counts = await Promise.all(
    statuses.map((status) =>
      prisma.prospect.count({ where: { status } }).then((count: number) => ({
        status,
        count,
      }))
    )
  );

  return c.json({ success: true, data: counts });
});

// ─── GET /admin/metrics/dashboard — complete overview with all pipeline stats ──

app.get("/dashboard", async (c) => {
  const { prisma } = await import("@madecreative/db");

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    // Pipeline counts
    totalProspects,
    prospectsByStatus,
    // Builds
    totalBuilds,
    buildsWithPreview,
    // Emails
    totalEmailsSent,
    emailsOpened,
    emailsClicked,
    emailsReplied,
    emailsBounced,
    emailsSentToday,
    emailsSent7d,
    emailsSent30d,
    // Preview sites viewed (clickedAt = they clicked the preview link)
    previewsViewed,
    // Agent jobs
    agentJobsByType,
    activeJobs,
    failedJobs30d,
    // Clients / revenue
    totalClients,
    activeClients,
    newClientsMonth,
    recentInvoices,
    // Analyzer stats
    analyzedProspects,
    highScoreProspects,
    avgLeadScore,
  ] = await Promise.all([
    // Pipeline
    prisma.prospect.count(),
    prisma.prospect.groupBy({ by: ["status"], _count: { id: true } }),

    // Builds
    prisma.agentJob.count({ where: { agentType: "BUILDER", status: "COMPLETED" } }),
    prisma.prospect.count({ where: { previewSiteUrl: { not: null } } }),

    // Emails
    prisma.outreachEmail.count({ where: { sentAt: { not: null } } }),
    prisma.outreachEmail.count({ where: { openedAt: { not: null } } }),
    prisma.outreachEmail.count({ where: { clickedAt: { not: null } } }),
    prisma.outreachEmail.count({ where: { repliedAt: { not: null } } }),
    prisma.outreachEmail.count({ where: { bouncedAt: { not: null } } }),
    prisma.outreachEmail.count({ where: { sentAt: { gte: startOfDay } } }),
    prisma.outreachEmail.count({ where: { sentAt: { gte: last7d } } }),
    prisma.outreachEmail.count({ where: { sentAt: { gte: last30d } } }),

    // Preview views (clicked = visited the preview link in the email)
    prisma.outreachEmail.count({ where: { clickedAt: { not: null } } }),

    // Agent jobs breakdown
    prisma.agentJob.groupBy({
      by: ["agentType", "status"],
      _count: { id: true },
    }),
    prisma.agentJob.count({ where: { status: { in: ["QUEUED", "RUNNING"] } } }),
    prisma.agentJob.count({ where: { status: "FAILED", createdAt: { gte: last30d } } }),

    // Clients
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.client.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.clientInvoice.findMany({
      where: { status: "PAID", createdAt: { gte: startOfMonth } },
      select: { amount: true },
    }),

    // Analyzer
    prisma.prospect.count({ where: { leadScore: { gt: 0 } } }),
    prisma.prospect.count({ where: { leadScore: { gte: 50 } } }),
    prisma.prospect.aggregate({ _avg: { leadScore: true }, where: { leadScore: { gt: 0 } } }),
  ]);

  // Build status map
  const statusMap: Record<string, number> = {};
  for (const row of prospectsByStatus) statusMap[row.status] = row._count.id;

  // Build agent job breakdown: { SCRAPER: { COMPLETED: 10, FAILED: 2 }, ... }
  const agentBreakdown: Record<string, Record<string, number>> = {};
  for (const row of agentJobsByType) {
    if (!agentBreakdown[row.agentType]) agentBreakdown[row.agentType] = {};
    agentBreakdown[row.agentType]![row.status] = row._count.id;
  }

  const monthlyRevenue = recentInvoices.reduce((sum: number, inv: { amount: number }) => sum + inv.amount, 0);

  // Email rates
  const openRate = totalEmailsSent > 0 ? Math.round((emailsOpened / totalEmailsSent) * 1000) / 10 : 0;
  const clickRate = totalEmailsSent > 0 ? Math.round((emailsClicked / totalEmailsSent) * 1000) / 10 : 0;
  const replyRate = totalEmailsSent > 0 ? Math.round((emailsReplied / totalEmailsSent) * 1000) / 10 : 0;
  const bounceRate = totalEmailsSent > 0 ? Math.round((emailsBounced / totalEmailsSent) * 1000) / 10 : 0;

  return c.json({
    success: true,
    data: {
      // Pipeline funnel
      pipeline: {
        scraped: statusMap["SCRAPED"] ?? 0,
        analyzed: analyzedProspects,
        highScore: highScoreProspects,
        avgLeadScore: Math.round(avgLeadScore._avg.leadScore ?? 0),
        previewsBuilt: buildsWithPreview,
        emailQueued: statusMap["EMAIL_QUEUED"] ?? 0,
        contacted: (statusMap["CONTACTED"] ?? 0) + (statusMap["EMAIL_SENT"] ?? 0),
        followedUp: statusMap["FOLLOWED_UP"] ?? 0,
        replied: statusMap["REPLIED"] ?? 0,
        converted: statusMap["CONVERTED"] ?? 0,
        lost: statusMap["LOST"] ?? 0,
        total: totalProspects,
      },

      // Email stats
      emails: {
        totalSent: totalEmailsSent,
        sentToday: emailsSentToday,
        sent7d: emailsSent7d,
        sent30d: emailsSent30d,
        opened: emailsOpened,
        clicked: emailsClicked,
        replied: emailsReplied,
        bounced: emailsBounced,
        openRate,
        clickRate,
        replyRate,
        bounceRate,
      },

      // Preview sites
      previews: {
        built: buildsWithPreview,
        viewed: previewsViewed,
        viewRate: buildsWithPreview > 0 ? Math.round((previewsViewed / buildsWithPreview) * 1000) / 10 : 0,
      },

      // Agent jobs
      agents: {
        active: activeJobs,
        failed30d: failedJobs30d,
        breakdown: agentBreakdown,
      },

      // Business
      business: {
        totalClients,
        activeClients,
        newClientsMonth,
        monthlyRevenue,
        mrr: activeClients * 79, // Business plan average
      },
    },
  });
});

export default app;
