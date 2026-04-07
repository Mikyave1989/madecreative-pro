import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// GET /portal/dashboard
app.get("/", async (c) => {
  const payload = c.get("jwtPayload");
  const clientId = payload.sub;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59
  );

  const [
    client,
    leadsThisMonth,
    leadsLastMonth,
    websites,
    recentLeads,
    openTickets,
    recentPosts,
    lastReport,
  ] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        plan: true,
        status: true,
        language: true,
        totalRevGenerated: true,
        totalLeadsGen: true,
        totalTimeSaved: true,
        socialPostingEnabled: true,
        _count: {
          select: {
            websites: true,
            automations: true,
            chatbots: true,
          },
        },
      },
    }),
    prisma.clientLead.count({
      where: { clientId, createdAt: { gte: startOfMonth } },
    }),
    prisma.clientLead.count({
      where: {
        clientId,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),
    prisma.clientWebsite.findMany({
      where: { clientId },
      select: {
        id: true,
        name: true,
        domain: true,
        status: true,
        monthlyVisits: true,
        lighthouseScore: true,
        deployUrl: true,
      },
    }),
    prisma.clientLead.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        source: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.supportTicket.count({
      where: { clientId, status: { in: ["open", "in_progress"] } },
    }),
    prisma.clientSocialPost.findMany({
      where: { clientId, status: { in: ["scheduled", "published"] } },
      orderBy: { scheduledFor: "asc" },
      take: 5,
      select: {
        id: true,
        platform: true,
        type: true,
        caption: true,
        scheduledFor: true,
        publishedAt: true,
        status: true,
        likes: true,
        reach: true,
      },
    }),
    prisma.monthlyReport.findFirst({
      where: { clientId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: { id: true, month: true, year: true, pdfUrl: true, sentAt: true },
    }),
  ]);

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  const leadsGrowth =
    leadsLastMonth > 0
      ? Math.round(
          ((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100
        )
      : 0;

  return c.json({
    success: true,
    data: {
      client,
      stats: {
        leadsThisMonth,
        leadsLastMonth,
        leadsGrowth,
        totalLeadsGen: client.totalLeadsGen,
        totalRevGenerated: client.totalRevGenerated,
        totalTimeSavedHours: Math.round(client.totalTimeSaved / 60),
        openTickets,
      },
      websites,
      recentLeads,
      recentPosts,
      lastReport,
    },
  });
});

export default app;
