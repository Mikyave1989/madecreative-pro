import { Hono } from "hono";

const app = new Hono();

// GET /admin/clients
app.get("/", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { ClientFilterSchema, PAGINATION } = await import("@madecreative/shared");
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
    country,
    sector,
    search,
  } = parsed.data;

  const where: Record<string, unknown> = {
    ...(status ? { status } : {}),
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
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.client.count({ where }),
  ]);

  return c.json({
    success: true,
    data: { data, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// GET /admin/clients/:id
app.get("/:id", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      websites: true,
      chatbot: true,
      invoices: { orderBy: { createdAt: "desc" }, take: 12 },
      reports: { orderBy: { createdAt: "desc" }, take: 3 },
      prospect: {
        select: { id: true, source: true, leadScore: true, previewSiteUrl: true },
      },
    },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  const { passwordHash, ...safeClient } = client as typeof client & { passwordHash: string };
  void passwordHash;

  return c.json({ success: true, data: safeClient });
});

// PATCH /admin/clients/:id
app.patch("/:id", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { ClientUpdateSchema } = await import("@madecreative/shared");
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

  return c.json({ success: true, data: { id: client.id, status: client.status } });
});

// GET /admin/clients/:id/metrics
app.get("/:id/metrics", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      invoices: {
        where: { status: "PAID" },
        select: { amount: true, paidAt: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
      websites: {
        where: { isActive: true },
        select: { id: true, name: true, domain: true, monthlyVisits: true, lighthouseScore: true, deployUrl: true },
        orderBy: { updatedAt: "desc" as const },
        take: 1,
      },
      chatbot: {
        select: { id: true, isActive: true, totalConversations: true, resolvedRate: true },
      },
    },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  const totalRevenue = client.invoices.reduce((sum: number, inv: { amount: number }) => sum + inv.amount, 0);

  return c.json({
    success: true,
    data: {
      totalRevenue,
      website: client.websites[0] ?? null,
      chatbot: client.chatbot ?? null,
      recentInvoices: client.invoices,
    },
  });
});

export default app;
