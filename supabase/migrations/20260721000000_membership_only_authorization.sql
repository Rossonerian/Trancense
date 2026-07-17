-- Roles are informational metadata for the MVP. Every active member of an
-- organization may use normal product and workspace operations. RLS still
-- requires authentication plus active tenant membership on every policy.

drop policy if exists organizations_admin_update on public.organizations;
create policy organizations_member_update on public.organizations for update to authenticated
  using (public.is_org_member(id))
  with check (public.is_org_member(id));

drop policy if exists memberships_member_select on public.organization_memberships;
drop policy if exists memberships_admin_insert on public.organization_memberships;
drop policy if exists memberships_admin_update on public.organization_memberships;
drop policy if exists memberships_admin_delete on public.organization_memberships;
create policy memberships_member_select on public.organization_memberships for select to authenticated
  using (user_id = (select auth.uid()) or public.is_org_member(organization_id));
create policy memberships_member_insert on public.organization_memberships for insert to authenticated
  with check (public.is_org_member(organization_id));
create policy memberships_member_update on public.organization_memberships for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
create policy memberships_member_delete on public.organization_memberships for delete to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists approvals_reviewer_update on public.approvals;
create policy approvals_member_update on public.approvals for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists calculation_results_reviewer_update on public.calculation_results;
create policy calculation_results_member_update on public.calculation_results for update to authenticated
  using (approved_at is null and public.is_org_member(organization_id))
  with check (approved_at is null and public.is_org_member(organization_id));

drop policy if exists report_snapshots_draft_update on public.report_snapshots;
drop policy if exists report_snapshots_reviewer_update on public.report_snapshots;
drop policy if exists report_snapshots_member_update on public.report_snapshots;
create policy report_snapshots_member_update on public.report_snapshots for update to authenticated
  using (status <> 'approved' and public.is_org_member(organization_id))
  with check (status <> 'approved' and public.is_org_member(organization_id));

drop policy if exists calculations_draft_update on public.calculations;
drop policy if exists calculations_reviewer_update on public.calculations;
create policy calculations_member_update on public.calculations for update to authenticated
  using (approved = false and public.is_org_member(organization_id))
  with check (approved = false and public.is_org_member(organization_id));

-- No active policy should depend on role. Remove the obsolete helper after all
-- role-based policies have been replaced, preserving membership-only RLS.
drop function if exists public.has_org_role(uuid, text[]);
