# StrayAnimals — Design Brief

> Phase 0 deliverable. Lists every screen, flow, and design-system element to build as static React UI (Tailwind + i18n) before any backend or feature logic is wired. App languages: **French (default) and Arabic (RTL)**. This document is in English.

---

## 1. Design system

### 1.1 Brand & tone

- Public-service feel: trustworthy, calm, accessible.
- Not playful (this is municipal, not consumer entertainment).
- Bilingual-ready strings (French primary).

### 1.2 Color palette (proposal — refine in Figma)

- Primary: deep blue (commune / authority)
- Accent: orange (call-to-action, "report")
- Status colors:
  - 🔴 Urgent / aggressive
  - 🟠 Injured
  - 🟡 Simple stray
  - 🟢 Resolved
  - ⚪ Pending
- Neutrals: white, light gray, dark gray for text

### 1.3 Typography

- One sans-serif family (e.g. Inter, Plus Jakarta Sans) for legibility on mobile.
- Sizes: H1 32, H2 24, H3 18, body 16, caption 14, micro 12.

### 1.4 Components

- Buttons (primary, secondary, ghost, destructive) — with loading + disabled states
- Inputs (text, textarea, select, photo upload, location picker)
- Cards (report card, mission card, stat card)
- Map markers (5 status colors above)
- Status badges
- Modals & confirmations
- Toasts / snackbars
- Empty states (with illustration)
- Loading skeletons
- Bottom navigation (mobile)
- Side navigation (dashboard)

### 1.5 Iconography

- Use a single icon set (Lucide or Phosphor) for consistency.

### 1.6 Accessibility

- WCAG AA contrast minimum.
- Touch targets ≥ 44×44 px.
- Visible focus states.
- Screen-reader labels.

---

## 2. Citizen — public landing-page website (with PWA install)

The citizen side is a **public web product**, not a logged-in app. No accounts, no history view. The user lands, learns, and submits a report. Mobile-first but fully responsive (looks like a real website on desktop too). Installable as PWA so it can be added to the home screen.

| #   | Screen / Section                | Purpose                                                                                                             |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| C1  | Landing page                    | Single scrollable page: nav, hero with imagery, stats, how-it-works, why-it-matters, FAQ, footer, language switcher |
| C2  | Report form — Step 1 (Photo)    | Take photo or pick from gallery                                                                                     |
| C3  | Report form — Step 2 (Location) | Auto-detected on map; allow manual pin                                                                              |
| C4  | Report form — Step 3 (Details)  | Category (aggressive / injured / stray) + free-text comment                                                         |
| C5  | Report form — Step 4 (Review)   | Summary; submit button                                                                                              |
| C6  | Submission success              | Confirmation, reference number, what happens next, share                                                            |
| C7  | Error / permission states       | No connection, no GPS, no camera, file too large                                                                    |

### Citizen flow

```
C1 (landing) → CTA "Signaler" → C2 → C3 → C4 → C5 → C6
```

No "my reports", no login. Reference number is the citizen's only proof; they keep it (or get it via SMS in a later phase).

---

## 3. Commune Dashboard (ERP for the commune)

The dashboard is the **ERP** of the system. Agents triage every citizen submission, approve or reject, assign approved reports to field teams, and run analytics. This is where the work actually happens.

| #   | Screen                  | Purpose                                                                                                           |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| D1  | Login                   | Email + password                                                                                                  |
| D2  | Forgot password         | Reset flow                                                                                                        |
| D3  | Overview / home         | KPIs (incoming, pending review, in progress, resolved), recent activity, hot zones                                |
| D4  | **Triage queue**        | New citizen submissions awaiting approval — agent reviews photo/comment/location, approves or rejects with reason |
| D5  | Live map                | All approved reports as colored pins, real-time updates                                                           |
| D6  | Reports list            | Filterable table (status, severity, zone, date, agent, team)                                                      |
| D7  | Report detail           | Photo, full info, audit timeline, action panel (assign, change status, comment)                                   |
| D8  | Assign to team          | Pick team, set priority, add internal notes                                                                       |
| D9  | Teams management        | List, create, edit field teams; see active load                                                                   |
| D10 | Statistics              | Charts: volume, response time, by zone, by category, by team                                                      |
| D11 | Heatmap                 | Density visualization over time                                                                                   |
| D12 | Rejected / spam         | Archive of rejected submissions for audit                                                                         |
| D13 | User management (admin) | Agent and team-member roles, permissions                                                                          |
| D14 | Settings                | Org info, notification rules, data retention, working zones                                                       |
| D15 | Audit log               | Who did what, when                                                                                                |

### Agent flow

```
D1 → D3 → D4 / D5 → D6 → D7
                          ↓
                       (mission created → field team)
```

---

## 4. Field Team PWA — screens

The field team **only sees missions that have been approved and assigned to them by the dashboard**. They never see raw citizen submissions or rejected ones. Their workflow is reduced to a few status taps.

| #   | Screen                  | Purpose                                                                                                            |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| F1  | Login                   | Team member auth                                                                                                   |
| F2  | Mission inbox           | List of assigned (approved) missions, sorted by priority. Each card shows photo, location, category, time received |
| F3  | Mission detail          | Photo, full location with map snippet, agent notes, big status-action buttons                                      |
| F4  | Navigate                | One-tap open in Apple/Google Maps for turn-by-turn                                                                 |
| F5  | Status update           | Single-tap buttons: "Je pars" / "Je suis sur place" / "Capturé" / "Impossible"                                     |
| F6  | Post-intervention photo | Required after "Capturé" or "Impossible" — short note optional                                                     |
| F7  | Mission complete        | Summary, returns to inbox                                                                                          |
| F8  | History                 | Today's completed missions (read-only)                                                                             |
| F9  | Profile / settings      | Logout, language                                                                                                   |

### Field team flow

```
F1 → F2 → F3 → F4 (external maps) → F5 → F6 → F7
```

---

## 5. WhatsApp conversation flow

| Step | Bot says (French)                                              | User responds |
| ---- | -------------------------------------------------------------- | ------------- |
| 1    | "Bonjour ! Pour signaler un animal errant, envoyez une photo." | photo         |
| 2    | "Merci. Partagez la localisation."                             | location      |
| 3    | "L'animal est : 1) Agressif 2) Blessé 3) Errant simple"        | 1 / 2 / 3     |
| 4    | "Voulez-vous ajouter un commentaire ? (oui/non)"               | text or "non" |
| 5    | "Signalement enregistré. Référence : XXXX. Merci !"            | —             |

---

## 6. Cross-cutting design considerations

- **Empty states** for every list (no reports yet, no missions, no teams).
- **Error states** with friendly French copy and a clear next action.
- **Loading states** (skeletons preferred over spinners).
- **Offline indicators** on both PWAs.
- **Confirmation dialogs** for destructive actions (delete, close report).
- **Print-friendly** report detail (for paper trails at the commune).

---

## 7. Localization strings

All UI strings managed in JSON files (`fr.json` default, `ar.json` Arabic). Both French and Arabic copy written during design — translation is part of the design, not an afterthought. Arabic screens must render right-to-left (RTL).

---

## 8. Deliverables checklist (in-code prototype)

- [ ] Design system in code (Tailwind config + reusable components)
- [ ] All citizen PWA screens (C1–C11) — mobile portrait
- [ ] All dashboard screens (D1–D13) — desktop 1440 + tablet
- [ ] All field team PWA screens (F1–F9) — mobile portrait
- [ ] WhatsApp conversation mockup (screenshots-style)
- [ ] Click-through navigation linking all flows
- [ ] French copy on every screen
- [ ] Arabic copy on every screen + RTL rendering verified
- [ ] Live preview URL (Vercel) for review

---

## 9. Sign-off

Every screen must be reviewed and approved by the user before we open Sprint 1 of the build phase.
