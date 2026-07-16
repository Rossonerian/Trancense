export type AuthRecoveryReason = "expired" | "invalid" | "missing_code" | "exchange_failed" | "configuration";

export function getAuthRecoveryReason(input: { error?: string | null; errorCode?: string | null; description?: string | null }): AuthRecoveryReason | null {
  const error = `${input.error ?? ""} ${input.errorCode ?? ""} ${input.description ?? ""}`.toLowerCase();
  if (!error.trim()) return null;
  if (error.includes("otp_expired") || error.includes("access_denied") || error.includes("expired") || error.includes("already been used") || error.includes("invalid or has expired")) return "expired";
  if (error.includes("configuration") || error.includes("missing or invalid supabase")) return "configuration";
  if (error.includes("missing") && error.includes("code")) return "missing_code";
  if (error.includes("invalid") || error.includes("invalid_grant") || error.includes("invalid_request")) return "invalid";
  return "exchange_failed";
}

export function normalizeAuthRecoveryReason(value?: string | null): AuthRecoveryReason {
  return value === "expired" || value === "invalid" || value === "missing_code" || value === "exchange_failed" || value === "configuration" ? value : "exchange_failed";
}
