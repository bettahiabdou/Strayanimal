# StrayAnimals — Plateforme de protection des animaux errants

Service du **Groupement des communes territoriales — Ouarzazate** pour le signalement, le triage et la prise en charge des animaux errants.

Three coordinated apps + one backend, deployed independently:

| App                               | Audience                 | Stack                   | Hosting                    |
| --------------------------------- | ------------------------ | ----------------------- | -------------------------- |
| **Citoyen** (`citizen`)           | Public · French + Arabic | React + Vite (PWA)      | Vercel                     |
| **Tableau de bord** (`dashboard`) | Agents communaux         | React + Vite            | Vercel                     |
| **Équipe terrain** (`field-team`) | Capture teams            | React + Vite (PWA)      | Vercel                     |
| **API** (`backend`)               | Internal                 | Node + Express + Prisma | Render                     |
| **DB**                            | —                        | PostgreSQL 16           | Neon (prod) / Docker (dev) |
| **Storage**                       | —                        | Photos                  | Cloudflare R2              |
| **Maps**                          | —                        | —                       | Mapbox                     |

For deployment instructions see **[DEPLOYMENT.md](DEPLOYMENT.md)**.
For the project plan and sprints see **[PLAN.md](PLAN.md)**.
For the design brief and screen list see **[DESIGN.md](DESIGN.md)**.

---

## Local development quickstart

### Prerequisites

- **Node 22+** (`.nvmrc` pinned — `nvm use`)
- **Docker** (for local Postgres)
- **Git**

### One-time setup

```bash
git clone git@github.com:<org>/strayanimals.git
cd strayanimals
npm install
cp backend/.env.example backend/.env
```

### Daily workflow

> **Tip:** copy commands one line at a time. Don't paste comments — `#` after a command becomes a literal argument.

**1. Start Postgres (background)**

```bash
npm run dev:db
```

> Local Postgres runs on **host port 5433** (not 5432) to avoid clashing with any system Postgres you already have.

**2. Generate Prisma client + run migrations (first time, or after schema change)**

```bash
npm run prisma:generate
npm run prisma:migrate
```

**3. Seed mock users + reports (optional)**

```bash
npm run db:seed
```

**4. In one terminal — backend** (http://localhost:4000)

```bash
npm run dev:backend
```

**5. In another terminal — design preview** (http://localhost:5173)

```bash
npm run dev:design
```

### Available npm scripts (root)

| Command                   | What it does                                |
| ------------------------- | ------------------------------------------- |
| `npm run dev:backend`     | Start backend with hot-reload               |
| `npm run dev:design`      | Start design preview (all 3 apps as routes) |
| `npm run dev:db`          | Boot local Postgres in Docker               |
| `npm run dev:db:stop`     | Stop local Postgres                         |
| `npm run dev:db:reset`    | Wipe local DB and restart                   |
| `npm run typecheck`       | Typecheck every workspace                   |
| `npm run lint`            | ESLint on the whole repo                    |
| `npm run format`          | Prettier write                              |
| `npm run format:check`    | Prettier check (CI)                         |
| `npm run build`           | Build every workspace                       |
| `npm run prisma:generate` | Regenerate Prisma client after schema edit  |
| `npm run prisma:migrate`  | Create + apply a new migration              |
| `npm run prisma:studio`   | Open Prisma Studio (DB GUI)                 |
| `npm run db:seed`         | Load mock data into local DB                |

---

## Repository layout

```
StrayAnimals/
├── backend/              # Node + Express + Prisma API
│   ├── prisma/
│   │   └── schema.prisma # Data model
│   └── src/
│       ├── routes/
│       ├── middleware/
│       ├── lib/
│       └── services/
│
├── design/               # Vite + React design preview
│   └── src/apps/
│       ├── citizen/      # public site + report form
│       ├── dashboard/    # commune ERP
│       └── field-team/   # mobile capture app
│
├── packages/
│   └── shared/           # Types + i18n shared backend↔frontend
│
├── docs/                 # specs, ADRs
├── docker-compose.yml    # Local Postgres
├── render.yaml           # Render blueprint (backend deploy)
├── .github/workflows/    # CI/CD
├── PLAN.md               # Sprint plan
├── DESIGN.md             # Screen list + design brief
├── DEPLOYMENT.md         # Hosting setup
└── README.md             # ← you are here
```

---

## Tools matrix (prod)

| Layer              | Service        | Free tier               | Setup steps                   |
| ------------------ | -------------- | ----------------------- | ----------------------------- |
| Code               | GitHub         | unlimited               | DEPLOYMENT.md §1              |
| CI/CD              | GitHub Actions | 2000 min/month          | Auto via `.github/workflows/` |
| Backend            | Render         | free (sleeps when idle) | DEPLOYMENT.md §5              |
| Database           | Neon           | 3 GB Postgres           | DEPLOYMENT.md §2              |
| Storage            | Cloudflare R2  | 10 GB                   | DEPLOYMENT.md §3              |
| Frontends          | Vercel         | unlimited deploys       | DEPLOYMENT.md §6              |
| Maps               | Mapbox         | 50k loads/month         | DEPLOYMENT.md §4              |
| Errors             | Sentry         | 5k events/month         | DEPLOYMENT.md §7              |
| Uptime             | Better Stack   | free monitors           | DEPLOYMENT.md §9              |
| WhatsApp (Phase 2) | Twilio sandbox | free for testing        | DEPLOYMENT.md §8              |
| Domain (optional)  | any registrar  | ~$10/year               | DEPLOYMENT.md §10             |

**Estimated monthly cost during pilot: $0.**

---

## Conventions

- **Language:** code, comments, commits, and docs are **English**. The end-user UI is **French (default) + Arabic (RTL)**.
- **Commit style:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- **Branches:** `main` is always deployable. Feature branches → PR → squash merge.
- **Code style:** Prettier + ESLint enforced in CI. Run `npm run format` before commit.
- **Types:** all shared types live in `packages/shared/src/types/`. Frontend doesn't depend on Prisma.

---

## Contact / governance

- **Maître d'ouvrage:** Groupement des communes territoriales — Ouarzazate
- **Maintenance:** TBD
- **Issues / bugs:** GitHub Issues
