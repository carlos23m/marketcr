# SINPEpay

Payment infrastructure platform for small businesses in Costa Rica. Accept SINPE Móvil payments via shareable links, reconcile bank SMS automatically, issue invoices, and expose a full REST API — all from a single web dashboard.

## Features

### Core
- **Payment Links** — create and share payment links with amount, client name, expiry, and public QR page
- **Transactions** — auto-reconcile incoming bank SMS (BCR, BN, BAC, Scotiabank, Banco Popular, Promerica) or record payments manually
- **Invoices** — generate and manage invoices per payment
- **Realtime** — live link status updates via Supabase Realtime
- **Team** — owner (`dueno`) and employee (`empleado`) roles; invite team members by link

### Platform (M3)
- **REST API** — public Hono.js API at `/api/v1` with API key auth, Zod validation, and plan-aware rate limiting
- **Webhooks** — register HTTPS endpoints to receive signed event deliveries for your business events
- **POS Mode** — full-screen tablet point-of-sale with numpad, quick items, and live QR display (Pro+)
- **Analytics** — daily revenue chart, bank breakdown, and linear regression month-end forecast (Pro+)
- **Card Payments** — accept card payments on public pay pages via Onvopay (Pro+)
- **Billing** — Starter / Pro / Business subscription plans; 14-day Pro trial on sign-up
- **Plugins** — WooCommerce, Magento, and Tiendanube integration guides
- **Referrals** — unique referral code per business

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + Vite + `<script setup>` |
| State | Pinia |
| Styles | Tailwind CSS |
| Charts | Chart.js + vue-chartjs |
| API | Hono.js (Node.js Vercel Functions) |
| Validation | Zod + @hono/zod-validator |
| Rate limiting | Upstash Redis (sliding window) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Edge Functions | Supabase Edge Functions (Deno) |
| Billing | Onvopay (checkout sessions + webhooks) |
| SMS ingestion | Twilio (inbound SMS webhook) |
| Deployment | Vercel |

## Project Structure

```
src/
├── components/
│   ├── billing/        # PlanCard, UsageMeter, UpgradeBanner
│   ├── dashboard/      # StatsCard, RevenueChart, RecentPaymentsTable
│   ├── layout/         # AppShell, AppSidebar, AppTopbar
│   └── ui/             # AppButton, AppCard, AppModal
├── composables/
│   ├── usePlanLimits.js   # plan-aware feature gates
│   └── usePermissions.js
├── lib/
│   ├── database.js     # Supabase query helpers
│   └── supabase.js     # Supabase client
├── stores/
│   ├── useAuthStore.js
│   ├── useBillingStore.js
│   ├── useApiKeysStore.js
│   ├── usePaymentsStore.js
│   ├── useTransactionsStore.js
│   └── useInvoicesStore.js
└── views/
    ├── auth/           # Login, Register, Onboarding, ResetPassword, InviteAccept
    ├── public/         # PayView (public payment page)
    ├── AnalyticsView.vue
    ├── ApiDocsView.vue
    ├── BillingView.vue
    ├── PosView.vue
    ├── PluginsView.vue
    └── ...             # Dashboard, PaymentLinks, Transactions, Invoices, Settings

api/
├── _lib/
│   ├── supabase.js     # adminClient() + userClient()
│   └── plans.js        # PLAN_LIMITS, effectivePlan(), planGte()
├── _middleware.js      # API key auth + rate limiting
├── v1/
│   ├── [[...route]].js # Hono catch-all router
│   └── routes/         # links, transactions, webhooks, me, auth
├── onvopay/
│   └── webhook.js      # Onvopay subscription lifecycle
└── sms/
    └── inbound.js      # Twilio SMS ingestion + auto-reconciliation

supabase/
├── functions/
│   ├── create-onvo-checkout/   # Onvopay hosted checkout session
│   ├── create-payment-intent/  # Card payment intent for PayView
│   └── fire-webhooks/          # Outbound webhook delivery + failure tracking
└── migrations/
    ├── 001_core_tables.sql
    ├── 002_rls_policies.sql
    ├── 003_profile_trigger.sql
    ├── 004_public_read_policies.sql
    ├── 005_security_hardening.sql
    ├── 006_api_keys.sql        # api_keys, webhook_endpoints, webhook_deliveries
    ├── 007_billing.sql         # plan/trial/Onvopay columns + my_plan()
    ├── 008_twilio_quick_items.sql
    └── 009_referrals.sql
```

## Environment Variables

Create `.env.local` at the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-jwt>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Onvopay
VITE_ONVO_PUBLISHABLE_KEY=onvo_live_publishable_key_...
ONVO_SECRET_KEY=onvo_live_secret_key_...
ONVO_WEBHOOK_SECRET=<random-32-byte-base64url>
ONVO_PRO_PRICE_ID=<price-id>
ONVO_BUSINESS_PRICE_ID=<price-id>

# Twilio (SMS ingestion — Pro feature)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# API infrastructure
API_JWT_SECRET=<random-secret>
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Feature flags
VITE_API_DOCS_ENABLED=true
```

The same variables (except `VITE_*`) must also be set in Vercel and as Supabase Edge Function secrets.

## Local Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. API routes under `/api/*` require a Vercel dev server:

```bash
npx vercel dev
```

## Database Migrations

Run migrations **in order** in the Supabase SQL Editor:

| File | Purpose |
|---|---|
| `001_core_tables.sql` | businesses, profiles, payment_links, transactions, invoices |
| `002_rls_policies.sql` | Row-level security policies |
| `003_profile_trigger.sql` | Auto-create profile on auth.users insert |
| `004_public_read_policies.sql` | Public read for payment link pages |
| `005_security_hardening.sql` | Additional RLS hardening |
| `006_api_keys.sql` | api_keys, webhook_endpoints, webhook_deliveries |
| `007_billing.sql` | plan/trial columns + 14-day trial trigger + my_plan() |
| `008_twilio_quick_items.sql` | twilio_number + quick_items columns |
| `009_referrals.sql` | referrals table + referral_code column |

## REST API

Base URL: `https://marketcr.vercel.app/api/v1`

Authentication via `Authorization: Bearer sp_live_...` (API key). Keys are managed in the **Developers** section of the dashboard.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Business info + usage counters |
| GET/POST | `/links` | List or create payment links |
| GET/PATCH/DELETE | `/links/:id` | Get, update, or delete a link |
| GET/POST | `/transactions` | List or record transactions |
| GET/PATCH/DELETE | `/transactions/:id` | Get, update, or delete a transaction |
| GET/POST | `/webhooks` | List or register webhook endpoints |
| GET/PATCH/DELETE | `/webhooks/:id` | Manage a webhook endpoint |
| GET | `/webhooks/:id/deliveries` | Delivery history for an endpoint |
| POST | `/webhooks/:id/redeliver` | Retry the last failed delivery |
| GET/POST | `/keys` | List or create API keys (session auth) |
| DELETE | `/keys/:id` | Revoke an API key (session auth) |

### Rate limits

| Plan | Requests / minute |
|---|---|
| Starter | 30 |
| Pro | 120 |
| Business | 600 |

## Subscription Plans

| Feature | Starter | Pro | Business |
|---|---|---|---|
| Payment links / month | 50 | Unlimited | Unlimited |
| REST API access | — | Yes | Yes |
| Webhooks | — | Yes | Yes |
| Auto SMS reconciliation | — | Yes | Yes |
| Card payments (PayView) | — | Yes | Yes |
| POS mode | — | Yes | Yes |
| Analytics | — | Yes | Yes |
| Remove branding | — | — | Yes |
| Team members | 1 | 3 | Unlimited |

New accounts start with a **14-day Pro trial** automatically.

## Deployment

1. Push to `main` — Vercel auto-deploys via Git integration.
2. Set all non-`VITE_*` environment variables in the Vercel dashboard or via CLI:
   ```bash
   npx vercel env add ONVO_SECRET_KEY production
   ```
3. Deploy Supabase Edge Functions:
   ```bash
   npx supabase functions deploy create-onvo-checkout
   npx supabase functions deploy create-payment-intent
   npx supabase functions deploy fire-webhooks
   ```
4. Set Edge Function secrets:
   ```bash
   npx supabase secrets set ONVO_SECRET_KEY=... ONVO_PRO_PRICE_ID=... ONVO_BUSINESS_PRICE_ID=... APP_URL=https://marketcr.vercel.app
   ```
5. Register the Onvopay webhook in the Onvopay dashboard:
   - URL: `https://marketcr.vercel.app/api/onvopay/webhook`
   - Events: `payment-intent.succeeded`, `subscription.updated`, `subscription.cancelled`, `payment-intent.failed`
   - Signing secret: value of `ONVO_WEBHOOK_SECRET`
6. Configure your Twilio number to forward inbound SMS to `https://marketcr.vercel.app/api/sms/inbound`.
