import "dotenv/config";
import { Worker, Queue } from "bullmq";
import { Redis as IORedis } from "ioredis";
import { prisma } from "@madecreative/db";

// ─── Redis ────────────────────────────────────────────────────────────────────

function createRedis(): IORedis {
  const url = process.env["REDIS_URL"];
  if (!url) throw new Error("REDIS_URL is not set");
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// ─── Sector automations ───────────────────────────────────────────────────────

interface SectorAutomation {
  name: string;
  type: string;
  trigger: string;
}

const SECTOR_AUTOMATIONS: Record<string, SectorAutomation[]> = {
  restaurant: [
    { name: "Risposta automatica form contatto", type: "email_reply", trigger: "form_submit" },
    { name: "Richiesta recensione post-visita", type: "review_request", trigger: "7_days_after_booking" },
    { name: "Newsletter mensile", type: "newsletter", trigger: "monthly" },
  ],
  dental: [
    { name: "Promemoria appuntamento", type: "appointment_reminder", trigger: "24h_before" },
    { name: "Risposta form emergenza", type: "email_reply", trigger: "form_submit" },
    { name: "Follow-up post-visita", type: "followup", trigger: "3_days_after_appointment" },
  ],
  beauty: [
    { name: "Reminder appuntamento beauty", type: "appointment_reminder", trigger: "24h_before" },
    { name: "Risposta prenotazione online", type: "email_reply", trigger: "form_submit" },
    { name: "Offerta fedeltà mensile", type: "newsletter", trigger: "monthly" },
  ],
  fitness: [
    { name: "Benvenuto nuovo iscritto", type: "email_reply", trigger: "form_submit" },
    { name: "Reminder rinnovo abbonamento", type: "appointment_reminder", trigger: "7_days_before_expiry" },
    { name: "Motivazione settimanale", type: "newsletter", trigger: "weekly" },
  ],
  hotel: [
    { name: "Conferma prenotazione", type: "email_reply", trigger: "form_submit" },
    { name: "Richiesta recensione post-soggiorno", type: "review_request", trigger: "1_day_after_checkout" },
    { name: "Offerta ritorno", type: "newsletter", trigger: "30_days_after_checkout" },
  ],
  legal: [
    { name: "Conferma richiesta consulenza", type: "email_reply", trigger: "form_submit" },
    { name: "Follow-up pratica", type: "followup", trigger: "7_days_after_contact" },
    { name: "Newsletter aggiornamenti legali", type: "newsletter", trigger: "monthly" },
  ],
  medical: [
    { name: "Conferma appuntamento medico", type: "appointment_reminder", trigger: "24h_before" },
    { name: "Risposta richiesta urgente", type: "email_reply", trigger: "form_submit" },
    { name: "Follow-up post-visita", type: "followup", trigger: "3_days_after_appointment" },
  ],
  ecommerce: [
    { name: "Risposta richiesta prodotto", type: "email_reply", trigger: "form_submit" },
    { name: "Richiesta recensione acquisto", type: "review_request", trigger: "7_days_after_purchase" },
    { name: "Newsletter promozioni mensili", type: "newsletter", trigger: "monthly" },
  ],
  realestate: [
    { name: "Risposta richiesta immobile", type: "email_reply", trigger: "form_submit" },
    { name: "Follow-up visita immobile", type: "followup", trigger: "2_days_after_visit" },
    { name: "Newsletter nuovi immobili", type: "newsletter", trigger: "weekly" },
  ],
  professional: [
    { name: "Conferma richiesta preventivo", type: "email_reply", trigger: "form_submit" },
    { name: "Follow-up proposta commerciale", type: "followup", trigger: "5_days_after_proposal" },
    { name: "Newsletter aggiornamenti settore", type: "newsletter", trigger: "monthly" },
  ],
};

function getAutomationsForSector(sector: string): SectorAutomation[] {
  return (
    SECTOR_AUTOMATIONS[sector] ??
    SECTOR_AUTOMATIONS["professional"] ?? [
      { name: "Risposta automatica form contatto", type: "email_reply", trigger: "form_submit" },
      { name: "Follow-up lead", type: "followup", trigger: "3_days_after_contact" },
      { name: "Newsletter mensile", type: "newsletter", trigger: "monthly" },
    ]
  );
}

// ─── Resend helper ────────────────────────────────────────────────────────────

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.warn("[OnboardingWorker] RESEND_API_KEY not set — skipping email");
    return;
  }

  const domain = process.env["EMAIL_DOMAIN"] ?? "madecreative.pro";
  const from = params.from ?? `MadeCreative <onboarding@${domain}>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend error ${response.status}: ${text}`);
  }
}

// ─── Welcome email template ───────────────────────────────────────────────────

function buildWelcomeEmail(params: {
  contactName: string;
  companyName: string;
  email: string;
  tempPassword: string;
  siteUrl: string;
  portalUrl: string;
  language: string;
}): { subject: string; html: string } {
  const { contactName, companyName, tempPassword, siteUrl, portalUrl } = params;

  const subject = `Il tuo sito è live! Benvenuto in MadeCreative`;
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="color:#00f0ff;font-size:28px;font-weight:900;letter-spacing:4px;margin:0;">MADECREATIVE</h1>
    </div>

    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#0f0f1a,#1a0f2e);border:1px solid #00f0ff30;border-radius:12px;padding:32px;margin-bottom:24px;">
      <h2 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px 0;">
        Ciao ${contactName}! Il tuo sito è live.
      </h2>
      <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
        Benvenuto in MadeCreative. Il sito di <strong style="color:#00f0ff;">${companyName}</strong>
        è stato configurato e pubblicato. Ecco tutto quello che ti serve per iniziare.
      </p>
      <a href="${siteUrl}" style="display:inline-block;background:#00f0ff;color:#000000;font-weight:700;font-size:14px;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:1px;">
        VISITA IL TUO SITO
      </a>
    </div>

    <!-- Credentials -->
    <div style="background:#0f0f1a;border:1px solid #a855f730;border-radius:12px;padding:24px;margin-bottom:24px;">
      <h3 style="color:#a855f7;font-size:14px;font-weight:700;letter-spacing:2px;margin:0 0 16px 0;text-transform:uppercase;">
        Credenziali Portale
      </h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:13px;">URL Portale</td>
          <td style="padding:8px 0;color:#e2e8f0;font-size:13px;text-align:right;">
            <a href="${portalUrl}" style="color:#00f0ff;">${portalUrl}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:13px;">Email</td>
          <td style="padding:8px 0;color:#e2e8f0;font-size:13px;text-align:right;">${params.email}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:13px;">Password temporanea</td>
          <td style="padding:8px 0;color:#f59e0b;font-size:13px;font-weight:700;text-align:right;font-family:monospace;">${tempPassword}</td>
        </tr>
      </table>
      <p style="color:#64748b;font-size:12px;margin:12px 0 0 0;">
        Cambia la password al primo accesso. Link valido per 24 ore.
      </p>
    </div>

    <!-- Next steps -->
    <div style="background:#0f0f1a;border:1px solid #22c55e30;border-radius:12px;padding:24px;margin-bottom:24px;">
      <h3 style="color:#22c55e;font-size:14px;font-weight:700;letter-spacing:2px;margin:0 0 16px 0;text-transform:uppercase;">
        Prossimi Passi
      </h3>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="color:#22c55e;font-size:18px;line-height:1;">1.</span>
          <p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.5;">
            <strong style="color:#e2e8f0;">Accedi al portale</strong> per vedere le statistiche del tuo sito e gestire le automazioni.
          </p>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="color:#22c55e;font-size:18px;line-height:1;">2.</span>
          <p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.5;">
            <strong style="color:#e2e8f0;">Condividi il link del sito</strong> sui tuoi profili social e con i tuoi clienti.
          </p>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="color:#22c55e;font-size:18px;line-height:1;">3.</span>
          <p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.5;">
            <strong style="color:#e2e8f0;">Il chatbot AI</strong> è già attivo sul tuo sito per rispondere alle domande dei visitatori.
          </p>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${portalUrl}" style="display:inline-block;background:transparent;color:#a855f7;font-weight:700;font-size:14px;padding:14px 28px;border-radius:8px;border:1px solid #a855f7;text-decoration:none;letter-spacing:1px;">
        ACCEDI AL PORTALE
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;border-top:1px solid #1e293b;padding-top:24px;">
      <p style="color:#334155;font-size:12px;margin:0;">
        © ${new Date().getFullYear()} MadeCreative — Supporto: <a href="mailto:support@madecreative.pro" style="color:#00f0ff;">support@madecreative.pro</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

// ─── Nurturing email templates ────────────────────────────────────────────────

interface NurturingEmail {
  delayMs: number;
  subject: string;
  html: string;
}

function buildNurturingEmails(params: {
  contactName: string;
  companyName: string;
  siteUrl: string;
  portalUrl: string;
}): NurturingEmail[] {
  const { contactName, companyName, siteUrl, portalUrl } = params;

  const DAY = 24 * 60 * 60 * 1000;

  return [
    {
      delayMs: 1 * DAY,
      subject: `${companyName}: il tuo sito è live! Ecco come condividerlo`,
      html: `<p>Ciao ${contactName},</p>
<p>Il tuo sito <strong>${companyName}</strong> è online da 24 ore. Ecco come condividerlo al meglio:</p>
<ul>
  <li>Aggiungi il link alla bio di Instagram e Facebook</li>
  <li>Includilo nel tuo biglietto da visita digitale</li>
  <li>Condividilo su WhatsApp Business</li>
</ul>
<p>Visita il tuo sito: <a href="${siteUrl}">${siteUrl}</a></p>
<p>Il team MadeCreative</p>`,
    },
    {
      delayMs: 3 * DAY,
      subject: `${companyName}: hai già ricevuto le prime visite`,
      html: `<p>Ciao ${contactName},</p>
<p>Il tuo sito ha già iniziato a ricevere visite! Accedi al portale per vedere le statistiche in tempo reale.</p>
<p><a href="${portalUrl}">Accedi al portale</a></p>
<p>Il team MadeCreative</p>`,
    },
    {
      delayMs: 7 * DAY,
      subject: `Report della prima settimana — ${companyName}`,
      html: `<p>Ciao ${contactName},</p>
<p>La prima settimana con MadeCreative è trascorsa. Accedi al portale per vedere il report completo delle performance del tuo sito.</p>
<p>Il chatbot ha già risposto a diverse domande dei tuoi visitatori, e le automazioni stanno lavorando in background per te.</p>
<p><a href="${portalUrl}">Vedi il report</a></p>
<p>Il team MadeCreative</p>`,
    },
    {
      delayMs: 14 * DAY,
      subject: `Suggerimento: aggiungi le tue foto reali — ${companyName}`,
      html: `<p>Ciao ${contactName},</p>
<p>Un suggerimento per migliorare ulteriormente il tuo sito: aggiungi foto reali della tua attività! I siti con foto autentiche convertono il 40% in più.</p>
<p>Puoi caricare le foto direttamente dal portale, nella sezione "Sito Web".</p>
<p><a href="${portalUrl}">Carica le tue foto</a></p>
<p>Il team MadeCreative</p>`,
    },
    {
      delayMs: 30 * DAY,
      subject: `Il tuo primo mese con MadeCreative — ${companyName}`,
      html: `<p>Ciao ${contactName},</p>
<p>Un mese insieme! Accedi al portale per vedere il report mensile completo: visite, lead generati, conversazioni chatbot e molto altro.</p>
<p>Se hai domande o vuoi espandere i tuoi servizi, siamo qui per te.</p>
<p><a href="${portalUrl}">Vedi il report mensile</a></p>
<p>Il team MadeCreative</p>`,
    },
  ];
}

// ─── Onboarding job data ──────────────────────────────────────────────────────

interface OnboardingJobData {
  clientId: string;
  prospectId: string | null;
  tempPassword: string;
}

// ─── Main onboarding processor ────────────────────────────────────────────────

async function processOnboarding(
  data: OnboardingJobData,
  redis: IORedis
): Promise<void> {
  const { clientId, tempPassword } = data;
  const portalUrl = process.env["PORTAL_URL"] ?? "https://app.madecreative.pro";

  console.log(`[OnboardingWorker] Starting onboarding for client ${clientId}`);

  // ── Phase 1: Load client ───────────────────────────────────────────────────
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { websites: true },
  });

  if (!client) {
    throw new Error(`Client ${clientId} not found`);
  }

  console.log(`[OnboardingWorker] Phase 1: Setup account for ${client.companyName}`);

  // Store temp credentials in Redis (TTL 24h)
  await redis.set(
    `onboarding:temp_password:${clientId}`,
    tempPassword,
    "EX",
    86400
  );

  // ── Phase 2: Website setup ─────────────────────────────────────────────────
  console.log(`[OnboardingWorker] Phase 2: Website setup`);

  const slug = client.companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const subdomain = `${slug}.madecreative.pro`;

  // Create or update website record
  let website = client.websites[0];
  if (!website) {
    website = await prisma.clientWebsite.create({
      data: {
        clientId,
        name: `${client.companyName} — Website`,
        domain: subdomain,
        status: "BUILDING",
        pages: [],
        monthlyVisits: 0,
      },
    });
  } else {
    website = await prisma.clientWebsite.update({
      where: { id: website.id },
      data: {
        domain: subdomain,
        status: "BUILDING",
      },
    });
  }

  // Simulate deploy (Vercel API integration would go here)
  await new Promise((resolve) => setTimeout(resolve, 500));

  await prisma.clientWebsite.update({
    where: { id: website.id },
    data: {
      status: "LIVE",
      deployUrl: `https://${subdomain}`,
    },
  });

  const siteUrl = `https://${subdomain}`;
  console.log(`[OnboardingWorker] Site deployed to ${siteUrl}`);

  // ── Phase 3: Chatbot ───────────────────────────────────────────────────────
  console.log(`[OnboardingWorker] Phase 3: Chatbot setup`);

  const existingChatbot = await prisma.clientChatbot.findFirst({
    where: { clientId },
  });

  if (!existingChatbot) {
    await prisma.clientChatbot.create({
      data: {
        clientId,
        name: `${client.companyName} Assistant`,
        knowledgeBase: {
          faqs: [],
          businessInfo: {
            name: client.companyName,
            description: `Professional services for ${client.sector}`,
            email: client.email,
            phone: client.phone ?? undefined,
            website: siteUrl,
          },
          services: [],
        },
        personality: {
          tone: "professional",
          language: client.language,
          greeting: `Ciao! Sono l'assistente di ${client.companyName}. Come posso aiutarti?`,
          fallbackMessage: "Mi dispiace, non ho capito. Puoi riformulare la domanda?",
        },
        widgetConfig: {
          position: "bottom-right",
          primaryColor: "#00f0ff",
          title: client.companyName,
          subtitle: "Assistente virtuale",
        },
        isActive: true,
        totalConversations: 0,
        resolvedRate: 0,
      },
    });
  }

  // ── Phase 4: Automations ───────────────────────────────────────────────────
  console.log(`[OnboardingWorker] Phase 4: Activating automations for sector ${client.sector}`);

  const automations = getAutomationsForSector(client.sector);

  for (const automation of automations.slice(0, 5)) {
    const existing = await prisma.clientAutomation.findFirst({
      where: { clientId, name: automation.name },
    });

    if (!existing) {
      await prisma.clientAutomation.create({
        data: {
          clientId,
          name: automation.name,
          type: mapAutomationType(automation.type),
          trigger: { type: automation.trigger, conditions: {} },
          actions: [
            {
              type: automation.type,
              config: { template: "default", language: client.language },
              order: 1,
            },
          ],
          isActive: true,
          runCount: 0,
          timeSaved: 0,
        },
      });
    }
  }

  // ── Phase 5: Welcome email ─────────────────────────────────────────────────
  console.log(`[OnboardingWorker] Phase 5: Sending welcome email`);

  const { subject, html } = buildWelcomeEmail({
    contactName: client.contactName,
    companyName: client.companyName,
    email: client.email,
    tempPassword,
    siteUrl,
    portalUrl,
    language: client.language,
  });

  await sendEmail({ to: client.email, subject, html });

  // ── Phase 6: Nurturing sequence ────────────────────────────────────────────
  console.log(`[OnboardingWorker] Phase 6: Scheduling nurturing sequence`);

  const nurturingEmails = buildNurturingEmails({
    contactName: client.contactName,
    companyName: client.companyName,
    siteUrl,
    portalUrl,
  });

  const nurturingQueue = new Queue("nurturing-queue", { connection: redis });

  for (let i = 0; i < nurturingEmails.length; i++) {
    const email = nurturingEmails[i]!;
    await nurturingQueue.add(
      "send-nurturing",
      {
        clientId,
        to: client.email,
        subject: email.subject,
        html: email.html,
      },
      {
        delay: email.delayMs,
        jobId: `nurturing-${clientId}-day${[1, 3, 7, 14, 30][i]}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      }
    );
  }

  await nurturingQueue.close();

  // ── Mark client as ACTIVE ──────────────────────────────────────────────────
  await prisma.client.update({
    where: { id: clientId },
    data: { status: "ACTIVE" },
  });

  console.log(`[OnboardingWorker] Onboarding complete for ${client.companyName}`);
}

// ─── Map automation type strings ───────────────────────────────────────────────

function mapAutomationType(
  type: string
): "EMAIL_SEQUENCE" | "LEAD_NOTIFICATION" | "REVIEW_REQUEST" | "APPOINTMENT_REMINDER" | "FOLLOW_UP" | "CUSTOM" {
  switch (type) {
    case "email_reply":
      return "EMAIL_SEQUENCE";
    case "review_request":
      return "REVIEW_REQUEST";
    case "appointment_reminder":
      return "APPOINTMENT_REMINDER";
    case "followup":
      return "FOLLOW_UP";
    case "newsletter":
      return "EMAIL_SEQUENCE";
    default:
      return "CUSTOM";
  }
}

// ─── Process nurturing job ────────────────────────────────────────────────────

interface NurturingJobData {
  clientId: string;
  to: string;
  subject: string;
  html: string;
}

async function processNurturing(data: NurturingJobData): Promise<void> {
  const { to, subject, html, clientId } = data;

  // Check if client is still active
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { status: true },
  });

  if (!client || client.status === "CHURNED" || client.status === "SUSPENDED") {
    console.log(`[OnboardingWorker] Skipping nurturing for churned/suspended client ${clientId}`);
    return;
  }

  await sendEmail({ to, subject, html });
  console.log(`[OnboardingWorker] Nurturing email sent to ${to}: ${subject}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("[OnboardingWorker] Starting...");

  const redis = createRedis();

  // Onboarding worker
  const onboardingWorker = new Worker<OnboardingJobData>(
    "onboarding-queue",
    async (job) => {
      console.log(`[OnboardingWorker] Processing job ${job.id}`);
      await processOnboarding(job.data, redis);
    },
    {
      connection: redis,
      concurrency: 2,
    }
  );

  onboardingWorker.on("completed", (job) => {
    console.log(`[OnboardingWorker] Job completed: ${job.id}`);
  });

  onboardingWorker.on("failed", (job, err) => {
    console.error(`[OnboardingWorker] Job failed: ${job?.id}`, err.message);
  });

  // Nurturing worker
  const nurturingWorker = new Worker<NurturingJobData>(
    "nurturing-queue",
    async (job) => {
      await processNurturing(job.data);
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  nurturingWorker.on("completed", (job) => {
    console.log(`[OnboardingWorker] Nurturing job completed: ${job.id}`);
  });

  nurturingWorker.on("failed", (job, err) => {
    console.error(`[OnboardingWorker] Nurturing job failed: ${job?.id}`, err.message);
  });

  const shutdown = async (): Promise<void> => {
    await onboardingWorker.close();
    await nurturingWorker.close();
    await redis.quit();
    console.log("[OnboardingWorker] Gracefully shut down");
    process.exit(0);
  };

  process.on("SIGTERM", () => { void shutdown(); });
  process.on("SIGINT", () => { void shutdown(); });

  console.log("[OnboardingWorker] Running — listening for onboarding and nurturing jobs");
}

main().catch((err) => {
  console.error("[OnboardingWorker] Fatal error:", err);
  process.exit(1);
});
