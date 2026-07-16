import "server-only";

import { getDataMode, getMissingSupabaseVariables, isSupabaseConfigured } from "./runtime-config";
import { getSupabaseAdmin } from "./supabase-admin";
import { getSupabaseServerConfig } from "./supabase/server-config";

export async function getHealthStatus() {
  const config = getSupabaseServerConfig();
  const configured = isSupabaseConfigured();
  const base = { supabaseConfigured: configured, supabaseUrlHost: config.urlHost, missingVariables: getMissingSupabaseVariables() };
  if (getDataMode() !== "supabase") return { status: "ok" as const, dataMode: "demo" as const, dataLabel: "Demo Data", ...base };
  const client = getSupabaseAdmin();
  if (!client) return { status: "degraded" as const, dataMode: "supabase" as const, dataLabel: "Supabase Setup Required", ...base };
  const check = await Promise.race([
    client.from("organizations").select("id").limit(1),
    new Promise<{ error: { message: string } }>((resolve) => setTimeout(() => resolve({ error: { message: "Supabase health check timed out" } }), 3500)),
  ]);
  if (check.error) return { status: "degraded" as const, dataMode: "supabase" as const, dataLabel: "Supabase Setup Required", ...base };
  return { status: "ok" as const, dataMode: "supabase" as const, dataLabel: "Supabase Data", ...base };
}
