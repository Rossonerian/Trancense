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
  const supabaseMode = getDataMode() === "supabase";
  const enabled = supabaseMode && configured;
  return {
    mode: supabaseMode ? "supabase" as const : "demo" as const,
    label: enabled ? "Supabase Data" : "Demo Data",
    detail: enabled ? "Persistent workspace" : supabaseMode ? `Supabase setup required · missing ${getMissingSupabaseVariables().join(", ")}` : "Deterministic seeded workspace",
    configured,
  };
}
