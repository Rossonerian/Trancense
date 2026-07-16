import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
    if (!context.user || !context.memberships[0]) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const parsed = onboardingSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Please complete all required onboarding fields." }, { status: 400 });
    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Server setup is incomplete: the server-only Supabase credential is missing or invalid." }, { status: 503 });
    const membership = context.memberships[0];
    const { error: orgError } = await admin.from("organizations").update({ name: parsed.data.organizationName }).eq("id", membership.organization_id);
    if (orgError) throw orgError;
    const { data: site, error: siteError } = await admin.from("sites").upsert({ organization_id: membership.organization_id, name: parsed.data.siteName, region: parsed.data.region, timezone: "Asia/Kolkata" }, { onConflict: "organization_id,name" }).select("id,name").single();
    if (siteError) throw siteError;
    const supabase = await getSupabaseServerClient();
    const { error: profileError } = await supabase.from("profiles").update({ full_name: context.user.user_metadata?.full_name ?? "", job_role: parsed.data.jobRole, country: parsed.data.country, phone: parsed.data.phone || null, onboarding_completed: true }).eq("id", context.user.id);
    if (profileError) throw profileError;
    return NextResponse.json({ organizationId: membership.organization_id, site });
  } catch (error) {
    console.error("[trancense-onboarding] failed", { reason: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Unable to complete onboarding." }, { status: 500 });
  }
}
