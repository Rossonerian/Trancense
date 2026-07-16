import { NextResponse } from "next/server";
import { z } from "zod";
import { answerWithGrounding } from "@/lib/ai-provider";
import { getDataMode } from "@/lib/runtime-config";
import { requireWorkspaceContext } from "@/lib/auth";
import { apiError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
const schema = z.object({ prompt: z.string().trim().min(1).max(1200) });
const requestWindow = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    if (getDataMode() === "supabase") await requireWorkspaceContext();
    const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const now = Date.now();
    const current = requestWindow.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : current;
    bucket.count += 1;
    requestWindow.set(key, bucket);
    if (bucket.count > 20) return NextResponse.json({ error: "Assistant rate limit reached. Try again shortly." }, { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
    const input = schema.parse(await request.json());
    const result = await answerWithGrounding(input.prompt);
    return NextResponse.json({ ...result, label: result.mode === "provider" ? "Provider Response" : "Grounded Demo Response" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && ["UNAUTHENTICATED", "NO_WORKSPACE", "FORBIDDEN"].includes(error.message)) return apiError(error);
    return NextResponse.json({ error: error instanceof z.ZodError ? "Prompt must be 1–1200 characters." : "Assistant request was not accepted." }, { status: 400 });
  }
}
