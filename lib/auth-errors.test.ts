import { describe, expect, it } from "vitest";
import { authErrorMessage, validatePasswordPair } from "./auth-errors";

describe("authentication error handling", () => {
  it("maps provider and credential failures without leaking raw details", () => {
    expect(authErrorMessage(new Error("Unsupported provider: provider is not enabled"), "fallback")).toContain("not enabled");
    expect(authErrorMessage(new Error("Invalid login credentials"), "fallback")).toBe("The email or password is incorrect.");
    expect(authErrorMessage(new Error("internal database detail"), "fallback")).toBe("fallback");
  });

  it("validates password confirmation before calling Supabase", () => {
    expect(validatePasswordPair("short", "short")).toBe("Password must be at least 8 characters.");
    expect(validatePasswordPair("valid-password", "different-password")).toBe("Passwords do not match.");
    expect(validatePasswordPair("valid-password", "valid-password")).toBeNull();
  });
});
