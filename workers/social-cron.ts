/**
 * social-cron.ts
 * Simple cron job — posts on our own Instagram/Facebook 3x/week.
 * Monday: screenshot of generated site (device mockup)
 * Wednesday: stat from DB (template HTML → screenshot)
 * Friday: tip for SMBs (carousel)
 *
 * NOT an AI agent. Just a cron that generates content and publishes via Meta API.
 */

import "dotenv/config";
import cron from "node-cron";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@madecreative/db";

const anthropic = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

// ─── Meta API helpers ─────────────────────────────────────────────────────────

async function publishToInstagram(params: {
  mediaUrl: string;
  caption: string;
}): Promise<void> {
  const igAccountId = process.env["META_INSTAGRAM_ACCOUNT_ID"];
  const accessToken = process.env["META_PAGE_ACCESS_TOKEN"];

  if (!igAccountId || !accessToken) {
    console.warn("[SocialCron] Meta credentials not configured — skipping");
    return;
  }

  // Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v21.0/${igAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: params.mediaUrl,
        caption: params.caption,
        access_token: accessToken,
      }),
    }
  );

  if (!containerRes.ok) {
    throw new Error(`IG container failed: ${await containerRes.text()}`);
  }

  const container = (await containerRes.json()) as { id: string };

  // Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: accessToken,
      }),
    }
  );

  if (!publishRes.ok) {
    throw new Error(`IG publish failed: ${await publishRes.text()}`);
  }

  console.log("[SocialCron] Published to Instagram:", container.id);
}

// ─── Caption generation ───────────────────────────────────────────────────────

async function generateCaption(
  type: "showcase" | "stat" | "tip",
  context: Record<string, unknown>
): Promise<string> {
  const prompts = {
    showcase: `Write a short Instagram caption (max 150 chars) in Italian for a digital agency showcasing a new client website.
Context: ${JSON.stringify(context)}
Style: enthusiastic, emoji, hashtags at the end.`,

    stat: `Write a short Instagram caption (max 150 chars) in Italian for a digital agency showing an impressive statistic.
Context: ${JSON.stringify(context)}
Style: punchy, one key number prominent, 3 hashtags.`,

    tip: `Write a short Instagram caption (max 150 chars) in Italian with a practical tip for small business owners about digital marketing.
Context: ${JSON.stringify(context)}
Style: helpful, actionable, emoji, 5 hashtags at the end.`,
  };

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompts[type] }],
  });

  const content = response.content[0];
  return content.type === "text" ? content.text : "";
}

// ─── Monday: Showcase post ────────────────────────────────────────────────────

async function runShowcasePost(): Promise<void> {
  console.log("[SocialCron] Running showcase post (Monday)");

  // Get a recently launched client site
  const recentClient = await prisma.client.findFirst({
    where: { status: "ACTIVE" },
    include: { website: true },
    orderBy: { createdAt: "desc" },
  });

  if (!recentClient?.website?.deployUrl) {
    console.warn("[SocialCron] No recent client site to showcase");
    return;
  }

  const caption = await generateCaption("showcase", {
    sector: recentClient.sector,
    country: recentClient.country,
  });

  // Use deploy URL as media (in production: use Playwright screenshot stored in R2)
  const mediaUrl = `${process.env["ASSETS_URL"] ?? "https://assets.madecreative.pro"}/social/showcase-placeholder.jpg`;

  await publishToInstagram({ mediaUrl, caption });
}

// ─── Wednesday: Stat post ─────────────────────────────────────────────────────

async function runStatPost(): Promise<void> {
  console.log("[SocialCron] Running stat post (Wednesday)");

  const [activeClients, totalProspects, convertedProspects] = await Promise.all([
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.prospect.count(),
    prisma.prospect.count({ where: { status: "CONVERTED" } }),
  ]);

  const conversionRate =
    totalProspects > 0
      ? Math.round((convertedProspects / totalProspects) * 100)
      : 0;

  const caption = await generateCaption("stat", {
    activeClients,
    conversionRate,
    totalProspects,
  });

  const mediaUrl = `${process.env["ASSETS_URL"] ?? "https://assets.madecreative.pro"}/social/stat-placeholder.jpg`;
  await publishToInstagram({ mediaUrl, caption });
}

// ─── Friday: Tip post ─────────────────────────────────────────────────────────

async function runTipPost(): Promise<void> {
  console.log("[SocialCron] Running tip post (Friday)");

  const topics = ["SEO", "chatbot", "automazioni", "email", "sito web"];
  const topic = topics[Math.floor(Math.random() * topics.length)];

  const caption = await generateCaption("tip", { topic });

  const mediaUrl = `${process.env["ASSETS_URL"] ?? "https://assets.madecreative.pro"}/social/tip-placeholder.jpg`;
  await publishToInstagram({ mediaUrl, caption });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("[SocialCron] Starting...");

  // Monday 10:00 — showcase
  cron.schedule("0 10 * * 1", () => {
    runShowcasePost().catch(console.error);
  });

  // Wednesday 10:00 — stat
  cron.schedule("0 10 * * 3", () => {
    runStatPost().catch(console.error);
  });

  // Friday 10:00 — tip
  cron.schedule("0 10 * * 5", () => {
    runTipPost().catch(console.error);
  });

  // Manual trigger via env var
  if (process.env["POST_NOW"] === "showcase") await runShowcasePost();
  if (process.env["POST_NOW"] === "stat") await runStatPost();
  if (process.env["POST_NOW"] === "tip") await runTipPost();

  console.log("[SocialCron] Scheduled: Mon/Wed/Fri at 10:00 CET");

  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));

  // Keep alive
  setInterval(() => {}, 60_000);
}

main().catch((err) => {
  console.error("[SocialCron] Fatal error:", err);
  process.exit(1);
});
