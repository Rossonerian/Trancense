# Trancense

Trancense is an evidence-led AI energy audit platform MVP for Indian industrial and commercial facilities. The existing dark editorial UI is unchanged; this release adds a production-compatible Supabase data path, safe server-side provider routing, and a pitch deployment path while keeping the deterministic demo available.

Seeded demo: **Shakti Precision Components Pvt. Ltd. — Pune Plant**, Detailed audit, `01 Apr 2025 — 31 Mar 2026`.

## Product boundaries

This is decision-support software. It does not provide BEE certification, PAT filing, legal compliance approval, automatic equipment control, predictive-maintenance failure prediction, a digital twin, subsidy/net-metering eligibility, vendor endorsement, live Modbus/BACnet/MQTT/SCADA/PLC/BMS connections, native mobile apps, or DOCX/XLSX export.

Authoritative numerical results remain in typed pure functions in [`lib/calculations.ts`](./lib/calculations.ts). External AI can explain approved calculations and evidence only; it cannot create energy, financial, carbon, tariff, compliance, or savings values.

## Stack and architecture

- Next.js App Router 16, React 19, strict TypeScript, and the existing responsive dark SaaS design system.
- Deterministic adapter in [`lib/demo-data.ts`](./lib/demo-data.ts), selected automatically when `DATA_MODE=demo` or Supabase is unavailable.
- Server-only Supabase repository in [`lib/data-access.ts`](./lib/data-access.ts) using `@supabase/supabase-js`; no ORM was added because the existing MVP had no persistence layer to preserve.
- SQL schema/RLS migration in [`supabase/migrations`](./supabase/migrations), deterministic seed script in [`scripts/seed-supabase.ts`](./scripts/seed-supabase.ts), and server-only service-role access.
- Server-only assistant route at `/api/assistant`: OpenRouter free-model catalogue discovery, optional Groq/Gemini fallbacks, then deterministic grounded response.
- Safe health route at `/api/health`; it reports data mode, provider mode, missing variable names, and a Supabase connectivity result without returning secrets.

Routes:

`/overview` · `/audits/[id]` · `/data` · `/assets` · `/energy-balance` · `/analytics` · `/ecms` · `/solar` · `/reports` · `/assistant` · `/settings` · `/api/health` · `/api/assistant`

## Local setup

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/RossoKashy/Trancense.git
cd Trancense
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000/overview](http://localhost:3000/overview). With the default `DATA_MODE=demo`, no account, database, or API key is required. The shell shows `Demo Data` and `/assistant` shows `Grounded Demo Response`.

## Environment variables

`.env.local` is ignored and must never be committed. `.env.example` contains names only. Missing Supabase or AI variables do not break deterministic demo mode.

### Required only for Supabase mode

- `DATA_MODE=demo|supabase` — use `demo` for the zero-setup fallback; use `supabase` after migration and seed.
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL from the Supabase dashboard Connect/API settings.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — publishable/anon key; safe for browser use but not used for privileged seed access.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only service-role key from Supabase API settings. Never prefix it with `NEXT_PUBLIC_`, log it, or send it to a client.
- `DATABASE_URL` — Supabase transaction pooler URL from the Connect dialog, useful for server/CLI tooling.
- `DIRECT_URL` — direct database URL from the Connect dialog, useful for migrations/admin tooling. The current app uses the Supabase Data API, so these URLs are not required to render the app.

### Optional AI variables

- `AI_PROVIDER=auto|demo|openrouter|groq|gemini`
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL_CHAIN`, `OPENROUTER_SITE_URL`, `OPENROUTER_APP_NAME`
- `GROQ_API_KEY`, `GROQ_MODEL`
- `GOOGLE_GENERATIVE_AI_API_KEY`, `GEMINI_MODEL`

Keys are read only in server modules and route handlers. They are not imported into client components or returned by `/api/health`.

## Supabase setup and persistence

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. In the project dashboard, open Connect/API settings and copy the Project URL, publishable/anon key, service-role key, transaction pooler URL, and direct connection URL into local `.env.local`. Do not paste secrets into Git or chat.
3. Install and authenticate the Supabase CLI, then link the project:

   ```bash
   supabase login
   supabase init  # once, if this checkout does not already have supabase/config.toml
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

   This applies [`20260716000000_trancense_core.sql`](./supabase/migrations/20260716000000_trancense_core.sql), including organizations, sites, audits, assets, meters, bills, calculations, ECMs, solar scenarios, evidence, audit events, report snapshots, indexes, and RLS policies.

4. Seed the existing demo through the server-only service-role path:

   ```bash
   DATA_MODE=supabase npm run db:seed
   ```

5. Set `DATA_MODE=supabase`, restart the app, and confirm `/api/health` reports `"dataMode":"supabase"` and the shell shows `Supabase Data`.

The seed is deterministic and upserts fixed IDs, so rerunning it is safe. The UI reads the seeded utility bills and assets through a tenant-scoped organization query. If the database is missing, unreachable, or unseeded, the repository returns the original deterministic dataset and the health endpoint reports degraded status without exposing connection details.

### Auth and RLS

Frictionless pitch access intentionally does not require a user login. The migration enables RLS on every exposed table and includes membership-based policies for a future authenticated path. If Auth is enabled later, add users to `organization_members` and use Supabase SSR clients with verified claims; never replace the server-only service-role boundary with a browser service-role key. Supabase recommends verified claims for authorization and RLS for exposed tables: [SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client) and [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## AI provider fallback

The assistant route follows this order:

1. OpenRouter, when selected/available, using only models currently returned by OpenRouter’s catalogue with prompt and completion pricing exactly `0`.
2. Groq, when configured.
3. Gemini, when configured.
4. Deterministic `Grounded Demo Response`.

The OpenRouter chain is discovered at runtime and cached briefly, so disappearing or expiring free models do not break the app. An explicit chain is treated as a preference and is used only when each model is still present and free. Verify the current catalogue with:

```bash
npm run ai:verify-models
```

On 16 Jul 2026 UTC, the catalogue verification returned 15 eligible text models and this first-five chain:

```text
tencent/hy3:free,poolside/laguna-xs-2.1:free,cohere/north-mini-code:free,nvidia/nemotron-3-ultra-550b-a55b:free,poolside/laguna-m.1:free
```

Free-model names, expiry dates, context limits, availability, and request limits can change. Do not treat that chain as permanent truth; rerun the verifier before a pitch. OpenRouter documents model fallbacks and error behavior at [model fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks), [error handling](https://openrouter.ai/docs/api/reference/errors-and-debugging), and [free variants](https://openrouter.ai/docs/guides/routing/model-variants/free). The provider path uses short 8-second timeouts, 1,200-character prompts, 320 output tokens, sequential failover, and safe metadata logs only. It does not retry storms or log prompts.

`/assistant` labels a real successful call `Provider Response` and includes provider/model metadata. Without a successful external call it labels the response `Grounded Demo Response`. All responses cite seeded evidence/calculation IDs and retain the refusal guardrail.

## Vercel deployment

The app is Vercel-compatible. No filesystem persistence is used by the application or API routes; Supabase is the persistence boundary.

1. Push the repository to GitHub and import it into a Vercel project.
2. Framework preset: **Next.js**. Root directory: repository root. Install command: `npm ci`. Build command: `npm run build`. Output directory: leave the Vercel default.
3. Add environment variables separately for both **Preview** and **Production**. Never reuse a local `.env.local` file upload.

Production/Preview Supabase variables:

```text
DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
DIRECT_URL=...
```

Production/Preview AI variables can remain `AI_PROVIDER=demo` for the most reliable pitch, or add server-only provider keys and `AI_PROVIDER=auto`. Add `OPENROUTER_MODEL_CHAIN` only after running the catalogue verifier. Vercel environment variables are scoped by Development, Preview, and Production: [Vercel environment variables](https://vercel.com/docs/environment-variables). The Vercel deployment itself is not claimed here because no Vercel account/deployment was available to verify.

### Pitch-demo checklist

- Apply migration and run `npm run db:seed` locally against the intended Supabase project.
- Set the same Supabase variables in Vercel Preview and Production; use separate projects or keys when appropriate.
- Deploy a Preview, open `/api/health`, and confirm `status=ok`, `dataMode=supabase`.
- Open `/overview` and confirm the sidebar says `Supabase Data`.
- Walk the demo: audit → energy balance → analytics → ECM weights → solar → assistant → report print.
- Refresh after the Supabase seed and confirm `/overview` and `/assets` still render.
- Keep `AI_PROVIDER=demo` if provider rate limits would risk the pitch; the deterministic assistant is the reliable fallback.

## Vercel Analytics and Speed Insights

The root layout renders the official `@vercel/analytics/next` `Analytics` component and `@vercel/speed-insights/next` `SpeedInsights` component exactly once. They collect aggregate page-view and real-user performance signals across the existing routes; Trancense does not add custom tracking of energy-audit content, credentials, or personally identifiable information. No environment variables or secrets are required for these integrations.

Web Analytics is viewed in the Vercel project dashboard under **Analytics**. Speed Insights is viewed under **Speed Insights**. Data begins collecting after the updated application is deployed and the deployed site is visited, and may not appear immediately on a new deployment. Select the correct environment, normally **Production**, before interpreting the results.

Beginner-friendly activation flow:

1. Deploy the updated project to Vercel.
2. Open the correct Vercel project.
3. Open **Analytics** and enable Web Analytics if Vercel requests activation.
4. Open **Speed Insights** and complete any activation step shown by Vercel.
5. Select the correct environment, normally **Production**.
6. Open the deployed production URL.
7. Navigate through several routes: overview, audit, analytics, ECM, solar, assistant, and reports.
8. Wait for Vercel to process the initial data.
9. Return to the **Analytics** and **Speed Insights** tabs.

The official integrations and dashboard behavior are documented in the [Web Analytics quickstart](https://vercel.com/docs/analytics/quickstart), [Analytics package guide](https://vercel.com/docs/analytics/package), [Speed Insights quickstart](https://vercel.com/docs/speed-insights/quickstart), and [Speed Insights overview](https://vercel.com/docs/speed-insights). Vercel plan availability, reporting windows, and usage policies can change; check the dashboard and current Vercel documentation for the active project terms.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run ai:verify-models
```

The final local verification run passed `npm run typecheck`, `npm run lint`, `npm test` with 7 tests, and `npm run build`. A production-like `npm run start` smoke run returned 200 for every required page route, returned 200 from `/api/health` in Demo Data mode, and returned a cited deterministic response from `/api/assistant` with no provider keys. Supabase refresh persistence requires account-side setup and a configured project, so it is documented as a manual deployment check rather than claimed as locally verified without credentials.

## Security and known limitations

The service-role key is server-only. RLS is enabled on all public tables. API inputs are Zod-validated, AI prompts are bounded, provider failures fail over without exposing prompt content, and health responses list missing variable names only. Demo data is fictional. The current frictionless demo does not authenticate users, and Supabase edits require the seed/service-role path rather than browser writes. Free AI providers may impose daily request limits, cold starts, expiring models, or provider-specific data policies. `npm audit --audit-level=high` currently reports two moderate transitive PostCSS findings through Next.js and no high/critical findings; `npm audit fix --force` proposes an unsafe breaking downgrade and was not applied.

## License and contribution

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`LICENSE`](./LICENSE). Keep authoritative numbers in the calculation layer, add provenance to new material outputs, and run the full verification set before a pull request.
