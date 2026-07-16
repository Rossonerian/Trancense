export type SupabaseConfigInput = {
  url?: string;
  publishableKey?: string;
  serviceRoleKey?: string;
};

export type ResolvedSupabaseConfig = {
  url: string | null;
  publishableKey: string | null;
  serviceRoleKey: string | null;
  urlHost: string | null;
  missingVariables: string[];
  invalidUrl: boolean;
};

export const supabaseEnvironmentVariableNames = {
  url: ["NEXT_PUBLIC_STORAGE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"],
  publishableKey: ["NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY", "NEXT_PUBLIC_STORAGE_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  serviceRoleKey: ["STORAGE_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
} as const;

function normalizeSupabaseUrl(value: string | undefined): { url: string | null; host: string | null; invalid: boolean } {
  if (!value) return { url: null, host: null, invalid: false };
  const normalized = value.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(normalized);
    const localHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const validProtocol = parsed.protocol === "https:" || (parsed.protocol === "http:" && localHost);
    const validHost = localHost || parsed.hostname.endsWith(".supabase.co");
    const validRoot = parsed.pathname === "" || parsed.pathname === "/";
    const validQuery = !parsed.search && !parsed.hash && !parsed.username && !parsed.password;
    if (!validProtocol || !validHost || !validRoot || !validQuery) return { url: null, host: parsed.host || null, invalid: true };
    return { url: normalized, host: parsed.host, invalid: false };
  } catch {
    return { url: null, host: null, invalid: true };
  }
}

export function resolveSupabaseConfig(input: SupabaseConfigInput): ResolvedSupabaseConfig {
  const resolvedUrl = normalizeSupabaseUrl(input.url);
  const missingVariables: string[] = [];
  if (!input.url) missingVariables.push(supabaseEnvironmentVariableNames.url.join(" or "));
  if (!input.publishableKey) missingVariables.push(supabaseEnvironmentVariableNames.publishableKey.join(" or "));
  if (!input.serviceRoleKey) missingVariables.push(supabaseEnvironmentVariableNames.serviceRoleKey.join(" or "));
  if (resolvedUrl.invalid) missingVariables.push("VALID_SUPABASE_PROJECT_ROOT_URL");
  return { url: resolvedUrl.url, publishableKey: input.publishableKey?.trim() || null, serviceRoleKey: input.serviceRoleKey?.trim() || null, urlHost: resolvedUrl.host, missingVariables, invalidUrl: resolvedUrl.invalid };
}

export function getSupabasePublicConfig(): ResolvedSupabaseConfig {
  return resolveSupabaseConfig({
    url: process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_STORAGE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function getSupabaseServiceRoleKey(): string | null {
  return process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}
