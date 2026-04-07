import "dotenv/config";
import cron from "node-cron";
import { prisma } from "@madecreative/db";
import type { ReportData } from "@madecreative/shared";

async function generateMonthlyReport(clientId: string, month: number, year: number): Promise<void> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [
    leadsCount,
    leadsConverted,
    websiteVisits,
    socialEngagement,
    chatbotConversations,
    invoices,
  ] = await Promise.all([
    prisma.clientLead.count({
      where: { clientId, createdAt: { gte: startDate, lte: endDate } },
    }),
    prisma.clientLead.count({
      where: { clientId, status: "won", createdAt: { gte: startDate, lte: endDate } },
    }),
    // Sum website visits from websites
    prisma.clientWebsite.aggregate({
      where: { clientId },
      _sum: { monthlyVisits: true },
    }),
    // Sum social engagement
    prisma.clientSocialPost.aggregate({
      where: { clientId, publishedAt: { gte: startDate, lte: endDate } },
      _sum: { likes: true, comments: true, reach: true },
    }),
    prisma.clientChatbot.aggregate({
      where: { clientId },
      _sum: { totalConversations: true },
    }),
    prisma.clientInvoice.aggregate({
      where: { clientId, status: "PAID", createdAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
  ]);

  const conversionRate =
    leadsCount > 0 ? (leadsConverted / leadsCount) * 100 : 0;

  const reportData: ReportData = {
    metrics: {
      websiteVisits: websiteVisits._sum.monthlyVisits ?? 0,
      leadsGenerated: leadsCount,
      leadsConverted,
      conversionRate: Math.round(conversionRate * 100) / 100,
      revenueAttributed: invoices._sum.amount ?? 0,
      timeSavedHours: Math.round((leadsCount * 0.5 + (websiteVisits._sum.monthlyVisits ?? 0) * 0.001) * 10) / 10,
      socialReach: socialEngagement._sum.reach ?? 0,
      socialEngagement:
        (socialEngagement._sum.likes ?? 0) +
        (socialEngagement._sum.comments ?? 0),
      chatbotConversations: chatbotConversations._sum.totalConversations ?? 0,
      chatbotResolved: 0,
    },
    insights: [
      `Generated ${leadsCount} leads this month`,
      `Website received ${websiteVisits._sum.monthlyVisits ?? 0} visits`,
      `Social media reached ${socialEngagement._sum.reach ?? 0} people`,
    ],
    recommendations: [
      "Continue optimizing landing pages for better conversion",
      "Increase social media posting frequency",
      "Consider adding more FAQ content to chatbot",
    ],
    nextMonthGoals: [
      `Target ${Math.ceil(leadsCount * 1.2)} leads`,
      `Reach ${Math.ceil((websiteVisits._sum.monthlyVisits ?? 0) * 1.15)} website visits`,
    ],
  };

  // Check if report already exists
  const existing = await prisma.monthlyReport.findFirst({
    where: { clientId, month, year },
  });

  if (existing) {
    await prisma.monthlyReport.update({
      where: { id: existing.id },
      data: { data: reportData  },
    });
  } else {
    await prisma.monthlyReport.create({
      data: {
        clientId,
        month,
        year,
        data: reportData ,
      },
    });
  }

  console.log(`[ReportWorker] Generated report for client ${clientId} — ${month}/${year}`);
}

async function generateAllMonthlyReports(): Promise<void> {
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  console.log(`[ReportWorker] Generating reports for ${lastMonth}/${year}`);

  const activeClients = await prisma.client.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  console.log(`[ReportWorker] Processing ${activeClients.length} active clients`);

  for (const client of activeClients) {
    await generateMonthlyReport(client.id, lastMonth, year).catch((err) => {
      console.error(`[ReportWorker] Failed for client ${client.id}:`, err);
    });
  }

  console.log(`[ReportWorker] Monthly reports complete`);
}

async function main(): Promise<void> {
  console.log("[ReportWorker] Starting...");

  // Run on 1st of every month at 8:00 AM
  cron.schedule("0 8 1 * *", () => {
    generateAllMonthlyReports().catch(console.error);
  });

  // Also allow manual trigger via env var
  if (process.env["RUN_REPORTS_NOW"] === "true") {
    await generateAllMonthlyReports();
  }

  console.log("[ReportWorker] Running — scheduled for 1st of each month at 08:00");

  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));

  // Keep process alive
  setInterval(() => {}, 60_000);
}

main().catch((err) => {
  console.error("[ReportWorker] Fatal error:", err);
  process.exit(1);
});
