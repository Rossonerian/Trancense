"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const config = getSupabasePublicConfig();
  if (!config.url || !config.publishableKey || config.invalidUrl) throw new Error("Supabase browser configuration is missing or invalid");

  browserClient = createBrowserClient(config.url, config.publishableKey);
  return browserClient;
}
