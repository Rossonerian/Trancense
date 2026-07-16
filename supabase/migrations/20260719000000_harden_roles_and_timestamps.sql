-- Normalize the role value used by the authenticated application and keep the
-- legacy spaced spelling from becoming a second authorization role.
update public.organization_memberships
set role = 'Executive/Viewer'
where role = 'Executive / Viewer';

alter table public.organization_memberships
  drop constraint if exists organization_memberships_role_check;
alter table public.organization_memberships
  add constraint organization_memberships_role_check
  check (role in ('Admin', 'Energy Auditor', 'Facility Manager', 'Reviewer', 'Executive/Viewer'));

create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['organizations','sites','assets','meters','utility_bills','ecms','solar_scenarios','report_snapshots','profiles','organization_memberships','comments'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;
