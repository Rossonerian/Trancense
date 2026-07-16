import { describe, expect, it } from "vitest";
import { googleOAuthCallbackPath, googleOAuthErrorMessage } from "./google-oauth";

describe("Google OAuth diagnostics", () => {
  it("uses the internal callback path", () => {
    expect(googleOAuthCallbackPath).toBe("/auth/callback");
  });

  it("turns provider-not-enabled errors into an actionable message", () => {
    expect(googleOAuthErrorMessage(new Error("Unsupported provider: provider is not enabled"))).toContain("Enable Google in Supabase Auth");
  });

  it("does not expose raw OAuth errors", () => {
    expect(googleOAuthErrorMessage(new Error("redirect_uri_mismatch: internal-provider-detail"))).not.toContain("internal-provider-detail");
    expect(googleOAuthErrorMessage(new Error("access_denied"))).toContain("cancelled");
  });
});
