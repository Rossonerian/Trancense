import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./runtime-config";
import { getSupabaseServerConfig } from "./supabase/server-config";

let adminClient: SupabaseClient | null | undefined;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient !== undefined) return adminClient;
  if (!isSupabaseConfigured()) {
    adminClient = null;
    return adminClient;
  }
  const config = getSupabaseServerConfig();
  adminClient = createClient(config.url!, config.serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { "x-trancense-server": "true" } },
  });
  return adminClient;
}
