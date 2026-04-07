# 🔒 LedgerLock

**AI-powered guardrails for your business finances. Your money moves only when you say so.**

> Built for the [Auth0 "Authorized to Act" Hackathon](https://devpost.com/estheradeoti07/ledgerlock) 

**Live Demo:** https://ledgerlock-git-main-estherea07s-projects.vercel.app
**Youtube Demo Video:** [Demo Video](https://youtu.be/EyBkxuteXOc)
**GitHub:** https://github.com/estherea07/ledgerlock

---

## The Problem

Staff fraud costs SMEs billions annually — not through elaborate hacking, but through simple payment diversion. Employees give customers their personal account numbers instead of the company's. They transfer business funds to fake vendors. They exploit the gap between "someone initiated a payment" and "the owner noticed."

LedgerLock closes that gap with an AI agent named **Elf** who monitors every transaction, verifies every payment link, and never lets credentials leave a secure vault.

---

## What LedgerLock Does

| Feature | Description |
|---|---|
| 🤖 **Elf AI Agent** | LangGraph-powered agent analyses every transaction against your policies in real time |
| 🔒 **Auth0 Token Vault** | All bank/payment credentials stored encrypted - staff never see raw keys |
| 📲 **CIBA Step-up Auth** | High-risk transactions push to owner's phone for one-tap approve/deny |
| 🔗 **Verified Payment Links** | Links locked to company account - customers always pay the business, not an employee |
| 📊 **Staff Risk Scoring** | Elf tracks payment behaviour per employee and flags patterns early |
| 📋 **Audit Log** | Every Elf action logged with Auth0 reference - tamper-proof |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| AI Agent | LangGraph, Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| Auth & Identity | Auth0 for AI Agents - Token Vault + CIBA, `@auth0/nextjs-auth0` |
| Database | Prisma ORM + PostgreSQL (Neon) in production, SQLite locally |
| Payments | Paystack (via Token Vault) |
| Notifications | Twilio WhatsApp/SMS (via Token Vault) |
| Deployment | Vercel |

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- Git
- Auth0 account (free at [auth0.com](https://auth0.com))
- Anthropic API key (free credits at [console.anthropic.com](https://console.anthropic.com))

### 1. Clone and install

```bash
git clone https://github.com/estherea07/ledgerlock.git
cd ledgerlock
npm install --legacy-peer-deps
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```bash
# Auth0 — from your Auth0 dashboard at manage.auth0.com
AUTH0_SECRET='run: node -e "console.log(require(crypto).randomBytes(32).toString(base64))"'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://YOUR_TENANT.us.auth0.com'
AUTH0_CLIENT_ID='your_regular_web_app_client_id'
AUTH0_CLIENT_SECRET='your_regular_web_app_client_secret'
AUTH0_AUDIENCE='https://YOUR_TENANT.us.auth0.com/api/v2/'
AUTH0_TOKEN_VAULT_URL='https://YOUR_TENANT.us.auth0.com'
AUTH0_MGMT_CLIENT_ID='your_m2m_client_id'
AUTH0_MGMT_CLIENT_SECRET='your_m2m_client_secret'

# Database (SQLite for local dev)
DATABASE_URL='file:./ledgerlock.db'

# Anthropic — free credits on signup
ANTHROPIC_API_KEY='sk-ant-your-key'

# Paystack — use TEST keys (free, no real money)
PAYSTACK_SECRET_KEY='sk_test_your_key'
PAYSTACK_PUBLIC_KEY='pk_test_your_key'

# App
NEXT_PUBLIC_APP_URL='http://localhost:3000'
NEXT_PUBLIC_APP_NAME='LedgerLock'
```

### 3. Auth0 Setup

1. Go to [auth0.com](https://auth0.com) → create free account → create tenant
2. **Applications → + Create Application** → Regular Web Application → name it `LedgerLock`
3. In Settings tab:
   - Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
4. **Applications → + Create Application** → Machine to Machine → name it `LedgerLock M2M`
   - Select Auth0 Management API → grant scopes: `read:users`, `update:users`
5. **Authentication → Social → GitHub** → enable Connected Accounts for Token Vault
6. **Applications → APIs → Auth0 My Account API** → Application Access → authorize LedgerLock

### 4. Run

```bash
npx prisma db push
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Load demo data (optional)

```bash
npx ts-node prisma/seed.ts
```

This loads Greenfield Laundry Ltd with 3 staff members, sample flagged transactions, and demo vault tokens.

---

## How to Test Elf

Once running (local or live), do this to see all features:

**1. Sign in** with GitHub via Auth0

**2. Add a staff member** - Staff → Add Staff Member → name: "David Kalu", role: Sales Rep

**3. Test Elf blocking a transaction** - Payments → New Payment Request:
- Amount: ₦200,000
- Description: "transfer to personal account"
- Submit → Elf blocks immediately (score: critical)

**4. Test Elf flagging for CIBA** - New Payment Request:
- Amount: ₦85,000
- Vendor: "Apex Supplies Ltd"
- Submit → Elf flags (new vendor + over limit) → CIBA approval required

**5. Test auto-approval** - New Payment Request:
- Amount: ₦5,000
- Vendor: "EKEDC"
- Description: "electricity bill"
- Submit → Elf auto-approves (low risk, known vendor)

**6. Generate a verified payment link** - Payment Links → Generate Verified Link
- See how the URL is locked to company account via Token Vault

**7. Connect a service to vault** - Token Vault → Connect Service
- See how only a reference ID is stored, never the raw key

---

## Architecture: How Token Vault Works

```
Business Owner
    │
    ▼
Connects API credentials → Auth0 Token Vault (encrypted, never in our DB)
    │
    ▼ (only tokenRef stored in LedgerLock DB)

Elf Agent (LangGraph 6-node pipeline)
    │
    ├── load_policies     → fetch owner's guardrails from DB
    ├── policy_check      → rule-based risk scoring
    ├── anomaly_detection → Claude Haiku AI reasoning
    ├── make_decision     → approve / flag / block
    ├── trigger_ciba      → Auth0 CIBA push to owner's phone (if flagged)
    └── persist_and_notify → log everything, update risk scores
    │
    ▼ (API calls go through Token Vault - Elf never sees raw credentials)

Bank API / Paystack / Twilio
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → import repo
3. Add all `.env.local` variables in Vercel → Environment Variables
4. Change `DATABASE_URL` to a PostgreSQL connection string (free at [neon.tech](https://neon.tech))
5. Change `AUTH0_BASE_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel domain
6. Update Auth0 Allowed Callback URLs to include your Vercel domain
7. Deploy

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[auth0]/     # Auth0 handler — login, callback, logout
│   │   ├── transactions/     # Submit transactions to Elf + CIBA actions
│   │   ├── links/            # Generate verified payment links
│   │   ├── staff/            # Staff management + suspend
│   │   ├── vault/            # Token Vault connections
│   │   ├── dashboard/        # Aggregated metrics
│   │   ├── audit/            # Audit log
│   │   └── webhook/paystack/ # Paystack payment webhooks
│   ├── dashboard/            # Owner dashboard
│   ├── payments/             # Transaction list + CIBA approval UI
│   ├── links/                # Payment link management
│   ├── staff/                # Staff risk monitoring
│   ├── vault/                # Token Vault UI
│   ├── audit/                # Full audit log
│   ├── onboarding/           # First-time business setup
│   └── pay/[reference]/      # Public payment page (customer-facing)
├── components/               # UI components (dashboard, payments, staff, vault)
├── lib/
│   ├── agent/elf.ts          # Elf LangGraph agent (core AI)
│   ├── auth.ts               # Auth0 Token Vault + CIBA helpers
│   ├── db.ts                 # Prisma client
│   ├── paystack.ts           # Paystack via Token Vault
│   └── notifications.ts      # Twilio via Token Vault
├── hooks/                    # React data-fetching hooks
├── types/                    # TypeScript interfaces
└── middleware.ts             # Auth0 route protection
```

---

## License

MIT © 2026 LedgerLock

*Built with Auth0 for AI Agents, LangGraph, Anthropic Claude, and a conviction that SME owners deserve financial guardrails that actually work.*
