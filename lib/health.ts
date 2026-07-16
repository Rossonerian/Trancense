import "server-only";

import { getDataMode, getMissingSupabaseVariables, getAIProvider, isSupabaseConfigured } from "./runtime-config";
import { getSupabaseAdmin } from "./supabase-admin";

export async function getHealthStatus() {
  const configured = isSupabaseConfigured();
  const base = { aiProvider: getAIProvider(), supabaseConfigured: configured, missingVariables: getMissingSupabaseVariables() };
  if (getDataMode() !== "supabase") return { status: "ok" as const, dataMode: "demo" as const, dataLabel: "Demo Data", ...base };
  const client = getSupabaseAdmin();
  if (!client) return { status: "degraded" as const, dataMode: "supabase" as const, dataLabel: "Demo Data", reason: "Supabase variables are missing; runtime data is unavailable until setup is complete", ...base };
  const check = await Promise.race([
    client.from("organizations").select("id").limit(1),
    new Promise<{ error: { message: string } }>((resolve) => setTimeout(() => resolve({ error: { message: "Supabase health check timed out" } }), 3500)),
  ]);
  if (check.error) return { status: "degraded" as const, dataMode: "supabase" as const, dataLabel: "Demo Data", reason: "Supabase connection unavailable; runtime data is unavailable", ...base };
  return { status: "ok" as const, dataMode: "supabase" as const, dataLabel: "Supabase Data", ...base };
}
