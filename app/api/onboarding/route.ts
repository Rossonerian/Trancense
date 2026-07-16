import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { canWrite } from "@/lib/authorization";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const onboardingSchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  siteName: z.string().trim().min(2).max(160),
  region: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(80),
  jobRole: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await getAuthContext();
    if (!context.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const parsed = onboardingSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Please complete all required onboarding fields." }, { status: 400 });
    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Server setup is incomplete: the server-only Supabase credential is missing or invalid." }, { status: 503 });
    let organizationId = context.activeOrganization?.id;
    let site: { id: string; name: string } | null = context.activeSite ? { id: context.activeSite.id, name: context.activeSite.name } : null;
    if (!organizationId) {
      const slugBase = parsed.data.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "workspace";
      const slug = `${slugBase}-${context.user.id.slice(0, 8)}`;
      const { data: existing, error: existingError } = await admin.from("organizations").select("id").eq("slug", slug).maybeSingle();
      if (existingError) throw existingError;
      if (existing) organizationId = existing.id;
      else {
        const { data: organization, error: orgError } = await admin.from("organizations").insert({ slug, name: parsed.data.organizationName, is_demo: false }).select("id").single();
        if (orgError || !organization) throw orgError ?? new Error("Unable to create organization.");
        organizationId = organization.id;
      }
      const { error: membershipError } = await admin.from("organization_memberships").upsert({ organization_id: organizationId, user_id: context.user.id, role: "Executive/Viewer", status: "active" }, { onConflict: "organization_id,user_id" });
      if (membershipError) throw membershipError;
    } else if (!site && (!context.role || !canWrite(context.role))) {
      return NextResponse.json({ error: "Your organization has not assigned an active site yet. Contact an administrator." }, { status: 403 });
    }
    if (!site) {
      const { data: createdSite, error: siteError } = await admin.from("sites").upsert({ organization_id: organizationId, name: parsed.data.siteName, region: parsed.data.region, timezone: "Asia/Kolkata" }, { onConflict: "organization_id,name" }).select("id,name").single();
      if (siteError) throw siteError;
      site = createdSite;
    }
    const profileName = context.profile?.full_name?.trim() || String(context.user.user_metadata?.full_name ?? context.user.user_metadata?.name ?? "").trim();
    const { error: profileError } = await admin.from("profiles").upsert({ id: context.user.id, full_name: profileName, job_role: parsed.data.jobRole, country: parsed.data.country, phone: parsed.data.phone || null, onboarding_completed: true }, { onConflict: "id" });
    if (profileError) throw profileError;
    await admin.from("audit_events").insert({ organization_id: organizationId, event_type: "onboarding_completed", actor_name: context.user.email ?? context.user.id, details: { site_id: site.id } });
    return NextResponse.json({ organizationId, site });
  } catch (error) {
    console.error("[trancense-onboarding] failed", { errorType: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "Unable to complete onboarding." }, { status: 500 });
  }
}
