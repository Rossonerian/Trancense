import { getSupabasePublicConfig, getSupabaseServiceRoleKey } from "../lib/supabase/config";
import { demoCleanupTables, knownDemoSlug, purgeFlagIsExplicit } from "../lib/demo-cleanup";
import { createClient } from "@supabase/supabase-js";

async function main() {
  if (!purgeFlagIsExplicit(process.env.PURGE_DEMO_DATA)) throw new Error("Refusing demo cleanup. Set PURGE_DEMO_DATA=true to target only the marked demo organization.");
  const config = getSupabasePublicConfig();
  const serviceRole = getSupabaseServiceRoleKey();
  if (!config.url || !serviceRole || config.invalidUrl) throw new Error("Missing or invalid Supabase configuration; no secret values are printed.");

  const supabase = createClient(config.url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: marked, error: markedError } = await supabase.from("organizations").select("id,slug,name,is_demo").eq("is_demo", true);
  if (markedError) throw markedError;
  const { data: known, error: knownError } = await supabase.from("organizations").select("id,slug,name,is_demo").eq("slug", knownDemoSlug).maybeSingle();
  if (knownError) throw knownError;
  const organizations = [...(marked ?? []), ...(known && !(marked ?? []).some((item) => item.id === known.id) ? [known] : [])];
  if (!organizations.length) { console.log("No marked demo organization found. No records were changed."); return; }

  const counts: Record<string, number> = {};
  for (const table of demoCleanupTables) {
    const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }).in("organization_id", organizations.map((item) => item.id));
    if (error && error.code !== "42P01") throw error;
    counts[table] = count ?? 0;
  }
  console.log("Targeted demo organizations:", organizations.map((item) => `${item.name} (${item.slug})`).join(", "));
  console.log("Record counts before deletion:", JSON.stringify(counts));
  for (const organization of organizations) {
    const { error } = await supabase.from("organizations").delete().eq("id", organization.id);
    if (error) throw error;
  }
  console.log("Deleted demo organizations:", organizations.length);
  console.log("Deleted cascaded record counts:", JSON.stringify(counts));
  console.log("Authentication users were not deleted.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Demo cleanup failed.");
  process.exitCode = 1;
});
