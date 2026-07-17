import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-helpers";
import { requireWorkspaceContext } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ kind: z.enum(["utility_bills", "assets"]), filename: z.string().trim().max(255).optional(), rows: z.array(z.record(z.string(), z.string())).min(1).max(5000) });
const unsafe = (value: string) => /^[=+@-]/.test(value.trim());
const numberValue = (value: string | undefined) => { const parsed = Number(value ?? 0); return Number.isFinite(parsed) && parsed >= 0 ? parsed : null; };

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Import rows are invalid or empty." }, { status: 400 });
    if (parsed.data.rows.some((row) => Object.values(row).some(unsafe))) return NextResponse.json({ error: "Formula-like CSV cells are blocked." }, { status: 400 });
    const supabase = await getSupabaseServerClient();
    const { data: site } = await supabase.from("sites").select("id").eq("organization_id", context.organizationId).order("created_at").limit(1).maybeSingle();
    if (!site) return NextResponse.json({ error: "Create a site before importing records." }, { status: 400 });
    const { data: batch, error: batchError } = await supabase.from("import_batches").insert({ organization_id: context.organizationId, site_id: site.id, kind: parsed.data.kind, filename: parsed.data.filename ?? null, row_count: parsed.data.rows.length, status: "received", created_by: context.user.id }).select("id").single();
    if (batchError) throw batchError;
    const rowRecords = parsed.data.rows.map((row, index) => ({ organization_id: context.organizationId, import_batch_id: batch.id, row_number: index + 1, raw_data: row, normalized_data: row, status: "validated" }));
    const { error: rowsError } = await supabase.from("import_rows").insert(rowRecords);
    if (rowsError) throw rowsError;
    let committed = 0;
    if (parsed.data.kind === "utility_bills") {
      const bills = parsed.data.rows.map((row) => ({ organization_id: context.organizationId, site_id: site.id, billing_month: row.month || row.billing_month, electricity_kwh: numberValue(row.kwh || row.electricity_kwh), total_cost_inr: numberValue(row.cost || row.total_cost_inr), diesel_litres: numberValue(row.diesel_litres) ?? 0, natural_gas_kwh: numberValue(row.natural_gas_kwh) ?? 0, solar_kwh: numberValue(row.solar_kwh) ?? 0, production_units: numberValue(row.production_units) ?? 0, source_id: `IMPORT-${batch.id}` }));
      if (bills.some((row) => !row.billing_month || row.electricity_kwh === null || row.total_cost_inr === null)) return NextResponse.json({ error: "Utility bill rows require month, kwh, and cost fields." }, { status: 400 });
      const result = await supabase.from("utility_bills").upsert(bills, { onConflict: "site_id,billing_month" });
      if (result.error) throw result.error;
      committed = bills.length;
    } else {
      const assets = parsed.data.rows.map((row, index) => ({ organization_id: context.organizationId, site_id: site.id, external_id: row.asset_id || row.external_id || `IMPORT-ASSET-${batch.id}-${index + 1}`, name: row.name || row.asset_name, equipment_type: row.type || row.equipment_type || "Equipment", system_name: row.system_name || null, location: row.location || null, rating: row.rating || null, confidence: "C", status: "Operating" }));
      if (assets.some((row) => !row.name)) return NextResponse.json({ error: "Asset rows require asset_id, name, and type fields." }, { status: 400 });
      const result = await supabase.from("assets").upsert(assets, { onConflict: "organization_id,external_id" });
      if (result.error) throw result.error;
      committed = assets.length;
    }
    await supabase.from("import_batches").update({ status: "committed" }).eq("id", batch.id).eq("organization_id", context.organizationId);
    await supabase.from("audit_events").insert({ organization_id: context.organizationId, event_type: "import_committed", actor_name: context.user.email ?? context.user.id, details: { batch_id: batch.id, kind: parsed.data.kind, rows: committed } });
    return NextResponse.json({ data: { batchId: batch.id, committed } }, { status: 201 });
  } catch (error) { return apiError(error, "Unable to commit import."); }
}
