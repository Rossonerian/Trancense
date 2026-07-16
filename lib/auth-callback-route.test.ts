import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  getSupabaseServerClient: vi.fn(),
  createSupabaseCallbackClient: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  isSupabaseConfigured: vi.fn(),
}));

vi.mock("@/lib/supabase/callback", () => ({ createSupabaseCallbackClient: mocks.createSupabaseCallbackClient }));
vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));
vi.mock("@/lib/runtime-config", () => ({ isSupabaseConfigured: mocks.isSupabaseConfigured }));

import { GET } from "../app/auth/callback/route";

describe("Supabase auth callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.getSupabaseAdmin.mockReturnValue(null);
    mocks.createSupabaseCallbackClient.mockReturnValue({ auth: { exchangeCodeForSession: mocks.exchangeCodeForSession, getUser: mocks.getUser }, from: mocks.from });
    mocks.from.mockImplementation((table: string) => {
      const result = table === "profiles" ? { onboarding_completed: false } : null;
      const chain = { eq: () => chain, limit: () => chain, maybeSingle: async () => ({ data: result, error: null }) };
      return { select: () => chain };
    });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("exchanges an OAuth code and redirects a new user to onboarding", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    const response = await GET(new NextRequest("https://trancense.vercel.app/auth/callback?code=one-time-code"));
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("one-time-code");
    expect(response.headers.get("location")).toBe("https://trancense.vercel.app/onboarding");
  });

  it("routes missing and expired auth links to login without exposing query details", async () => {
    const missing = await GET(new NextRequest("https://trancense.vercel.app/auth/callback"));
    expect(missing.headers.get("location")).toBe("https://trancense.vercel.app/login?error=oauth");

    const expired = await GET(new NextRequest("https://trancense.vercel.app/auth/callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"));
    expect(expired.headers.get("location")).toBe("https://trancense.vercel.app/login?error=oauth");
    expect(expired.headers.get("location")).not.toContain("access_denied");
    expect(expired.headers.get("location")).not.toContain("otp_expired");
  });

  it("routes an onboarded member to the real overview", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.from.mockImplementation((table: string) => {
      const result = table === "profiles" ? { onboarding_completed: true } : { id: "membership-1" };
      const chain = { eq: () => chain, limit: () => chain, maybeSingle: async () => ({ data: result, error: null }) };
      return { select: () => chain };
    });
    const response = await GET(new NextRequest("https://trancense.vercel.app/auth/callback?code=existing-user-code"));
    expect(response.headers.get("location")).toBe("https://trancense.vercel.app/overview");
  });

  it("copies SSR cookies onto the redirect response after the exchange", async () => {
    mocks.createSupabaseCallbackClient.mockImplementation((_request: NextRequest, response: Response) => {
      (response as Response & { cookies?: { set: (name: string, value: string) => void } }).cookies?.set("sb-test-session", "opaque-session");
      return { auth: { exchangeCodeForSession: mocks.exchangeCodeForSession, getUser: mocks.getUser }, from: mocks.from };
    });
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    const response = await GET(new NextRequest("https://trancense.vercel.app/auth/callback?code=cookie-code"));
    expect(response.cookies.get("sb-test-session")?.value).toBe("opaque-session");
  });
});
