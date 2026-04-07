import { Hono } from "hono";
import { prisma } from "@madecreative/db";
import { WebsiteUpdateRequestSchema } from "@madecreative/shared";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// GET /portal/websites
app.get("/", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const websites = await prisma.clientWebsite.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ success: true, data: websites });
});

// GET /portal/websites/:id
app.get("/:id", async (c) => {
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

  // Create a support ticket for the update request
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { companyName: true },
  });

  const ticket = await prisma.supportTicket.create({
    data: {
      clientId,
      subject: `Website Update Request: ${parsed.data.type} - ${website.name}`,
      message: `Type: ${parsed.data.type}\nPriority: ${parsed.data.priority}\nWebsite: ${website.name} (${website.domain ?? "No domain"})\n\nDescription:\n${parsed.data.description}${
        parsed.data.attachmentUrls
          ? `\n\nAttachments:\n${parsed.data.attachmentUrls.join("\n")}`
          : ""
      }`,
      type: "website",
      priority: parsed.data.priority,
    },
  });

  return c.json(
    {
      success: true,
      message: `Update request submitted for ${website.name}. Our team will review it shortly.`,
      data: {
        ticketId: ticket.id,
        websiteId: website.id,
        websiteName: website.name,
        companyName: client?.companyName,
      },
    },
    201
  );
});

export default app;
