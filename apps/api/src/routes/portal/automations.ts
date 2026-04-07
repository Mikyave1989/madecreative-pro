import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@madecreative/db";
import { PLANS } from "@madecreative/shared";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };

const app = new Hono<{ Variables: Variables }>();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ToggleAutomationSchema = z.object({
  isActive: z.boolean(),
});

const CreateAutomationSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["email_reply", "reminder", "newsletter", "review_request"]),
  trigger: z.record(z.unknown()),
  actions: z.array(z.record(z.unknown())),
});

// ─── Default automation templates by sector ───────────────────────────────────

const DEFAULT_AUTOMATION_TEMPLATES: Array<{
  name: string;
  description: string;
  type: string;
  trigger: Record<string, unknown>;
  actions: Record<string, unknown>[];
}> = [
  {
    name: "Risposta automatica ai lead",
    description:
      "Invia un'email di benvenuto automatica quando arriva un nuovo lead dal sito",
    type: "email_reply",
    trigger: { event: "new_lead", source: "website" },
    actions: [
      {
        type: "send_email",
        template: "lead_welcome",
        delay_minutes: 0,
      },
    ],
  },
  {
    name: "Promemoria preventivo",
    description:
      "Invia un promemoria dopo 3 giorni se il lead non ha risposto al preventivo",
    type: "reminder",
    trigger: { event: "no_reply", after_days: 3, previous_action: "quote_sent" },
    actions: [
      {
        type: "send_email",
        template: "quote_followup",
        delay_minutes: 0,
      },
    ],
  },
  {
    name: "Richiesta recensione",
    description:
      "Chiedi una recensione Google 7 giorni dopo il completamento del servizio",
    type: "review_request",
    trigger: { event: "service_completed", after_days: 7 },
    actions: [
      {
        type: "send_email",
        template: "review_request",
        delay_minutes: 0,
      },
    ],
  },
];

// ─── GET /portal/automations ──────────────────────────────────────────────────

app.get("/", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { plan: true },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  const automations = await prisma.clientAutomation.findMany({
    where: { clientId },
    orderBy: { createdAt: "asc" },
  });

  // If client has no automations yet, seed defaults
  if (automations.length === 0) {
    const created = await Promise.all(
      DEFAULT_AUTOMATION_TEMPLATES.map((tpl) =>
        prisma.clientAutomation.create({
          data: {
            clientId,
            name: tpl.name,
            description: tpl.description,
            type: tpl.type,
            trigger: tpl.trigger,
            actions: tpl.actions,
            isActive: true,
          },
        })
      )
    );

    const planConfig = PLANS[client.plan];
    const limit = planConfig?.limits.maxAutomations ?? 3;

    return c.json({
      success: true,
      data: {
        automations: created,
        plan: client.plan,
        limit,
        canCreate: ["GROWTH", "ENTERPRISE"].includes(client.plan),
      },
    });
  }

  const planConfig = PLANS[client.plan];
  const limit = planConfig?.limits.maxAutomations ?? 3;

  // Aggregate stats
  type AutomationRow = (typeof automations)[number];
  const totalActive = automations.filter((a: AutomationRow) => a.isActive).length;
  const totalTimeSavedMinutes = automations.reduce(
    (acc: number, a: AutomationRow) => acc + a.timeSaved,
    0
  );
  const totalRuns = automations.reduce((acc: number, a: AutomationRow) => acc + a.runCount, 0);

  // Estimate next execution (dummy: next full hour)
  const now = new Date();
  const nextExecution = new Date(now);
  nextExecution.setMinutes(0, 0, 0);
  nextExecution.setHours(nextExecution.getHours() + 1);

  return c.json({
    success: true,
    data: {
      automations,
      plan: client.plan,
      limit,
      canCreate: ["GROWTH", "ENTERPRISE"].includes(client.plan),
      stats: {
        totalActive,
        totalRuns,
        timeSavedHours: Math.round((totalTimeSavedMinutes / 60) * 10) / 10,
        nextExecution: nextExecution.toISOString(),
      },
    },
  });
});

// ─── PATCH /portal/automations/:id ───────────────────────────────────────────

app.patch("/:id", async (c) => {
  const clientId = c.get("jwtPayload").sub;
  const id = c.req.param("id");

  const body = await c.req.json().catch(() => ({}));
  const parsed = ToggleAutomationSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      400
    );
  }

  const automation = await prisma.clientAutomation.findFirst({
    where: { id, clientId },
  });

  if (!automation) {
    return c.json({ success: false, error: "Automation not found" }, 404);
  }

  const updated = await prisma.clientAutomation.update({
    where: { id },
    data: { isActive: parsed.data.isActive },
  });

  return c.json({ success: true, data: updated });
});

// ─── POST /portal/automations ─────────────────────────────────────────────────

app.post("/", async (c) => {
  const clientId = c.get("jwtPayload").sub;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { plan: true },
  });

  if (!client) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  if (!["GROWTH", "ENTERPRISE"].includes(client.plan)) {
    return c.json(
      {
        success: false,
        error:
          "La creazione di automazioni personalizzate richiede il piano GROWTH o ENTERPRISE",
      },
      403
    );
  }

  const planConfig = PLANS[client.plan];
  const limit = planConfig?.limits.maxAutomations ?? 3;

  const currentCount = await prisma.clientAutomation.count({
    where: { clientId },
  });

  if (currentCount >= limit) {
    return c.json(
      {
        success: false,
        error: `Hai raggiunto il limite di ${limit} automazioni per il piano ${client.plan}`,
      },
      403
    );
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateAutomationSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      400
    );
  }

  const automation = await prisma.clientAutomation.create({
    data: {
      clientId,
      name: parsed.data.name,
      description: parsed.data.description,
      type: parsed.data.type,
      trigger: parsed.data.trigger,
      actions: parsed.data.actions,
      isActive: true,
    },
  });

  return c.json({ success: true, data: automation }, 201);
});

export default app;
