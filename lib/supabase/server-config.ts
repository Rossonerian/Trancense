import "server-only";

import { getSupabasePublicConfig, getSupabaseServiceRoleKey, resolveSupabaseConfig } from "./config";

export function getSupabaseServerConfig() {
  const publicConfig = getSupabasePublicConfig();
  const config = resolveSupabaseConfig({
    url: publicConfig.url ?? undefined,
    publishableKey: publicConfig.publishableKey ?? undefined,
    serviceRoleKey: getSupabaseServiceRoleKey() ?? undefined,
  });
  return { ...config, invalidUrl: config.invalidUrl || publicConfig.invalidUrl, urlHost: publicConfig.urlHost ?? config.urlHost, missingVariables: [...new Set([...config.missingVariables, ...(publicConfig.invalidUrl ? ["VALID_SUPABASE_PROJECT_ROOT_URL"] : [])])] };
}
