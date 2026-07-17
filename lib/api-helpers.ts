import { NextResponse } from "next/server";

export function apiError(error: unknown, fallback = "Request could not be completed.") {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHENTICATED") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (message === "NO_WORKSPACE") return NextResponse.json({ error: "No active organization membership is available." }, { status: 403 });
  if (message === "FORBIDDEN") return NextResponse.json({ error: "This workspace action is not permitted." }, { status: 403 });
  if (message === "SUPABASE_CONFIGURATION_MISSING") return NextResponse.json({ error: "Supabase mode is not configured." }, { status: 503 });
  console.error("[trancense-api] request failed", { errorType: error instanceof Error ? error.name : "unknown" });
  return NextResponse.json({ error: fallback }, { status: 500 });
}
