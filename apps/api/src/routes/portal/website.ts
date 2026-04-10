import { Hono } from "hono";
import type { JwtPayload } from "@madecreative/shared";
import { getQueue } from "../../lib/queue.js";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// GET /portal/websites
app.get("/", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;

  const websites = await prisma.clientWebsite.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ success: true, data: websites });
});

// GET /portal/websites/:id
app.get("/:id", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const website = await prisma.clientWebsite.findFirst({
    where: { id, clientId },
  });

  if (!website) {
    return c.json({ success: false, error: "Website not found" }, 404);
  }

  return c.json({ success: true, data: website });
});

// POST /portal/websites/:id/update-request
app.post("/:id/update-request", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const { WebsiteUpdateRequestSchema } = await import("@madecreative/shared");
  const clientId = c.get("jwtPayload").sub;
  const websiteId = c.req.param("id");

  const website = await prisma.clientWebsite.findFirst({
    where: { id: websiteId, clientId },
  });

  if (!website) {
    return c.json({ success: false, error: "Website not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = WebsiteUpdateRequestSchema.safeParse(body);

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

  // Queue a BUILDER job to process the update request
  const job = await prisma.agentJob.create({
    data: {
      agentType: "BUILDER",
      status: "QUEUED",
      clientId,
      input: {
        websiteId,
        updateRequest: {
          type: parsed.data.type,
          description: parsed.data.description,
          priority: parsed.data.priority,
          attachmentUrls: parsed.data.attachmentUrls ?? [],
        },
      },
    },
  });

  try {
    const queue = await getQueue("BUILDER");
    await queue.add("update-request", { jobId: job.id }, { jobId: job.id });
  } catch {
    // Queue add is best-effort; job is already in DB
  }

  return c.json(
    {
      success: true,
      message: "Update request submitted. Our AI will process it shortly.",
      data: {
        jobId: job.id,
        websiteId: website.id,
        domain: website.domain,
        type: parsed.data.type,
      },
    },
    201
  );
});

export default app;
