# StrayAnimals — Project Plan

> Full application (not MVP). Design-first: we validate the complete UI/UX before writing any feature code. The app itself is localized in French; this plan and codebase are in English.

---

## Phase 0 — Design (current phase)

**Goal:** produce a clickable, in-browser prototype of the entire app, validated by the user, before we wire any backend or feature logic.

**Approach:** code-based design directly in the project. We build a static React + Tailwind + i18n prototype (pure UI, no API calls, no real data), iterate screen by screen with live browser preview, and only move to Phase 1 once every screen is approved.

**Deliverables:**

1. Design system in code (colors, typography, components, icons) as Tailwind tokens + reusable components
2. Every screen built as a React component with mock data
3. Click-through navigation between screens (real React Router, no functionality)
4. French + Arabic copy on every screen, with RTL support for Arabic
5. Mobile + desktop responsiveness verified in browser

**Languages:** French (default) + Arabic (RTL). No English in the end-user UI.

**Exit criteria:** Every screen in DESIGN.md is built, reviewed, and approved by the user.

---

## Phase 1 — Build (after Phase 0 is approved)

Sprints below are 1–2 weeks each. Adjust pace to team size.

### Sprint 1 — Foundations

- Repo, monorepo structure, CI (GitHub Actions)
- Database schema (PostgreSQL via Prisma): `User`, `Report`, `Mission`, `Team`, `Intervention`, `MediaAsset`
- Auth system (JWT + refresh) with roles: `CITIZEN`, `AGENT`, `FIELD_TEAM`, `ADMIN`
- File/image storage (Cloudflare R2 or Supabase Storage)
- i18n setup (French primary, Arabic with RTL) using `i18next`
- Reuse the design tokens and components built during Phase 0

### Sprint 2 — Citizen PWA

- PWA shell (installable, offline-friendly, French UI)
- Photo capture (camera + gallery)
- Automatic geolocation (HTML5 Geolocation API + manual map pin fallback)
- Comment with categories: aggressive, injured, simple stray
- Submission with progress + retry on poor connectivity
- Confirmation screen
- Optional push notifications (status updates on user's report)

### Sprint 3 — Commune Dashboard (web)

- Agent login
- Real-time interactive map (Mapbox GL or Google Maps) with color-coded markers
- Reports list with filters (status, date, zone, severity)
- Report detail view (photo, location, citizen comment, history)
- Status workflow: `PENDING` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` / `IMPOSSIBLE`
- Team assignment UI

### Sprint 4 — Field Team PWA

- Team-member login
- Mission inbox (push notification on assignment)
- Mission detail with map + GPS navigation handoff (Google/Apple Maps deeplink)
- Status updates: `EN_ROUTE`, `CAPTURED`, `IMPOSSIBLE`
- Post-intervention photo upload
- Offline-tolerant queue (sync when back online)

### Sprint 5 — Real-time & Statistics

- WebSocket layer (Socket.io) for live dashboard updates
- Statistics module: total reports, average response time, hot zones
- Heatmap visualization
- Exports (CSV, PDF) for reporting

### Sprint 6 — WhatsApp channel

- WhatsApp Business API integration (or Twilio WhatsApp sandbox for demo)
- Conversational flow: photo, location, category
- Webhook handlers
- Same backend pipeline as PWA (single source of truth)

### Sprint 7 — Advanced features

- Duplicate detection (geo + time + image similarity)
- AI image analysis (aggressive vs injured) — OpenAI Vision or self-hosted CLIP
- Intervention history per report
- Audit log

### Sprint 8 — Hardening & Launch

- Security review (OWASP top 10, rate limiting, input validation)
- Load testing
- Backups & disaster recovery
- Production monitoring (Sentry, Better Stack)
- Documentation, training material for agents
- Public launch

---

## Public deployment (free / low-cost — for demo before investment)

These services have generous free tiers, enough to deploy publicly and demonstrate the working app to investors / stakeholders without spending money upfront.

| Layer                 | Service                      | Free tier                           | Notes                                   |
| --------------------- | ---------------------------- | ----------------------------------- | --------------------------------------- |
| Code hosting          | **GitHub**                   | unlimited public/private repos      | source of truth                         |
| CI/CD                 | **GitHub Actions**           | 2 000 min/month                     | tests, build, deploy                    |
| Backend API           | **Render** or **Railway**    | free web service (sleeps when idle) | Node.js/Express                         |
| Database              | **Neon** or **Supabase**     | 0.5–3 GB Postgres free              | managed Postgres                        |
| Image storage         | **Cloudflare R2**            | 10 GB free                          | S3-compatible, zero egress fee          |
| Dashboard hosting     | **Vercel** or **Netlify**    | unlimited deploys, custom domain    | React static                            |
| PWA hosting           | **Vercel** or **Netlify**    | same                                | citizen + team PWAs                     |
| Maps                  | **Mapbox**                   | 50 000 map loads/month free         | (or Google Maps free tier)              |
| Push notifications    | **Firebase Cloud Messaging** | free                                | web + mobile                            |
| WhatsApp (demo)       | **Twilio WhatsApp Sandbox**  | free for testing                    | move to WhatsApp Business API at launch |
| Email (transactional) | **Resend** or **Brevo**      | 3 000 emails/month free             | password resets, alerts                 |
| Error monitoring      | **Sentry**                   | 5k events/month free                | crash reports                           |
| Uptime monitoring     | **Better Stack** (Logtail)   | free tier                           | status page                             |
| Domain                | **Namecheap / Cloudflare**   | ~$10/year                           | only real cost                          |

**Estimated monthly cost for public demo:** $0 (excluding domain ~$1/month).

**When to upgrade:** when traffic exceeds free tier limits, or when you need WhatsApp Business API (paid per conversation), or 24/7 backend without sleep (Render paid plan ~$7/month).

---

## Roles & ownership

To be filled in once the team is defined:

- Product owner: ?
- Designer: ?
- Backend dev: ?
- Frontend dev: ?
- QA: ?
- Stakeholders (commune): ?

---

## Risks

- **WhatsApp Business API approval** — can take weeks; start the process during Phase 0.
- **Geolocation accuracy** in dense urban areas — design must allow manual pin adjustment.
- **Photo quality / size** on poor connectivity — needs client-side compression.
- **GDPR / data privacy** — citizens' photos and locations are personal data; design retention policy now.
- **Adoption by field teams** — UX must be extremely simple, or they'll resist.

---

## Definition of Done (per sprint)

- All screens match the approved Figma design.
- French copy reviewed by a native speaker.
- Tested on a real phone (Android + iOS).
- Deployed to staging URL.
- Stakeholder demo completed.
- No critical / high-severity bugs open.
