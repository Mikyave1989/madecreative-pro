import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@madecreative/db";
import type { AgentType } from "@madecreative/shared";
import { AGENT_QUEUE_NAMES } from "@madecreative/shared";

// Lazy imports for each agent to avoid loading all at startup
async function getAgent(agentType: AgentType, context: {
  jobId: string;
  agentType: AgentType;
  input: Record<string, unknown>;
}) {
  switch (agentType) {
    case "SCRAPER": {
      const { ScraperAgent } = await import("./scraper/index.js");
      return new ScraperAgent(context);
    }
    case "ANALYZER": {
      const { AnalyzerAgent } = await import("./analyzer/index.js");
      return new AnalyzerAgent(context);
    }
    case "BUILDER": {
      const { BuilderAgent } = await import("./builder/index.js");
      return new BuilderAgent(context);
    }
    case "OUTREACH": {
      const { OutreachAgent } = await import("./outreach/index.js");
      return new OutreachAgent(context);
    }
    case "CHATBOT": {
      const { ChatbotAgent } = await import("./chatbot/index.js");
      return new ChatbotAgent(context);
    }
    case "QA": {
      const { QaAgent } = await import("./qa/index.js");
      return new QaAgent(context);
    }
    default:
      throw new Error(`Unknown agent type: ${agentType as string}`);
  }
}

export function createOrchestratorWorker(
  agentType: AgentType,
  redisConnection: IORedis
): Worker {
  const queueName = AGENT_QUEUE_NAMES[agentType];

  const worker = new Worker(
    queueName,
    async (job) => {
      const { jobId, input } = job.data as {
        jobId: string;
        input: Record<string, unknown>;
      };

      console.log(`[Orchestrator] Processing ${agentType} job: ${jobId}`);

      // Check if job still exists and is not cancelled
      const dbJob = await prisma.agentJob.findUnique({
        where: { id: jobId },
      });

      if (!dbJob) {
        throw new Error(`Job ${jobId} not found in database`);
      }

      if (dbJob.status === "CANCELLED") {
        console.log(`[Orchestrator] Job ${jobId} was cancelled, skipping`);
        return { cancelled: true };
      }

      const context = {
        jobId,
        agentType,
        input,
      };

      const agent = await getAgent(agentType, context);
      const result = await agent.runWithRetry(input);

      return result;
    },
    {
      connection: redisConnection,
      concurrency: 2,
      limiter: {
        max: 5,
        duration: 60_000, // 5 jobs per minute per agent type
      },
    }
  );

  worker.on("completed", (job, result) => {
    console.log(`[Orchestrator] ${agentType} job completed: ${job.id}`, {
      cost: (result as { apiCost?: number })?.apiCost,
    });

    // Auto-pipeline: chain agents after completion
    void chainNextAgent(agentType, job.data as { jobId: string; input: Record<string, unknown> }, result).catch((err) => {
      console.error(`[Orchestrator] Auto-chain error for ${agentType}:`, err);
    });
  });

  worker.on("failed", (job, err) => {
    console.error(`[Orchestrator] ${agentType} job failed: ${job?.id}`, err.message);
  });

  worker.on("error", (err) => {
    console.error(`[Orchestrator] Worker error for ${agentType}:`, err.message);
  });

  return worker;
}

// ─── Auto-pipeline: chain agents after completion ────────────────────────────
// SCRAPER → ANALYZER (for each new prospect)
// ANALYZER → BUILDER (if leadScore >= 50)
// BUILDER → OUTREACH (generate + send cold email after preview built)
// BUILDER (client site) → QA (run lighthouse/check after deploy)

async function chainNextAgent(
  completedType: AgentType,
  jobData: { jobId: string; input: Record<string, unknown> },
  result: unknown,
): Promise<void> {
  const { Queue } = await import("bullmq");
  const url = process.env["REDIS_URL"];
  if (!url) return;

  const redis = new (await import("ioredis")).default(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  try {
    if (completedType === "SCRAPER") {
      // After scraping, queue ANALYZER for all new SCRAPED prospects without a score
      const prospects = await prisma.prospect.findMany({
        where: { status: "SCRAPED", leadScore: 0 },
        take: 50,
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (prospects.length === 0) return;

      const analyzerQueue = new Queue(AGENT_QUEUE_NAMES["ANALYZER"], { connection: redis });

      for (let i = 0; i < prospects.length; i++) {
        const prospect = prospects[i]!;
        const job = await prisma.agentJob.create({
          data: {
            agentType: "ANALYZER",
            status: "QUEUED",
            input: { prospectId: prospect.id },
            prospectId: prospect.id,
          },
        });

        await analyzerQueue.add(
          "ANALYZER",
          { jobId: job.id, input: { prospectId: prospect.id } },
          { jobId: job.id, delay: i * 10_000 }, // stagger 10s apart
        );
      }

      await analyzerQueue.close();
      console.log(`[Orchestrator] Auto-chained ${prospects.length} ANALYZER jobs after SCRAPER`);
    }

    if (completedType === "ANALYZER") {
      // After analyzing, queue BUILDER for high-score prospects without preview
      const prospectId = jobData.input["prospectId"] as string | undefined;
      if (!prospectId) return;

      const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
        select: { id: true, leadScore: true, previewSiteUrl: true, sector: true },
      });

      if (!prospect || prospect.leadScore < 50 || prospect.previewSiteUrl) return;

      const builderQueue = new Queue(AGENT_QUEUE_NAMES["BUILDER"], { connection: redis });

      const job = await prisma.agentJob.create({
        data: {
          agentType: "BUILDER",
          status: "QUEUED",
          input: { prospectId: prospect.id, templateSlug: prospect.sector },
          prospectId: prospect.id,
        },
      });

      await builderQueue.add(
        "BUILDER",
        { jobId: job.id, input: { prospectId: prospect.id, templateSlug: prospect.sector } },
        { jobId: job.id, delay: 5_000 },
      );

      await builderQueue.close();
      console.log(`[Orchestrator] Auto-chained BUILDER for prospect ${prospectId} (score: ${prospect.leadScore})`);
    }

    if (completedType === "BUILDER") {
      const prospectId = jobData.input["prospectId"] as string | undefined;
      if (!prospectId) return;

      // Check if this prospect now has a preview and hasn't been contacted yet
      const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
        select: {
          id: true,
          contactEmail: true,
          status: true,
          previewSiteUrl: true,
          companyName: true,
          sector: true,
          country: true,
          city: true,
        },
      });

      if (!prospect?.contactEmail || !prospect.previewSiteUrl) return;

      // Only chain OUTREACH if prospect hasn't been contacted yet
      const alreadyContacted = ["EMAIL_QUEUED", "CONTACTED", "EMAIL_SENT", "FOLLOWED_UP", "REPLIED", "CALL_SCHEDULED", "CONVERTED", "BLACKLISTED"].includes(prospect.status);
      if (alreadyContacted) return;

      // ── Send preview email immediately via API ──
      // Bypass the OutreachAgent (which needs Claude + Redis) for reliability.
      // Directly call the send-preview-email endpoint — instant, no queuing.
      const langMap: Record<string, string> = { DE: "de", AT: "de", CH: "de", IT: "it", FR: "fr", BE: "fr", ES: "es" };
      const language = langMap[prospect.country?.toUpperCase() ?? ""] ?? "en";
      const apiBase = process.env["API_URL"] ?? "https://api.madecreative.pro";

      try {
        const emailRes = await fetch(`${apiBase}/admin/prospects/${prospect.id}/send-preview-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Internal-Token": process.env["JWT_SECRET"] ?? "" },
          body: JSON.stringify({ language }),
        });
        if (emailRes.ok) {
          console.log(`[Orchestrator] Preview email sent to ${prospect.contactEmail} for ${prospect.companyName}`);
        } else {
          console.warn(`[Orchestrator] Email send failed: ${emailRes.status}`);
        }
      } catch (err) {
        console.warn(`[Orchestrator] Email send error: ${(err as Error).message}`);
      }

      await prisma.prospect.update({
        where: { id: prospect.id },
        data: { status: "EMAIL_QUEUED" },
      });

      console.log(`[Orchestrator] Preview email sent for prospect ${prospectId} (email: ${prospect.contactEmail})`);

      // Also chain QA for the built preview site
      const qaQueue = new Queue(AGENT_QUEUE_NAMES["QA"], { connection: redis });

      const qaJob = await prisma.agentJob.create({
        data: {
          agentType: "QA",
          status: "QUEUED",
          input: {
            prospectId: prospect.id,
            url: prospect.previewSiteUrl,
            checks: ["lighthouse", "mobile", "links"],
          },
          prospectId: prospect.id,
        },
      });

      await qaQueue.add(
        "QA",
        { jobId: qaJob.id, input: qaJob.input as Record<string, unknown> },
        { jobId: qaJob.id, delay: 60_000 }, // 1min after deploy
      );

      await qaQueue.close();
      console.log(`[Orchestrator] Auto-chained QA for prospect ${prospectId}`);
    }
  } finally {
    await redis.quit();
  }
}

export async function startOrchestrator(): Promise<Worker[]> {
  const url = process.env["REDIS_URL"];
  if (!url) throw new Error("REDIS_URL is not set");

  const redis = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const agentTypes: AgentType[] = [
    "SCRAPER",
    "ANALYZER",
    "BUILDER",
    "OUTREACH",
    "CHATBOT",
    "QA",
  ];

  const workers = agentTypes.map((type) =>
    createOrchestratorWorker(type, redis)
  );

  console.log(
    `[Orchestrator] Started ${workers.length} workers for agent types: ${agentTypes.join(", ")}`
  );

  // ── DB Poller: pick up jobs that were created but never reached BullMQ ──
  // This handles the case where the API (Vercel) can't connect to Redis
  // and creates jobs in DB only. We poll every 30s and enqueue them.
  const pollInterval = setInterval(async () => {
    try {
      const stuckJobs = await prisma.agentJob.findMany({
        where: {
          status: { in: ["QUEUED", "RUNNING"] },
          progress: 0,
          startedAt: { lt: new Date(Date.now() - 60_000) }, // older than 1 min
        },
        take: 5,
        orderBy: { createdAt: "asc" },
      });

      if (stuckJobs.length === 0) return;

      console.log(`[Orchestrator] DB Poller: found ${stuckJobs.length} stuck jobs, re-enqueueing...`);

      for (const job of stuckJobs) {
        const agentType = job.agentType as AgentType;
        const queueName = AGENT_QUEUE_NAMES[agentType];
        const queue = new (await import("bullmq")).Queue(queueName, { connection: redis });

        try {
          await queue.add(
            agentType,
            { jobId: job.id, input: job.input as Record<string, unknown> },
            { jobId: job.id }
          );
          // Reset startedAt so we don't re-enqueue next cycle
          await prisma.agentJob.update({
            where: { id: job.id },
            data: { startedAt: new Date() },
          });
          console.log(`[Orchestrator] DB Poller: re-enqueued ${agentType} job ${job.id}`);
        } catch (err) {
          console.error(`[Orchestrator] DB Poller: failed to enqueue ${job.id}:`, (err as Error).message);
        }

        await queue.close();
      }
    } catch (err) {
      // Non-fatal — will retry next cycle
    }
  }, 30_000);

  // ── HTTP server for deep scraping — used by the editor ──
  // The editor calls POST /scrape on this worker (which has Playwright installed)
  // to get JS-rendered content including all lazy-loaded images and videos.
  const { createServer } = await import("http");
  const SCRAPE_PORT = parseInt(process.env["SCRAPE_PORT"] ?? "4000", 10);

  const httpServer = createServer(async (req, res) => {
    if (req.method !== "POST" || !req.url?.startsWith("/scrape")) {
      res.writeHead(404); res.end("Not found"); return;
    }

    // Auth check
    const internalToken = req.headers["x-internal-token"];
    if (!internalToken || internalToken !== process.env["JWT_SECRET"]) {
      res.writeHead(401); res.end("Unauthorized"); return;
    }

    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const { url } = JSON.parse(body) as { url: string };
        if (!url) { res.writeHead(400); res.end("url required"); return; }

        console.log(`[ScrapeServer] Deep scraping: ${url}`);
        const { chromium } = await import("playwright");
        const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
        const context = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" });

        const mainPage = await context.newPage();
        await mainPage.goto(url, { waitUntil: "networkidle", timeout: 30_000 }).catch(() => mainPage.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 }));
        await mainPage.evaluate(async () => { for (let i = 0; i < Math.ceil(document.body.scrollHeight / window.innerHeight); i++) { window.scrollBy(0, window.innerHeight); await new Promise(r => setTimeout(r, 200)); } });
        await mainPage.waitForTimeout(1000);

        const baseHost = new URL(url).hostname.replace("www.", "");
        const allLinks = await mainPage.evaluate((host: string) => Array.from(document.querySelectorAll("a[href]")).map(a => (a as HTMLAnchorElement).href).filter(h => { try { return new URL(h).hostname.replace("www.", "") === host; } catch { return false; } }).filter(h => !h.match(/\.(pdf|zip|jpg|png|gif|svg|css|js)$/i) && !h.includes("#") && !h.includes("?")), baseHost);
        const uniqueLinks = [...new Set([url, ...allLinks])].slice(0, 25);
        await mainPage.close();

        const pages = [];
        let siteLogo = null;
        let siteContact: Record<string, string | null> = {};
        let siteSocial: Record<string, string> = {};

        for (const pageUrl of uniqueLinks) {
          try {
            const page = await context.newPage();
            await page.goto(pageUrl, { waitUntil: "networkidle", timeout: 20_000 }).catch(() => page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 10_000 }));
            await page.evaluate(async () => { for (let i = 0; i < Math.ceil(document.body.scrollHeight / window.innerHeight); i++) { window.scrollBy(0, window.innerHeight); await new Promise(r => setTimeout(r, 150)); } });
            await page.waitForTimeout(300);

            const data = await page.evaluate(() => {
              const images = Array.from(document.querySelectorAll("img")).filter(img => img.src?.startsWith("http") && img.naturalWidth >= 50).filter(img => !/icon|sprite|pixel|tracking|badge|spinner/i.test(img.className + img.id + (img.alt || ""))).map(img => ({ url: img.src, alt: img.alt || "", width: img.naturalWidth, height: img.naturalHeight }));
              const bgImages: Array<{ url: string; alt: string }> = [];
              document.querySelectorAll("*").forEach(el => { const bg = getComputedStyle(el).backgroundImage; if (bg && bg !== "none") { const m = bg.match(/url\(["']?([^"')]+)/); if (m?.[1]?.startsWith("http") && /\.(jpg|jpeg|png|webp)/i.test(m[1])) bgImages.push({ url: m[1], alt: "background" }); } });
              const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4")).map(h => ({ level: parseInt(h.tagName.slice(1)), text: h.textContent?.trim().slice(0, 300) || "" })).filter(h => h.text.length > 2);
              const paragraphs = Array.from(document.querySelectorAll("p,li,blockquote,.text,[class*='desc'],[class*='content']")).map(p => p.textContent?.trim() || "").filter(t => t.length > 30 && t.length < 2000);
              const videos: Array<{ url: string; type: string }> = [];
              document.querySelectorAll("iframe[src]").forEach(f => { const src = (f as HTMLIFrameElement).src; if (/youtube|vimeo/i.test(src)) videos.push({ url: src, type: src.includes("youtube") ? "youtube" : "vimeo" }); });
              document.querySelectorAll("video source,video[src]").forEach(v => { const src = (v as HTMLSourceElement).src || ""; if (src) videos.push({ url: src, type: "video" }); });
              const logo = (document.querySelector("header img,nav img,.logo img,img[alt*='logo' i],img[src*='logo' i],[class*='logo'] img") as HTMLImageElement)?.src || null;
              const phone = (document.querySelector("a[href^='tel:']") as HTMLAnchorElement)?.href?.replace("tel:", "") || null;
              const email = (document.querySelector("a[href^='mailto:']") as HTMLAnchorElement)?.href?.replace("mailto:", "") || null;
              const social: Record<string, string> = {};
              document.querySelectorAll("a[href]").forEach(a => { const h = (a as HTMLAnchorElement).href; if (h.includes("facebook.com")) social.facebook = h; if (h.includes("instagram.com")) social.instagram = h; });
              return { title: document.title, images: [...images, ...bgImages], headings, paragraphs: [...new Set(paragraphs)], videos, logo, phone, email, social };
            });

            pages.push({ url: pageUrl, title: data.title, headings: data.headings, paragraphs: data.paragraphs, images: data.images, videos: data.videos });
            if (pages.length === 1) { siteLogo = data.logo; siteContact = { phone: data.phone, email: data.email }; siteSocial = data.social; }
            await page.close();
          } catch { /* skip failed pages */ }
        }

        await browser.close();

        const totalImages = pages.reduce((s, p) => s + p.images.length, 0);
        console.log(`[ScrapeServer] Done: ${pages.length} pages, ${totalImages} images`);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, data: { scraped: { url, pages, logo: siteLogo, contact: siteContact, socialLinks: siteSocial } } }));
      } catch (err) {
        console.error("[ScrapeServer] Error:", (err as Error).message);
        res.writeHead(500); res.end(JSON.stringify({ error: (err as Error).message }));
      }
    });
  });

  httpServer.listen(SCRAPE_PORT, () => console.log(`[ScrapeServer] Listening on :${SCRAPE_PORT}`));
  process.on("SIGTERM", () => { httpServer.close(); clearInterval(pollInterval); });

  return workers;
}
