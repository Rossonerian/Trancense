import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { roles } from "./authorization";

describe("tenant role capabilities", () => {
  it("keeps roles as metadata rather than permission gates", () => {
    expect(roles).toEqual(expect.arrayContaining(["Admin", "Energy Auditor", "Facility Manager", "Reviewer", "Executive/Viewer"]));
  });

  it("uses authenticated active membership for all workspace mutation policies", () => {
    const migration = readFileSync(new URL("../supabase/migrations/20260721000000_membership_only_authorization.sql", import.meta.url), "utf8");
    expect(migration).toContain("public.is_org_member");
    expect(migration).not.toMatch(/(?:using|with check|create policy)[^\n]*has_org_role/);
    expect(migration).toContain("to authenticated");
  });

  it("keeps RLS enabled in the schema migrations", () => {
    const schema = readFileSync(new URL("../supabase/migrations/20260717000000_tester_ready_auth_workflows.sql", import.meta.url), "utf8");
    expect(schema).toContain("alter table public.organization_memberships enable row level security");
    expect(schema).toContain("alter table public.import_batches enable row level security");
  });
});
