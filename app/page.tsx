import { redirect } from "next/navigation";
import { getAuthRecoveryReason } from "@/lib/auth-recovery";
import { getSafeAuthContext } from "@/lib/auth";
import { getDataMode, isSupabaseConfigured } from "@/lib/runtime-config";
import { resolveRootDestination } from "@/lib/root-routing";

type HomeProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ? await searchParams : {};
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const reason = getAuthRecoveryReason({ error: first(params.error), errorCode: first(params.error_code), description: first(params.error_description) });
  if (reason) redirect(`/auth/recovery?reason=${reason}`);
  if (getDataMode() === "demo") redirect(resolveRootDestination({ dataMode: "demo", authenticated: false, hasProfile: false, hasOrganization: false }));
  if (!isSupabaseConfigured()) redirect("/login?error=configuration");
  const context = await getSafeAuthContext();
  redirect(resolveRootDestination({ dataMode: "supabase", authenticated: Boolean(context.user), hasProfile: Boolean(context.profile), hasOrganization: Boolean(context.activeOrganization) }));
}
