import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import { ClientFilterSchema, ClientUpdateSchema, PAGINATION } from "@madecreative/shared";

const app = new Hono();

// GET /admin/clients
app.get("/", async (c) => {
  const query = c.req.query();
  const parsed = ClientFilterSchema.safeParse(query);

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
    status,
    plan,
    country,
    sector,
    search,
  } = parsed.data;

  const where: Record<string, unknown> = {
    ...(status ? { status } : {}),
    ...(plan ? { plan } : {}),
    ...(country ? { country } : {}),
    ...(sector ? { sector } : {}),
    ...(search
      ? {
          OR: [
            { companyName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { contactName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
        country: true,
        sector: true,
        plan: true,
        status: true,
        monthlyAmount: true,
        totalRevGenerated: true,
        totalLeadsGen: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            websites: true,
            leads: true,
            tickets: true,
          },
        },
      },
    }),
    prisma.client.count({ where }),
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

// GET /admin/clients/:id
app.get("/:id", async (c) => {
  const id = c.req.param("id");

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      websites: { orderBy: { createdAt: "desc" } },
      leads: { orderBy: { createdAt: "desc" }, take: 10 },
      automations: true,
      chatbots: true,
      invoices: { orderBy: { createdAt: "desc" }, take: 12 },
      tickets: { orderBy: { createdAt: "desc" }, take: 5 },
      reports: { orderBy: { createdAt: "desc" }, take: 3 },
      prospect: {
        select: { id: true, source: true, leadScore: true, previewSiteUrl: true },
      },
    },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  // Strip sensitive fields
  const { passwordHash, igAccessToken, fbPageAccessToken, ...safeClient } =
    client as typeof client & {
      passwordHash: string;
      igAccessToken: string | null;
      fbPageAccessToken: string | null;
    };
  void passwordHash;
  void igAccessToken;
  void fbPageAccessToken;

  return c.json({ success: true, data: safeClient });
});

// PATCH /admin/clients/:id
app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = ClientUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: "Validation error", details: parsed.error.flatten() },
      400
    );
  }

  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  const client = await prisma.client.update({
    where: { id },
    data: parsed.data,
  });

  return c.json({ success: true, data: { id: client.id, status: client.status, plan: client.plan } });
});

// GET /admin/clients/:id/metrics
app.get("/:id/metrics", async (c) => {
  const id = c.req.param("id");

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [leadsThisMonth, leadsLastMonth, invoices, websites, tickets] =
    await Promise.all([
      prisma.clientLead.count({
        where: { clientId: id, createdAt: { gte: startOfMonth } },
      }),
      prisma.clientLead.count({
        where: {
          clientId: id,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      prisma.clientInvoice.findMany({
        where: { clientId: id, status: "PAID" },
        select: { amount: true, type: true, paidAt: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.clientWebsite.findMany({
        where: { clientId: id },
        select: { id: true, name: true, status: true, monthlyVisits: true, lighthouseScore: true },
      }),
      prisma.supportTicket.count({
        where: { clientId: id, status: { in: ["open", "in_progress"] } },
      }),
    ]);

  const totalRevenue = invoices.reduce((sum: number, inv: { amount: number }) => sum + inv.amount, 0);

  return c.json({
    success: true,
    data: {
      leadsThisMonth,
      leadsLastMonth,
      leadsGrowth:
        leadsLastMonth > 0
          ? Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100)
          : 0,
      totalRevenue,
      websites,
      openTickets: tickets,
      totalRevGenerated: client.totalRevGenerated,
      totalLeadsGen: client.totalLeadsGen,
      totalTimeSaved: client.totalTimeSaved,
    },
  });
});

export default app;
