import "server-only";

export type DataMode = "demo" | "supabase";
export type AIProvider = "auto" | "demo" | "openrouter" | "groq" | "gemini";

const requiredSupabaseVariables = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;

export function getDataMode(): DataMode {
  return process.env.DATA_MODE === "supabase" ? "supabase" : "demo";
}

export function getAIProvider(): AIProvider {
  const value = process.env.AI_PROVIDER;
  return value === "openrouter" || value === "groq" || value === "gemini" || value === "demo" ? value : "auto";
}

export function getMissingSupabaseVariables(): string[] {
  return requiredSupabaseVariables.filter((name) => !process.env[name]);
}

export function isSupabaseConfigured(): boolean {
  return getMissingSupabaseVariables().length === 0;
}

export function getPublicRuntimeStatus() {
  const configured = isSupabaseConfigured();
  const enabled = getDataMode() === "supabase" && configured;
  return {
    mode: enabled ? "supabase" as const : "demo" as const,
    label: enabled ? "Supabase Data" : "Demo Data",
    detail: enabled ? "Persistent workspace" : getDataMode() === "supabase" ? "Supabase not configured · using fallback" : "Deterministic seeded workspace",
    configured,
  };
}
