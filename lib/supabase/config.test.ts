import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseConfig } from "./config";

describe("Supabase configuration resolver", () => {
  it("documents the Supabase Connect aliases used by the local environment", async () => {
    const { supabaseEnvironmentVariableNames } = await import("./config");
    expect(supabaseEnvironmentVariableNames.publishableKey).toContain("SUPABASE_PUBLISHABLE_KEY");
    expect(supabaseEnvironmentVariableNames.serviceRoleKey).toContain("SUPABASE_SECRET_KEY");
  });

  it("accepts a project root and normalizes harmless trailing slashes", () => {
    const config = resolveSupabaseConfig({ url: "https://demo-project.supabase.co///", publishableKey: "public-key", serviceRoleKey: "server-key" });
    expect(config.url).toBe("https://demo-project.supabase.co");
    expect(config.urlHost).toBe("demo-project.supabase.co");
    expect(config.invalidUrl).toBe(false);
    expect(config.missingVariables).toEqual([]);
  });

  it("rejects SDK subpaths so auth does not become /auth/v1/auth/v1", () => {
    const config = resolveSupabaseConfig({ url: "https://demo-project.supabase.co/auth/v1", publishableKey: "public-key", serviceRoleKey: "server-key" });
    expect(config.invalidUrl).toBe(true);
    expect(config.url).toBeNull();
  });

  it("lets the SDK append exactly one auth path to a project root", async () => {
    let requestedUrl = "";
    const client = createClient("https://demo-project.supabase.co", "public-key", {
      global: {
        fetch: async (input) => {
          requestedUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
          return new Response(JSON.stringify({ user: null, session: null }), { status: 200, headers: { "Content-Type": "application/json" } });
        },
      },
    });
    await client.auth.signUp({ email: "tester@example.com", password: "not-a-secret" });
    expect(requestedUrl).toBe("https://demo-project.supabase.co/auth/v1/signup");
  });
});
