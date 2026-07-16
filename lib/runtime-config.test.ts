import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./supabase/server-config", () => ({ getSupabaseServerConfig: () => ({ missingVariables: [] }) }));

import { getDataMode } from "./runtime-config";

afterEach(() => vi.unstubAllEnvs());

describe("runtime data mode", () => {
  it("allows demo mode only outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATA_MODE", "demo");
    expect(getDataMode()).toBe("demo");
  });

  it("forces Supabase mode in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_MODE", "demo");
    expect(getDataMode()).toBe("supabase");
  });

  it("defaults to Supabase when production mode is not explicitly set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_MODE", "");
    expect(getDataMode()).toBe("supabase");
  });
});
