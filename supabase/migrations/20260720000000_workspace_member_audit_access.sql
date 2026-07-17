-- Every active workspace member may perform ordinary audit and analysis work.
-- Authentication, membership, tenant scope, and approved-output immutability
-- remain enforced by the policies and trigger below. Administrative changes
-- and technical approvals remain role-gated.

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'audit_boundaries','audit_versions','meter_readings','production_records',
    'tariffs','emission_factors','evidence_items','import_batches','import_rows',
    'validation_findings','calculation_runs','calculation_results',
    'ecm_interactions','mv_plans','workflow_transitions','approvals','comments','citations'
  ] loop
    execute format('drop policy if exists %I_writer_insert on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_writer_update on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_writer_delete on public.%I', table_name, table_name);
    execute format('create policy %I_member_insert on public.%I for insert to authenticated with check (public.is_org_member(organization_id))', table_name, table_name);
    execute format('create policy %I_member_update on public.%I for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id))', table_name, table_name);
    execute format('create policy %I_member_delete on public.%I for delete to authenticated using (public.is_org_member(organization_id))', table_name, table_name);
  end loop;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array['sites','audits','assets','meters','utility_bills','calculations','ecms','solar_scenarios','evidence','audit_events','report_snapshots'] loop
    execute format('drop policy if exists %I_role_insert on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_role_update on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_role_delete on public.%I', table_name, table_name);
    execute format('create policy %I_member_insert on public.%I for insert to authenticated with check (public.is_org_member(organization_id))', table_name, table_name);
    execute format('create policy %I_member_update on public.%I for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id))', table_name, table_name);
    execute format('create policy %I_member_delete on public.%I for delete to authenticated using (public.is_org_member(organization_id))', table_name, table_name);
  end loop;
end $$;

-- Approved technical outputs are immutable. Drafts remain editable by all members;
-- reviewer/admin policies are retained for the approval workflow.
drop policy if exists audit_versions_member_update on public.audit_versions;
drop policy if exists audit_versions_member_delete on public.audit_versions;
create policy audit_versions_draft_update on public.audit_versions for update to authenticated
  using (status <> 'approved' and public.is_org_member(organization_id))
  with check (status <> 'approved' and public.is_org_member(organization_id));
create policy audit_versions_draft_delete on public.audit_versions for delete to authenticated
  using (status <> 'approved' and public.is_org_member(organization_id));

drop policy if exists calculations_member_update on public.calculations;
drop policy if exists calculations_member_delete on public.calculations;
create policy calculations_draft_update_all_members on public.calculations for update to authenticated
  using (approved = false and public.is_org_member(organization_id))
  with check (approved = false and public.is_org_member(organization_id));
create policy calculations_draft_delete_all_members on public.calculations for delete to authenticated
  using (approved = false and public.is_org_member(organization_id));

drop policy if exists calculation_results_member_update on public.calculation_results;
drop policy if exists calculation_results_member_delete on public.calculation_results;
create policy calculation_results_unapproved_update on public.calculation_results for update to authenticated
  using (approved_at is null and public.is_org_member(organization_id))
  with check (approved_at is null and public.is_org_member(organization_id));
create policy calculation_results_unapproved_delete on public.calculation_results for delete to authenticated
  using (approved_at is null and public.is_org_member(organization_id));

-- Approval state changes remain Admin/Reviewer-only. Members may submit records
-- and approval requests, but cannot approve or reject them.
drop policy if exists approvals_member_update on public.approvals;
drop policy if exists approvals_member_delete on public.approvals;
