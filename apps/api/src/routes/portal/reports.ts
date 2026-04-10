import { Hono } from "hono";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// ─── GET /portal/reports ──────────────────────────────────────────────────────

app.get("/", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;

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

  return c.json({ success: true, data: { reports } });
});

// ─── GET /portal/reports/:id ──────────────────────────────────────────────────

app.get("/:id", async (c) => {
  const { prisma } = await import("@madecreative/db");
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

export default app;
