import "dotenv/config";
import cron from "node-cron";
import { prisma } from "@madecreative/db";
import type { ReportData } from "@madecreative/shared";
import { PLANS } from "@madecreative/shared";
import path from "path";
import fs from "fs";
import os from "os";

// ─── PDF generation helper ────────────────────────────────────────────────────

async function generatePdf(params: {
  clientName: string;
  month: number;
  year: number;
  reportData: ReportData;
  plan: string;
}): Promise<string> {
  const PDFDocumentModule = await import("pdfkit").catch(() => null);
  if (!PDFDocumentModule) {
    console.warn("[ReportWorker] pdfkit not available, skipping PDF generation");
    return "";
  }

  const PDFDocument =
    "default" in PDFDocumentModule
      ? (PDFDocumentModule as { default: typeof import("pdfkit") }).default
      : (PDFDocumentModule as unknown as typeof import("pdfkit"));

  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
  ];
  const monthName = monthNames[(params.month - 1) % 12] ?? String(params.month);

  const tmpDir = os.tmpdir();
  const filename = `report_${params.clientName.replace(/\W+/g, "_")}_${params.year}_${String(params.month).padStart(2, "0")}.pdf`;
  const filePath = path.join(tmpDir, filename);

  return new Promise<string>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const BRAND_INDIGO = "#4f46e5";
    const BRAND_DARK = "#1e1b4b";
    const GRAY_600 = "#4b5563";
    const GRAY_200 = "#e5e7eb";

    function headerBar() {
      doc.rect(0, 0, doc.page.width, 8).fill(BRAND_INDIGO);
    }

    function sectionTitle(text: string) {
      doc
        .moveDown(0.5)
        .fontSize(13)
        .fillColor(BRAND_DARK)
        .font("Helvetica-Bold")
        .text(text)
        .moveDown(0.2);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor(GRAY_200)
        .lineWidth(1)
        .stroke()
        .moveDown(0.4);
    }

    function kpiRow(label: string, value: string, note?: string) {
      const x = doc.page.margins.left;
      const y = doc.y;
      doc
        .fontSize(10)
        .fillColor(GRAY_600)
        .font("Helvetica")
        .text(label, x, y, { continued: true, width: 250 });
      doc.font("Helvetica-Bold").fillColor(BRAND_DARK).text(value, { align: "right" });
      if (note) {
        doc
          .fontSize(9)
          .fillColor(GRAY_600)
          .font("Helvetica-Oblique")
          .text(note, x, doc.y, { indent: 10 });
      }
      doc.moveDown(0.3);
    }

    function bulletPoint(text: string) {
      doc
        .fontSize(10)
        .fillColor(GRAY_600)
        .font("Helvetica")
        .text(`• ${text}`, { indent: 10 });
      doc.moveDown(0.2);
    }

    function miniBarChart(values: number[], labels: string[]) {
      const maxVal = Math.max(...values, 1);
      const chartX = doc.page.margins.left;
      const chartY = doc.y;
      const barWidth = 18;
      const gap = 4;
      const maxHeight = 50;

      values.forEach((v, i) => {
        const barH = Math.round((v / maxVal) * maxHeight);
        const x = chartX + i * (barWidth + gap);
        const y = chartY + maxHeight - barH;
        doc.rect(x, y, barWidth, barH).fill(BRAND_INDIGO);
        if (labels[i]) {
          doc
            .fontSize(7)
            .fillColor(GRAY_600)
            .font("Helvetica")
            .text(labels[i], x - 2, chartY + maxHeight + 3, {
              width: barWidth + 4,
              align: "center",
            });
        }
      });

      doc.moveDown(5);
    }

    // ── Cover Page ─────────────────────────────────────────────────────────────

    headerBar();

    doc
      .moveDown(4)
      .fontSize(28)
      .fillColor(BRAND_DARK)
      .font("Helvetica-Bold")
      .text("made", { continued: true })
      .fillColor(BRAND_INDIGO)
      .text("creative", { continued: false });

    doc.moveDown(0.3).fontSize(11).fillColor(GRAY_600).font("Helvetica").text(
      "Il tuo partner digitale"
    );

    doc
      .moveDown(3)
      .fontSize(20)
      .fillColor(BRAND_DARK)
      .font("Helvetica-Bold")
      .text("Report Mensile");

    doc
      .moveDown(0.4)
      .fontSize(14)
      .fillColor(BRAND_INDIGO)
      .font("Helvetica-Bold")
      .text(`${monthName} ${params.year}`);

    doc
      .moveDown(1.5)
      .fontSize(12)
      .fillColor(GRAY_600)
      .font("Helvetica")
      .text(`Cliente: ${params.clientName}`);

    doc
      .moveDown(6)
      .fontSize(9)
      .fillColor(GRAY_600)
      .text(
        `Generato il ${new Date().toLocaleDateString("it-IT")} · madecreative.pro`,
        { align: "center" }
      );

    // ── Executive Summary ──────────────────────────────────────────────────────

    doc.addPage();
    headerBar();
    doc.moveDown(1);

    sectionTitle("Executive Summary");

    (params.reportData.insights ?? []).slice(0, 4).forEach((insight) => {
      bulletPoint(insight);
    });

    doc.moveDown(0.5);

    // ── Metriche Sito ─────────────────────────────────────────────────────────

    sectionTitle("Metriche Sito Web");

    kpiRow("Visite mensili", String(params.reportData.metrics.websiteVisits));
    kpiRow("Bounce rate", `${params.reportData.metrics.bounceRate ?? "—"}%`);

    const visits = params.reportData.metrics.websiteVisits;
    const weeklyVisits = [
      Math.round(visits * 0.22),
      Math.round(visits * 0.26),
      Math.round(visits * 0.24),
      Math.round(visits * 0.28),
    ];
    miniBarChart(weeklyVisits, ["Sett 1", "Sett 2", "Sett 3", "Sett 4"]);

    doc.fontSize(10).fillColor(GRAY_600).font("Helvetica-Bold").text("Pagine più visitate:");
    doc.moveDown(0.2);
    ["/ (Homepage)", "/servizi", "/contatti"].forEach((page) => bulletPoint(page));

    doc.moveDown(0.5);
    doc.fontSize(10).fillColor(GRAY_600).font("Helvetica-Bold").text("Fonti traffico:");
    doc.moveDown(0.2);
    [
      "Ricerca organica: 45%",
      "Diretto: 30%",
      "Social media: 15%",
      "Referral: 10%",
    ].forEach((src) => bulletPoint(src));

    // ── Lead Generati ─────────────────────────────────────────────────────────

    doc.addPage();
    headerBar();
    doc.moveDown(1);

    sectionTitle("Lead Generati");

    kpiRow("Totale lead", String(params.reportData.metrics.leadsGenerated));
    kpiRow("Lead convertiti", String(params.reportData.metrics.leadsConverted));
    kpiRow("Tasso di conversione", `${params.reportData.metrics.conversionRate}%`);
    kpiRow(
      "Valore stimato",
      `€${(params.reportData.metrics.leadsGenerated * 150).toLocaleString("it-IT")}`
    );

    doc.moveDown(0.5);
    doc.fontSize(10).fillColor(GRAY_600).font("Helvetica-Bold").text("Lead per fonte:");
    doc.moveDown(0.2);
    ["Chatbot: 40%", "Form contatto: 35%", "Click telefono: 25%"].forEach(
      (src) => bulletPoint(src)
    );

    // ── Chatbot Performance ───────────────────────────────────────────────────

    sectionTitle("Performance Chatbot");

    kpiRow("Conversazioni totali", String(params.reportData.metrics.chatbotConversations));
    kpiRow("Tasso di risoluzione", `${params.reportData.metrics.chatbotResolved ?? 0}%`);

    doc.moveDown(0.5);
    doc.fontSize(10).fillColor(GRAY_600).font("Helvetica-Bold").text("Domande più frequenti:");
    doc.moveDown(0.2);
    [
      "Orari di apertura",
      "Come richiedere un preventivo",
      "Metodi di pagamento accettati",
    ].forEach((q) => bulletPoint(q));

    // ── Automazioni ───────────────────────────────────────────────────────────

    sectionTitle("Automazioni");

    kpiRow("Chatbot attivo", "Sì");
    kpiRow("Risposte automatizzate", `${params.reportData.metrics.chatbotResolved ?? 0}%`);

    // ── Raccomandazioni ────────────────────────────────────────────────────────

    doc.addPage();
    headerBar();
    doc.moveDown(1);

    sectionTitle("Raccomandazioni per il prossimo mese");

    (params.reportData.recommendations ?? []).slice(0, 3).forEach((rec, i) => {
      doc
        .fontSize(10)
        .fillColor(BRAND_DARK)
        .font("Helvetica-Bold")
        .text(`${i + 1}. ${rec}`);
      doc.moveDown(0.3);
    });

    // ── ROI Section ────────────────────────────────────────────────────────────

    doc.moveDown(1);
    sectionTitle("ROI — Valore generato");

    const monthlyAmount = PLANS[params.plan as keyof typeof PLANS]?.price ?? 25;
    const estimatedValue =
      params.reportData.metrics.leadsGenerated * 150 +
      (params.reportData.metrics.websiteVisits / 1000) * 50;

    kpiRow("Costo abbonamento mensile", `€${monthlyAmount}`);
    kpiRow("Valore stimato generato", `€${Math.round(estimatedValue)}`);

    const roiMultiplier =
      monthlyAmount > 0
        ? Math.round((estimatedValue / monthlyAmount) * 10) / 10
        : 0;

    doc
      .moveDown(0.5)
      .fontSize(14)
      .fillColor(BRAND_INDIGO)
      .font("Helvetica-Bold")
      .text(`ROI stimato: ${roiMultiplier}x`)
      .moveDown(0.3);

    doc
      .fontSize(9)
      .fillColor(GRAY_600)
      .font("Helvetica-Oblique")
      .text(
        "* Il valore è stimato sulla base del valore medio per lead del settore e dei costi equivalenti di advertising."
      );

    doc
      .moveDown(3)
      .fontSize(9)
      .fillColor(GRAY_600)
      .font("Helvetica")
      .text(
        `madecreative.pro · ${params.clientName} · ${monthName} ${params.year}`,
        { align: "center" }
      );

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}

// ─── Upload PDF to R2 ─────────────────────────────────────────────────────────

async function uploadPdfToR2(filePath: string, key: string): Promise<string | null> {
  const accountId = process.env["CLOUDFLARE_ACCOUNT_ID"];
  const bucketName = process.env["R2_BUCKET_NAME"];
  const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];

  if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
    console.warn("[ReportWorker] R2 not configured — PDF saved locally at", filePath);
    return null;
  }

  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3").catch(
      () => ({ S3Client: null, PutObjectCommand: null })
    );

    if (!S3Client || !PutObjectCommand) {
      console.warn("[ReportWorker] @aws-sdk/client-s3 not available");
      return null;
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    const body = fs.readFileSync(filePath);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: "application/pdf",
      })
    );

    const publicUrl = `${process.env["R2_PUBLIC_URL"] ?? `https://pub-${accountId}.r2.dev`}/${key}`;
    fs.unlinkSync(filePath);
    return publicUrl;
  } catch (err) {
    console.error("[ReportWorker] R2 upload failed:", err);
    return null;
  }
}

// ─── Core report generation ───────────────────────────────────────────────────

async function generateMonthlyReport(
  clientId: string,
  month: number,
  year: number
): Promise<void> {
  const [client, websiteVisits, chatbotStats] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: { companyName: true, sector: true, email: true, plan: true },
    }),
    prisma.clientWebsite.findFirst({
      where: { clientId, isActive: true },
      select: { monthlyVisits: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.clientChatbot.findUnique({
      where: { clientId },
      select: { totalConversations: true, resolvedRate: true },
    }),
  ]);

  if (!client) {
    console.error(`[ReportWorker] Client ${clientId} not found`);
    return;
  }

  const monthlyVisits = websiteVisits?.monthlyVisits ?? 0;
  const chatbotConversations = chatbotStats?.totalConversations ?? 0;
  const resolvedRate = Math.round((chatbotStats?.resolvedRate ?? 0) * 10) / 10;

  const reportData: ReportData = {
    metrics: {
      websiteVisits: monthlyVisits,
      bounceRate: 38,
      leadsGenerated: 0,
      leadsConverted: 0,
      conversionRate: 0,
      chatbotConversations,
      chatbotResolved: resolvedRate,
    },
    insights: [
      `Il sito ha ricevuto ${monthlyVisits.toLocaleString("it-IT")} visite questo mese`,
      chatbotConversations > 0
        ? `Il chatbot ha gestito ${chatbotConversations} conversazioni (${resolvedRate}% risolte)`
        : "Chatbot attivo — in attesa delle prime conversazioni",
      monthlyVisits > 500
        ? "Traffico in crescita — ottimo segnale per il posizionamento locale"
        : "Il sito è online — la visibilità aumenterà con l'indicizzazione",
    ],
    recommendations: [
      "Assicurati che il tuo sito sia verificato su Google Business Profile",
      chatbotConversations < 20
        ? "Il chatbot impara ogni giorno — più conversazioni, risposte migliori"
        : "Il chatbot sta performando bene — considera di aggiungere nuove FAQ",
      "Condividi il link del tuo sito sui tuoi profili social per aumentare il traffico",
    ],
    nextMonthGoals: [
      `Obiettivo visite: ${Math.ceil(monthlyVisits * 1.2).toLocaleString("it-IT")}`,
      "Ottieni almeno 5 nuove recensioni Google",
    ],
  };

  const pdfPath = await generatePdf({
    clientName: client.companyName,
    month,
    year,
    reportData,
    plan: client.plan,
  });

  let pdfUrl: string | null = null;

  if (pdfPath) {
    const r2Key = `reports/${clientId}/${year}-${String(month).padStart(2, "0")}.pdf`;
    pdfUrl = await uploadPdfToR2(pdfPath, r2Key);
  }

  const existing = await prisma.monthlyReport.findFirst({
    where: { clientId, month, year },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reportJson = reportData as any;

  if (existing) {
    await prisma.monthlyReport.update({
      where: { id: existing.id },
      data: { data: reportJson, pdfUrl },
    });
  } else {
    await prisma.monthlyReport.create({
      data: { clientId, month, year, data: reportJson, pdfUrl },
    });
  }

  console.log(
    `[ReportWorker] Report generated for ${client.companyName} — ${month}/${year}${pdfUrl ? " (PDF uploaded)" : ""}`
  );
}

// ─── Run all active clients ───────────────────────────────────────────────────

async function generateAllMonthlyReports(): Promise<void> {
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  console.log(`[ReportWorker] Generating reports for ${lastMonth}/${year}`);

  const activeClients = await prisma.client.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  console.log(`[ReportWorker] Processing ${activeClients.length} active clients`);

  for (const client of activeClients) {
    await generateMonthlyReport(client.id, lastMonth, year).catch((err) => {
      console.error(`[ReportWorker] Failed for client ${client.id}:`, err);
    });
  }

  console.log("[ReportWorker] Monthly reports complete");
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("[ReportWorker] Starting...");

  cron.schedule("0 8 1 * *", () => {
    generateAllMonthlyReports().catch(console.error);
  });

  if (process.env["RUN_REPORTS_NOW"] === "true") {
    await generateAllMonthlyReports();
  }

  if (process.env["REPORT_CLIENT_ID"]) {
    const now = new Date();
    const month = parseInt(
      process.env["REPORT_MONTH"] ?? String(now.getMonth() + 1),
      10
    );
    const year = parseInt(
      process.env["REPORT_YEAR"] ?? String(now.getFullYear()),
      10
    );
    await generateMonthlyReport(process.env["REPORT_CLIENT_ID"], month, year);
  }

  console.log("[ReportWorker] Running — scheduled for 1st of each month at 08:00");

  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));

  setInterval(() => {}, 60_000);
}

main().catch((err) => {
  console.error("[ReportWorker] Fatal error:", err);
  process.exit(1);
});
