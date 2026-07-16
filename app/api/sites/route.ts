import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-helpers";
import { canWrite, requireWorkspaceContext } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ name: z.string().trim().min(2).max(160), region: z.string().trim().max(120).optional(), timezone: z.string().trim().max(80).default("Asia/Kolkata") });

export async function GET() { try { const context = await requireWorkspaceContext(); const supabase = await getSupabaseServerClient(); const { data, error } = await supabase.from("sites").select("id,name,region,timezone,created_at").eq("organization_id", context.organizationId).order("created_at"); if (error) throw error; return NextResponse.json({ data }); } catch (error) { return apiError(error, "Unable to load sites."); } }
export async function POST(request: Request) { try { const context = await requireWorkspaceContext(); if (!canWrite(context.membership.role)) throw new Error("FORBIDDEN"); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Site name is required." }, { status: 400 }); const supabase = await getSupabaseServerClient(); const { data, error } = await supabase.from("sites").insert({ organization_id: context.organizationId, ...parsed.data }).select("id,name,region,timezone").single(); if (error) throw error; await supabase.from("audit_events").insert({ organization_id: context.organizationId, event_type: "site_created", actor_name: context.user.email ?? context.user.id, details: { site_id: data.id } }); return NextResponse.json({ data }, { status: 201 }); } catch (error) { return apiError(error, "Unable to create site."); } }
