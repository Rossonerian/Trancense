export function authErrorMessage(value: unknown, fallback: string) {
  const message = value instanceof Error ? value.message.toLowerCase() : String(value ?? "").toLowerCase();
  if (message.includes("email not confirmed")) return "The email or password is incorrect.";
  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) return "The email or password is incorrect.";
  if (message.includes("already registered") || message.includes("already exists")) return "An account with this email already exists. Sign in or reset your password.";
  if (message.includes("password") && (message.includes("weak") || message.includes("short") || message.includes("at least"))) return "Choose a password with at least 8 characters.";
  if (message.includes("rate limit") || message.includes("too many requests")) return "Too many attempts. Wait a moment and try again.";
  if (message.includes("provider") && message.includes("not enabled")) return "Google sign-in is not enabled for this Supabase project. Contact the workspace administrator.";
  if (message.includes("redirect_uri_mismatch") || message.includes("redirect uri")) return "Google sign-in is not configured for this application origin. Contact the workspace administrator.";
  if (message.includes("expired") || message.includes("invalid or has expired")) return "This link has expired or has already been used. Request a fresh link and try again.";
  if (message.includes("fetch") || message.includes("network") || message.includes("configuration")) return "Authentication is temporarily unavailable. Check the deployment configuration and try again.";
  return fallback;
}

export function validatePasswordPair(password: string, confirmation: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password !== confirmation) return "Passwords do not match.";
  return null;
}
