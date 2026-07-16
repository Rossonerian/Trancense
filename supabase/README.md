# Supabase database

The SQL migrations are the source of truth for the tester-ready backend. Apply them with the Supabase CLI from the repository root:

```bash
supabase init # once, if config.toml is not already present
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The first migration contains the original demo-compatible core tables. The follow-up migration adds profiles, authenticated organization memberships, audit boundaries and versions, readings, production, tariffs, emission factors, evidence metadata, imports and validation findings, calculation runs/results, ECM interactions and M&V plans, workflow transitions, approvals, comments, citations, auth provisioning, indexes, and role-aware RLS policies.

For a local development/demo project only:

```bash
npm run db:seed -- TESTER_USER_UUID
```

The seed is deterministic, marks the organization as demo data, and uses the service-role key only from the local script. It is never called by the production runtime. To create the first administrator in a real organization, use the documented server-side command:

```bash
npm run grant:admin -- USER_UUID ORGANIZATION_UUID
```

The application uses `@supabase/ssr` browser/server clients and a root `proxy.ts` for cookie session refresh. Browser and authenticated server requests use the publishable/anon key and RLS. The service-role key is reserved for trusted onboarding/invitation/seed operations and is never sent to the browser.

RLS policies require an active `organization_memberships` row. Roles are `Admin`, `Energy Auditor`, `Facility Manager`, `Reviewer`, and `Executive/Viewer`; public signup can only create the viewer role. Reviewers/admins alone can approve technical outputs. Test cross-tenant access with two authenticated users and both the UI and direct API requests; changing an organization, site, audit, or UUID must return no data or a permission error.

Private file uploads are not exposed by the current MVP. If enabled later, use a private Storage bucket, metadata in `evidence_items`, server-generated signed URLs, MIME/extension/size checks, and organization-scoped Storage policies. Do not use Vercel filesystem persistence.
