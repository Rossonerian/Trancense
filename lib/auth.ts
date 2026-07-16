import "server-only";

import type { User } from "@supabase/supabase-js";
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

export type WorkspaceProfile = { id: string; full_name: string; job_role: string; country: string; phone: string | null; onboarding_completed: boolean };
export type WorkspaceSite = { id: string; name: string; region: string; timezone: string };
export type WorkspaceContext = {
  user: User | null;
  profile: WorkspaceProfile | null;
  memberships: WorkspaceMembership[];
  activeOrganization: { id: string; name: string; slug: string } | null;
  activeSite: WorkspaceSite | null;
  role: Role | null;
};
export type AuthenticatedWorkspaceContext = WorkspaceContext & { user: User; membership: WorkspaceMembership; organizationId: string };

function emptyAuthContext(): WorkspaceContext {
  return { user: null, profile: null, memberships: [], activeOrganization: null, activeSite: null, role: null };
}

export async function getSafeAuthContext(): Promise<WorkspaceContext> {
  try {
    return await getAuthContext();
  } catch {
    return emptyAuthContext();
  }
}

export async function getAuthContext(): Promise<WorkspaceContext> {
  if (getDataMode() !== "supabase" || !isSupabaseConfigured()) return emptyAuthContext();
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return emptyAuthContext();

  const [{ data: profileData, error: profileError }, { data, error }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,job_role,country,phone,onboarding_completed").eq("id", user.id).maybeSingle(),
    supabase.from("organization_memberships").select("id,organization_id,user_id,role,status,organizations(id,name,slug)").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }),
  ]);
  if (profileError) throw new Error(`Unable to load user profile: ${profileError.message}`);
  if (error) throw new Error(`Unable to load workspace membership: ${error.message}`);
  const memberships = (data ?? []).map((item) => ({ ...item, organizations: Array.isArray(item.organizations) ? item.organizations[0] ?? null : item.organizations })) as WorkspaceMembership[];
  const activeOrganization = memberships[0]?.organizations ?? null;
  let activeSite: WorkspaceSite | null = null;
  if (activeOrganization) {
    const { data: site, error: siteError } = await supabase.from("sites").select("id,name,region,timezone").eq("organization_id", activeOrganization.id).order("created_at").limit(1).maybeSingle();
    if (siteError) throw new Error(`Unable to load active site: ${siteError.message}`);
    activeSite = site as WorkspaceSite | null;
  }
  return { user, profile: profileData as WorkspaceProfile | null, memberships, activeOrganization, activeSite, role: memberships[0]?.role ?? null };
}

export async function requireWorkspaceContext(): Promise<AuthenticatedWorkspaceContext> {
  const context = await getAuthContext();
  if (!context.user) throw new Error("UNAUTHENTICATED");
  if (!context.profile) throw new Error("NO_WORKSPACE");
  const membership = context.memberships[0];
  if (!membership) throw new Error("NO_WORKSPACE");
  return { ...context, user: context.user, membership, organizationId: membership.organization_id };
}

export function hasRole(role: Role, allowed: readonly Role[]) {
  return allowed.includes(role);
}
