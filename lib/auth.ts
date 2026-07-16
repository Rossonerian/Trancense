import "server-only";

import { getDataMode, isSupabaseConfigured } from "./runtime-config";
import { getSupabaseServerClient } from "./supabase/server";
import { canManageMembers, canReview, canWrite, roles, type Role } from "./authorization";

export { canManageMembers, canReview, canWrite, roles } from "./authorization";
export type { Role } from "./authorization";

export type WorkspaceMembership = {
  id: string;
  organization_id: string;
  user_id: string;
  role: Role;
  status: "active" | "invited" | "suspended";
  organizations?: { id: string; name: string; slug: string } | null;
};

export async function getAuthContext() {
  if (getDataMode() !== "supabase" || !isSupabaseConfigured()) return { user: null, memberships: [] as WorkspaceMembership[] };
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, memberships: [] as WorkspaceMembership[] };

  const { data, error } = await supabase
    .from("organization_memberships")
    .select("id,organization_id,user_id,role,status,organizations(id,name,slug)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load workspace membership: ${error.message}`);
  return { user, memberships: (data ?? []).map((item) => ({ ...item, organizations: Array.isArray(item.organizations) ? item.organizations[0] ?? null : item.organizations })) as WorkspaceMembership[] };
}

export async function requireWorkspaceContext() {
  const context = await getAuthContext();
  if (!context.user) throw new Error("UNAUTHENTICATED");
  const membership = context.memberships[0];
  if (!membership) throw new Error("NO_WORKSPACE");
  return { ...context, membership, organizationId: membership.organization_id };
}

export function hasRole(role: Role, allowed: readonly Role[]) {
  return allowed.includes(role);
}
