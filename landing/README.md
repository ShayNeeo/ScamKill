# ScamKill Landing — Astro 5 + Svelte 5 + Cloudflare

Pitch/product landing page for **ScamKill by QuadDraKe (HITC InnoStar 2026)**: a chronological
anti-scam shield for older adults and their families. This is a standalone pnpm project, separate
from the Expo app at the repo root.

## Stack

| Layer | Choice |
|---|---|
| Meta-framework | Astro 5, `output: 'server'` (SSR) with `export const prerender = true` on the landing page |
| Adapter | `@astrojs/cloudflare` → Workers Static Assets |
| Islands | Svelte 5 runes (`BaLanSimulator`, `PricingCalculator`, `LeadAndAuthModal`) |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite`, custom Shadcn-style tokens |
| Database | Cloudflare D1 + Drizzle ORM (`users`, `sessions`, `family_leads`, `scam_reports`) |
| Auth | Lucia-style opaque session cookie, PBKDF2 password hashes (Web Crypto) |
| Edge | `src/middleware.ts` resolves sessions + security headers |

## Quick start

```bash
# From the repo root:
pnpm --dir landing install

# Inside landing/: create the database once, then put the returned id in wrangler.jsonc.
pnpm exec wrangler d1 create scamkill-db

pnpm db:migrate:local     # apply migrations/0001_init.sql locally (required for D1 writes)
pnpm dev                  # http://localhost:4321
pnpm db:migrate:remote    # apply to the real D1 database
```

Without a D1 binding the app falls back to an in-memory store (per isolate) so local UI and auth
flows work immediately. Data disappears on restart. With the `DB` binding present but no migration
applied, inserts fail — run `pnpm db:migrate:local` first.

`wrangler.jsonc` binds D1 as `DB` (`database_name: "scamkill-db"`). Replace the placeholder
`database_id` with the id printed by `wrangler d1 create`.

### Generate a new migration after editing `src/db/schema.ts`

```bash
pnpm db:generate
pnpm db:migrate:local
```

## Routes

| Route | Rendering | Purpose |
|---|---|---|
| `/` | Prerendered static HTML | Hero, NCA stats, 3 protection layers, Bà Lan demo, PWA install guide, pricing |
| `/dashboard` | SSR (`prerender = false`) | Session-gated view of leads + scam reports |
| `POST /api/leads` | Edge | Family/institutional lead capture (validated, consent required) |
| `GET/POST/DELETE /api/auth/session` | Edge | Current session, login/signup, logout |
| `GET/POST /api/reports` | Edge | Recent masked scam reports / submit a report |

Request bodies are JSON. Auth cookie is `scamkill_session` (HttpOnly, SameSite=Lax, 30 days).

## Build & deploy

```bash
pnpm build           # emits dist/ (static assets + dist/_worker.js/index.js)
pnpm preview         # preview the Worker build locally
pnpm deploy          # build + wrangler deploy
```

Wrangler config: `name: "scamkill-landing"`, `compatibility_date: "2026-10-01"`,
`assets.directory: "./dist"`, D1 binding `DB`, account `9df9d709f5cfa6826655e5416b9d6e1e`.
A `PUBLIC_APP_URL` var defaults to `http://localhost:8081` for the PWA CTA.

pnpm 12 requires dependency build scripts to be allowlisted. `pnpm-workspace.yaml` allows
`esbuild`/`workerd` and denies `sharp` (no Astro `<Image>` usage). `minimumReleaseAge: 0` keeps
freshly published tooling installable; the lockfile is committed.

## PWA testing (iOS + Android)

The landing page links to the PWA at `http://localhost:8081`:

- **iOS Safari:** Share → *Thêm vào Màn hình chính* → *Thêm*.
- **Android Chrome:** ⋮ → *Cài đặt ứng dụng* / *Thêm vào Màn hình chính*.

On a physical phone, `localhost` points at the phone itself — replace it with the LAN IP of the
machine serving the app (e.g. `http://192.168.1.20:8081`). Test offline shell, 200% text zoom,
screen reader labels, denied microphone permission, and the family-alert consent default.

## Content sources

- NCA 2024 survey: 18,900 billion VND losses, 1/220 victims, 62.08% authority-impersonation calls.
- nTrust H2/2024: 134,000 scam-number reports, 296,000+ spam/scam numbers.
- Pricing: Free $0; Family Plus $2.99/household/month; institutional licensing
  $0.08–$0.15/MAU/month (Basic) and $0.30–$0.75/MAU/month (Advanced AI).
- Bà Lan scenario and 3-layer architecture follow `PRD.md` §3–4.

All figures and prices are pitch-stage estimates, not commercial commitments. ScamKill reports risk,
never an absolute fraud verdict; family alerts send metadata only unless the senior explicitly opts
in to sharing content.
