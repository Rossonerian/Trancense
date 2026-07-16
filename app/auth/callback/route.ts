import { NextResponse, type NextRequest } from "next/server";
import { getAuthRecoveryReason } from "@/lib/auth-recovery";
import { getSafeInternalPath, getTrustedAppOrigin } from "@/lib/app-origin";
import { isSupabaseConfigured } from "@/lib/runtime-config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const origin = getTrustedAppOrigin({ requestOrigin: request.nextUrl.origin });
  const redirect = (path: string) => NextResponse.redirect(new URL(getSafeInternalPath(path), origin));
  const recovery = (reason: string) => {
    const url = new URL("/auth/recovery", origin);
    url.searchParams.set("reason", reason);
    return NextResponse.redirect(url);
  };

  const suppliedError = getAuthRecoveryReason({
    error: request.nextUrl.searchParams.get("error"),
    errorCode: request.nextUrl.searchParams.get("error_code"),
    description: request.nextUrl.searchParams.get("error_description"),
  });
  if (suppliedError) return recovery(suppliedError);

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return recovery("missing_code");
  if (!isSupabaseConfigured()) return recovery("configuration");

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return recovery(getAuthRecoveryReason({ error: error.message, errorCode: error.code }) ?? "exchange_failed");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return recovery("exchange_failed");

    const admin = getSupabaseAdmin();
    if (admin) {
      const { data: invited } = await admin.from("organization_memberships").select("id").eq("user_id", user.id).eq("status", "invited").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (invited) await admin.from("organization_memberships").update({ status: "active" }).eq("id", invited.id);
    }

    const [{ data: profile, error: profileError }, { data: membership, error: membershipError }] = await Promise.all([
      supabase.from("profiles").select("onboarding_completed").eq("id", user.id).maybeSingle(),
      supabase.from("organization_memberships").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle(),
    ]);
    if (profileError || membershipError) return recovery("exchange_failed");
    const requestedNext = getSafeInternalPath(request.nextUrl.searchParams.get("next"), "");
    const safeNext = requestedNext === "/login" || requestedNext === "/overview" || requestedNext === "/onboarding" ? requestedNext : "";
    return redirect(profile?.onboarding_completed && membership ? safeNext || "/overview?confirmed=1" : "/onboarding");
  } catch {
    return recovery("exchange_failed");
  }
}
