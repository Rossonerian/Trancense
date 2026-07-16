import "server-only";

import { getDataMode, getMissingSupabaseVariables, isSupabaseConfigured } from "./runtime-config";
import { getSupabaseAdmin } from "./supabase-admin";
import { getSupabaseServerConfig } from "./supabase/server-config";
import { normalizeAppOrigin, productionAppOrigin } from "./app-origin";

function productionDiagnostics() {
  const isProduction = process.env.NODE_ENV === "production";
  const configuredOrigin = normalizeAppOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const productionDataModeConfigured = !isProduction || process.env.DATA_MODE === "supabase";
  const productionOriginConfigured = !isProduction || configuredOrigin === productionAppOrigin;
  const configurationIssues = [
    ...(isProduction && !productionDataModeConfigured ? ["DATA_MODE_MUST_BE_SUPABASE_IN_PRODUCTION"] : []),
    ...(isProduction && !productionOriginConfigured ? ["NEXT_PUBLIC_APP_URL_MUST_BE_HTTPS_PRODUCTION_ORIGIN"] : []),
  ];
  return {
    productionDataModeConfigured,
    productionOriginConfigured,
    appOriginConfigured: Boolean(configuredOrigin),
    appOriginHost: configuredOrigin ? new URL(configuredOrigin).host : null,
    callbackPath: "/auth/callback",
    callbackUsesLocalhost: Boolean(configuredOrigin?.includes("localhost")),
    configurationIssues,
  };
}

export async function getHealthStatus() {
  const config = getSupabaseServerConfig();
  const configured = isSupabaseConfigured();
  const diagnostics = productionDiagnostics();
  const configurationIssues = [...diagnostics.configurationIssues, ...(!configured ? ["SUPABASE_CONFIGURATION_INCOMPLETE"] : [])];
  const base = { supabaseConfigured: configured, supabaseUrlHost: config.urlHost, missingVariables: getMissingSupabaseVariables(), ...diagnostics, configurationIssues };
  if (getDataMode() !== "supabase") return { status: "ok" as const, dataMode: "demo" as const, dataLabel: "Demo Data", ...base };
  if (configurationIssues.length) return { status: "degraded" as const, dataMode: "supabase" as const, dataLabel: "Supabase Setup Required", databaseReachable: false, ...base };
  const client = getSupabaseAdmin();
  if (!client) return { status: "degraded" as const, dataMode: "supabase" as const, dataLabel: "Supabase Setup Required", databaseReachable: false, ...base };
  const check = await Promise.race([
    client.from("organizations").select("id").limit(1),
    new Promise<{ error: { message: string } }>((resolve) => setTimeout(() => resolve({ error: { message: "Supabase health check timed out" } }), 3500)),
  ]);
  if (check.error) return { status: "degraded" as const, dataMode: "supabase" as const, dataLabel: "Supabase Setup Required", databaseReachable: false, ...base };
  return { status: "ok" as const, dataMode: "supabase" as const, dataLabel: "Supabase Data", databaseReachable: true, ...base };
}
