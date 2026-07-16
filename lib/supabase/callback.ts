import "server-only";

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";
import { getSupabasePublicConfig } from "./config";

export function createSupabaseCallbackClient(request: NextRequest, response: NextResponse) {
  const config = getSupabasePublicConfig();
  if (!config.url || !config.publishableKey || config.invalidUrl) throw new Error("Supabase callback configuration is missing or invalid");

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
}
