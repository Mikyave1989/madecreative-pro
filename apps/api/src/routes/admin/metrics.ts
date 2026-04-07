import { Hono } from "hono";
import { prisma } from "@madecreative/db";

const app = new Hono();

// GET /admin/metrics — Platform KPIs
app.get("/", async (c) => {
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
    conversionRate,
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
    // Conversion rate: prospects that became clients / total prospects
    prisma.prospect.count({ where: { status: "CONVERTED" } }),
    // MRR from active clients
    prisma.client.aggregate({
      where: { status: "ACTIVE" },
      _sum: { monthlyAmount: true },
    }),
    // Recent revenue
    prisma.clientInvoice.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: startOfMonth },
      },
      select: { amount: true, type: true },
    }),
    // Agent job stats
    prisma.agentJob.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { createdAt: { gte: startOfMonth } },
    }),
  ]);

  const monthlyRevenue = recentInvoices.reduce((sum: number, inv: { amount: number }) => sum + inv.amount, 0);
  const convertedProspects = conversionRate;
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
        mrr: mrr._sum.monthlyAmount ?? 0,
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
  const months = 12;
  const data = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    const revenue = await prisma.clientInvoice.aggregate({
      where: {
        status: "PAID",
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });

    data.push({
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      revenue: revenue._sum.amount ?? 0,
    });
  }

  return c.json({ success: true, data });
});

// GET /admin/metrics/prospects-funnel
app.get("/prospects-funnel", async (c) => {
  const statuses = [
    "SCRAPED",
    "ANALYZED",
    "PREVIEW_GENERATED",
    "EMAIL_SENT",
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
