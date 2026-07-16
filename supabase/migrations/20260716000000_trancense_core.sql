create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, region text, timezone text not null default 'Asia/Kolkata', created_at timestamptz not null default now(), unique (organization_id, name)
);
create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('Admin','Energy Auditor','Facility Manager','Reviewer','Executive / Viewer')),
  created_at timestamptz not null default now(), primary key (organization_id, user_id)
);
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade, code text not null unique, name text not null, level text not null,
  period_start date not null, period_end date not null, state text not null, completeness numeric(5,2) not null default 0,
  owner_name text, reviewer_name text, boundary text, purpose text, snapshot_version text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade, external_id text not null, name text not null, equipment_type text not null,
  system_name text, location text, rating text, age_years numeric, operating_hours_year numeric, criticality text, health_score numeric, status text,
  confidence text, note text, parent_asset_id uuid references public.assets(id) on delete set null, created_at timestamptz not null default now(), unique (organization_id, external_id)
);
create table if not exists public.meters (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade, external_id text not null, name text not null, carrier text not null,
  unit text not null, interval_minutes integer, status text not null default 'read-only', created_at timestamptz not null default now(), unique (organization_id, external_id)
);
create table if not exists public.utility_bills (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade, billing_month date not null, electricity_kwh numeric not null default 0,
  diesel_litres numeric not null default 0, natural_gas_kwh numeric not null default 0, solar_kwh numeric not null default 0,
  total_cost_inr numeric not null default 0, production_units numeric not null default 0, source_id text, confidence text, created_at timestamptz not null default now(), unique (site_id, billing_month)
);
create table if not exists public.calculations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid references public.audits(id) on delete set null, calculation_id text not null, formula_version text not null,
  result jsonb not null default '{}'::jsonb, provenance jsonb not null default '{}'::jsonb, approved boolean not null default false,
  created_at timestamptz not null default now(), unique (organization_id, calculation_id)
);
create table if not exists public.ecms (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid references public.audits(id) on delete set null, code text not null, title text not null, system_name text,
  observation text, proposed_action text, savings_kwh numeric, cost_savings_inr numeric, carbon_tonnes numeric, capex_low_inr numeric,
  capex_high_inr numeric, payback_years numeric, confidence text, effort numeric, risk text, status text, interaction_group text,
  mv_method text, owner_name text, provenance jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique (organization_id, code)
);
create table if not exists public.solar_scenarios (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid references public.audits(id) on delete set null, code text not null, name text not null, inputs jsonb not null default '{}'::jsonb,
  outputs jsonb not null default '{}'::jsonb, assumptions jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), unique (organization_id, code)
);
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid references public.audits(id) on delete set null, evidence_id text not null, evidence_type text, title text not null,
  status text, captured_at date, confidence text, note text, created_at timestamptz not null default now(), unique (organization_id, evidence_id)
);
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid references public.audits(id) on delete set null, event_type text not null, actor_name text not null, details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create table if not exists public.report_snapshots (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid not null references public.audits(id) on delete cascade, snapshot_code text not null, version integer not null default 1,
  status text not null default 'draft', payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique (organization_id, snapshot_code)
);

create index if not exists sites_organization_idx on public.sites(organization_id);
create index if not exists audits_organization_idx on public.audits(organization_id);
create index if not exists assets_organization_idx on public.assets(organization_id);
create index if not exists bills_organization_month_idx on public.utility_bills(organization_id, billing_month);
create index if not exists calculations_organization_idx on public.calculations(organization_id);
create index if not exists ecms_organization_idx on public.ecms(organization_id);
create index if not exists evidence_organization_idx on public.evidence(organization_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists audits_set_updated_at on public.audits;
create trigger audits_set_updated_at before update on public.audits for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.sites enable row level security;
alter table public.organization_members enable row level security;
alter table public.audits enable row level security;
alter table public.assets enable row level security;
alter table public.meters enable row level security;
alter table public.utility_bills enable row level security;
alter table public.calculations enable row level security;
alter table public.ecms enable row level security;
alter table public.solar_scenarios enable row level security;
alter table public.evidence enable row level security;
alter table public.audit_events enable row level security;
alter table public.report_snapshots enable row level security;

create or replace function public.is_org_member(target_org uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members where organization_id = target_org and user_id = (select auth.uid()));
$$;
revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated, service_role;

create policy organizations_member_select on public.organizations for select to authenticated using (public.is_org_member(id));
create policy organizations_member_update on public.organizations for update to authenticated using (public.is_org_member(id)) with check (public.is_org_member(id));
create policy organization_members_self_select on public.organization_members for select to authenticated using (user_id = (select auth.uid()));

do $$
declare table_name text;
begin
  foreach table_name in array array['sites','audits','assets','meters','utility_bills','calculations','ecms','solar_scenarios','evidence','audit_events','report_snapshots'] loop
    execute format('create policy %I_member_select on public.%I for select to authenticated using (public.is_org_member(organization_id))', table_name, table_name);
    execute format('create policy %I_member_insert on public.%I for insert to authenticated with check (public.is_org_member(organization_id))', table_name, table_name);
    execute format('create policy %I_member_update on public.%I for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id))', table_name, table_name);
  end loop;
end $$;

comment on schema public is 'Trancense tenant-scoped energy audit persistence. Service-role access is server-only; authenticated browser access is RLS-protected.';
