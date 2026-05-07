# Canary Sales

Personal sales activity dashboard for lemlist. Single-user, deployed to Vercel behind password protection. (Repo & npm package retain the original `lemlist-pulse` slug.)

Answers two questions every morning:

1. **Am I on pace** for today's call goal — and have I been on pace this whole week?
2. **Where will I land** by end of month at this activity rate?

## Stack

Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui (new-york) · Recharts · SWR · Zod · Vercel KV · Vitest · Playwright.

Theme tokens (OKLCH dark, hue 280, Inter + JetBrains Mono) lifted from [`oncanary/factory-simulator`](https://github.com/oncanary/factory-simulator).

## Local development

```bash
bun install
cp .env.example .env.local
# paste your LEMLIST_API_KEY into .env.local
bun dev           # http://localhost:3000
```

`bun run typecheck && bun run test` to verify. Run `bun run test:e2e` for the Playwright smoke (requires Chromium, takes ~30s).

## Configuration

All tunable knobs live in [`src/lib/config.ts`](src/lib/config.ts):

- `TARGETS` — daily/weekly call & email goals (currently pessimistic defaults: 30 calls/day, 150/week)
- `WORKING_HOURS` — timezone (default `America/Los_Angeles`), start/end hours, workdays
- `BENCHMARKS` — industry conversion rates used for projections, plus the `connectDurationThresholdSec` that defines what counts as a "connected" call

Edit and redeploy.

## Deploying to Vercel

```bash
# one-time setup
vercel link
vercel env add LEMLIST_API_KEY     # paste key, scope: production + preview
vercel kv create lemlist-pulse-kv  # provisions KV_REST_API_URL/TOKEN automatically

# then enable password protection in Vercel project settings:
#   Settings → Deployment Protection → Standard Protection → Password
```

Push to `main` triggers a production deploy. CI (GitHub Actions in `.github/workflows/ci.yml`) runs typecheck + lint + unit tests on every push and PR.

## Architecture

- **Server-rendered shell + client SWR.** The Next.js page is a client component that hydrates SWR hooks. Hooks call our own `/api/lemlist/*` route handlers, which in turn call lemlist (server-side, API key never reaches the browser).
- **Vercel KV as shared cache** for lemlist responses. Today's data: 60s TTL. Past weeks: 24h TTL (immutable). Campaigns list: 10min. Stats: 5min. KV unavailability transparently falls through to direct fetch.
- **Token bucket** in `lib/lemlist/client.ts` keeps us under lemlist's 20 req/2s ceiling (8 r/s sustained, 12 burst). 429 retries once honoring `Retry-After`.
- **All metrics are pure functions** in `src/lib/metrics/`, fully tested in Vitest. The lemlist client and route handlers are tested with `vi.spyOn(global, 'fetch')`.

## Lemlist quirks worth knowing

- Each call dial fires **two** events: `aircallCreated` then `aircallEnded`. Only `aircallEnded` carries `duration` — that's the canonical "this call happened" event. The `aircall*` prefix is legacy naming; native-dialer calls use the same types.
- Lemlist exposes **no native "connected" flag** for calls — only `aircallInterested`/`aircallNotInterested`, and those only fire if you manually disposition. The "Connect rate" KPI is therefore a **heuristic** (`duration >= 60s` by default — voicemail greetings rarely run that long). Tunable in `BENCHMARKS.connectDurationThresholdSec`. The "Qualified" KPI alongside it counts `aircallInterested` events for ground-truth.
- The `/campaigns/{id}/stats` endpoint **requires** `startDate` and `endDate` — there is no "all time."
- The `/team/senders` endpoint returns objects shaped `{ userId, campaigns }`. There's no `email`/`firstName` at this level — the API key per-user identifies you.

## Project structure

```
src/
├── app/
│   ├── (dash)/            # route group: dashboard shell + pages
│   ├── api/lemlist/       # route handlers (cached lemlist proxies)
│   ├── globals.css        # OKLCH theme tokens
│   └── layout.tsx         # root layout (fonts, dark)
├── components/
│   ├── kpi/               # KpiCard, PaceCard, ProjectionCard
│   ├── charts/            # Recharts wrappers + Funnel
│   ├── ui/                # shadcn primitives (generated)
│   └── ActivityFeed.tsx
├── hooks/                 # SWR hooks
└── lib/
    ├── config.ts          # all tunable knobs
    ├── lemlist/           # client + zod schemas + endpoints
    ├── metrics/           # pure: pacing, projection, derived
    ├── cache.ts           # KV wrapper
    └── utils.ts           # cn()

tests/
├── unit/                  # Vitest
└── e2e/                   # Playwright
```
