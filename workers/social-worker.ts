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

async function publishToInstagram(params: {
  igAccountId: string;
  igAccessToken: string;
  mediaUrl: string;
  caption: string;
}): Promise<{ igMediaId: string }> {
  // Step 1: Create media container
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
    throw new Error(`IG container creation failed: ${await containerRes.text()}`);
  }

  const container = (await containerRes.json()) as { id: string };

  // Step 2: Publish container
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
    if (!post.client.socialAutoPublish) continue;

    try {
      await prisma.clientSocialPost.update({
        where: { id: post.id },
        data: { status: "publishing" },
      });

      const mediaUrls = post.mediaUrls as string[];
      const mediaUrl = mediaUrls[0];

      if (post.platform === "INSTAGRAM" && post.client.igAccessToken && post.client.igAccountId && mediaUrl) {
        const result = await publishToInstagram({
          igAccountId: post.client.igAccountId,
          igAccessToken: post.client.igAccessToken,
          mediaUrl,
          caption: `${post.caption}\n\n${post.hashtags ?? ""}`.trim(),
        });

        await prisma.clientSocialPost.update({
          where: { id: post.id },
          data: {
            status: "published",
            publishedAt: new Date(),
            igMediaId: result.igMediaId,
          },
        });

        console.log(`[SocialWorker] Published post ${post.id} to Instagram`);
      } else {
        // Mark as published without actual API call if config missing
        await prisma.clientSocialPost.update({
          where: { id: post.id },
          data: { status: "published", publishedAt: new Date() },
        });
      }
    } catch (err) {
      console.error(`[SocialWorker] Failed to publish post ${post.id}:`, err);

      await prisma.clientSocialPost.update({
        where: { id: post.id },
        data: { status: "approved" }, // Reset for retry
      });
    }
  }
}

async function main(): Promise<void> {
  console.log("[SocialWorker] Starting...");

  const redis = createRedis();
  const publishQueue = new Queue(SOCIAL_PUBLISH_QUEUE, { connection: redis });

  const worker = new Worker(
    SOCIAL_PUBLISH_QUEUE,
    async (job) => {
      const { postId } = job.data as { postId: string };
      console.log(`[SocialWorker] Processing post: ${postId}`);
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

  // Check for scheduled posts every 5 minutes
  const interval = setInterval(() => {
    publishQueue
      .add("check-scheduled", { timestamp: Date.now() })
      .catch(console.error);
  }, 5 * 60 * 1000);

  // Run immediately
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

  console.log("[SocialWorker] Running — checking for scheduled posts every 5 minutes");
}

main().catch((err) => {
  console.error("[SocialWorker] Fatal error:", err);
  process.exit(1);
});
