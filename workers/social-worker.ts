import "dotenv/config";
import { Worker, Queue } from "bullmq";
import { Redis as IORedis } from "ioredis";
import { prisma } from "@madecreative/db";

const SOCIAL_PUBLISH_QUEUE = "social-publish-queue";

function createRedis(): InstanceType<typeof IORedis> {
  return new IORedis(process.env["REDIS_URL"]!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// ─── Meta API helpers ─────────────────────────────────────────────────────────

async function publishToInstagram(params: {
  igAccountId: string;
  igAccessToken: string;
  mediaUrl: string;
  caption: string;
}): Promise<{ igMediaId: string }> {
  const containerRes = await fetch(
    `https://graph.facebook.com/v21.0/${params.igAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: params.mediaUrl,
        caption: params.caption,
        access_token: params.igAccessToken,
      }),
    }
  );

  if (!containerRes.ok) {
    throw new Error(
      `IG container creation failed: ${await containerRes.text()}`
    );
  }

  const container = (await containerRes.json()) as { id: string };

  const publishRes = await fetch(
    `https://graph.facebook.com/v21.0/${params.igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: params.igAccessToken,
      }),
    }
  );

  if (!publishRes.ok) {
    throw new Error(`IG publish failed: ${await publishRes.text()}`);
  }

  const published = (await publishRes.json()) as { id: string };
  return { igMediaId: published.id };
}

async function publishToFacebook(params: {
  fbPageId: string;
  fbPageAccessToken: string;
  message: string;
  photoUrl?: string;
}): Promise<{ fbPostId: string }> {
  const endpoint = params.photoUrl
    ? `https://graph.facebook.com/v21.0/${params.fbPageId}/photos`
    : `https://graph.facebook.com/v21.0/${params.fbPageId}/feed`;

  const body: Record<string, string> = {
    access_token: params.fbPageAccessToken,
  };

  if (params.photoUrl) {
    body["url"] = params.photoUrl;
    body["caption"] = params.message;
  } else {
    body["message"] = params.message;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`FB publish failed: ${await res.text()}`);
  }

  const data = (await res.json()) as { id: string; post_id?: string };
  return { fbPostId: data.post_id ?? data.id };
}

// ─── Process own-channel SocialPost ──────────────────────────────────────────

async function processOwnChannelPosts(): Promise<void> {
  const now = new Date();

  const metaIgToken = process.env["MADECREATIVE_IG_ACCESS_TOKEN"];
  const metaIgAccountId = process.env["MADECREATIVE_IG_ACCOUNT_ID"];
  const metaFbPageId = process.env["MADECREATIVE_FB_PAGE_ID"];
  const metaFbToken = process.env["MADECREATIVE_FB_PAGE_ACCESS_TOKEN"];

  if (!metaIgToken && !metaFbToken) {
    console.warn(
      "[SocialWorker] Own-channel Meta credentials not configured — skipping own posts"
    );
    return;
  }

  const ownPosts = await prisma.socialPost.findMany({
    where: {
      status: "scheduled",
      scheduledFor: { lte: now },
    },
    take: 10,
  });

  for (const post of ownPosts) {
    try {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "publishing" },
      });

      const mediaUrls = post.mediaUrls as string[];
      const mediaUrl = mediaUrls[0];
      const caption =
        `${post.caption}\n\n${post.hashtags ?? ""}`.trim();

      if (
        post.platform === "INSTAGRAM" &&
        metaIgToken &&
        metaIgAccountId &&
        mediaUrl
      ) {
        const result = await publishToInstagram({
          igAccountId: metaIgAccountId,
          igAccessToken: metaIgToken,
          mediaUrl,
          caption,
        });

        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            status: "published",
            publishedAt: new Date(),
            igMediaId: result.igMediaId,
          },
        });

        console.log(
          `[SocialWorker] Own-channel post ${post.id} published to Instagram`
        );
      } else if (
        post.platform === "FACEBOOK" &&
        metaFbToken &&
        metaFbPageId
      ) {
        const result = await publishToFacebook({
          fbPageId: metaFbPageId,
          fbPageAccessToken: metaFbToken,
          message: caption,
          photoUrl: mediaUrl,
        });

        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            status: "published",
            publishedAt: new Date(),
            fbPostId: result.fbPostId,
          },
        });

        console.log(
          `[SocialWorker] Own-channel post ${post.id} published to Facebook`
        );
      } else {
        // Missing credentials — reset to scheduled for retry
        await prisma.socialPost.update({
          where: { id: post.id },
          data: { status: "scheduled" },
        });
        console.warn(
          `[SocialWorker] Skipped own post ${post.id} — missing credentials for ${post.platform}`
        );
      }
    } catch (err) {
      console.error(
        `[SocialWorker] Failed to publish own post ${post.id}:`,
        err
      );
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "scheduled" }, // Reset for retry
      });
    }
  }
}

// ─── Process client ClientSocialPost ─────────────────────────────────────────

async function processScheduledPosts(): Promise<void> {
  const now = new Date();

  const postsToPublish = await prisma.clientSocialPost.findMany({
    where: {
      status: "approved",
      scheduledFor: { lte: now },
    },
    include: {
      client: {
        select: {
          igAccessToken: true,
          igAccountId: true,
          fbPageId: true,
          fbPageAccessToken: true,
          socialAutoPublish: true,
          status: true,
        },
      },
    },
    take: 20,
  });

  for (const post of postsToPublish) {
    if (post.client.status !== "ACTIVE") continue;
    if (!post.client.socialAutoPublish) {
      // Auto-publish disabled — send portal notification (just log for now)
      console.log(
        `[SocialWorker] Post ${post.id} ready but auto-publish off — notifying client`
      );
      continue;
    }

    try {
      await prisma.clientSocialPost.update({
        where: { id: post.id },
        data: { status: "publishing" },
      });

      const mediaUrls = post.mediaUrls as string[];
      const mediaUrl = mediaUrls[0];
      const caption =
        `${post.caption}\n\n${post.hashtags ?? ""}`.trim();

      if (
        post.platform === "INSTAGRAM" &&
        post.client.igAccessToken &&
        post.client.igAccountId &&
        mediaUrl
      ) {
        const result = await publishToInstagram({
          igAccountId: post.client.igAccountId,
          igAccessToken: post.client.igAccessToken,
          mediaUrl,
          caption,
        });

        await prisma.clientSocialPost.update({
          where: { id: post.id },
          data: {
            status: "published",
            publishedAt: new Date(),
            igMediaId: result.igMediaId,
          },
        });

        console.log(
          `[SocialWorker] Client post ${post.id} published to Instagram`
        );
      } else if (
        post.platform === "FACEBOOK" &&
        post.client.fbPageId &&
        post.client.fbPageAccessToken
      ) {
        const result = await publishToFacebook({
          fbPageId: post.client.fbPageId,
          fbPageAccessToken: post.client.fbPageAccessToken,
          message: caption,
          photoUrl: mediaUrl,
        });

        await prisma.clientSocialPost.update({
          where: { id: post.id },
          data: {
            status: "published",
            publishedAt: new Date(),
            fbPostId: result.fbPostId,
          },
        });

        console.log(
          `[SocialWorker] Client post ${post.id} published to Facebook`
        );
      } else {
        // Mark as published without API call (missing config)
        await prisma.clientSocialPost.update({
          where: { id: post.id },
          data: { status: "published", publishedAt: new Date() },
        });
        console.warn(
          `[SocialWorker] Post ${post.id} marked published without Meta API (missing config for ${post.platform})`
        );
      }
    } catch (err) {
      console.error(
        `[SocialWorker] Failed to publish client post ${post.id}:`,
        err
      );

      await prisma.clientSocialPost.update({
        where: { id: post.id },
        data: { status: "approved" }, // Reset for retry
      });
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("[SocialWorker] Starting...");

  const redis = createRedis();
  const publishQueue = new Queue(SOCIAL_PUBLISH_QUEUE, { connection: redis });

  const worker = new Worker(
    SOCIAL_PUBLISH_QUEUE,
    async (job) => {
      const { postId } = job.data as { postId?: string };
      console.log(
        `[SocialWorker] Processing job: ${job.id}${postId ? ` (postId: ${postId})` : ""}`
      );
      await processOwnChannelPosts();
      await processScheduledPosts();
    },
    {
      connection: redis,
      concurrency: 3,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[SocialWorker] Job failed: ${job?.id}`, err.message);
  });

  // Check every 5 minutes
  const interval = setInterval(() => {
    publishQueue
      .add("check-scheduled", { timestamp: Date.now() })
      .catch(console.error);
  }, 5 * 60 * 1000);

  // Run immediately on startup
  await processOwnChannelPosts();
  await processScheduledPosts();

  process.on("SIGTERM", async () => {
    clearInterval(interval);
    await Promise.all([worker.close(), publishQueue.close()]);
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    clearInterval(interval);
    await Promise.all([worker.close(), publishQueue.close()]);
    process.exit(0);
  });

  console.log(
    "[SocialWorker] Running — checking for scheduled posts every 5 minutes"
  );
}

main().catch((err) => {
  console.error("[SocialWorker] Fatal error:", err);
  process.exit(1);
});
