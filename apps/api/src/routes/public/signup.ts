import { Hono } from "hono";
import { generateTokens } from "../../lib/auth.js";
import { getStripeClient } from "../../lib/stripe.js";

const app = new Hono();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientPayload(client: {
  id: string;
  email: string;
  companyName: string;
  contactName: string | null;
  plan: string;
  status: string;
  language: string;
}) {
  return {
    id: client.id,
    email: client.email,
    companyName: client.companyName,
    contactName: client.contactName,
    plan: client.plan,
    status: client.status,
    language: client.language,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── POST /checkout — Create Stripe Checkout Session for paid plans ──────────

app.post("/checkout", async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const rawBody = body as {
    plan?: string;
    billing?: string;
    email?: string;
    companyName?: string;
    websiteUrl?: string;
    locale?: string;
  };

  // Normalize plan to UPPERCASE (frontend sends lowercase)
  const plan = rawBody.plan?.toUpperCase();
  const billing = rawBody.billing?.toLowerCase();
  const email = rawBody.email;
  const companyName = rawBody.companyName;
  const websiteUrl = rawBody.websiteUrl;
  const locale = rawBody.locale;

  const validPlans = ["STARTER", "PRO"] as const;
  const validBillings = ["monthly", "annual", "onetime"] as const;

  if (!plan || !validPlans.includes(plan as (typeof validPlans)[number])) {
    return c.json(
      { success: false, error: "Plan must be STARTER or PRO" },
      400
    );
  }

  if (
    !billing ||
    !validBillings.includes(billing as (typeof validBillings)[number])
  ) {
    return c.json(
      { success: false, error: "Billing must be monthly, annual or onetime" },
      400
    );
  }

  if (!email || !EMAIL_RE.test(email)) {
    return c.json({ success: false, error: "A valid email is required" }, 400);
  }

  // STARTER = EUR 9.99 one-time; PRO = EUR 49/month with 30-day free trial
  const isSubscription = plan === "PRO";
  const priceId = isSubscription
    ? process.env["STRIPE_PRICE_SUBSCRIPTION"] ?? "price_1TPL2eFJTS50UtnPeKWHkgu5"
    : process.env["STRIPE_PRICE_ID"] ?? "price_1TP2GRFJTS50UtnPyVGT2CJ9";

  if (!priceId) {
    return c.json(
      { success: false, error: `Price not configured for ${plan} ${billing}` },
      400
    );
  }

  let stripe: ReturnType<typeof getStripeClient>;
  try {
    stripe = getStripeClient();
  } catch {
    return c.json({ success: false, error: "Pagamenti non ancora configurati. Riprova tra poco." }, 503);
  }

  try {
    // Create TWO sessions — embedded + hosted — in parallel so the frontend can
    // fall back if Stripe.js can't load (e.g. Firefox Enhanced Tracking
    // Protection blocking js.stripe.com as a "tracker"). Embedded keeps the
    // customer on madecreative.pro; hosted is a top-level navigation to
    // checkout.stripe.com which most tracker-blockers allow.
    const marketingUrl = process.env["MARKETING_URL"] ?? "https://madecreative.pro";
    const sharedFields = {
      payment_method_types: ["card", "link"] as Array<"card" | "link">,
      locale: "auto" as const,
      billing_address_collection: "auto" as const,
      phone_number_collection: { enabled: true },
      customer_email: email.toLowerCase(),
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        plan,
        websiteUrl: websiteUrl ?? "",
        companyName: companyName ?? "",
      },
    };
    const modeSpecific = isSubscription
      ? {
          mode: "subscription" as const,
          payment_method_options: { card: { request_three_d_secure: "automatic" as const } },
          subscription_data: { trial_period_days: 30, metadata: { plan } },
        }
      : {
          mode: "payment" as const,
          customer_creation: "always" as const,
          payment_method_options: { card: { request_three_d_secure: "automatic" as const } },
        };

    const [embeddedSession, hostedSession] = await Promise.all([
      stripe.checkout.sessions.create({
        ...sharedFields,
        ...modeSpecific,
        ui_mode: "embedded",
        return_url: `${marketingUrl}/signup?success=true&session_id={CHECKOUT_SESSION_ID}`,
      }),
      stripe.checkout.sessions.create({
        ...sharedFields,
        ...modeSpecific,
        success_url: `${marketingUrl}/signup?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${marketingUrl}/#pricing`,
      }),
    ]);

    if (!embeddedSession.client_secret || !hostedSession.url) {
      console.error("[Checkout] Stripe did not return expected session fields");
      return c.json({ success: false, error: "Checkout session creation failed" }, 500);
    }

    return c.json({
      success: true,
      data: {
        clientSecret: embeddedSession.client_secret,
        sessionId: embeddedSession.id,
        hostedUrl: hostedSession.url,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Checkout] Stripe error:", msg);
    return c.json({ success: false, error: msg }, 500);
  }
});

// ─── POST /verify-session — Verify Stripe session & auto-login ──────────────

app.post("/verify-session", async (c) => {
  const { prisma } = await import("@madecreative/db");
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { sessionId } = body as { sessionId?: string };

  if (!sessionId) {
    return c.json({ success: false, error: "sessionId is required" }, 400);
  }

  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return c.json(
      { success: false, error: "Payment not completed" },
      402
    );
  }

  const email = session.customer_email?.toLowerCase();
  if (!email) {
    return c.json(
      { success: false, error: "No email found on checkout session" },
      400
    );
  }

  // Retry up to 10 times with exponential backoff — the webhook may not have created the client yet
  // Delays: 500ms, 1s, 2s, 4s, 8s, then capped at 8s for remaining attempts
  let client: Awaited<ReturnType<typeof prisma.client.findUnique>> = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    client = await prisma.client.findUnique({ where: { email } });
    if (client) break;
    const delayMs = Math.min(500 * Math.pow(2, attempt), 8000);
    await sleep(delayMs);
  }

  if (!client) {
    return c.json(
      { success: false, error: "Account not found. Please try again shortly." },
      404
    );
  }

  const tokens = await generateTokens({
    sub: client.id,
    email: client.email,
    role: "STANDARD",
    type: "client",
  });

  return c.json({
    success: true,
    data: {
      ...tokens,
      user: clientPayload(client),
    },
  });
});

// ─── POST /generate-preview — Generate a preview site HTML (public, no auth) ──
// Accepts either:
//   { name, sector, city?, phone?, email? }               → fake-content path
//   { scrapedData: ScrapedWebsite, sector }                → real-content path

app.post("/generate-preview", async (c) => {
  const body = await c.req.json().catch(() => null);
  const sector = ((body?.sector as string) ?? "professional").trim();

  const { generateSitePreview, buildProjectFromContent } = await import("@madecreative/shared");

  // Real content path — scrapedData was provided (e.g. from /analyze-url)
  if (body?.scrapedData && typeof body.scrapedData === "object") {
    try {
      const pd = buildProjectFromContent(body.scrapedData, sector);
      const html = generateSitePreview({ name: pd.businessName, sector }, pd);
      return c.json({ success: true, data: { html, name: pd.businessName, sector } });
    } catch (err) {
      console.error("[generate-preview] buildProjectFromContent failed:", err instanceof Error ? err.message : err);
      // Fall through to the default path
    }
  }

  // Default fake-content path
  const name = ((body?.name as string) ?? "Il tuo sito").trim();
  const city = ((body?.city as string) ?? "").trim();
  const html = generateSitePreview({ name, sector, city: city || undefined });

  return c.json({ success: true, data: { html, name, sector } });
});

// ─── POST /analyze-url — Full website scrape + SEO audit (public, no auth) ───
// Body: { url: string, sector?: string, generatePreview?: boolean }
// Returns scraped content + SEO issues + optional preview HTML

app.post("/analyze-url", async (c) => {
  const body = await c.req.json().catch(() => null);
  const url = (body?.url as string)?.trim();

  if (!url) {
    return c.json({ success: false, error: "URL is required" }, 400);
  }

  // Normalize URL
  let targetUrl = url;
  if (!targetUrl.startsWith("http")) targetUrl = `https://${targetUrl}`;

  const sector = ((body?.sector as string) ?? "professional").trim();
  const generatePreview = body?.generatePreview !== false; // default true

  const { scrapeWebsite, buildProjectFromContent, generateSitePreview } =
    await import("@madecreative/shared");

  try {
    // ── Full multi-page crawl ──────────────────────────────────────────────
    const scraped = await scrapeWebsite(targetUrl);

    // ── SEO audit (derived from scraped homepage) ──────────────────────────
    const homepage = scraped.pages.find(p => p.isHomepage);
    const issues: string[] = [];

    const hasH1 = (homepage?.headings ?? []).some(h => h.level === 1);
    const hasMeta = !!homepage?.metaDescription;
    const hasHttps = targetUrl.startsWith("https");
    // We can't check viewport from parsed structure alone — do a raw HTML check
    // on the first page's raw content (re-fetched from scraped data if needed)
    const hasImages = (homepage?.images.length ?? 0) > 0;
    const hasContact = !!(scraped.contact.phone || scraped.contact.email);

    if (!hasHttps) issues.push("Manca HTTPS (sicurezza)");
    if (!hasMeta) issues.push("Manca meta description (SEO)");
    if (!hasH1) issues.push("Manca H1 (struttura SEO)");
    if (!hasImages) issues.push("Nessuna immagine trovata");
    if (!hasContact) issues.push("Nessun contatto trovato");
    if (scraped.totalPages < 2) issues.push("Sito con una sola pagina");

    // Detect platform from URL patterns across crawled pages
    const isWordPress = scraped.pages.some(p => p.url.includes("/wp-content") || p.url.includes("/wp-json"));
    const isWix = scraped.domain.includes("wix") || scraped.pages.some(p => p.url.includes("wixstatic"));
    const isSquarespace = scraped.pages.some(p => p.url.includes("squarespace"));
    const platform = isWordPress ? "WordPress" : isWix ? "Wix" : isSquarespace ? "Squarespace" : "Custom";

    // Score 0-100
    let score = 100;
    if (!hasHttps) score -= 15;
    if (!hasMeta) score -= 15;
    if (!hasH1) score -= 10;
    if (!hasImages) score -= 10;
    if (!hasContact) score -= 10;
    if (scraped.totalPages < 2) score -= 10;
    if (isWordPress) score -= 5;

    // ── Optional preview generation ────────────────────────────────────────
    let previewHtml: string | null = null;
    if (generatePreview && scraped.totalPages > 0) {
      try {
        const pd = buildProjectFromContent(scraped, sector);
        previewHtml = generateSitePreview({ name: pd.businessName, sector }, pd);
      } catch (previewErr) {
        console.error("[analyze-url] preview generation failed:", previewErr instanceof Error ? previewErr.message : previewErr);
        // Non-fatal: return scraped data without preview
      }
    }

    return c.json({
      success: true,
      data: {
        // Legacy SEO audit fields (backward-compat with existing frontend)
        url: scraped.url,
        title: homepage?.title ?? null,
        description: homepage?.metaDescription ?? null,
        ogImage: homepage?.images[0]?.url ?? null,
        h1: homepage?.headings.find(h => h.level === 1)?.text ?? null,
        platform,
        score: Math.max(0, score),
        issues,
        mobile: true,   // can't reliably detect without raw HTML; assume true
        https: hasHttps,
        seo: hasMeta,

        // Rich scraped data
        scraped,

        // Preview HTML (if requested and generation succeeded)
        previewHtml,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Impossibile analizzare il sito";
    console.error("[analyze-url] error:", msg);
    return c.json({
      success: true,
      data: {
        url: targetUrl,
        title: null,
        description: null,
        ogImage: null,
        h1: null,
        platform: "Sconosciuto",
        score: 0,
        issues: ["Sito non raggiungibile o troppo lento"],
        mobile: false,
        https: false,
        seo: false,
        scraped: null,
        previewHtml: null,
        error: msg,
      },
    });
  }
});

export default app;
