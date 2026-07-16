# Supabase database

Apply the migration with the Supabase CLI or the SQL editor, then run the TypeScript seed script with the service-role key in a local `.env.local`.

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
npm run db:seed
```

The migration enables RLS on every exposed table. The current pitch app uses a server-only service-role repository for the seeded frictionless demo; it still scopes reads by the seeded organization. A future authenticated browser path should use Supabase SSR clients and the included membership policies, never the service-role key.
