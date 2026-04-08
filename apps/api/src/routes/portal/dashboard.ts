import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// GET /portal/dashboard
app.get("/", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const [client, lastReport] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        status: true,
        language: true,
        sector: true,
        createdAt: true,
        website: {
          select: {
            id: true,
            domain: true,
            monthlyVisits: true,
            lighthouseScore: true,
            deployUrl: true,
          },
        },
        chatbot: {
          select: {
            id: true,
            isActive: true,
            totalConversations: true,
            resolvedRate: true,
          },
        },
        invoices: {
          where: { status: "PAID" },
          select: { amount: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        },
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

  const totalRevenue = client.invoices.reduce((sum: number, inv: { amount: number }) => sum + inv.amount, 0);

  return c.json({
    success: true,
    data: {
      client: {
        id: client.id,
        companyName: client.companyName,
        contactName: client.contactName,
        status: client.status,
        language: client.language,
        sector: client.sector,
        createdAt: client.createdAt,
      },
      stats: {
        totalRevenue,
        chatbotConversations: client.chatbot?.totalConversations ?? 0,
        chatbotResolvedRate: client.chatbot?.resolvedRate ?? 0,
        monthlyVisits: client.website?.monthlyVisits ?? 0,
        lighthouseScore: client.website?.lighthouseScore ?? null,
      },
      website: client.website ?? null,
      chatbot: client.chatbot ?? null,
      lastReport,
    },
  });
});

export default app;
