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
    // MRR: activeClients × €197
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

  const PLAN_PRICE = 197;
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

export default app;
