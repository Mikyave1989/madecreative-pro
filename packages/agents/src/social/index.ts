import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";
import { BaseAgent, type AgentContext } from "../base-agent.js";
import type { AgentResult } from "@madecreative/shared";
import { prisma } from "@madecreative/db";
import { socialTools } from "./tools.js";
import {
  SOCIAL_AGENT_SYSTEM_PROMPT,
  buildClientSocialPrompt,
  buildOwnChannelPrompt,
} from "./prompt.js";
import {
  SocialAgentInputSchema,
  GenerateShowcasePostSchema,
  GenerateStatPostSchema,
  GenerateTipsPostSchema,
  GenerateClientPostSchema,
  SchedulePostSchema,
  PublishToInstagramSchema,
  PublishToFacebookSchema,
} from "./types.js";

// ─── Meta Graph API helpers ───────────────────────────────────────────────────

async function igPublish(params: {
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

async function fbPublish(params: {
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

// ─── Next-slot calculator ─────────────────────────────────────────────────────
// Ensures no more than 1 post per day per platform for a client

async function getNextAvailableSlot(
  clientId: string | null,
  platform: string
): Promise<Date> {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setMinutes(0, 0, 0);

  // Preferred posting hours: 08:00, 12:00, 18:00
  const preferredHours = [8, 12, 18];
  let currentHour = candidate.getHours();

  // Find next preferred hour today or tomorrow
  for (let day = 0; day < 14; day++) {
    for (const hour of preferredHours) {
      if (day === 0 && hour <= currentHour) continue;

      const slot = new Date(candidate);
      slot.setDate(slot.getDate() + day);
      slot.setHours(hour, 0, 0, 0);

      if (slot <= now) continue;

      // Check if there's already a post at this time
      const existing = clientId
        ? await prisma.clientSocialPost.count({
            where: {
              clientId,
              platform,
              scheduledFor: {
                gte: new Date(slot.getTime() - 3 * 60 * 60 * 1000),
                lte: new Date(slot.getTime() + 3 * 60 * 60 * 1000),
              },
            },
          })
        : await prisma.socialPost.count({
            where: {
              platform,
              scheduledFor: {
                gte: new Date(slot.getTime() - 3 * 60 * 60 * 1000),
                lte: new Date(slot.getTime() + 3 * 60 * 60 * 1000),
              },
            },
          });

      if (existing === 0) {
        return slot;
      }
    }
    currentHour = -1;
  }

  // Fallback: tomorrow at 09:00
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(9, 0, 0, 0);
  return fallback;
}

// ─── Social Agent ─────────────────────────────────────────────────────────────

export class SocialAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super(context);
  }

  protected getTools(): Tool[] {
    return socialTools;
  }

  protected async handleToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      // ── Own-channel tools ───────────────────────────────────────────────────

      case "generate_showcase_post": {
        const parsed = GenerateShowcasePostSchema.safeParse(toolInput);
        if (!parsed.success) {
          return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
        }

        const client = await prisma.client.findUnique({
          where: { id: parsed.data.clientId },
          select: {
            companyName: true,
            sector: true,
            websites: {
              select: { domain: true, deployUrl: true, lighthouseScore: true },
              take: 1,
            },
          },
        });

        if (!client) {
          return { error: "Client not found", generated: false };
        }

        this.log("info", `Generating showcase post for ${client.companyName}`);

        const domain = client.websites[0]?.domain ?? "example.com";
        const score = client.websites[0]?.lighthouseScore;

        const caption = buildShowcaseCaption({
          companyName: client.companyName,
          sector: client.sector,
          domain,
          language: parsed.data.language,
          metrics: parsed.data.metrics,
          lighthouseScore: score ?? undefined,
        });

        return {
          generated: true,
          caption,
          hashtags: buildHashtags(client.sector, parsed.data.language, "showcase"),
          visualSuggestion: `Device mockup of ${domain} — use a MacBook + iPhone frame`,
          mediaType: "carousel",
        };
      }

      case "generate_stat_post": {
        const parsed = GenerateStatPostSchema.safeParse(toolInput);
        if (!parsed.success) {
          return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
        }

        this.log("info", "Generating stat post for @madecreative.pro");

        const { totalSitesLive, leadsThisWeek, timeSavedHoursThisWeek } =
          parsed.data.stats;
        const lang = parsed.data.language;

        const captions: Record<string, string> = {
          de: `📊 Diese Woche bei MadeCreative:\n\n🌐 ${totalSitesLive} Websites live\n🎯 ${leadsThisWeek} neue Leads generiert\n⏱️ ${timeSavedHoursThisWeek} Stunden gespart\n\nKleine Unternehmen verdienen große Ergebnisse. Wir machen das möglich.\n\n#MadeCreative #Digitalisierung #KMU #Website #Marketing`,
          it: `📊 Questa settimana con MadeCreative:\n\n🌐 ${totalSitesLive} siti live\n🎯 ${leadsThisWeek} nuovi lead generati\n⏱️ ${timeSavedHoursThisWeek} ore risparmiate\n\nLe piccole imprese meritano grandi risultati. Noi lo rendiamo possibile.\n\n#MadeCreative #PMI #DigitalMarketing #Website`,
          en: `📊 This week at MadeCreative:\n\n🌐 ${totalSitesLive} websites live\n🎯 ${leadsThisWeek} new leads generated\n⏱️ ${timeSavedHoursThisWeek} hours saved\n\nSmall businesses deserve big results. We make it happen.\n\n#MadeCreative #SMB #DigitalMarketing #Website`,
        };

        return {
          generated: true,
          caption: captions[lang] ?? captions["de"],
          hashtags: "#MadeCreative #DigitalMarketing #PMI #KMU #Web #Automation",
          visualSuggestion: `1080x1080 dark card with three stat blocks: sites (${totalSitesLive}), leads (${leadsThisWeek}), hours (${timeSavedHoursThisWeek}). Brand color #4f46e5.`,
          mediaType: "image",
        };
      }

      case "generate_tips_post": {
        const parsed = GenerateTipsPostSchema.safeParse(toolInput);
        if (!parsed.success) {
          return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
        }

        this.log("info", `Generating tips post — topic: ${parsed.data.topic}`);

        const tips = getTipsContent(parsed.data.topic, parsed.data.language);

        return {
          generated: true,
          slides: tips.slides,
          caption: tips.caption,
          hashtags: tips.hashtags,
          visualSuggestion: tips.visualDescription,
          mediaType: "carousel",
        };
      }

      case "schedule_our_post": {
        const parsed = SchedulePostSchema.safeParse(toolInput);
        if (!parsed.success) {
          return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
        }

        const scheduledFor = parsed.data.scheduledFor
          ? new Date(parsed.data.scheduledFor)
          : await getNextAvailableSlot(null, parsed.data.platform);

        const post = await prisma.socialPost.create({
          data: {
            platform: parsed.data.platform,
            type: parsed.data.type,
            contentType: parsed.data.contentType,
            caption: parsed.data.caption,
            hashtags: parsed.data.hashtags ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mediaUrls: (parsed.data.mediaUrls ?? []) as any,
            language: parsed.data.language,
            scheduledFor,
            status: "scheduled",
          },
        });

        this.log("info", `Scheduled own-channel post ${post.id} for ${scheduledFor.toISOString()}`);
        return { postId: post.id, status: post.status, scheduledFor: scheduledFor.toISOString() };
      }

      // ── Client post tools ───────────────────────────────────────────────────

      case "generate_client_post": {
        const parsed = GenerateClientPostSchema.safeParse(toolInput);
        if (!parsed.success) {
          return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
        }

        this.log(
          "info",
          `Generating client post for ${parsed.data.clientId} — ${parsed.data.sector}`
        );

        const caption = buildClientCaption({
          sector: parsed.data.sector,
          language: parsed.data.language,
          platform: parsed.data.platform,
        });

        const hashtags = buildHashtags(
          parsed.data.sector,
          parsed.data.language,
          "client"
        );

        return {
          generated: true,
          caption,
          hashtags,
          mediaUrls: parsed.data.photoUrls ?? [],
          visualSuggestion:
            parsed.data.photoUrls && parsed.data.photoUrls.length > 0
              ? `Use provided photo: ${parsed.data.photoUrls[0]}`
              : `Create a visual matching sector: ${parsed.data.sector}`,
        };
      }

      case "publish_to_instagram": {
        const parsed = PublishToInstagramSchema.safeParse(toolInput);
        if (!parsed.success) {
          return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
        }

        const client = await prisma.client.findUnique({
          where: { id: parsed.data.clientId },
          select: {
            igAccessToken: true,
            igAccountId: true,
            socialAutoPublish: true,
          },
        });

        if (!client?.igAccessToken || !client.igAccountId) {
          return { error: "Instagram not connected", published: false };
        }

        if (!client.socialAutoPublish) {
          await prisma.clientSocialPost.update({
            where: { id: parsed.data.postId },
            data: { status: "scheduled" },
          });
          return {
            published: false,
            status: "scheduled",
            requiresApproval: true,
            message: "Auto-publish disabled — post queued for approval",
          };
        }

        if (!parsed.data.mediaUrl) {
          return { error: "mediaUrl required for Instagram publishing", published: false };
        }

        const caption = `${parsed.data.caption}`;
        const result = await igPublish({
          igAccountId: client.igAccountId,
          igAccessToken: client.igAccessToken,
          mediaUrl: parsed.data.mediaUrl,
          caption,
        });

        await prisma.clientSocialPost.update({
          where: { id: parsed.data.postId },
          data: {
            status: "published",
            publishedAt: new Date(),
            igMediaId: result.igMediaId,
          },
        });

        this.log("info", `Published post ${parsed.data.postId} to Instagram`);
        return { published: true, igMediaId: result.igMediaId };
      }

      case "publish_to_facebook": {
        const parsed = PublishToFacebookSchema.safeParse(toolInput);
        if (!parsed.success) {
          return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
        }

        const client = await prisma.client.findUnique({
          where: { id: parsed.data.clientId },
          select: {
            fbPageId: true,
            fbPageAccessToken: true,
            socialAutoPublish: true,
          },
        });

        if (!client?.fbPageId || !client.fbPageAccessToken) {
          return { error: "Facebook Page not connected", published: false };
        }

        if (!client.socialAutoPublish) {
          await prisma.clientSocialPost.update({
            where: { id: parsed.data.postId },
            data: { status: "scheduled" },
          });
          return {
            published: false,
            status: "scheduled",
            requiresApproval: true,
          };
        }

        const result = await fbPublish({
          fbPageId: client.fbPageId,
          fbPageAccessToken: client.fbPageAccessToken,
          message: parsed.data.message,
          photoUrl: parsed.data.photoUrl,
        });

        await prisma.clientSocialPost.update({
          where: { id: parsed.data.postId },
          data: {
            status: "published",
            publishedAt: new Date(),
            fbPostId: result.fbPostId,
          },
        });

        this.log("info", `Published post ${parsed.data.postId} to Facebook`);
        return { published: true, fbPostId: result.fbPostId };
      }

      case "schedule_client_post": {
        const parsed = SchedulePostSchema.safeParse({ ...toolInput, isOwnChannel: false });
        if (!parsed.success) {
          return { error: `Invalid input: ${JSON.stringify(parsed.error.flatten())}` };
        }

        const clientId = parsed.data.clientId;
        if (!clientId) {
          return { error: "clientId required for schedule_client_post" };
        }

        const clientInfo = await prisma.client.findUnique({
          where: { id: clientId },
          select: { socialAutoPublish: true },
        });

        const scheduledFor = parsed.data.scheduledFor
          ? new Date(parsed.data.scheduledFor)
          : await getNextAvailableSlot(clientId, parsed.data.platform);

        const status = clientInfo?.socialAutoPublish ? "approved" : "draft";

        const post = await prisma.clientSocialPost.create({
          data: {
            clientId,
            platform: parsed.data.platform,
            type: parsed.data.type,
            caption: parsed.data.caption,
            hashtags: parsed.data.hashtags ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mediaUrls: (parsed.data.mediaUrls ?? []) as any,
            language: parsed.data.language,
            scheduledFor,
            status,
          },
        });

        this.log(
          "info",
          `Scheduled client post ${post.id} — status: ${status} — ${scheduledFor.toISOString()}`
        );

        return {
          postId: post.id,
          status: post.status,
          scheduledFor: scheduledFor.toISOString(),
          requiresApproval: !clientInfo?.socialAutoPublish,
        };
      }

      // ── Legacy tools ────────────────────────────────────────────────────────

      case "generate_post_content": {
        this.log("info", `Generating ${String(toolInput["platform"])} post content (legacy)`);
        return { generated: true };
      }

      case "save_social_post": {
        const {
          clientId,
          platform,
          type,
          caption,
          hashtags,
          mediaUrls,
          language,
          scheduledFor,
        } = toolInput as {
          clientId: string;
          platform: string;
          type: string;
          caption: string;
          hashtags?: string;
          mediaUrls?: string[];
          language: string;
          scheduledFor: string;
        };

        const post = await prisma.clientSocialPost.create({
          data: {
            clientId,
            platform,
            type,
            caption,
            hashtags: hashtags ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mediaUrls: (mediaUrls ?? []) as any,
            language,
            scheduledFor: new Date(scheduledFor),
            status: "draft",
          },
        });

        return { postId: post.id, status: post.status };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async run(input: Record<string, unknown>): Promise<AgentResult> {
    const parsed = SocialAgentInputSchema.safeParse(input);
    if (!parsed.success) {
      const error = `Invalid input: ${JSON.stringify(parsed.error.flatten())}`;
      await this.markJobFailed(error);
      return {
        success: false,
        error,
        apiCost: 0,
        tokensUsed: 0,
        durationMs: 0,
        toolCalls: [],
      };
    }

    try {
      await this.markJobStarted();
      this.log("info", "Social agent starting", {
        clientId: parsed.data.clientId,
        isOwnChannel: parsed.data.isOwnChannel,
      });

      let userPrompt: string;

      if (parsed.data.isOwnChannel) {
        // Own-channel @madecreative.pro post
        const contentType =
          parsed.data.contentType ??
          pickContentTypeForDay(new Date());

        // For stat posts, fetch real platform data
        let contextData: Record<string, unknown> | undefined;
        if (contentType === "stat") {
          const [sitesLive, leadsThisWeek, hoursThisWeek] = await Promise.all([
            prisma.clientWebsite.count({ where: { status: "LIVE" } }),
            prisma.clientLead.count({
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            }),
            prisma.clientAutomation
              .aggregate({
                _sum: { timeSaved: true },
              })
              .then((r: { _sum: { timeSaved: number | null } }) =>
                Math.round((((r._sum.timeSaved ?? 0) as number) / 60) * 10) / 10
              ),
          ]);
          contextData = {
            stats: {
              totalSitesLive: sitesLive,
              leadsThisWeek,
              timeSavedHoursThisWeek: hoursThisWeek,
            },
          };
        }

        userPrompt = buildOwnChannelPrompt({
          contentType,
          platform: parsed.data.platform,
          language: "de",
          data: contextData,
          scheduledFor: parsed.data.scheduledFor,
        });
      } else {
        // Client post
        const client = await prisma.client.findUnique({
          where: { id: parsed.data.clientId },
          select: {
            companyName: true,
            sector: true,
            language: true,
            websites: {
              select: { designTokens: true },
              take: 1,
            },
          },
        });

        if (!client) {
          const error = `Client ${parsed.data.clientId} not found`;
          await this.markJobFailed(error);
          return {
            success: false,
            error,
            apiCost: 0,
            tokensUsed: 0,
            durationMs: 0,
            toolCalls: [],
          };
        }

        const designTokens = client.websites[0]?.designTokens as
          | { primaryColor?: string; secondaryColor?: string }
          | undefined;

        userPrompt = buildClientSocialPrompt({
          clientName: client.companyName,
          sector: client.sector,
          platform: parsed.data.platform,
          language: client.language,
          brandColors: designTokens
            ? {
                primary: designTokens.primaryColor,
                secondary: designTokens.secondaryColor,
              }
            : undefined,
          scheduledFor: parsed.data.scheduledFor,
        });
      }

      await this.updateProgress(20);

      const result = await this.callClaude(
        [{ role: "user", content: userPrompt }],
        SOCIAL_AGENT_SYSTEM_PROMPT
      );

      await this.updateProgress(95);

      const output = {
        clientId: parsed.data.clientId,
        ...(result.data as Record<string, unknown>),
        apiCost: this.totalCost,
      };

      await this.markJobCompleted(output);
      return { ...result, data: output };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await this.markJobFailed(error);
      return {
        success: false,
        error,
        apiCost: this.totalCost,
        tokensUsed: 0,
        durationMs: 0,
        toolCalls: this.toolCalls,
      };
    }
  }
}

// ─── Content calendar helper ──────────────────────────────────────────────────

function pickContentTypeForDay(
  date: Date
): "showcase" | "stat" | "tips" | "behind_scenes" | "reel" {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const map: Record<
    number,
    "showcase" | "stat" | "tips" | "behind_scenes" | "reel"
  > = {
    0: "tips",         // Sunday
    1: "showcase",     // Monday
    2: "tips",         // Tuesday
    3: "stat",         // Wednesday
    4: "behind_scenes",// Thursday
    5: "showcase",     // Friday
    6: "reel",         // Saturday
  };
  return map[day] ?? "tips";
}

// ─── Caption builders ──────────────────────────────────────────────────────────

function buildShowcaseCaption(params: {
  companyName: string;
  sector: string;
  domain: string;
  language: string;
  metrics?: {
    visits?: number;
    leads?: number;
    timeSavedHours?: number;
  };
  lighthouseScore?: number;
}): string {
  const metricsText =
    params.metrics?.leads != null
      ? ` — ${params.metrics.leads} leads generati`
      : "";

  const captions: Record<string, string> = {
    de: `🚀 Neues Projekt live!\n\n${params.companyName} hat jetzt eine professionelle Website${metricsText}.\n\n🌐 ${params.domain}${params.lighthouseScore ? `\n⚡ Lighthouse Score: ${params.lighthouseScore}/100` : ""}\n\nVon der Idee zur fertigen Website in wenigen Wochen. Das ist MadeCreative.`,
    it: `🚀 Nuovo progetto online!\n\n${params.companyName} ha ora un sito professionale${metricsText}.\n\n🌐 ${params.domain}${params.lighthouseScore ? `\n⚡ Lighthouse Score: ${params.lighthouseScore}/100` : ""}\n\nDall'idea al sito finito in poche settimane. Questo è MadeCreative.`,
    en: `🚀 New project live!\n\n${params.companyName} now has a professional website${metricsText}.\n\n🌐 ${params.domain}${params.lighthouseScore ? `\n⚡ Lighthouse Score: ${params.lighthouseScore}/100` : ""}\n\nFrom idea to live website in weeks. That's MadeCreative.`,
  };

  return captions[params.language] ?? captions["de"] ?? "";
}

function buildClientCaption(params: {
  sector: string;
  language: string;
  platform: string;
}): string {
  const templates: Record<string, Record<string, string>> = {
    restaurant: {
      de: "🍽️ Frische Zutaten, leidenschaftliche Küche. Kommen Sie vorbei und erleben Sie es selbst!",
      it: "🍽️ Ingredienti freschi, cucina con passione. Venite a trovarci e vivete l'esperienza!",
      en: "🍽️ Fresh ingredients, passionate cooking. Come visit us and experience it yourself!",
    },
    dental: {
      de: "😁 Ihr Lächeln ist unser Antrieb. Vereinbaren Sie jetzt Ihren Termin!",
      it: "😁 Il vostro sorriso è la nostra motivazione. Prenota il tuo appuntamento!",
      en: "😁 Your smile is our motivation. Book your appointment today!",
    },
    fitness: {
      de: "💪 Stärker werden — ein Training nach dem anderen. Starte jetzt!",
      it: "💪 Diventare più forti — un allenamento alla volta. Inizia ora!",
      en: "💪 Getting stronger — one workout at a time. Start today!",
    },
  };

  const sectorTemplates = templates[params.sector];
  if (sectorTemplates) {
    return sectorTemplates[params.language] ?? sectorTemplates["de"] ?? "";
  }

  // Generic fallback
  const generic: Record<string, string> = {
    de: "✨ Qualität, die überzeugt. Kontaktieren Sie uns heute!",
    it: "✨ Qualità che convince. Contattaci oggi!",
    en: "✨ Quality that convinces. Contact us today!",
  };
  return generic[params.language] ?? generic["de"] ?? "";
}

function buildHashtags(
  sector: string,
  language: string,
  type: "showcase" | "client"
): string {
  const ownHashtags = "#MadeCreative #DigitalMarketing #Website #PMI #KMU #Web";

  const sectorHashtags: Record<string, Record<string, string>> = {
    restaurant: {
      de: "#Restaurant #Gastro #Foodie #Lecker #Essen #Kulinarik #Gastronomie",
      it: "#Ristorante #Cucina #Gastronomia #Food #FoodPhotography #Chef",
      en: "#Restaurant #Food #Foodie #Gastronomy #Chef #Culinary",
    },
    dental: {
      de: "#Zahnarzt #Zahngesundheit #Dental #Zahnarztpraxis #Lächeln",
      it: "#Dentista #SaluteDentale #Sorriso #StudioDentistico",
      en: "#Dentist #DentalHealth #Smile #DentalCare",
    },
    fitness: {
      de: "#Fitness #Training #Sport #Workout #Gesundheit #Fitnessstudio",
      it: "#Fitness #Allenamento #Sport #Palestra #Benessere",
      en: "#Fitness #Training #Workout #Gym #Health",
    },
  };

  const sector_tags =
    sectorHashtags[sector]?.[language] ??
    sectorHashtags[sector]?.["de"] ??
    "#Business #Marketing #Digital";

  return type === "showcase"
    ? `${ownHashtags} ${sector_tags}`
    : sector_tags;
}

// ─── Tips content bank ─────────────────────────────────────────────────────────

function getTipsContent(
  topic: "SEO" | "chatbot" | "automazioni" | "email" | "social",
  language: string
): {
  slides: Array<{ title: string; content: string }>;
  caption: string;
  hashtags: string;
  visualDescription: string;
} {
  const content: Record<
    string,
    {
      de: { slides: Array<{ title: string; content: string }>; caption: string };
      it: { slides: Array<{ title: string; content: string }>; caption: string };
    }
  > = {
    SEO: {
      de: {
        slides: [
          { title: "Was ist SEO?", content: "SEO hilft Kunden, Sie online zu finden" },
          { title: "Tipp 1", content: "Verwenden Sie lokale Keywords (z.B. 'Bäcker Wien')" },
          { title: "Tipp 2", content: "Pflegen Sie Ihren Google Business Eintrag" },
          { title: "Tipp 3", content: "Laden Sie Ihre Website schnell (< 3 Sekunden)" },
          { title: "Tipp 4", content: "Sammeln Sie Google-Bewertungen aktiv" },
        ],
        caption:
          "📈 5 SEO-Tipps für kleine Unternehmen, die wirklich funktionieren\n\nSave this post — du wirst es brauchen! 🔖",
      },
      it: {
        slides: [
          { title: "Cos'è la SEO?", content: "La SEO aiuta i clienti a trovarti online" },
          { title: "Consiglio 1", content: "Usa keyword locali (es. 'pizzeria Milano')" },
          { title: "Consiglio 2", content: "Cura il tuo profilo Google Business" },
          { title: "Consiglio 3", content: "Sito veloce = più clienti (< 3 secondi)" },
          { title: "Consiglio 4", content: "Raccogli recensioni Google attivamente" },
        ],
        caption:
          "📈 5 consigli SEO per le piccole imprese che funzionano davvero\n\nSalva questo post — ti servirà! 🔖",
      },
    },
    chatbot: {
      de: {
        slides: [
          { title: "Warum Chatbot?", content: "24/7 verfügbar, keine verpassten Anfragen" },
          { title: "Tipp 1", content: "Beantworte die häufigsten 10 Fragen" },
          { title: "Tipp 2", content: "Sammle Kontaktdaten automatisch" },
          { title: "Tipp 3", content: "Qualifiziere Leads bevor sie anrufen" },
          { title: "Ergebnis", content: "Bis zu 3x mehr Leads ohne Mehraufwand" },
        ],
        caption:
          "🤖 Wie ein Chatbot Ihrem Unternehmen hilft — auch nachts\n\nSave für später! 💾",
      },
      it: {
        slides: [
          { title: "Perché un chatbot?", content: "Disponibile 24/7, nessuna richiesta persa" },
          { title: "Consiglio 1", content: "Rispondi alle 10 domande più frequenti" },
          { title: "Consiglio 2", content: "Raccogli contatti automaticamente" },
          { title: "Consiglio 3", content: "Qualifica i lead prima che chiamino" },
          { title: "Risultato", content: "Fino a 3x più lead senza sforzo aggiuntivo" },
        ],
        caption:
          "🤖 Come un chatbot aiuta la tua attività — anche di notte\n\nSalva per dopo! 💾",
      },
    },
    automazioni: {
      de: {
        slides: [
          { title: "Was sind Automationen?", content: "Aufgaben, die sich selbst erledigen" },
          { title: "Tipp 1", content: "Automatisieren Sie Willkommens-E-Mails" },
          { title: "Tipp 2", content: "Senden Sie Erinnerungen automatisch" },
          { title: "Tipp 3", content: "Bitten Sie nach dem Service um Bewertungen" },
          { title: "Ergebnis", content: "Sparen Sie 10+ Stunden pro Monat" },
        ],
        caption:
          "⚡ 3 Automationen, die jedes KMU sofort einsetzen sollte\n\nWelche nutzt du schon? 👇",
      },
      it: {
        slides: [
          { title: "Cosa sono le automazioni?", content: "Compiti che si completano da soli" },
          { title: "Consiglio 1", content: "Automatizza le email di benvenuto" },
          { title: "Consiglio 2", content: "Invia promemoria automaticamente" },
          { title: "Consiglio 3", content: "Chiedi recensioni dopo il servizio" },
          { title: "Risultato", content: "Risparmia 10+ ore al mese" },
        ],
        caption:
          "⚡ 3 automazioni che ogni PMI dovrebbe usare subito\n\nQuali usi già? 👇",
      },
    },
    email: {
      de: {
        slides: [
          { title: "E-Mail Marketing 2025", content: "Noch immer der ROI-König" },
          { title: "Tipp 1", content: "Segmentieren Sie Ihre Liste" },
          { title: "Tipp 2", content: "Betreffzeile entscheidet alles" },
          { title: "Tipp 3", content: "1 klarer CTA pro E-Mail" },
          { title: "Tipp 4", content: "Personalisierung erhöht Öffnungsraten um 26%" },
        ],
        caption:
          "📧 4 E-Mail-Tipps mit sofortiger Wirkung\n\nSichern für später! 🔖",
      },
      it: {
        slides: [
          { title: "Email Marketing 2025", content: "Ancora il re del ROI" },
          { title: "Consiglio 1", content: "Segmenta la tua lista" },
          { title: "Consiglio 2", content: "L'oggetto decide tutto" },
          { title: "Consiglio 3", content: "1 CTA chiaro per email" },
          { title: "Consiglio 4", content: "La personalizzazione aumenta i tassi di apertura del 26%" },
        ],
        caption:
          "📧 4 consigli email con effetto immediato\n\nSalva per dopo! 🔖",
      },
    },
    social: {
      de: {
        slides: [
          { title: "Social Media für KMU", content: "Konsistenz schlägt Perfektion" },
          { title: "Tipp 1", content: "3 Posts/Woche besser als 1 perfekter" },
          { title: "Tipp 2", content: "Stories täglich für Sichtbarkeit" },
          { title: "Tipp 3", content: "Reels erreichen 3x mehr Menschen" },
          { title: "Tipp 4", content: "Antworten Sie auf jeden Kommentar" },
        ],
        caption:
          "📲 Social Media für KMU — so funktioniert es wirklich\n\nSpeichern! 📌",
      },
      it: {
        slides: [
          { title: "Social Media per PMI", content: "La costanza batte la perfezione" },
          { title: "Consiglio 1", content: "3 post/settimana meglio di 1 perfetto" },
          { title: "Consiglio 2", content: "Stories ogni giorno per la visibilità" },
          { title: "Consiglio 3", content: "I Reel raggiungono 3x più persone" },
          { title: "Consiglio 4", content: "Rispondi a ogni commento" },
        ],
        caption:
          "📲 Social Media per PMI — come funziona davvero\n\nSalva! 📌",
      },
    },
  };

  const topicContent = content[topic];
  if (!topicContent) {
    return {
      slides: [{ title: "Tip", content: "No content available" }],
      caption: "Tips for your business",
      hashtags: "#MadeCreative #Tips #Business",
      visualDescription: "5-slide carousel with tips",
    };
  }

  const lang = language === "it" ? "it" : "de";
  const langContent = topicContent[lang];

  const hashtagMap: Record<string, string> = {
    SEO: "#SEO #GoogleOptimierung #Suchmaschinenoptimierung #MadeCreative #Digital #KMU",
    chatbot: "#Chatbot #KI #Automatisierung #MadeCreative #KMU #Digital",
    automazioni:
      "#Automatisierung #Workflow #MadeCreative #KMU #Produktivität #Digital",
    email:
      "#EmailMarketing #Newsletter #Marketing #MadeCreative #KMU #Digital",
    social:
      "#SocialMedia #Instagram #Marketing #MadeCreative #KMU #Digital",
  };

  return {
    slides: langContent.slides,
    caption: langContent.caption,
    hashtags:
      hashtagMap[topic] ??
      "#MadeCreative #Tips #Business #Digital #KMU",
    visualDescription: `5-slide carousel on topic "${topic}" — brand color #4f46e5, white text, clean minimal design`,
  };
}
