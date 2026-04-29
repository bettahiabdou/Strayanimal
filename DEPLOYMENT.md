# Deployment Guide

This document lists every external service the project depends on, in the order you should sign up for them. Free tiers are sufficient for the demo / pilot phase. Total recurring cost: **~$0/month** (excluding optional domain ~$1/month).

> **Order matters.** Postgres → R2 → Mapbox → Render → Vercel → Sentry → DNS. Each step's output (a URL, a key) is the input to the next.

---

## 1. GitHub — source of truth

1. Create a private GitHub repo `strayanimals` (or use an org).
2. Push this code:
   ```bash
   git remote add origin git@github.com:<org>/strayanimals.git
   git push -u origin main
   ```
3. The CI workflow at `.github/workflows/ci.yml` will start running on every push.

---

## 2. Neon — managed Postgres (free 3GB)

1. Go to [neon.tech](https://neon.tech) → sign up with GitHub.
2. Create a project: `strayanimals` · region `eu-central-1` (Frankfurt — closest to Morocco).
3. Copy the **pooled** connection string (the one with `-pooler` in the host).
4. Save it: this is `DATABASE_URL` for both Render and your local `.env` if you don't run Postgres locally.

> Do NOT use Neon's free tier directly from your laptop for development — use the Docker `docker compose up postgres` setup instead. Neon is only for staging/production.

---

## 3. Cloudflare R2 — image storage (free 10GB)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → create an account.
2. R2 → Create bucket: `strayanimals-photos`. Region: `auto`.
3. R2 → Manage API tokens → Create token: read+write on this bucket only. Note the **Access Key ID**, **Secret Access Key**, and **Account ID**.
4. Bucket → Settings → Public access → Connect a custom domain (e.g. `photos.ouarzazate.ma`) OR use the R2.dev public URL for now.
5. Save: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=strayanimals-photos`, `R2_PUBLIC_URL`.

---

## 4. Mapbox — maps (free 50k loads/month)

1. [account.mapbox.com](https://account.mapbox.com) → sign up.
2. Tokens → Create a token: scopes `styles:read`, `styles:tiles`. URL restrictions: your Vercel domains.
3. Save: `VITE_MAPBOX_TOKEN` for the dashboard frontend.

---

## 5. Render — backend hosting (free with sleep)

1. [render.com](https://render.com) → sign in with GitHub.
2. New → **Blueprint** → select the `strayanimals` repo. Render reads `render.yaml` and provisions the service.
3. After provisioning, open the service → **Environment** and fill the secrets marked `sync: false`:
   - `DATABASE_URL` — Neon pooled connection string (from step 2)
   - `R2_*` — from step 3
   - `CORS_ORIGINS` — comma-separated, e.g. `https://citizen.ouarzazate.ma,https://dashboard.ouarzazate.ma,https://terrain.ouarzazate.ma`
4. Trigger the first deploy. Build command runs `prisma migrate deploy`, so the DB schema is created automatically.
5. Backend is live at `https://strayanimals-backend.onrender.com` (or your custom domain).

> **Free-tier caveat:** the service sleeps after 15 min idle. First request takes ~30s to wake. Upgrade to **Starter $7/month** when you need 24/7 uptime.

---

## 6. Vercel — frontend hosting (free, unlimited deploys)

For the design preview (one app today), import once. Once we split into 3 apps, each gets its own Vercel project.

1. [vercel.com](https://vercel.com) → sign in with GitHub.
2. Add New → Project → import `strayanimals`.
3. **Root Directory**: `design` (or whichever app you're deploying).
4. **Framework**: Vite (auto-detected).
5. **Build Command**: `npm run build` · **Output Directory**: `dist`.
6. **Environment Variables** (per project):
   - `VITE_API_URL=https://strayanimals-backend.onrender.com`
   - `VITE_MAPBOX_TOKEN` (dashboard only)
7. Deploy. Vercel gives you a `*.vercel.app` URL.
8. Add custom domains in Vercel → Settings → Domains.

When we split into 3 apps, repeat for each:

- `apps/citizen` → `citizen.ouarzazate.ma`
- `apps/dashboard` → `dashboard.ouarzazate.ma`
- `apps/field-team` → `terrain.ouarzazate.ma`

---

## 7. Sentry — error monitoring (free 5k events/month)

1. [sentry.io](https://sentry.io) → sign up.
2. Create projects: `strayanimals-backend` (Node), `strayanimals-citizen` (React), `strayanimals-dashboard` (React), `strayanimals-field-team` (React).
3. Copy each DSN.
4. Save: `SENTRY_DSN_BACKEND`, `VITE_SENTRY_DSN_CITIZEN`, `VITE_SENTRY_DSN_DASHBOARD`, `VITE_SENTRY_DSN_FIELD_TEAM`.
5. Wired in code during Sprint 5 (hardening).

---

## 8. Twilio — WhatsApp + SMS (sandbox free for testing)

> Defer until Sprint 6 (WhatsApp channel).

1. [twilio.com](https://twilio.com) → sign up.
2. Messaging → WhatsApp sandbox → follow the join instructions (send a code to the sandbox number from your WhatsApp).
3. Save the sandbox number, your account SID, and auth token.
4. Production: apply for WhatsApp Business API approval — takes 2–6 weeks. Start the process during Sprint 0.

---

## 9. Better Stack — uptime monitoring (free)

1. [betterstack.com/uptime](https://betterstack.com/uptime) → sign up.
2. Add monitors:
   - `https://strayanimals-backend.onrender.com/health` (every 3 min)
   - `https://citizen.ouarzazate.ma` (every 3 min)
   - `https://dashboard.ouarzazate.ma` (every 3 min)
3. Add the team's emails / Slack for alerts.
4. Optionally publish a status page at `status.ouarzazate.ma`.

---

## 10. Domain (optional, ~$10/year)

1. Buy `ouarzazate.ma` (or whichever subdomain you have access to via the commune).
2. Point DNS records:
   - `A` `@` → Vercel landing or redirect
   - `CNAME` `citizen` → `cname.vercel-dns.com`
   - `CNAME` `dashboard` → `cname.vercel-dns.com`
   - `CNAME` `terrain` → `cname.vercel-dns.com`
   - `CNAME` `api` → `strayanimals-backend.onrender.com`
   - `CNAME` `photos` → R2 custom-domain target
3. Vercel + Render + R2 will auto-provision Let's Encrypt certs.

---

## Environment variables — single-page reference

| Variable               | Where                  | Source                                            |
| ---------------------- | ---------------------- | ------------------------------------------------- |
| `DATABASE_URL`         | Render, local `.env`   | Neon (or Docker locally)                          |
| `JWT_ACCESS_SECRET`    | Render                 | `openssl rand -hex 32` (or Render auto-generates) |
| `JWT_REFRESH_SECRET`   | Render                 | `openssl rand -hex 32`                            |
| `R2_ACCOUNT_ID`        | Render                 | Cloudflare dashboard                              |
| `R2_ACCESS_KEY_ID`     | Render                 | Cloudflare R2 token                               |
| `R2_SECRET_ACCESS_KEY` | Render                 | Cloudflare R2 token                               |
| `R2_BUCKET`            | Render                 | `strayanimals-photos`                             |
| `R2_PUBLIC_URL`        | Render, frontend       | R2 custom domain                                  |
| `CORS_ORIGINS`         | Render                 | Comma-separated frontend URLs                     |
| `VITE_API_URL`         | Vercel (each frontend) | `https://api.ouarzazate.ma` or Render URL         |
| `VITE_MAPBOX_TOKEN`    | Vercel (dashboard)     | Mapbox                                            |
| `SENTRY_DSN_BACKEND`   | Render                 | Sentry                                            |
| `VITE_SENTRY_DSN_*`    | Vercel (each frontend) | Sentry                                            |

---

## Deploy checklist (when ready)

- [ ] GitHub repo pushed to `main`
- [ ] CI green
- [ ] Neon Postgres provisioned, DATABASE_URL captured
- [ ] R2 bucket created, keys captured
- [ ] Mapbox token created
- [ ] Render service deployed via render.yaml, secrets set
- [ ] `/health` endpoint responding
- [ ] Vercel projects created (1 per frontend), env vars set
- [ ] Sentry projects created, DSNs set
- [ ] Better Stack monitors configured
- [ ] Custom domains (optional) pointed and verified
- [ ] First end-to-end test: submit a citizen report → see it in dashboard → assign to team → close from field-team
