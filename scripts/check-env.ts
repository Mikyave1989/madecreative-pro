/**
 * scripts/check-env.ts
 *
 * Pre-launch environment variable validator.
 * Checks that every required variable is present before deploying or
 * starting any worker. Run this on all services before going live.
 *
 * Usage:
 *   npx tsx scripts/check-env.ts
 *
 * Exit code:
 *   0  — all required vars are set
 *   1  — one or more required vars are missing
 */
import "dotenv/config";

// ---------------------------------------------------------------------------
// Variable definitions
// ---------------------------------------------------------------------------

interface EnvVar {
  key: string;
  description: string;
  required: boolean;
  /** Masks the value in output so secrets are never printed */
  secret?: boolean;
}

const ENV_VARS: EnvVar[] = [
  // ── Database ──────────────────────────────────────────────────────────────
  {
    key: "DATABASE_URL",
    description: "Supabase / PostgreSQL connection string (pooler URL)",
    required: true,
    secret: true,
  },
  {
    key: "DIRECT_URL",
    description: "Supabase direct connection string (for migrations)",
    required: false,
    secret: true,
  },

  // ── Redis ─────────────────────────────────────────────────────────────────
  {
    key: "REDIS_URL",
    description: "Upstash Redis connection URL (BullMQ queues)",
    required: true,
    secret: true,
  },

  // ── AI ────────────────────────────────────────────────────────────────────
  {
    key: "ANTHROPIC_API_KEY",
    description: "Anthropic Claude API key",
    required: true,
    secret: true,
  },

  // ── Email ─────────────────────────────────────────────────────────────────
  {
    key: "RESEND_API_KEY",
    description: "Resend email delivery API key",
    required: true,
    secret: true,
  },
  {
    key: "EMAIL_DOMAIN",
    description: "Sender domain (e.g. madecreative.pro)",
    required: false,
  },

  // ── Stripe ────────────────────────────────────────────────────────────────
  {
    key: "STRIPE_SECRET_KEY",
    description: "Stripe secret key (sk_live_... or sk_test_...)",
    required: true,
    secret: true,
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    description: "Stripe webhook signing secret (whsec_...)",
    required: true,
    secret: true,
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  {
    key: "JWT_SECRET",
    description: "JWT signing secret (min 32 chars)",
    required: true,
    secret: true,
  },
  {
    key: "JWT_REFRESH_SECRET",
    description: "JWT refresh token signing secret",
    required: false,
    secret: true,
  },

  // ── URLs ──────────────────────────────────────────────────────────────────
  {
    key: "API_URL",
    description: "Public API base URL (https://api.madecreative.pro)",
    required: true,
  },
  {
    key: "PORTAL_URL",
    description: "Client portal URL (https://app.madecreative.pro)",
    required: true,
  },
  {
    key: "ADMIN_URL",
    description: "Admin panel URL (https://admin.madecreative.pro)",
    required: true,
  },
  {
    key: "MARKETING_URL",
    description: "Marketing site URL (https://madecreative.pro)",
    required: true,
  },

  // ── Cloudflare R2 ─────────────────────────────────────────────────────────
  {
    key: "CLOUDFLARE_R2_BUCKET",
    description: "R2 bucket name for asset storage",
    required: true,
  },
  {
    key: "CLOUDFLARE_R2_ACCESS_KEY",
    description: "R2 access key ID",
    required: true,
    secret: true,
  },
  {
    key: "CLOUDFLARE_R2_SECRET_KEY",
    description: "R2 secret access key",
    required: true,
    secret: true,
  },

  // ── Scraping ──────────────────────────────────────────────────────────────
  {
    key: "BRIGHTDATA_API_KEY",
    description: "BrightData proxy API key",
    required: false,
    secret: true,
  },
  {
    key: "GOOGLE_MAPS_API_KEY",
    description: "Google Maps Places API key",
    required: false,
    secret: true,
  },

  // ── Social / Meta ─────────────────────────────────────────────────────────
  {
    key: "META_APP_ID",
    description: "Meta (Facebook/Instagram) App ID",
    required: false,
  },
  {
    key: "META_APP_SECRET",
    description: "Meta App secret",
    required: false,
    secret: true,
  },
  {
    key: "SOCIAL_ENCRYPTION_KEY",
    description: "AES key for encrypting stored social tokens (32 chars)",
    required: false,
    secret: true,
  },

  // ── Monitoring ────────────────────────────────────────────────────────────
  {
    key: "SENTRY_DSN",
    description: "Sentry DSN for error tracking",
    required: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskValue(value: string): string {
  if (value.length <= 8) return "****";
  return value.slice(0, 4) + "****" + value.slice(-4);
}

function formatKey(key: string, width = 36): string {
  return key.padEnd(width);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function checkEnv(): void {
  console.log("=".repeat(70));
  console.log("  MadeCreative — Pre-Launch Environment Check");
  console.log("=".repeat(70));
  console.log();

  const required = ENV_VARS.filter((v) => v.required);
  const optional = ENV_VARS.filter((v) => !v.required);

  let requiredMissing = 0;

  // ── Required variables ──────────────────────────────────────────────────
  console.log("REQUIRED VARIABLES:");
  console.log("-".repeat(70));

  for (const envVar of required) {
    const value = process.env[envVar.key];
    const present = value !== undefined && value.trim() !== "";
    const indicator = present ? "OK" : "MISSING";
    const display = present
      ? envVar.secret
        ? `  (${maskValue(value!)})`
        : `  ${value!.slice(0, 40)}${value!.length > 40 ? "..." : ""}`
      : "";

    console.log(`  [${indicator}]  ${formatKey(envVar.key)}${display}`);

    if (!present) {
      console.log(`         ^ ${envVar.description}`);
      requiredMissing++;
    }
  }

  console.log();

  // ── Optional variables ──────────────────────────────────────────────────
  console.log("OPTIONAL VARIABLES:");
  console.log("-".repeat(70));

  let optionalMissing = 0;
  for (const envVar of optional) {
    const value = process.env[envVar.key];
    const present = value !== undefined && value.trim() !== "";
    const indicator = present ? "OK" : "NOT SET";

    console.log(`  [${indicator.padEnd(7)}]  ${formatKey(envVar.key)}`);

    if (!present) {
      console.log(`             ^ ${envVar.description}`);
      optionalMissing++;
    }
  }

  console.log();

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));
  console.log();
  console.log(
    `  Required : ${required.length - requiredMissing}/${required.length} present` +
      (requiredMissing > 0 ? `  (${requiredMissing} MISSING)` : "")
  );
  console.log(
    `  Optional : ${optional.length - optionalMissing}/${optional.length} present` +
      (optionalMissing > 0 ? `  (${optionalMissing} not set)` : "")
  );
  console.log();

  if (requiredMissing > 0) {
    console.log(
      `  RESULT: FAIL — ${requiredMissing} required variable(s) are missing.`
    );
    console.log("  Set them in your .env file or deployment environment.");
    console.log();
    process.exit(1);
  } else {
    console.log("  RESULT: PASS — All required variables are set.");
    console.log("  You are clear to deploy.");
    console.log();
  }
}

checkEnv();
