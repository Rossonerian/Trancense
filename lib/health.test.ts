import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./runtime-config", () => ({
  getDataMode: () => "supabase",
  getMissingSupabaseVariables: () => ["NEXT_PUBLIC_APP_URL"],
  isSupabaseConfigured: () => false,
}));
vi.mock("./supabase-admin", () => ({ getSupabaseAdmin: () => null }));
vi.mock("./supabase/server-config", () => ({ getSupabaseServerConfig: () => ({ urlHost: null }) }));

import { getHealthStatus } from "./health";

describe("safe health diagnostics", () => {
  it("returns configuration names only and never credential fields", async () => {
    const response = await getHealthStatus();
    const serialized = JSON.stringify(response);
    expect(response).toMatchObject({ status: "degraded", dataMode: "supabase", supabaseConfigured: false, missingVariables: ["NEXT_PUBLIC_APP_URL"] });
    expect(serialized).not.toContain("serviceRoleKey");
    expect(serialized).not.toContain("DATABASE_URL");
    expect(serialized).not.toContain("access_token");
    expect(serialized).not.toContain("password");
  });
});
