import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@madecreative/db";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const UpdatePostSchema = z.object({
  status: z.enum(["approved", "draft", "rejected"]).optional(),
  caption: z.string().min(1).max(2000).optional(),
  scheduledFor: z.string().datetime().optional(),
});

// ─── GET /portal/social/posts ─────────────────────────────────────────────────

app.get("/posts", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const query = c.req.query();
  const status = query["status"];
  const limit = Math.min(50, parseInt(query["limit"] ?? "20", 10));

  const where: {
    clientId: string;
    status?: { in: string[] } | string;
    scheduledFor?: { gte: Date };
  } = { clientId };

  if (status) {
    where.status = status;
  } else {
    where.status = { in: ["draft", "scheduled", "approved", "published"] };
  }

  const posts = await prisma.clientSocialPost.findMany({
    where,
    orderBy: { scheduledFor: "asc" },
    take: limit,
    select: {
      id: true,
      platform: true,
      type: true,
      caption: true,
      hashtags: true,
      mediaUrls: true,
      language: true,
      status: true,
      scheduledFor: true,
      approvedAt: true,
      publishedAt: true,
      igMediaId: true,
      fbPostId: true,
      likes: true,
      comments: true,
      reach: true,
      isCustom: true,
      createdAt: true,
    },
  });

  return c.json({ success: true, data: posts });
});

// ─── PATCH /portal/social/posts/:id ──────────────────────────────────────────

app.patch("/posts/:id", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const post = await prisma.clientSocialPost.findFirst({
    where: { id, clientId },
  });

  if (!post) {
    return c.json({ success: false, error: "Post not found" }, 404);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = UpdatePostSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      400
    );
  }

  const updateData: {
    status?: string;
    caption?: string;
    scheduledFor?: Date;
    approvedAt?: Date | null;
  } = {};

  if (parsed.data.status !== undefined) {
    updateData.status = parsed.data.status;
    if (parsed.data.status === "approved") {
      updateData.approvedAt = new Date();
    }
  }

  if (parsed.data.caption !== undefined) {
    updateData.caption = parsed.data.caption;
  }

  if (parsed.data.scheduledFor !== undefined) {
    updateData.scheduledFor = new Date(parsed.data.scheduledFor);
  }

  const updated = await prisma.clientSocialPost.update({
    where: { id },
    data: updateData,
  });

  return c.json({ success: true, data: updated });
});

// ─── POST /portal/social/connect ─────────────────────────────────────────────
// Initiates Meta OAuth flow — returns auth URL

app.post("/connect", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const body = await c.req.json().catch(() => ({}));
  const platform = (body as { platform?: string }).platform ?? "instagram";

  const metaAppId = process.env["META_APP_ID"];

  if (!metaAppId) {
    // Graceful fallback when Meta credentials are not configured
    return c.json(
      {
        success: false,
        error:
          "Integrazione Meta non configurata. Contatta il supporto per abilitare la connessione social.",
      },
      503
    );
  }

  const redirectUri = encodeURIComponent(
    `${process.env["API_URL"] ?? "https://api.madecreative.pro"}/portal/social/callback`
  );

  const scopes =
    platform === "instagram"
      ? "instagram_basic,instagram_content_publish,pages_show_list"
      : "pages_manage_posts,pages_read_engagement,pages_show_list";

  const state = Buffer.from(
    JSON.stringify({ clientId, platform })
  ).toString("base64url");

  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}&response_type=code`;

  return c.json({ success: true, data: { authUrl } });
});

// ─── GET /portal/social/callback ─────────────────────────────────────────────
// Meta OAuth callback — exchanges code for token and stores it

app.get("/callback", async (c) => {
  const query = c.req.query();
  const code = query["code"];
  const state = query["state"];
  const error = query["error"];

  if (error) {
    const portalUrl =
      process.env["PORTAL_URL"] ?? "https://app.madecreative.pro";
    return c.redirect(`${portalUrl}/social?error=oauth_denied`);
  }

  if (!code || !state) {
    return c.json({ success: false, error: "Missing code or state" }, 400);
  }

  let stateData: { clientId: string; platform: string };
  try {
    stateData = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8")
    ) as { clientId: string; platform: string };
  } catch {
    return c.json({ success: false, error: "Invalid state" }, 400);
  }

  const metaAppId = process.env["META_APP_ID"];
  const metaAppSecret = process.env["META_APP_SECRET"];

  if (!metaAppId || !metaAppSecret) {
    return c.json(
      { success: false, error: "Meta credentials not configured" },
      503
    );
  }

  // Exchange code for access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${metaAppId}&client_secret=${metaAppSecret}&redirect_uri=${encodeURIComponent(`${process.env["API_URL"] ?? "https://api.madecreative.pro"}/portal/social/callback`)}&code=${code}`
  );

  if (!tokenRes.ok) {
    return c.json({ success: false, error: "Token exchange failed" }, 500);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    token_type: string;
  };

  if (stateData.platform === "instagram") {
    // Get IG account ID from the page
    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenData.access_token}`
    );
    const accounts = (await accountsRes.json()) as {
      data: Array<{ id: string; access_token: string }>;
    };
    const page = accounts.data[0];

    if (page) {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = (await igRes.json()) as {
        instagram_business_account?: { id: string };
      };

      await prisma.client.update({
        where: { id: stateData.clientId },
        data: {
          igAccessToken: page.access_token,
          igAccountId: igData.instagram_business_account?.id ?? null,
          socialPostingEnabled: true,
        },
      });
    }
  } else {
    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenData.access_token}`
    );
    const accounts = (await accountsRes.json()) as {
      data: Array<{ id: string; access_token: string }>;
    };
    const page = accounts.data[0];

    if (page) {
      await prisma.client.update({
        where: { id: stateData.clientId },
        data: {
          fbPageId: page.id,
          fbPageAccessToken: page.access_token,
          socialPostingEnabled: true,
        },
      });
    }
  }

  const portalUrl =
    process.env["PORTAL_URL"] ?? "https://app.madecreative.pro";
  return c.redirect(`${portalUrl}/social?connected=true`);
});

// ─── GET /portal/social/stats ─────────────────────────────────────────────────

app.get("/stats", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      igAccountId: true,
      fbPageId: true,
      socialPostingEnabled: true,
      socialAutoPublish: true,
    },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  const [thisMonthPosts, publishedPosts] = await Promise.all([
    prisma.clientSocialPost.count({
      where: { clientId, createdAt: { gte: startOfMonth } },
    }),
    prisma.clientSocialPost.aggregate({
      where: {
        clientId,
        status: "published",
        publishedAt: { gte: startOfMonth },
      },
      _sum: { reach: true, likes: true, comments: true },
      _count: { id: true },
    }),
  ]);

  const totalEngagement =
    (publishedPosts._sum.likes ?? 0) + (publishedPosts._sum.comments ?? 0);
  const totalReach = publishedPosts._sum.reach ?? 0;
  const engagementRate =
    totalReach > 0
      ? Math.round((totalEngagement / totalReach) * 1000) / 10
      : 0;

  return c.json({
    success: true,
    data: {
      connected: {
        instagram: !!client.igAccountId,
        facebook: !!client.fbPageId,
        socialPostingEnabled: client.socialPostingEnabled,
        socialAutoPublish: client.socialAutoPublish,
      },
      stats: {
        postsThisMonth: thisMonthPosts,
        publishedThisMonth: publishedPosts._count.id,
        totalReach,
        totalEngagement,
        engagementRate,
        followerGrowth: 0, // Requires Meta API polling
      },
    },
  });
});

// ─── PATCH /portal/social/settings ───────────────────────────────────────────

app.patch("/settings", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const body = await c.req.json().catch(() => ({}));
  const schema = z.object({
    socialAutoPublish: z.boolean().optional(),
    socialPostingEnabled: z.boolean().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      400
    );
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { plan: true },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  // Auto-publish toggle is only configurable on ENTERPRISE
  if (
    parsed.data.socialAutoPublish !== undefined &&
    client.plan !== "ENTERPRISE"
  ) {
    return c.json(
      {
        success: false,
        error:
          "Il controllo dell'auto-pubblicazione richiede il piano ENTERPRISE",
      },
      403
    );
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      ...(parsed.data.socialAutoPublish !== undefined
        ? { socialAutoPublish: parsed.data.socialAutoPublish }
        : {}),
      ...(parsed.data.socialPostingEnabled !== undefined
        ? { socialPostingEnabled: parsed.data.socialPostingEnabled }
        : {}),
    },
    select: {
      socialAutoPublish: true,
      socialPostingEnabled: true,
    },
  });

  return c.json({ success: true, data: updated });
});

export default app;
