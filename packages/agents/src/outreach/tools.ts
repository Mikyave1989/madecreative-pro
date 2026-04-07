import type { Tool } from "@anthropic-ai/sdk/resources/messages/index";

export const outreachTools: Tool[] = [
  // ── 1. Generate full 3-email sequence via Claude ──────────────────────────
  {
    name: "generate_email_sequence",
    description:
      "Use Claude to generate a complete 3-email outreach sequence in the prospect's native language. Returns subject, HTML body, plain-text body, fromName, fromEmail for each email.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: { type: "string", description: "The prospect's database ID" },
        language: {
          type: "string",
          description: "ISO language code: de, it, es, fr, nl, en",
        },
        senderName: {
          type: "string",
          description: "Sender display name (e.g. Marco, Anna, Sarah)",
        },
        senderEmail: {
          type: "string",
          description: "Sender email local-part (e.g. marco, anna, sarah)",
        },
      },
      required: ["prospectId", "language", "senderName", "senderEmail"],
    },
  },

  // ── 2. Check daily sending limit ─────────────────────────────────────────
  {
    name: "check_daily_limit",
    description:
      "Check if the daily email sending limit has been reached. Returns current count, limit, and whether sending is blocked.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format",
        },
      },
      required: ["date"],
    },
  },

  // ── 3. Handle domain warming ──────────────────────────────────────────────
  {
    name: "handle_warming",
    description:
      "Get the current domain warming state and effective daily limit. Warming schedule: 5→10→20→50→100→200 emails per 5-day period.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },

  // ── 4. Blacklist check ────────────────────────────────────────────────────
  {
    name: "blacklist_check",
    description:
      "Check if an email address or prospect is in the blacklist (bounced, unsubscribed, or BLACKLISTED status).",
    input_schema: {
      type: "object" as const,
      properties: {
        email: { type: "string", description: "Email address to check" },
        prospectId: { type: "string", description: "Prospect database ID" },
      },
      required: ["email", "prospectId"],
    },
  },

  // ── 5. Save outreach email to DB ──────────────────────────────────────────
  {
    name: "save_outreach_email",
    description:
      "Save a generated outreach email to the database with status 'draft' or 'queued'.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: { type: "string" },
        stepNumber: { type: "number" },
        subject: { type: "string" },
        body: { type: "string", description: "HTML body" },
        bodyPlain: { type: "string", description: "Plain-text body" },
        language: { type: "string" },
        fromName: { type: "string" },
        fromEmail: { type: "string", description: "Local-part only (e.g. marco)" },
        status: {
          type: "string",
          enum: ["draft", "queued"],
          description: "Use 'queued' to immediately schedule for sending",
        },
      },
      required: [
        "prospectId",
        "stepNumber",
        "subject",
        "body",
        "bodyPlain",
        "language",
        "fromName",
        "fromEmail",
      ],
    },
  },

  // ── 6. Send email via Resend ──────────────────────────────────────────────
  {
    name: "send_email",
    description:
      "Send an email via the Resend API. Updates the OutreachEmail record and Prospect status in the database.",
    input_schema: {
      type: "object" as const,
      properties: {
        emailId: {
          type: "string",
          description: "OutreachEmail database ID",
        },
        toEmail: { type: "string" },
        subject: { type: "string" },
        bodyHtml: { type: "string" },
        bodyPlain: { type: "string" },
        fromName: { type: "string" },
        fromEmail: {
          type: "string",
          description: "Local-part only (e.g. marco)",
        },
        prospectId: { type: "string" },
        stepNumber: { type: "number" },
      },
      required: [
        "emailId",
        "toEmail",
        "subject",
        "bodyHtml",
        "bodyPlain",
        "fromName",
        "fromEmail",
        "prospectId",
        "stepNumber",
      ],
    },
  },

  // ── 7. Schedule follow-up emails ──────────────────────────────────────────
  {
    name: "schedule_followup",
    description:
      "Schedule a follow-up email (step 2 or 3) via BullMQ with the appropriate delay.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: { type: "string" },
        emailId: {
          type: "string",
          description: "The sent email ID to track open status",
        },
        stepNumber: {
          type: "number",
          description: "The NEXT step to schedule (2 or 3)",
        },
        delayDays: {
          type: "number",
          description: "Days to wait before sending the follow-up",
        },
      },
      required: ["prospectId", "emailId", "stepNumber", "delayDays"],
    },
  },

  // ── 8. Get prospect details ───────────────────────────────────────────────
  {
    name: "get_prospect_details",
    description:
      "Fetch full prospect details from the database including pain points, preview URL, and previous outreach history.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: { type: "string" },
      },
      required: ["prospectId"],
    },
  },
];
