import "server-only";

export type DataMode = "demo" | "supabase";
export type AIProvider = "auto" | "demo" | "openrouter" | "groq" | "gemini";
import { getSupabaseServerConfig } from "./supabase/server-config";

export function getDataMode(): DataMode {
  return process.env.DATA_MODE === "supabase" ? "supabase" : "demo";
}

export function getAIProvider(): AIProvider {
  const value = process.env.AI_PROVIDER;
  return value === "openrouter" || value === "groq" || value === "gemini" || value === "demo" ? value : "auto";
}

export function getMissingSupabaseVariables(): string[] {
  return getSupabaseServerConfig().missingVariables;
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseServerConfig();
  return Boolean(config.url && config.publishableKey && config.serviceRoleKey && !config.invalidUrl);
}

export function getPublicRuntimeStatus() {
  const configured = isSupabaseConfigured();
  const supabaseMode = getDataMode() === "supabase";
  const enabled = supabaseMode && configured;
  return {
    mode: supabaseMode ? "supabase" as const : "demo" as const,
    label: enabled ? "Supabase Data" : "Demo Data",
    detail: enabled ? "Persistent workspace" : supabaseMode ? `Supabase setup required · missing ${getMissingSupabaseVariables().join(", ")}` : "Deterministic seeded workspace",
    configured,
  };
}
