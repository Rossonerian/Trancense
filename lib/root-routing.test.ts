import { describe, expect, it } from "vitest";
import { resolveRootDestination } from "./root-routing";

describe("root authentication routing", () => {
  it("never sends an unauthenticated Supabase visitor to the dashboard", () => {
    expect(resolveRootDestination({ dataMode: "supabase", authenticated: false, hasProfile: false, hasOrganization: false })).toBe("/login");
    expect(resolveRootDestination({ dataMode: "supabase", authenticated: true, hasProfile: false, hasOrganization: false })).toBe("/onboarding");
    expect(resolveRootDestination({ dataMode: "supabase", authenticated: true, hasProfile: true, hasOrganization: false })).toBe("/onboarding");
    expect(resolveRootDestination({ dataMode: "supabase", authenticated: true, hasProfile: true, hasOrganization: true })).toBe("/overview");
  });

  it("keeps demo mode behind the login entry point", () => {
    expect(resolveRootDestination({ dataMode: "demo", authenticated: false, hasProfile: false, hasOrganization: false })).toBe("/login");
  });
});
