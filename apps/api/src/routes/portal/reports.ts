import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// ─── GET /portal/reports ──────────────────────────────────────────────────────

app.get("/", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { plan: true },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  const reports = await prisma.monthlyReport.findMany({
    where: { clientId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: {
      id: true,
      month: true,
      year: true,
      pdfUrl: true,
      sentAt: true,
      createdAt: true,
      data: true,
    },
  });

  return c.json({
    success: true,
    data: {
      reports,
      canGenerateNow: client.plan === "ENTERPRISE",
    },
  });
});

// ─── GET /portal/reports/:id ──────────────────────────────────────────────────

app.get("/:id", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const report = await prisma.monthlyReport.findFirst({
    where: { id, clientId },
  });

  if (!report) {
    return c.json({ success: false, error: "Report not found" }, 404);
  }

  return c.json({ success: true, data: report });
});

// ─── POST /portal/reports/generate ───────────────────────────────────────────
// Only ENTERPRISE can trigger on-demand

app.post("/generate", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { plan: true },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  if (client.plan !== "ENTERPRISE") {
    return c.json(
      {
        success: false,
        error:
          "La generazione manuale dei report è disponibile solo per il piano ENTERPRISE",
      },
      403
    );
  }

  // Queue a report generation job — in production this would enqueue to BullMQ
  // For now we return a 202 Accepted acknowledging the request
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return c.json(
    {
      success: true,
      data: {
        message: `Generazione report per ${month}/${year} avviata. Riceverai un'email quando il PDF è pronto.`,
        month,
        year,
      },
    },
    202
  );
});

export default app;
