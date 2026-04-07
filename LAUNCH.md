# MadeCreative — Launch Checklist

Pre-launch checklist for the G28-30 "Primo batch 100 prospect" milestone.
Complete every item in order before marking the platform LIVE.

---

## Phase 1 — Infrastructure

- [ ] **DNS records configured**
  - `madecreative.pro` → Vercel (marketing)
  - `www.madecreative.pro` → Vercel (marketing, redirect or alias)
  - `admin.madecreative.pro` → Vercel (admin)
  - `app.madecreative.pro` → Vercel (portal)
  - `api.madecreative.pro` → Vercel (API)
  - Verify propagation: `dig madecreative.pro` and `dig api.madecreative.pro`

- [ ] **Vercel deployments live**
  - [ ] `apps/marketing` — `https://madecreative.pro` returns HTTP 200
  - [ ] `apps/admin` — `https://admin.madecreative.pro` returns HTTP 200
  - [ ] `apps/portal` — `https://app.madecreative.pro` returns HTTP 200
  - [ ] `apps/api` — `https://api.madecreative.pro/healthz` returns `{"ok":true}`
  - Deploy command: `vercel --prod` in each app directory, or link via Vercel dashboard

- [ ] **Railway workers running (6 services)**
  - [ ] `agent-runner` — status: Active
  - [ ] `scraper-cron` — status: Active
  - [ ] `outreach-worker` — status: Active
  - [ ] `social-worker` — status: Active
  - [ ] `report-worker` — status: Active
  - [ ] `monitoring-worker` — status: Active
  - Deploy: `railway up` from repo root (Railway auto-detects `railway.toml`)

---

## Phase 2 — Data & Services

- [ ] **Supabase database migrated**
  ```bash
  cd apps/api && npx prisma migrate deploy
  ```
  Verify: check Supabase dashboard that all tables exist (Prospect, Client, AgentJob, ScrapeConfig, etc.)

- [ ] **Upstash Redis connected**
  - Confirm `REDIS_URL` points to Upstash EU (Frankfurt) endpoint
  - Test: `redis-cli -u $REDIS_URL ping` returns `PONG`

- [ ] **Stripe webhooks configured**
  - Endpoint: `https://api.madecreative.pro/webhooks/stripe`
  - Events to enable:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_failed`
    - `charge.refunded`
  - Copy webhook signing secret → set `STRIPE_WEBHOOK_SECRET`

- [ ] **Resend domain verified**
  - Domain: `madecreative.pro`
  - Add SPF, DKIM, DMARC DNS records as shown in Resend dashboard
  - Verify: Resend domain status shows "Verified"
  - Test send: `npx tsx scripts/check-env.ts` then send a test email via API

- [ ] **Meta App reviewed (for social posting)**
  - Meta Developer App in "Live" mode (not Development)
  - `instagram_basic`, `instagram_content_publish` permissions approved
  - `pages_manage_posts`, `pages_read_engagement` permissions approved
  - Set `META_APP_ID`, `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`, `META_INSTAGRAM_ACCOUNT_ID`

---

## Phase 3 — Environment Validation

- [ ] **`scripts/check-env.ts` passes on all services**

  Run locally (against production .env):
  ```bash
  npx tsx scripts/check-env.ts
  ```

  Expected output:
  ```
  RESULT: PASS — All required variables are set.
  ```

  Also run on Railway before deploying workers:
  ```bash
  railway run npx tsx scripts/check-env.ts --service agent-runner
  railway run npx tsx scripts/check-env.ts --service scraper-cron
  ```

---

## Phase 4 — First Batch Launch

- [ ] **`scripts/launch-batch.ts` run to seed first scrape config**
  ```bash
  npx tsx scripts/launch-batch.ts
  ```

  Expected output confirms:
  - `ScrapeConfig` "Ristoranti Germania - Batch 1" created
  - `AgentJob` QUEUED with type SCRAPER
  - Target: 100 restaurants in 10 German cities

  The `agent-runner` will pick up the job within 60 seconds of its next poll cycle.

---

## Phase 5 — Monitoring & Validation

- [ ] **Monitor agent logs for first 24 hours**
  ```bash
  # Railway logs (production)
  railway logs --service agent-runner --follow
  railway logs --service scraper-cron --follow

  # Docker (local)
  docker compose logs -f agent-runner scraper-cron
  ```

  Watch for:
  - `[ScraperAgent] Found N places` — scraping is working
  - `[AgentRunner] Job completed` — job finished successfully
  - No `ERROR` or `Fatal` lines

- [ ] **First 100 prospects scraped**
  Verify in Supabase or admin panel:
  ```sql
  SELECT count(*) FROM "Prospect" WHERE source = 'scraper' AND sector = 'restaurant' AND country = 'DE';
  ```
  Expected: >= 100 rows

- [ ] **First 10 emails sent (warming phase)**
  The outreach agent sends in warming mode: Day 1-5 = max 5 emails/day.
  Verify after first outreach run:
  ```sql
  SELECT count(*) FROM "OutreachEmail" WHERE status = 'sent';
  ```
  Check Resend dashboard for delivery confirmations.

---

## Phase 6 — Go Live

- [ ] All checklist items above are complete
- [ ] Admin user created: `ADMIN_EMAIL` / `ADMIN_PASSWORD` set and working
- [ ] First client onboarding flow tested end-to-end (Stripe checkout → portal login)
- [ ] Monitoring worker sending alerts to `ADMIN_ALERT_EMAIL`

**LIVE**

---

## Rollback Procedures

### Vercel rollback
```bash
# List recent deployments
vercel ls

# Promote a previous deployment
vercel rollback <deployment-url>
```

### Railway rollback
```bash
# Redeploy previous build
railway rollback --service <name>
```

### Database rollback
```bash
# Roll back the last migration
cd apps/api && npx prisma migrate resolve --rolled-back <migration-name>

# Or restore from Supabase point-in-time recovery (PITR) via dashboard
```

### Emergency contacts

| Role | Contact |
|------|---------|
| Platform lead | madecreative internal |
| Vercel support | https://vercel.com/support |
| Railway support | https://railway.app/help |
| Supabase support | https://supabase.com/support |
| Resend support | https://resend.com/support |
| Stripe support | https://support.stripe.com |

---

*Last updated: 2026-04-07 — G28-30 launch milestone*
