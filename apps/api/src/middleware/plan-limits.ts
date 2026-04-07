import type { Context, Next } from "hono";
import { prisma } from "@madecreative/db";
import { PLANS } from "@madecreative/shared";
import type { JwtPayload } from "@madecreative/shared";

type Variables = {
  jwtPayload: JwtPayload;
};

type LimitResource =
  | "websites"
  | "automations"
  | "chatbots"
  | "leads"
  | "socialPosts";

export function checkPlanLimit(resource: LimitResource) {
  return async (
    c: Context<{ Variables: Variables }>,
    next: Next
  ): Promise<Response | void> => {
    const payload = c.get("jwtPayload");
    if (!payload || payload.type !== "client") {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const client = await prisma.client.findUnique({
      where: { id: payload.sub },
      include: {
        _count: {
          select: {
            websites: true,
            automations: true,
            chatbots: true,
            leads: true,
            socialPosts: true,
          },
        },
      },
    });

    if (!client) {
      return c.json({ success: false, error: "Client not found" }, 404);
    }

    const planConfig = PLANS[client.plan];
    if (!planConfig) {
      return c.json({ success: false, error: "Invalid plan configuration" }, 500);
    }

    const limits = planConfig.limits;
    const counts = client._count;

    let isExceeded = false;
    let limitMessage = "";

    switch (resource) {
      case "websites":
        if (counts.websites >= limits.maxWebsites) {
          isExceeded = true;
          limitMessage = `Your ${client.plan} plan allows a maximum of ${limits.maxWebsites} website(s). Please upgrade to add more.`;
        }
        break;
      case "automations":
        if (counts.automations >= limits.maxAutomations) {
          isExceeded = true;
          limitMessage = `Your ${client.plan} plan allows a maximum of ${limits.maxAutomations} automation(s). Please upgrade to add more.`;
        }
        break;
      case "chatbots":
        if (counts.chatbots >= limits.maxChatbots) {
          isExceeded = true;
          limitMessage = `Your ${client.plan} plan allows a maximum of ${limits.maxChatbots} chatbot(s). Please upgrade to add more.`;
        }
        break;
      case "leads": {
        // Check monthly leads
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyLeads = await prisma.clientLead.count({
          where: {
            clientId: client.id,
            createdAt: { gte: startOfMonth },
          },
        });

        if (monthlyLeads >= limits.maxLeadsPerMonth) {
          isExceeded = true;
          limitMessage = `Your ${client.plan} plan allows a maximum of ${limits.maxLeadsPerMonth} leads per month. Please upgrade for more capacity.`;
        }
        break;
      }
      case "socialPosts": {
        // Check monthly posts
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyPosts = await prisma.clientSocialPost.count({
          where: {
            clientId: client.id,
            createdAt: { gte: startOfMonth },
          },
        });

        if (monthlyPosts >= limits.maxSocialPostsPerMonth) {
          isExceeded = true;
          limitMessage = `Your ${client.plan} plan allows a maximum of ${limits.maxSocialPostsPerMonth} social posts per month. Please upgrade for more.`;
        }
        break;
      }
    }

    if (isExceeded) {
      return c.json(
        {
          success: false,
          error: "Plan limit exceeded",
          message: limitMessage,
          upgradeUrl: `${process.env["PORTAL_URL"]}/billing/upgrade`,
        },
        403
      );
    }

    await next();
  };
}
