export const googleOAuthCallbackPath = "/auth/callback";

export function googleOAuthErrorMessage(value: unknown): string {
  const message = value instanceof Error ? value.message : String(value ?? "");
  const normalized = message.toLowerCase();
  if (normalized.includes("unsupported provider") || normalized.includes("provider is not enabled")) return "Google sign-in is not enabled in the Supabase project used by this deployment. Enable Google in Supabase Auth → Providers → Google and save the setting for the project matching the deployed Supabase host.";
  if (normalized.includes("redirect_uri_mismatch") || normalized.includes("redirect uri mismatch")) return "Google sign-in has a redirect mismatch. Verify the Supabase callback URL and Google OAuth redirect URI for this deployment.";
  if (normalized.includes("access_denied") || normalized.includes("cancel")) return "Google sign-in was cancelled. Try again when you are ready.";
  return "Unable to start Google sign-in. Check the Supabase Google provider configuration and try again.";
}
