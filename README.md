# 🔒 LedgerLock

**AI-powered guardrails for your business finances. Your money moves only when you say so.**

Built for the [Auth0 "Authorized to Act" Hackathon](https://auth0hackathon.devpost.com) · $10,000 prize pool

---

## What is LedgerLock?

LedgerLock is an agentic AI application that protects SME business finances from internal staff fraud — both outgoing (staff diverting payments to personal accounts) and incoming (staff giving customers their personal account instead of the company's).

The core AI agent, **Elf**, sits between every financial operation and your bank accounts. Using **Auth0 Token Vault** as the identity and credential layer, Elf ensures no staff member ever touches a raw credential — and uses **Auth0 CIBA** (Client-Initiated Backchannel Authentication) to push high-risk decisions directly to the business owner's phone for one-tap approval.

---

## Core Features

| Feature | Description |
|---|---|
| 🤖 **Elf Agent** | LangGraph-powered AI that analyses every transaction against your policies |
| 🔒 **Token Vault** | All bank/payment API keys stored in Auth0 Token Vault — never in our DB |
| 📲 **CIBA Approval** | High-risk transactions push to owner's phone for tap-to-approve |
| 🔗 **Verified Payment Links** | Links locked to company account — staff cannot redirect to personal accounts |
| 📊 **Staff Risk Scoring** | Elf tracks every staff member's payment behaviour and flags patterns |
| 📋 **Audit Log** | Every Elf action logged with Auth0 log reference — tamper-proof |
| 💰 **Bank Feed Reconciliation** | Elf verifies every payment link against actual bank deposits |

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **AI Agent**: LangGraph + OpenAI GPT-4o-mini (Elf's reasoning engine)
- **Auth & Identity**: Auth0 for AI Agents — Token Vault + CIBA
- **Database**: SQLite (Prisma ORM) — swap to Postgres for production
- **Payments**: Paystack (Nigerian market) via Token Vault
- **Notifications**: Twilio WhatsApp + SMS via Token Vault
- **Deployment**: Vercel

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourusername/ledgerlock
cd ledgerlock
npm install
```

### 2. Set up Auth0

1. Go to [auth0.com](https://auth0.com) → Create a new tenant
2. Create a **Regular Web Application** → note Client ID + Secret
3. Set Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
4. Set Allowed Logout URLs: `http://localhost:3000`
5. Enable **Auth0 for AI Agents** in your tenant settings
6. Enable **Token Vault** feature
7. Enable **CIBA** (go to Advanced Settings → Grant Types → check CIBA)
8. Create a **Machine-to-Machine** app for the Management API with `read:users update:users` scopes

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. Required:
- All `AUTH0_*` values from step 2
- `OPENAI_API_KEY` — get from platform.openai.com
- `PAYSTACK_SECRET_KEY` — get from dashboard.paystack.com (use test keys)
- `TWILIO_*` — optional, for WhatsApp/SMS alerts

Generate `AUTH0_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Set up database

```bash
npx prisma db push
npx prisma generate
```

### 5. Seed demo data (optional)

```bash
npx ts-node prisma/seed.ts
```

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How Auth0 Token Vault is Used

Token Vault is the **core security mechanism** of LedgerLock. Here's exactly how:

```
Business Owner
    │
    ▼
Connects bank/payment credentials → Auth0 Token Vault (encrypted storage)
    │
    ▼ (reference ID only stored in LedgerLock DB — never the raw token)
    
Elf Agent (LangGraph)
    │
    ▼ (makes API calls through Token Vault — never sees raw credentials)
    
Bank API / Paystack API / Twilio
    │
    ▼
Deposit verified / Payment link generated / SMS sent
```

Staff members **never** see or handle credentials. Elf **never** sees raw tokens. Only scoped, delegated access via Auth0.

---

## How CIBA Works

When Elf flags a transaction as high-risk:

1. Elf calls Auth0's `/bc-authorize` endpoint with the owner's `login_hint`
2. Auth0 pushes a notification to the owner's authenticated device
3. Owner taps **Approve** or **Deny**
4. Auth0 resolves the CIBA grant → Elf receives the decision
5. Transaction proceeds or is blocked

This is implemented in `src/lib/auth.ts` → `initiateCIBA()` and `pollCIBAStatus()`.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[auth0]/    # Auth0 callback handler
│   │   ├── transactions/    # Submit + CIBA actions
│   │   ├── links/           # Payment link generation
│   │   ├── staff/           # Staff management + suspend
│   │   ├── vault/           # Token Vault management
│   │   ├── dashboard/       # Aggregated dashboard data
│   │   ├── audit/           # Audit log
│   │   └── webhook/paystack/ # Paystack payment webhooks
│   ├── dashboard/           # Owner dashboard
│   ├── payments/            # Transaction management + CIBA
│   ├── links/               # Payment link management
│   ├── staff/               # Staff risk monitoring
│   ├── vault/               # Token Vault UI
│   ├── audit/               # Audit log
│   ├── onboarding/          # First-time setup
│   └── pay/[reference]/     # Public payment page (customer-facing)
├── components/
│   ├── dashboard/           # Sidebar, MetricsRow, AlertsPanel, etc.
│   ├── payments/            # CIBACard, NewTransactionModal
│   ├── links/               # GenerateLinkModal
│   ├── staff/               # AddStaffModal
│   └── ui/                  # Badge, Button, Card, Modal, etc.
├── lib/
│   ├── agent/elf.ts         # Elf LangGraph agent (core AI)
│   ├── auth.ts              # Auth0 Token Vault + CIBA helpers
│   ├── db.ts                # Prisma client
│   ├── paystack.ts          # Paystack via Token Vault
│   └── notifications.ts     # Twilio via Token Vault
├── hooks/                   # React hooks for data fetching
├── types/                   # TypeScript interfaces
└── middleware.ts            # Auth0 route protection
```

---

## Deployment (Vercel)

```bash
npm run build  # verify no build errors first
vercel --prod
```

Set all `.env.local` variables in Vercel dashboard → Settings → Environment Variables.

Update Auth0 app settings:
- Allowed Callback URLs: `https://yourdomain.vercel.app/api/auth/callback`
- Allowed Logout URLs: `https://yourdomain.vercel.app`

Update `AUTH0_BASE_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel URL.

For production database, replace `DATABASE_URL` with a Postgres connection string (e.g. Supabase, Neon, or Railway).

---

## Demo Video Script (3 minutes)

**0:00–0:40** — Hook: P. Tommy's story. "Running an SME in Nigeria, if overheads don't come for your jugular, your staff will try to steal from you." Show the problem.

**0:40–1:20** — Dashboard walkthrough: Elf's metrics, the CIBA alert panel showing a flagged transaction.

**1:20–2:00** — CIBA demo: Tap Approve on a ₦85,000 request. Show how Elf logs it. Then show a blocked personal account transfer.

**2:00–2:35** — Payment links: Generate a verified link. Explain Token Vault lock. Show Link #035 flagged because no deposit found.

**2:35–3:00** — Token Vault screen + Audit log. "Every credential lives in Auth0. Every action logged. Tamper-proof." Close on tagline.

---

## License

MIT © 2026 LedgerLock

---

*Built with Auth0 for AI Agents, LangGraph, Next.js 14, and a deep belief that SME owners deserve financial guardrails that work.*
