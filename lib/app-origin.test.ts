import { describe, expect, it } from "vitest";
import { getSafeInternalPath, isTrustedAppOrigin, normalizeAppOrigin, resolveTrustedAppOrigin } from "./app-origin";

describe("trusted application origin", () => {
  it("uses the production origin and removes trailing slashes", () => {
    expect(normalizeAppOrigin("https://trancense.vercel.app///")).toBe("https://trancense.vercel.app");
    expect(resolveTrustedAppOrigin({ configuredOrigin: "https://trancense.vercel.app///", isProduction: true })).toBe("https://trancense.vercel.app");
  });

  it("allows local development but never uses localhost as a production fallback", () => {
    expect(resolveTrustedAppOrigin({ configuredOrigin: "http://localhost:3000", isProduction: false })).toBe("http://localhost:3000");
    expect(resolveTrustedAppOrigin({ configuredOrigin: "http://localhost:3000", requestOrigin: "https://trancense.vercel.app", isProduction: true })).toBe("https://trancense.vercel.app");
    expect(isTrustedAppOrigin("http://localhost:3000", { isProduction: true })).toBe(false);
  });

  it("rejects external, malformed, and path-bearing origins", () => {
    expect(normalizeAppOrigin("https://example.com")).toBe("https://example.com");
    expect(isTrustedAppOrigin("https://example.com", { isProduction: true })).toBe(false);
    expect(normalizeAppOrigin("https://trancense.vercel.app/auth/v1")).toBeNull();
    expect(normalizeAppOrigin("https://trancense.vercel.app/?next=/overview")).toBeNull();
  });

  it("accepts an explicitly configured Vercel preview origin", () => {
    const preview = "https://trancense-git-demo.vercel.app";
    expect(resolveTrustedAppOrigin({ configuredOrigin: preview, isProduction: true })).toBe(preview);
    expect(resolveTrustedAppOrigin({ requestOrigin: preview, configuredPreviewOrigins: [preview], isProduction: true })).toBe(preview);
  });
});

describe("safe internal redirects", () => {
  it("keeps approved local paths and rejects external destinations", () => {
    expect(getSafeInternalPath("/onboarding")).toBe("/onboarding");
    expect(getSafeInternalPath("/login?next=/overview")).toBe("/login?next=/overview");
    expect(getSafeInternalPath("//evil.example/login")).toBe("/overview");
    expect(getSafeInternalPath("https://evil.example/login")).toBe("/overview");
    expect(getSafeInternalPath("/\\\\evil.example")).toBe("/overview");
  });
});
