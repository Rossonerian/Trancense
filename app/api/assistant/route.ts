import { NextResponse } from "next/server";
import { z } from "zod";
import { answerWithGrounding } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";
const schema = z.object({ prompt: z.string().trim().min(1).max(1200) });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const result = await answerWithGrounding(input.prompt);
    return NextResponse.json({ ...result, label: result.mode === "provider" ? "Provider Response" : "Grounded Demo Response" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? "Prompt must be 1–1200 characters." : "Assistant request was not accepted." }, { status: 400 });
  }
}
