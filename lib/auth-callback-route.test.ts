import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  getSupabaseServerClient: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  isSupabaseConfigured: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ getSupabaseServerClient: mocks.getSupabaseServerClient }));
vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));
vi.mock("@/lib/runtime-config", () => ({ isSupabaseConfigured: mocks.isSupabaseConfigured }));

import { GET } from "../app/auth/callback/route";

describe("Supabase auth callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.getSupabaseAdmin.mockReturnValue(null);
    mocks.getSupabaseServerClient.mockResolvedValue({ auth: { exchangeCodeForSession: mocks.exchangeCodeForSession, getUser: mocks.getUser }, from: mocks.from });
    mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { onboarding_completed: false } }) }) }) });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("exchanges a confirmation code and redirects a new user to onboarding", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    const response = await GET(new NextRequest("https://trancense.vercel.app/auth/callback?code=one-time-code"));
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("one-time-code");
    expect(response.headers.get("location")).toBe("https://trancense.vercel.app/onboarding");
  });

  it("routes missing and expired links to recovery without exposing query details", async () => {
    const missing = await GET(new NextRequest("https://trancense.vercel.app/auth/callback"));
    expect(missing.headers.get("location")).toBe("https://trancense.vercel.app/auth/recovery?reason=missing_code");

    const expired = await GET(new NextRequest("https://trancense.vercel.app/auth/callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"));
    expect(expired.headers.get("location")).toBe("https://trancense.vercel.app/auth/recovery?reason=expired");
    expect(expired.headers.get("location")).not.toContain("access_denied");
    expect(expired.headers.get("location")).not.toContain("otp_expired");
  });
});
