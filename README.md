# Trancense

Trancense is an evidence-led AI energy-audit platform for tester-ready industrial workspaces. The existing dark SaaS interface and deterministic calculation engine are preserved; this release adds authenticated Supabase persistence, tenant isolation, role-aware workflows, and safe server-side AI grounding.

The product is decision-support software. It does not provide BEE certification, PAT filing, legal compliance approval, automatic equipment control, auditor sign-off, live SCADA/PLC/BMS connections, vendor endorsement, or guaranteed savings.

## Architecture

- Next.js App Router 16.2.10, React 19, strict TypeScript, and the existing responsive UI.
- `DATA_MODE=demo` uses the explicit deterministic seed in [`lib/demo-data.ts`](./lib/demo-data.ts) for local product demos and calculation fixtures only.
- `DATA_MODE=supabase` requires an authenticated Supabase session and active organization membership. It never silently falls back to demo data. Empty organizations receive setup/empty states instead of fabricated metrics.
- The root route is server-gated: unauthenticated visitors go to `/login`, authenticated users without a membership go to `/onboarding`, and members go to `/overview`. [`lib/supabase/client.ts`](./lib/supabase/client.ts) and [`lib/supabase/server.ts`](./lib/supabase/server.ts) use `@supabase/ssr` cookies; [`proxy.ts`](./proxy.ts) refreshes sessions with verified claims before protected routes execute.
- [`lib/data-access.ts`](./lib/data-access.ts) is the tenant-scoped read adapter. Route handlers under [`app/api`](./app/api) validate input with Zod, check membership and roles, write records, and append audit events.
- PostgreSQL schema and RLS are versioned under [`supabase/migrations`](./supabase/migrations). The service-role client is limited to trusted seed, onboarding, and invitation operations and is never imported by browser code.
- Authoritative numerical outputs remain in [`lib/calculations.ts`](./lib/calculations.ts). The assistant can explain authorized records but cannot create energy, financial, carbon, tariff, compliance, or savings values.

Routes include `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/auth/recovery`, `/onboarding`, `/overview`, `/audits`, `/audits/[id]`, `/data`, `/assets`, `/energy-balance`, `/analytics`, `/ecms`, `/solar`, `/reports`, `/assistant`, `/settings`, and `/api/health`.

## Local setup

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/Rossonerian/Trancense.git
cd Trancense
npm ci
cp .env.example .env.local
# For a zero-setup local UI demo, set DATA_MODE=demo in .env.local.
npm run dev
```

Open <http://localhost:3000/>. In `DATA_MODE=demo`, the login entry point offers an explicit demo workspace and shows `Demo Data`. In `DATA_MODE=supabase`, the root route requires authentication and never loads seeded data.

## Environment variables

`.env.example` contains names only. `.env.local`, `.env`, database dumps, and private credential files are ignored by Git. Never expose the service-role or AI keys with a `NEXT_PUBLIC_` prefix.

```env
# Vercel Supabase integration names
NEXT_PUBLIC_STORAGE_SUPABASE_URL=
NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STORAGE_SUPABASE_PUBLISHABLE_KEY=
STORAGE_SUPABASE_SERVICE_ROLE_KEY=

# Local-development aliases
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
DATA_MODE=supabase

AI_PROVIDER=auto
OPENROUTER_API_KEY=
OPENROUTER_MODEL_CHAIN=
GROQ_API_KEY=
GROQ_MODEL=
GOOGLE_GENERATIVE_AI_API_KEY=
GEMINI_MODEL=
```

`DATA_MODE=supabase` is the production setting. `DATA_MODE=demo` is an explicit local development mode only. The resolver prefers the Vercel integration names `NEXT_PUBLIC_STORAGE_SUPABASE_URL`, `NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STORAGE_SUPABASE_PUBLISHABLE_KEY`, and `STORAGE_SUPABASE_SERVICE_ROLE_KEY`; the original `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` names remain supported as local aliases. Only the `NEXT_PUBLIC_*` URL and publishable/anon key are browser-safe. The service-role key is server-only and is never imported by browser code. The URL must be the Supabase project root, such as `https://YOUR_PROJECT_REF.supabase.co`; `/rest/v1`, `/auth/v1`, `/storage/v1`, dashboard, project, query-string, and malformed URLs are rejected. The Supabase SDK constructs `/auth/v1/signup` itself, so the application never appends `/auth/v1` to the configured URL. `DATABASE_URL` should be a transaction-pooler connection for serverless tooling and `DIRECT_URL` the direct connection for migrations/admin work. The current application uses the Supabase Data API, so neither URL is read by the browser.

`NEXT_PUBLIC_APP_URL` is the trusted application origin used in Supabase email links. Set it to `https://trancense.vercel.app` in Vercel Production and to `http://localhost:3000` for local development. The resolver accepts the production origin, local development origin, and explicitly configured Vercel preview origins; it rejects arbitrary external hosts, query strings, fragments, and path-bearing origins. If the variable is absent in a server request, the resolver can use the current request origin only when it is trusted, and production never falls back to localhost.

## Supabase project and migrations

1. Create a Supabase project and open **Connect** / **API** in the dashboard. Copy the Project URL, publishable/anon key, service-role key, transaction pooler URL, and direct database URL into `.env.local` without committing the file. In Vercel, the Supabase integration may inject the same values under the `NEXT_PUBLIC_STORAGE_SUPABASE_*` / `STORAGE_SUPABASE_SERVICE_ROLE_KEY` names documented above.
2. Configure Auth → URL Configuration. For Production use Site URL `https://trancense.vercel.app` and redirect URLs `https://trancense.vercel.app/auth/callback` and `https://trancense.vercel.app/reset-password`. For local development use Site URL `http://localhost:3000` and redirect URLs `http://localhost:3000/auth/callback` and `http://localhost:3000/reset-password`.
3. Enable Email provider/password sign-in. For a real tester, configure custom SMTP; the hosted default email service is best-effort and rate-limited. Enable email confirmation for production and keep it disabled only for a controlled local test project.
4. Install and authenticate the Supabase CLI, then apply migrations:

   ```bash
   # Run once if this checkout does not yet have supabase/config.toml.
   supabase init
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

   The migrations create profiles, organizations, organization memberships, sites, audit boundaries/versions, assets, meters, bills, readings, production records, tariffs, emission factors, evidence metadata, import batches/rows/findings, calculation runs/results, ECMs/interactions/M&V plans, solar scenarios, workflow transitions, approvals, comments, audit events, report snapshots, citations, indexes, triggers, and RLS policies.

5. Seed only a development/demo project when the deterministic Shakti Precision Components Pvt. Ltd. Pune Plant dataset is wanted:

   ```bash
   npm run db:seed -- TESTER_USER_UUID
   ```

   The seed uses the server-only service-role boundary, fixed IDs, and `is_demo=true`. It is not called by the production runtime. Omit the user UUID when the seed is only for service-side inspection; provide it to give that existing Auth user a demo organization Admin membership.

6. Create the first administrator through the documented server-side command, never through a public signup role selector:

   ```bash
   npm run grant:admin -- USER_UUID ORGANIZATION_UUID
   ```

   The command requires one supported Supabase project URL and one supported server-only service-role variable in the invoking environment and prints no secret values. Public signup always starts with `Executive/Viewer`.

### Auth and onboarding

Signup collects full name, organization, role, country, and optional phone. The database trigger creates only the profile; onboarding creates the organization, an `Executive/Viewer` membership, and the first site from the user’s submitted values. Login, logout, persistent secure-cookie sessions, email confirmation, Google OAuth, resend through Supabase Auth, password reset, callback handling, protected routes, loading states, and validation/error states are implemented.

The `/settings` administration panel is visible only to an Admin membership. Admins can invite testers, change roles, suspend/remove memberships, and inspect tenant audit events. Reviewers can approve technical outputs; viewers can read permitted records but cannot mutate them. These checks are repeated in route handlers and RLS, not just in the UI.

Supabase’s official SSR guidance recommends separate browser/server clients, a proxy for cookie refresh, and verified claims for route protection: [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client). Supabase’s official RLS guidance requires RLS on exposed public tables and warns that service keys bypass RLS: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

Confirmation and recovery behavior:

- Signup sends `emailRedirectTo` to `/auth/callback` on the trusted application origin. The callback exchanges the Supabase code, preserves secure cookies, and sends new users to `/onboarding` or established users to `/overview`.
- Confirmation links are one-time use. Expired, consumed, invalid, or incomplete links go to `/auth/recovery` with a safe explanation and actions to return to login/signup or request a fresh confirmation email.
- Password-reset emails use the trusted origin plus `/reset-password`. The reset page validates the recovery session before enabling the password form and explains expired links without exposing tokens.
- Tester invitations use the same trusted production callback origin and never trust an arbitrary request `Origin` header.

After changing `NEXT_PUBLIC_APP_URL` or any Vercel environment variable, redeploy the application. Existing deployments do not receive changed environment values automatically. Test signup, email confirmation, login, logout, resend confirmation, and password reset with a newly generated link; an old or already-used link cannot be reused.

Google OAuth is enabled in Supabase Auth → Providers. The login and signup buttons use the trusted application origin and `/auth/callback`; Google client credentials remain in Supabase, never in the browser. Configure the callback URL in Supabase and use a fresh auth session for each test.

## Real tester workflows

With `DATA_MODE=supabase` and a configured account:

1. Sign up, confirm the email, and complete `/onboarding`.
2. Create an audit from `/audits` after the first site exists.
3. Import utility bills or asset CSVs from `/data`; formula-like cells are rejected, rows are recorded in import batches, and committed data is tenant-scoped.
4. Use the APIs or authorized forms to create sites, audits, assets, bills, ECMs, and solar scenarios. Every mutation validates input, checks role, revalidates through the authenticated Supabase client, and appends an audit event.
5. Review the persisted audit, run deterministic calculations against validated records, create a report snapshot, and use `/assistant` for grounded explanations.
6. Invite a viewer and a reviewer from Settings. Test that the viewer can read but cannot create, edit, or approve technical outputs.

If there are no records, the UI shows actions such as **Create your first site**, **Create your first audit**, **Import utility data**, and **No solar scenario yet**. It does not display seeded totals in Supabase mode.

To remove only the known seeded demo tenant, review the printed target and counts first, then run this guarded command against the intended project:

```bash
PURGE_DEMO_DATA=true npm run db:remove-demo
```

Without the explicit flag the command refuses to run. It targets only organizations marked `is_demo=true` and the known `shakti-precision` demo slug, cascades their tenant records, preserves Supabase Auth users, and never deletes unrelated organizations. Do not run it against production until the target organization and counts have been manually verified.

## Evidence and Storage

The current MVP persists CSV/import metadata and evidence metadata in PostgreSQL. It does not yet expose a browser evidence-file upload route, so no private file storage claim is made. Before enabling evidence uploads, create a private Supabase Storage bucket, keep only metadata in `evidence_items`, validate MIME/extension/size server-side, issue signed URLs only from trusted server code, and add organization-scoped Storage policies. Never use the Vercel filesystem or a public bucket for private client evidence.

## Grounded AI fallback

`/api/assistant` always has a deterministic `Grounded Demo Response`. Provider order in `AI_PROVIDER=auto` is OpenRouter free models, optional Groq, optional Gemini, then deterministic fallback. The server:

- queries OpenRouter’s current model catalogue and accepts only text models with both prompt and completion pricing exactly zero;
- treats `OPENROUTER_MODEL_CHAIN` as a preference, skipping missing, expired, unavailable, 402, 429, 5xx, timeout, and provider-failure models;
- uses sequential short timeouts, a 1,200-character prompt limit, 320 output tokens, no retry storm, and safe provider/model logs only;
- supplies only authenticated tenant records in Supabase mode and refuses fabricated readings, savings, compliance, certification, control, or cross-tenant requests;
- labels responses `Provider Response` only after a provider succeeds and `Grounded Demo Response` otherwise.

Run `npm run ai:verify-models` before a pitch because free availability, expiry, context limits, and rate limits change. A previous local catalogue check recorded these eligible examples, but they are not permanent truth: `tencent/hy3:free`, `poolside/laguna-xs-2.1:free`, `cohere/north-mini-code:free`, `nvidia/nemotron-3-ultra-550b-a55b:free`, and `poolside/laguna-m.1:free`. See OpenRouter’s current [free variants](https://openrouter.ai/docs/guides/routing/model-variants/free), [model fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks), and [error handling](https://openrouter.ai/docs/api/reference/errors-and-debugging).

## Vercel deployment

Import the repository into Vercel with the **Next.js** framework preset, repository root, install command `npm ci`, build command `npm run build`, and the default output directory. No filesystem persistence is required.

Set variables separately for **Preview** and **Production**. Production must use `DATA_MODE=supabase` and `NEXT_PUBLIC_APP_URL=https://trancense.vercel.app`; use a separate Supabase project or tightly controlled test tenant for Preview when possible. Add the resolved Vercel integration names—or the supported local aliases—to both environments as needed. Add AI variables only as server-side Vercel environment variables. Redeploy after changing environment variables; changing Vercel environment variables does not update an existing deployment. Confirm the deployed `/api/health` response and the visible `Supabase Data` label after authentication before inviting testers.

Pitch checklist:

- Apply the latest migration and seed only the intended development/demo project.
- Create the first production Admin with `grant:admin` or a controlled SQL/server-side operation.
- Sign up a tester, confirm email, complete onboarding, and invite a Viewer and Reviewer.
- Walk overview → audit → energy balance → analytics → ECM weights → solar → assistant → report preview/print.
- Refresh in Production and confirm records remain after the Supabase-backed reload.
- Keep `AI_PROVIDER=demo` if provider quotas could affect the pitch; deterministic grounding remains available.
- Do not claim deployment succeeded until the Vercel deployment URL and `/api/health` have actually been checked.

Vercel environment variables are scoped by Development, Preview, and Production: [Vercel environment variables](https://vercel.com/docs/environment-variables). Free-tier provider quotas, database limits, email delivery, and Vercel reporting policies are subject to change and should not be treated as availability guarantees.

## Vercel Analytics and Speed Insights

The root layout renders `Analytics` from `@vercel/analytics` and `SpeedInsights` from `@vercel/speed-insights` exactly once. Web Analytics is viewed in the Vercel project dashboard under **Analytics**. Speed Insights is viewed under **Speed Insights**. No environment variables or secrets are required, and Trancense does not add custom tracking of sensitive audit data or personally identifiable information.

Metrics begin collecting after the updated application is deployed and the deployed site is visited. They may not appear immediately on a new deployment. Select the correct environment, normally **Production**.

1. Deploy the updated project to Vercel.
2. Open the correct Vercel project.
3. Open **Analytics** and enable Web Analytics if Vercel requests activation.
4. Open **Speed Insights** and complete any activation step shown by Vercel.
5. Select the correct environment, normally **Production**.
6. Open the deployed production URL.
7. Navigate through overview, audit, analytics, ECM, solar, assistant, and reports.
8. Wait for Vercel to process the initial data.
9. Return to the **Analytics** and **Speed Insights** tabs.

Official references: [Web Analytics quickstart](https://vercel.com/docs/analytics/quickstart), [Analytics package](https://vercel.com/docs/analytics/package), [Speed Insights quickstart](https://vercel.com/docs/speed-insights/quickstart), and [Speed Insights overview](https://vercel.com/docs/speed-insights).

## Verification

Executed in this repository during the current implementation:

```text
npm run typecheck  PASS
npm run lint       PASS
npm test           PASS — 10 files, 25 tests
npm run build      PASS — Next.js 16.2.10 production build; all app/API routes generated
```

Migration application against a live Supabase project, account signup/email delivery, Vercel deployment, and Production refresh persistence require account-side credentials and were not claimed as locally verified in this environment. Run `supabase db push`, `npm run db:seed -- USER_UUID`, the auth flow, and the Vercel checklist above against the intended project.

## Security and free-tier limitations

Never commit `.env.local`, service-role keys, AI keys, database URLs, user exports, or private evidence. The service role bypasses RLS and is server-only. RLS must remain enabled on every tenant-owned public table. Review Supabase Auth email/SMTP, Storage policies, backups, retention, deletion, rate limits, and audit logging before handling real client data.

Supabase/Vercel/free AI services can have quotas, cold starts, email limits, model expiry, transient failures, storage limits, and changing plan terms. They are suitable for a small pitch/demo, not critical professional audits without backups, privacy review, security testing, monitoring, incident response, and operational hardening.

## License and contribution

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`LICENSE`](./LICENSE). Keep authoritative numbers in the calculation layer, add provenance to material outputs, test tenant isolation, and run the verification set before a pull request.
