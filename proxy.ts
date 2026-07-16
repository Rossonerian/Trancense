import { NextResponse, type NextRequest } from "next/server";
import { getDataMode } from "@/lib/runtime-config";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (getDataMode() !== "supabase") return NextResponse.next({ request });
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
