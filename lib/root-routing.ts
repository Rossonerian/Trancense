export function resolveRootDestination(input: { dataMode: "demo" | "supabase"; authenticated: boolean; hasProfile: boolean; hasOrganization: boolean }) {
  if (input.dataMode === "demo") return "/login";
  if (!input.authenticated) return "/login";
  if (!input.hasProfile || !input.hasOrganization) return "/onboarding";
  return "/overview";
}
