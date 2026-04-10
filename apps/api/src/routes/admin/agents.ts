import { Hono } from "hono";

const app = new Hono();

// GET /admin/agents/jobs
app.get("/jobs", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { AgentJobFilterSchema, PAGINATION } = await import("@madecreative/shared");
  const query = c.req.query();
  const parsed = AgentJobFilterSchema.safeParse(query);

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
    agentType,
    status,
    prospectId,
    clientId,
  } = parsed.data;

  const where: Record<string, unknown> = {
    ...(agentType ? { agentType } : {}),
    ...(status ? { status } : {}),
    ...(prospectId ? { prospectId } : {}),
    ...(clientId ? { clientId } : {}),
  };

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.agentJob.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.agentJob.count({ where }),
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

// GET /admin/agents/jobs/:id
app.get("/jobs/:id", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");

  const job = await prisma.agentJob.findUnique({ where: { id } });
  if (!job) {
    return c.json({ success: false, error: "Job not found" }, 404);
  }

  return c.json({ success: true, data: job });
});

// POST /admin/agents/jobs
app.post("/jobs", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { AgentJobCreateSchema } = await import("@madecreative/shared");
  const { enqueueAgentJob } = await import("../../lib/queue.js");
  const body = await c.req.json().catch(() => null);
  const parsed = AgentJobCreateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: "Validation error", details: parsed.error.flatten() },
      400
    );
  }

  const { agentType, input, prospectId, clientId } = parsed.data;

  const job = await prisma.agentJob.create({
    data: {
      agentType,
      status: "QUEUED",
      input: JSON.parse(JSON.stringify(input)),
      prospectId: prospectId ?? null,
      clientId: clientId ?? null,
    },
  });

  await enqueueAgentJob({
    agentType,
    jobId: job.id,
    input,
  });

  return c.json({ success: true, data: job }, 202);
});

// DELETE /admin/agents/jobs/:id (cancel)
app.delete("/jobs/:id", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const id = c.req.param("id");

  const job = await prisma.agentJob.findUnique({ where: { id } });
  if (!job) {
    return c.json({ success: false, error: "Job not found" }, 404);
  }

  if (!["QUEUED", "RUNNING"].includes(job.status)) {
    return c.json(
      { success: false, error: "Job cannot be cancelled in its current state" },
      409
    );
  }

  await prisma.agentJob.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return c.json({ success: true, message: "Job cancelled" });
});

// POST /admin/agents/bulk-analyze — queue ANALYZER jobs for all SCRAPED prospects without a score
app.post("/bulk-analyze", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { enqueueAgentJob } = await import("../../lib/queue.js");
  const BULK_LIMIT = 50;

  const prospects = await prisma.prospect.findMany({
    where: {
      status: "SCRAPED",
      leadScore: 0,
    },
    take: BULK_LIMIT,
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (prospects.length === 0) {
    return c.json({
      success: true,
      data: { enqueued: 0, jobIds: [], message: "No eligible prospects found" },
    });
  }

  const jobIds: string[] = [];

  for (const prospect of prospects) {
    const job = await prisma.agentJob.create({
      data: {
        agentType: "ANALYZER",
        status: "QUEUED",
        input: { prospectId: prospect.id },
        prospectId: prospect.id,
      },
    });

    await enqueueAgentJob({
      agentType: "ANALYZER",
      jobId: job.id,
      input: { prospectId: prospect.id },
    });

    jobIds.push(job.id);
  }

  return c.json({
    success: true,
    data: { enqueued: jobIds.length, jobIds },
  });
});

// GET /admin/agents/stats
app.get("/stats", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const [byStatus, byType, recentCost] = await Promise.all([
    prisma.agentJob.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.agentJob.groupBy({
      by: ["agentType"],
      _count: { id: true },
      _sum: { apiCost: true },
    }),
    prisma.agentJob.aggregate({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        status: "COMPLETED",
      },
      _sum: { apiCost: true },
      _count: { id: true },
    }),
  ]);

  return c.json({
    success: true,
    data: {
      byStatus: byStatus.map((s: { status: string; _count: { id: number } }) => ({ status: s.status, count: s._count.id })),
      byType: byType.map((t: { agentType: string; _count: { id: number }; _sum: { apiCost: number | null } }) => ({
        agentType: t.agentType,
        count: t._count.id,
        totalCost: t._sum.apiCost ?? 0,
      })),
      last30Days: {
        completedJobs: recentCost._count.id,
        totalApiCost: recentCost._sum.apiCost ?? 0,
      },
    },
  });
});

export default app;
