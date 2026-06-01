# Deployment Guide (Convex + Vercel — all in `client/`)

Everything lives in **`client/`**: React UI, Convex backend, and Vercel config. One GitHub repo, one Vercel project, one deploy.

| Part | Folder |
|------|--------|
| Frontend (React) | `client/src/` |
| Backend + database (Convex) | `client/convex/` |
| Vercel config | `client/vercel.json` |

---

## Pre-deploy checklist

| Step | Status | Action |
|------|--------|--------|
| Code builds locally | Run `cd client && bun run build` | Must succeed |
| GitHub repo pushed | `git push origin main` | Required for Git auto-deploy |
| Vercel project created | Import repo on [vercel.com](https://vercel.com) | Root Directory: **`client`** |
| Convex linked | `cd client && bun run dev:convex` (one time) | Creates `.env.local` |
| Convex deploy key | Convex Dashboard → Settings → Deploy Keys | Add to Vercel as `CONVEX_DEPLOY_KEY` |
| Clerk JWT on Convex | `bunx convex env set CLERK_JWT_ISSUER_DOMAIN ...` | Production Convex env |
| Vercel env vars | See [Environment variables](#environment-variables) | Production + Preview |
| Clerk allowed origins | Clerk Dashboard → Domains | Add your `*.vercel.app` URL |

---

## Step 1 — Push to GitHub

Commit and push the repo to **`https://github.com/mawlid1431/Uatai`**.

Vercel will use **Root Directory: `client`** (not the repo root).

---

## Step 2 — Link Convex (one time, on your PC)

From the **`client/`** folder:

```bash
cd client
bun install
bun run dev:convex
```

Log in and select or create your Convex project. This creates `client/.env.local` and pushes `client/convex/` to the cloud.

Press Ctrl+C after “Convex functions ready”.

---

## Step 2b — Clerk auth (Google login + per-user data)

1. Create an app at [clerk.com](https://clerk.com)
2. **User & Authentication → Social connections** → enable **Google**
3. Copy **Publishable key** → add to `client/.env`:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
4. **JWT Templates** → **New template** → choose **Convex**
5. Copy the **Issuer URL** (e.g. `https://your-app.clerk.accounts.dev`)
6. Set on Convex (dev + production):
   ```bash
   bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
   ```
7. For production Convex deployment, also set in [Convex Dashboard](https://dashboard.convex.dev) → **Settings → Environment Variables**

Each user only sees their own invoices — stored with `userId` from Clerk.

---

## Step 3 — Convex deploy key for Vercel

1. Open [Convex dashboard](https://dashboard.convex.dev) → your project
2. **Settings → Deploy Keys** → create a **Production Deploy Key**
3. Copy the key (starts with `prod:...`)

---

## Step 4 — Vercel setup

1. [vercel.com](https://vercel.com) → **Add New Project** → import **`mawlid1431/Uatai`**
2. **Root Directory:** leave as repo root (default) — root `vercel.json` delegates to `client/`
   - Alternative: set Root Directory to `client` in Vercel → Settings → Build & Deployment
3. Framework should auto-detect **Vite**
4. **Environment variables** (Production + Preview):

   ```env
   CONVEX_DEPLOY_KEY=prod:your_deploy_key_from_step_3
   VITE_CONVEX_URL=https://your-deployment.convex.cloud
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   VITE_GROQ_API_KEY=gsk_...
   VITE_GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
   VITE_GROQ_TEXT_MODEL=llama-3.3-70b-versatile
   ```

5. **Deploy**

Vercel runs `bun run build:vercel`, which:
1. Deploys Convex functions from `client/convex/` (using `CONVEX_DEPLOY_KEY`)
2. Builds the Vite frontend with `VITE_CONVEX_URL` injected automatically

### What `client/vercel.json` configures

| Setting | Value |
|---------|-------|
| `installCommand` | `bun install` |
| `buildCommand` | `bun run build:vercel` |
| `outputDirectory` | `dist` |
| `framework` | `vite` |
| SPA routing | rewrite all paths to `/index.html` |

---

## Step 5 — Connect GitHub for auto-deploy

In Vercel → Project → **Settings → Git**:

- **Production Branch:** `main`
- Every push to `main` → production deploy
- Every PR / branch push → preview deploy

No GitHub Actions workflow is required — Vercel handles CI/CD when the repo is connected.

---

## Step 6 — Test production

From **`client/`** (after Convex is linked):

```bash
bun run test:endpoints
bun run test:groq
```

On the live Vercel URL: sign in → upload → extract → save → receipt appears in the list.

---

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `CONVEX_DEPLOY_KEY` | Vercel only | Deploy Convex on each Vercel build |
| `VITE_CONVEX_URL` | Vercel + `client/.env.local` | Convex cloud URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Vercel + `client/.env` | Clerk frontend auth |
| `VITE_GROQ_API_KEY` | Vercel + `client/.env` | Groq AI extract |
| `VITE_GROQ_VISION_MODEL` | Vercel + `client/.env` | Vision model (optional) |
| `VITE_GROQ_TEXT_MODEL` | Vercel + `client/.env` | Text model (optional) |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex dashboard only | Validate Clerk JWTs |

See `client/.env.production.example` for a copy-paste template.

Do not commit `.env`, `.env.local`, or deploy keys.

---

## Local development

**Terminal 1** (from `client/`):

```bash
bun run dev:convex
```

**Terminal 2** (from `client/`):

```bash
bun run dev
```

Or one command:

```bash
bun start
```

**`client/.env`** (local only):

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_GROQ_API_KEY=gsk_...
VITE_GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
VITE_GROQ_TEXT_MODEL=llama-3.3-70b-versatile
```

`VITE_CONVEX_URL` is auto-written to `client/.env.local` by `convex dev`.

---

## Troubleshooting Vercel builds

| Error | Fix |
|-------|-----|
| `CONVEX_DEPLOY_KEY is not set` | Add deploy key in Vercel env vars (see below) |
| `MissingAccessToken` / `first-rabbit-422` | You added `CONVEX_DEPLOYMENT` instead of `CONVEX_DEPLOY_KEY`. Remove dev vars from Vercel; add deploy key only |
| `VITE_CONVEX_URL is missing` at runtime | Set `VITE_CONVEX_URL` in Vercel; redeploy |
| Build runs from repo root | Set **Root Directory** to `client` |
| `bun: command not found` | Vercel auto-installs Bun when `bun.lock` exists |
| Login works but Convex auth fails | Set `CLERK_JWT_ISSUER_DOMAIN` on **production** Convex |
| Clerk redirect errors | Add Vercel URL to Clerk allowed origins |
