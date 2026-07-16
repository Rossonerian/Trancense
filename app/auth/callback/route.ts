import { NextResponse, type NextRequest } from "next/server";
import { getAuthRecoveryReason } from "@/lib/auth-recovery";
import { getSafeInternalPath, getTrustedAppOrigin } from "@/lib/app-origin";
import { isSupabaseConfigured } from "@/lib/runtime-config";
import { createSupabaseCallbackClient } from "@/lib/supabase/callback";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function callbackErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") return error.code;
  return "unknown";
}

export async function GET(request: NextRequest) {
  const origin = getTrustedAppOrigin({ requestOrigin: request.nextUrl.origin });
  const sessionResponse = NextResponse.next({ request });
  const withSessionCookies = (target: NextResponse) => {
    sessionResponse.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
    return target;
  };
  const redirect = (path: string) => withSessionCookies(NextResponse.redirect(new URL(getSafeInternalPath(path), origin)));
  const failure = (_reason: string) => {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "oauth");
    return withSessionCookies(NextResponse.redirect(url));
  };

  const suppliedError = getAuthRecoveryReason({
    error: request.nextUrl.searchParams.get("error"),
    errorCode: request.nextUrl.searchParams.get("error_code"),
    description: request.nextUrl.searchParams.get("error_description"),
  });
  if (suppliedError) return failure(suppliedError);

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return failure("missing_code");
  if (!isSupabaseConfigured()) return failure("configuration");

  try {
    const supabase = createSupabaseCallbackClient(request, sessionResponse);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[trancense-auth-callback] exchange failed", { stage: "exchange", code: callbackErrorCode(error) });
      return failure(getAuthRecoveryReason({ error: error.message, errorCode: error.code }) ?? "exchange_failed");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("[trancense-auth-callback] user missing after exchange", { stage: "get_user" });
      return failure("exchange_failed");
    }

    const admin = getSupabaseAdmin();
    if (admin) {
      const metadata = user.user_metadata ?? {};
      const profileName = String(metadata.full_name ?? metadata.name ?? "").trim();
      const { error: profileUpsertError } = await admin.from("profiles").upsert({
        id: user.id,
        ...(profileName ? { full_name: profileName } : {}),
        ...(metadata.job_role ? { job_role: String(metadata.job_role).trim() } : {}),
        ...(metadata.country ? { country: String(metadata.country).trim() } : {}),
        ...(metadata.phone ? { phone: String(metadata.phone).trim() } : {}),
      }, { onConflict: "id" });
      if (profileUpsertError) {
        console.error("[trancense-auth-callback] profile persistence failed", { stage: "profile_upsert", code: callbackErrorCode(profileUpsertError) });
        return failure("exchange_failed");
      }
      const { data: invited } = await admin.from("organization_memberships").select("id").eq("user_id", user.id).eq("status", "invited").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (invited) await admin.from("organization_memberships").update({ status: "active" }).eq("id", invited.id);
    }

    const [{ data: profile, error: profileError }, { data: membership, error: membershipError }] = await Promise.all([
      supabase.from("profiles").select("onboarding_completed").eq("id", user.id).maybeSingle(),
      supabase.from("organization_memberships").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle(),
    ]);
    if (profileError || membershipError) {
      console.error("[trancense-auth-callback] workspace lookup failed", { stage: "workspace_lookup", profileCode: callbackErrorCode(profileError), membershipCode: callbackErrorCode(membershipError) });
      return failure("exchange_failed");
    }
    const requestedNext = getSafeInternalPath(request.nextUrl.searchParams.get("next"), "");
    const safeNext = requestedNext === "/login" || requestedNext === "/overview" || requestedNext === "/onboarding" ? requestedNext : "";
    return redirect(profile?.onboarding_completed && membership ? safeNext || "/overview" : "/onboarding");
  } catch {
    return failure("exchange_failed");
  }
}
