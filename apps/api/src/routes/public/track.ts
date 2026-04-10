import { Hono } from "hono";

const app = new Hono();

// ─── 1×1 GIF pixel (base64) ───────────────────────────────────────────────────
// Standard transparent 1×1 GIF
const PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

// ─── GET /track/open/:emailId ─────────────────────────────────────────────────

/**
 * Returns a 1×1 transparent GIF and records the open event.
 * Designed to be embedded as an invisible tracking pixel in HTML email.
 */
app.get("/open/:emailId", async (c) => {
  const emailId = c.req.param("emailId");

  // Always return the pixel immediately — don't block on DB write
  void recordOpen(emailId).catch((err) => {
    console.error("[Track/Open] Error recording open:", err);
  });

  return new Response(PIXEL_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
});

// ─── GET /track/click/:emailId ────────────────────────────────────────────────

/**
 * Records the click event and redirects the user to the target URL.
 * URL is passed as a query param: ?url=[encoded_url]
 */
app.get("/click/:emailId", async (c) => {
  const emailId = c.req.param("emailId");
  const encodedUrl = c.req.query("url");

  if (!encodedUrl) {
    return c.json({ error: "Missing url parameter" }, 400);
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(encodedUrl);
    // Basic URL validation
    new URL(targetUrl);
  } catch {
    return c.json({ error: "Invalid url parameter" }, 400);
  }

  // Record click asynchronously
  void recordClick(emailId).catch((err) => {
    console.error("[Track/Click] Error recording click:", err);
  });

  return c.redirect(targetUrl, 302);
});

// ─── Helper functions ─────────────────────────────────────────────────────────

async function recordOpen(emailId: string): Promise<void> {
  const { prisma } = await import("@madecreative/db");
  // Find email and skip if already opened
  const existing = await prisma.outreachEmail.findUnique({
    where: { id: emailId },
    select: { openedAt: true, status: true },
  });

  if (!existing) return;
  if (existing.openedAt) return; // Already recorded

  await prisma.outreachEmail.update({
    where: { id: emailId },
    data: {
      openedAt: new Date(),
      // Only upgrade status if currently 'sent'
      status: existing.status === "sent" ? "opened" : existing.status,
    },
  });

  console.log(`[Track/Open] Email ${emailId} opened`);
}

async function recordClick(emailId: string): Promise<void> {
  const { prisma } = await import("@madecreative/db");
  const existing = await prisma.outreachEmail.findUnique({
    where: { id: emailId },
    select: { clickedAt: true, openedAt: true, status: true },
  });

  if (!existing) return;

  const now = new Date();

  await prisma.outreachEmail.update({
    where: { id: emailId },
    data: {
      clickedAt: existing.clickedAt ?? now,
      openedAt: existing.openedAt ?? now, // clicking implies opening
      status: "clicked",
    },
  });

  console.log(`[Track/Click] Email ${emailId} clicked`);
}

export default app;
