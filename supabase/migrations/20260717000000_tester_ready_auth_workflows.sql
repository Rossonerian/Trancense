-- Tester-ready auth, tenant isolation, workflow records, and immutable provenance.
-- This migration extends the original demo schema; it does not create tables dynamically at runtime.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  job_role text not null default '',
  country text not null default '',
  phone text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'Executive/Viewer' check (role in ('Admin','Energy Auditor','Facility Manager','Reviewer','Executive/Viewer','Executive / Viewer')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.audit_boundaries (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid not null references public.audits(id) on delete cascade, name text not null, description text,
  included_assets jsonb not null default '[]'::jsonb, included_meters jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.audit_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid not null references public.audits(id) on delete cascade, version integer not null, status text not null default 'draft',
  input_snapshot jsonb not null default '{}'::jsonb, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(),
  unique (audit_id, version)
);
create table if not exists public.meter_readings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade, meter_id uuid not null references public.meters(id) on delete cascade,
  reading_at timestamptz not null, value numeric not null check (value >= 0), unit text not null, quality text not null default 'unvalidated',
  source text, import_batch_id uuid, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(),
  unique (meter_id, reading_at)
);
create table if not exists public.production_records (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade, period_start date not null, period_end date not null,
  quantity numeric not null check (quantity >= 0), unit text not null, product_line text, source text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(),
  check (period_end >= period_start)
);
create table if not exists public.tariffs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade, name text not null, currency text not null default 'INR',
  energy_rate numeric not null check (energy_rate >= 0), demand_rate numeric not null default 0 check (demand_rate >= 0), valid_from date not null, valid_to date,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), check (valid_to is null or valid_to >= valid_from)
);
create table if not exists public.emission_factors (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, carrier text not null, factor numeric not null check (factor >= 0), unit text not null, valid_from date not null, valid_to date,
  source_citation text, created_at timestamptz not null default now(), check (valid_to is null or valid_to >= valid_from)
);
create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid references public.audits(id) on delete set null, storage_path text, original_filename text not null, mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0), status text not null default 'pending', metadata jsonb not null default '{}'::jsonb,
  uploaded_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null, kind text not null, filename text, status text not null default 'received',
  row_count integer not null default 0 check (row_count >= 0), created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.import_rows (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  import_batch_id uuid not null references public.import_batches(id) on delete cascade, row_number integer not null check (row_number > 0), raw_data jsonb not null default '{}'::jsonb,
  normalized_data jsonb, status text not null default 'pending', created_at timestamptz not null default now(), unique (import_batch_id, row_number)
);
create table if not exists public.validation_findings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  import_row_id uuid references public.import_rows(id) on delete cascade, entity_type text not null, field_name text, severity text not null default 'error',
  message text not null, resolved_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.calculation_runs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid references public.audits(id) on delete set null, site_id uuid references public.sites(id) on delete set null, formula_version text not null,
  input_snapshot jsonb not null default '{}'::jsonb, assumptions jsonb not null default '[]'::jsonb, provenance jsonb not null default '{}'::jsonb,
  quality_status text not null default 'unvalidated', status text not null default 'complete', created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.calculation_results (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  calculation_run_id uuid not null references public.calculation_runs(id) on delete cascade, calculation_key text not null, value jsonb not null default '{}'::jsonb,
  unit text, approved_at timestamptz, approved_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), unique (calculation_run_id, calculation_key)
);
create table if not exists public.ecm_interactions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  ecm_id uuid not null references public.ecms(id) on delete cascade, related_ecm_id uuid not null references public.ecms(id) on delete cascade,
  interaction_type text not null, adjustment_factor numeric, notes text, created_at timestamptz not null default now(), check (ecm_id <> related_ecm_id)
);
create table if not exists public.mv_plans (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  ecm_id uuid not null references public.ecms(id) on delete cascade, method text not null, baseline text not null, measurement_points jsonb not null default '[]'::jsonb,
  frequency text, owner_name text, status text not null default 'draft', created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.workflow_transitions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid references public.audits(id) on delete cascade, entity_type text not null, entity_id uuid not null, from_status text, to_status text not null,
  reason text, actor_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null, entity_id uuid not null, status text not null default 'pending', comment text, requested_by uuid references auth.users(id) on delete set null,
  decided_by uuid references auth.users(id) on delete set null, decided_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null, entity_id uuid not null, body text not null check (char_length(body) between 1 and 4000), author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.citations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  citation_id text not null, entity_type text not null, entity_id uuid, title text not null, locator text, created_at timestamptz not null default now(), unique (organization_id, citation_id)
);

alter table public.organizations add column if not exists updated_at timestamptz not null default now();
alter table public.organizations add column if not exists is_demo boolean not null default false;
alter table public.sites add column if not exists updated_at timestamptz not null default now();
alter table public.assets add column if not exists updated_at timestamptz not null default now();
alter table public.meters add column if not exists updated_at timestamptz not null default now();
alter table public.utility_bills add column if not exists updated_at timestamptz not null default now();
alter table public.ecms add column if not exists updated_at timestamptz not null default now();
alter table public.solar_scenarios add column if not exists updated_at timestamptz not null default now();
alter table public.report_snapshots add column if not exists updated_at timestamptz not null default now();

create index if not exists memberships_user_idx on public.organization_memberships(user_id, status);
create index if not exists memberships_org_idx on public.organization_memberships(organization_id, status);
create index if not exists boundaries_audit_idx on public.audit_boundaries(audit_id);
create index if not exists versions_audit_idx on public.audit_versions(audit_id, version desc);
create index if not exists readings_org_time_idx on public.meter_readings(organization_id, reading_at);
create index if not exists production_org_period_idx on public.production_records(organization_id, period_start, period_end);
create index if not exists import_rows_batch_idx on public.import_rows(import_batch_id, row_number);
create index if not exists findings_org_idx on public.validation_findings(organization_id, severity);
create index if not exists runs_org_audit_idx on public.calculation_runs(organization_id, audit_id, created_at desc);
create index if not exists results_run_idx on public.calculation_results(calculation_run_id);
create index if not exists approvals_org_idx on public.approvals(organization_id, status);
create index if not exists comments_entity_idx on public.comments(organization_id, entity_type, entity_id);

create or replace function public.is_org_member(target_org uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_memberships where organization_id = target_org and user_id = (select auth.uid()) and status = 'active');
$$;
create or replace function public.has_org_role(target_org uuid, allowed_roles text[]) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_memberships where organization_id = target_org and user_id = (select auth.uid()) and status = 'active' and role = any(allowed_roles));
$$;
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, text[]) from public;
grant execute on function public.is_org_member(uuid) to authenticated, service_role;
grant execute on function public.has_org_role(uuid, text[]) to authenticated, service_role;

-- Replace the first demo migration's member-wide mutation policies with role-aware policies below.
drop policy if exists organizations_member_update on public.organizations;
do $$
declare table_name text;
begin
  foreach table_name in array array['sites','audits','assets','meters','utility_bills','calculations','ecms','solar_scenarios','evidence','audit_events','report_snapshots'] loop
    execute format('drop policy if exists %I_member_insert on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_member_update on public.%I', table_name, table_name);
  end loop;
end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare new_org uuid; org_name text;
begin
  org_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''), 'My energy workspace');
  insert into public.profiles (id, full_name, job_role, country, phone) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.raw_user_meta_data ->> 'job_role', ''), coalesce(new.raw_user_meta_data ->> 'country', ''), nullif(new.raw_user_meta_data ->> 'phone', '')) on conflict (id) do nothing;
  insert into public.organizations (slug, name) values ('user-' || replace(new.id::text, '-', ''), org_name) returning id into new_org;
  insert into public.organization_memberships (organization_id, user_id, role, status) values (new_org, new.id, 'Executive/Viewer', 'active');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.audit_boundaries enable row level security;
alter table public.audit_versions enable row level security;
alter table public.meter_readings enable row level security;
alter table public.production_records enable row level security;
alter table public.tariffs enable row level security;
alter table public.emission_factors enable row level security;
alter table public.evidence_items enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;
alter table public.validation_findings enable row level security;
alter table public.calculation_runs enable row level security;
alter table public.calculation_results enable row level security;
alter table public.ecm_interactions enable row level security;
alter table public.mv_plans enable row level security;
alter table public.workflow_transitions enable row level security;
alter table public.approvals enable row level security;
alter table public.comments enable row level security;
alter table public.citations enable row level security;

create policy profiles_self_select on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_self_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy memberships_member_select on public.organization_memberships for select to authenticated using (user_id = (select auth.uid()) or public.has_org_role(organization_id, array['Admin']));
create policy memberships_admin_insert on public.organization_memberships for insert to authenticated with check (public.has_org_role(organization_id, array['Admin']));
create policy memberships_admin_update on public.organization_memberships for update to authenticated using (public.has_org_role(organization_id, array['Admin'])) with check (public.has_org_role(organization_id, array['Admin']));
create policy memberships_admin_delete on public.organization_memberships for delete to authenticated using (public.has_org_role(organization_id, array['Admin']));

do $$
declare table_name text;
begin
  foreach table_name in array array['audit_boundaries','audit_versions','meter_readings','production_records','tariffs','emission_factors','evidence_items','import_batches','import_rows','validation_findings','calculation_runs','calculation_results','ecm_interactions','mv_plans','workflow_transitions','approvals','comments','citations'] loop
    execute format('create policy %I_member_select on public.%I for select to authenticated using (public.is_org_member(organization_id))', table_name, table_name);
    execute format('create policy %I_writer_insert on public.%I for insert to authenticated with check (public.has_org_role(organization_id, array[''Admin'',''Energy Auditor'',''Facility Manager'']))', table_name, table_name);
    execute format('create policy %I_writer_update on public.%I for update to authenticated using (public.has_org_role(organization_id, array[''Admin'',''Energy Auditor'',''Facility Manager''])) with check (public.has_org_role(organization_id, array[''Admin'',''Energy Auditor'',''Facility Manager'']))', table_name, table_name);
    execute format('create policy %I_writer_delete on public.%I for delete to authenticated using (public.has_org_role(organization_id, array[''Admin'',''Energy Auditor'',''Facility Manager'']))', table_name, table_name);
  end loop;
end $$;

create policy organizations_admin_update on public.organizations for update to authenticated using (public.has_org_role(id, array['Admin'])) with check (public.has_org_role(id, array['Admin']));

do $$
declare table_name text;
begin
  foreach table_name in array array['sites','audits','assets','meters','utility_bills','calculations','ecms','solar_scenarios','evidence','audit_events','report_snapshots'] loop
    execute format('create policy %I_role_insert on public.%I for insert to authenticated with check (public.has_org_role(organization_id, array[''Admin'',''Energy Auditor'',''Facility Manager'']))', table_name, table_name);
    execute format('create policy %I_role_update on public.%I for update to authenticated using (public.has_org_role(organization_id, array[''Admin'',''Energy Auditor'',''Facility Manager''])) with check (public.has_org_role(organization_id, array[''Admin'',''Energy Auditor'',''Facility Manager'']))', table_name, table_name);
    execute format('create policy %I_role_delete on public.%I for delete to authenticated using (public.has_org_role(organization_id, array[''Admin'',''Energy Auditor'',''Facility Manager'']))', table_name, table_name);
  end loop;
end $$;

create policy approvals_reviewer_update on public.approvals for update to authenticated using (public.has_org_role(organization_id, array['Admin','Reviewer'])) with check (public.has_org_role(organization_id, array['Admin','Reviewer']));
create policy calculation_results_reviewer_update on public.calculation_results for update to authenticated using (public.has_org_role(organization_id, array['Admin','Reviewer'])) with check (public.has_org_role(organization_id, array['Admin','Reviewer']));

drop policy if exists approvals_writer_update on public.approvals;
drop policy if exists calculation_results_writer_update on public.calculation_results;
drop policy if exists report_snapshots_writer_update on public.report_snapshots;
drop policy if exists report_snapshots_role_update on public.report_snapshots;
drop policy if exists calculations_role_update on public.calculations;
create policy report_snapshots_draft_update on public.report_snapshots for update to authenticated using (status <> 'approved' and public.has_org_role(organization_id, array['Admin','Energy Auditor','Facility Manager'])) with check (status <> 'approved' and public.has_org_role(organization_id, array['Admin','Energy Auditor','Facility Manager']));
create policy report_snapshots_reviewer_update on public.report_snapshots for update to authenticated using (public.has_org_role(organization_id, array['Admin','Reviewer'])) with check (public.has_org_role(organization_id, array['Admin','Reviewer']));
create policy calculations_draft_update on public.calculations for update to authenticated using (approved = false and public.has_org_role(organization_id, array['Admin','Energy Auditor','Facility Manager'])) with check (approved = false and public.has_org_role(organization_id, array['Admin','Energy Auditor','Facility Manager']));
create policy calculations_reviewer_update on public.calculations for update to authenticated using (public.has_org_role(organization_id, array['Admin','Reviewer'])) with check (public.has_org_role(organization_id, array['Admin','Reviewer']));

create or replace function public.prevent_approved_snapshot_mutation() returns trigger language plpgsql as $$
begin
  if (tg_table_name = 'calculation_results' and (to_jsonb(old) ->> 'approved_at') is not null)
    or (tg_table_name = 'report_snapshots' and (to_jsonb(old) ->> 'status') = 'approved')
    or (tg_table_name = 'audit_versions' and (to_jsonb(old) ->> 'status') = 'approved')
    or (tg_table_name = 'calculations' and (to_jsonb(old) ->> 'approved') = 'true') then
    raise exception 'Approved snapshots are immutable';
  end if;
  return new;
end;
$$;
drop trigger if exists calculation_results_immutable on public.calculation_results;
create trigger calculation_results_immutable before update on public.calculation_results for each row execute function public.prevent_approved_snapshot_mutation();
drop trigger if exists report_snapshots_immutable on public.report_snapshots;
create trigger report_snapshots_immutable before update on public.report_snapshots for each row execute function public.prevent_approved_snapshot_mutation();
drop trigger if exists audit_versions_immutable on public.audit_versions;
create trigger audit_versions_immutable before update on public.audit_versions for each row execute function public.prevent_approved_snapshot_mutation();
drop trigger if exists calculations_immutable on public.calculations;
create trigger calculations_immutable before update on public.calculations for each row execute function public.prevent_approved_snapshot_mutation();

grant select, insert, update, delete on all tables in schema public to authenticated;
comment on table public.organization_memberships is 'Tenant membership and server-enforced role; public signup can only create Executive/Viewer.';
comment on table public.evidence_items is 'Private evidence metadata. Files belong in a private Supabase Storage bucket and signed URLs are server-generated.';
