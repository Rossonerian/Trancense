import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const admin = getSupabaseAdmin();
        if (admin) {
          const { data: invited } = await admin.from("organization_memberships").select("id").eq("user_id", user.id).eq("status", "invited").order("created_at", { ascending: false }).limit(1).maybeSingle();
          if (invited) await admin.from("organization_memberships").update({ status: "active" }).eq("id", invited.id);
        }
      }
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }
  return NextResponse.redirect(new URL("/login?error=auth_callback", request.url));
}
