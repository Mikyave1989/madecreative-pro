import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "@madecreative/db";
import type { JwtPayload } from "@madecreative/shared";
import { Queue } from "bullmq";
import { Redis as IORedis } from "ioredis";

const app = new Hono();

// ─── GET /portal/editor — load current page content ──────────────────────────

app.get("/", async (c) => {
  const payload = c.get("jwtPayload") as JwtPayload;

  const website = await prisma.clientWebsite.findUnique({
    where: { clientId: payload.sub },
    select: { id: true, domain: true, pages: true, designTokens: true, deployUrl: true },
  });

  if (!website) {
    return c.json({ success: false, error: "Website not found" }, 404);
  }

  return c.json({ success: true, data: website });
});

// ─── PATCH /portal/editor/pages — update editable page content ───────────────

const UpdatePagesSchema = z.object({
  pages: z.array(z.object({
    slug: z.string(),
    sections: z.array(z.object({
      type: z.string(),
      content: z.record(z.unknown()),
      order: z.number(),
    })),
  })),
});

app.patch(
  "/pages",
  zValidator("json", UpdatePagesSchema),
  async (c) => {
    const payload = c.get("jwtPayload") as JwtPayload;
    const { pages } = c.req.valid("json");

    const website = await prisma.clientWebsite.findUnique({
      where: { clientId: payload.sub },
    });

    if (!website) {
      return c.json({ success: false, error: "Website not found" }, 404);
    }

    // Merge: only update sections that are editable (hero, about, services, contact, hours)
    // The layout, colors, and font structure remain unchanged
    const EDITABLE_SECTION_TYPES = [
      "hero", "about", "services", "contact", "hours", "gallery",
    ];

    const currentPages = website.pages as Array<{
      slug: string;
      title: string;
      sections: Array<{ type: string; content: Record<string, unknown>; order: number }>;
    }>;

    const updatedPages = currentPages.map((currentPage) => {
      const incomingPage = pages.find((p) => p.slug === currentPage.slug);
      if (!incomingPage) return currentPage;

      const updatedSections = currentPage.sections.map((section) => {
        if (!EDITABLE_SECTION_TYPES.includes(section.type)) return section;

        const incomingSection = incomingPage.sections.find(
          (s) => s.type === section.type
        );
        if (!incomingSection) return section;

        // Only allow updating specific content fields (not layout/design)
        const EDITABLE_FIELDS = [
          "headline", "subheadline", "description", "text",
          "phone", "email", "address",
          "openingHours", "mondayHours", "tuesdayHours", "wednesdayHours",
          "thursdayHours", "fridayHours", "saturdayHours", "sundayHours",
          "imageUrl", "photoUrl", "items",
        ];

        const filteredContent: Record<string, unknown> = { ...section.content };
        for (const field of EDITABLE_FIELDS) {
          if (field in incomingSection.content) {
            filteredContent[field] = incomingSection.content[field];
          }
        }

        return { ...section, content: filteredContent };
      });

      return { ...currentPage, sections: updatedSections };
    });

    await prisma.clientWebsite.update({
      where: { id: website.id },
      data: { pages: updatedPages },
    });

    return c.json({ success: true, data: { saved: true } });
  }
);

// ─── POST /portal/editor/rebuild — trigger site rebuild ──────────────────────

app.post("/rebuild", async (c) => {
  const payload = c.get("jwtPayload") as JwtPayload;

  const website = await prisma.clientWebsite.findUnique({
    where: { clientId: payload.sub },
    select: { id: true, domain: true },
  });

  if (!website) {
    return c.json({ success: false, error: "Website not found" }, 404);
  }

  // Queue a BUILDER job to re-deploy with updated content
  const redisUrl = process.env["REDIS_URL"];
  if (!redisUrl) {
    return c.json({ success: false, error: "Queue unavailable" }, 503);
  }

  const redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  const builderQueue = new Queue("builder-queue", { connection: redis });

  // Create agent job record
  const job = await prisma.agentJob.create({
    data: {
      agentType: "BUILDER",
      status: "QUEUED",
      input: {
        clientId: payload.sub,
        websiteId: website.id,
        rebuild: true,
      },
      clientId: payload.sub,
    },
  });

  await builderQueue.add("rebuild", {
    jobId: job.id,
    input: { clientId: payload.sub, websiteId: website.id, rebuild: true },
  });

  await redis.quit();

  return c.json({
    success: true,
    data: {
      jobId: job.id,
      message: "Rebuild avviato — sito live in circa 2 minuti",
      estimatedMinutes: 2,
    },
  });
});

// ─── POST /portal/editor/upload — upload a photo ─────────────────────────────

app.post("/upload", async (c) => {
  const payload = c.get("jwtPayload") as JwtPayload;

  const client = await prisma.client.findUnique({
    where: { id: payload.sub },
    select: { id: true },
  });

  if (!client) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || typeof file === "string") {
    return c.json({ success: false, error: "No file provided" }, 400);
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ success: false, error: "Only JPEG, PNG, WEBP allowed" }, 400);
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return c.json({ success: false, error: "File too large (max 10MB)" }, 400);
  }

  // Upload to R2
  const R2_ENDPOINT = process.env["CLOUDFLARE_R2_ENDPOINT"];
  const R2_ACCESS_KEY = process.env["CLOUDFLARE_R2_ACCESS_KEY"];
  const R2_SECRET_KEY = process.env["CLOUDFLARE_R2_SECRET_KEY"];
  const R2_BUCKET = process.env["CLOUDFLARE_R2_BUCKET"] ?? "madecreative-assets";

  if (!R2_ENDPOINT || !R2_ACCESS_KEY || !R2_SECRET_KEY) {
    return c.json({ success: false, error: "Storage not configured" }, 503);
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `clients/${client.id}/photos/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const uploadRes = await fetch(`${R2_ENDPOINT}/${R2_BUCKET}/${key}`, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      "Content-Length": String(file.size),
    },
    body: arrayBuffer,
  });

  if (!uploadRes.ok) {
    return c.json({ success: false, error: "Upload failed" }, 500);
  }

  const ASSETS_URL = process.env["ASSETS_URL"] ?? `${R2_ENDPOINT}/${R2_BUCKET}`;
  const publicUrl = `${ASSETS_URL}/${key}`;

  return c.json({ success: true, data: { url: publicUrl } });
});

export default app;
