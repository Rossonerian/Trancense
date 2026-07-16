import { describe, expect, it } from "vitest";
import { getAuthRecoveryReason, normalizeAuthRecoveryReason } from "./auth-recovery";
import { getTrustedAppOrigin } from "./app-origin";

describe("authentication redirect and recovery behavior", () => {
  it("creates production and local signup/reset callback targets", () => {
    const production = getTrustedAppOrigin({ configuredOrigin: "https://trancense.vercel.app", isProduction: true });
    const local = getTrustedAppOrigin({ configuredOrigin: "http://localhost:3000", isProduction: false });
    expect(`${production}/auth/callback`).toBe("https://trancense.vercel.app/auth/callback");
    expect(`${production}/reset-password`).toBe("https://trancense.vercel.app/reset-password");
    expect(`${local}/auth/callback`).toBe("http://localhost:3000/auth/callback");
    expect(`${local}/reset-password`).toBe("http://localhost:3000/reset-password");
  });

  it("classifies expired, missing, invalid, and configuration failures without retaining query details", () => {
    expect(getAuthRecoveryReason({ error: "access_denied", errorCode: "otp_expired", description: "Email link is invalid or has expired" })).toBe("expired");
    expect(getAuthRecoveryReason({ error: "missing_code" })).toBe("missing_code");
    expect(getAuthRecoveryReason({ error: "invalid_request" })).toBe("invalid");
    expect(getAuthRecoveryReason({ error: "configuration" })).toBe("configuration");
    expect(normalizeAuthRecoveryReason("access_token=secret")).toBe("exchange_failed");
  });
});
