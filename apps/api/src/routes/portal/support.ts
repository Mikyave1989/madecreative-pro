import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import {
  TicketCreateSchema,
  TicketUpdateSchema,
  PAGINATION,
} from "@madecreative/shared";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// GET /portal/support/tickets
app.get("/tickets", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const query = c.req.query();
  const page = Math.max(1, parseInt(query["page"] ?? "1", 10));
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    parseInt(query["limit"] ?? "20", 10)
  );
  const status = query["status"];
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    clientId,
    ...(status ? { status } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.supportTicket.count({ where }),
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

// GET /portal/support/tickets/:id
app.get("/tickets/:id", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, clientId },
  });

  if (!ticket) {
    return c.json({ success: false, error: "Ticket not found" }, 404);
  }

  return c.json({ success: true, data: ticket });
});

// POST /portal/support/tickets
app.post("/tickets", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const body = await c.req.json().catch(() => null);
  const parsed = TicketCreateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: "Validation error",
        details: parsed.error.flatten(),
      },
      400
    );
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      clientId,
      ...parsed.data,
    },
  });

  // TODO: trigger AI response generation via agent queue

  return c.json({ success: true, data: ticket }, 201);
});

// PATCH /portal/support/tickets/:id
app.patch("/tickets/:id", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, clientId },
  });

  if (!ticket) {
    return c.json({ success: false, error: "Ticket not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  // Clients can only update status to "closed"
  const clientUpdateSchema = TicketUpdateSchema.pick({ status: true });
  const parsed = clientUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: "Validation error",
        details: parsed.error.flatten(),
      },
      400
    );
  }

  if (parsed.data.status && parsed.data.status !== "closed") {
    return c.json(
      { success: false, error: "Clients can only close tickets" },
      403
    );
  }

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.status === "closed"
        ? { resolvedAt: new Date() }
        : {}),
    },
  });

  return c.json({ success: true, data: updated });
});

export default app;
