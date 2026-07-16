import { createClient } from "@supabase/supabase-js";
import { assets, audit, company, ecms, evidence, monthly } from "../lib/demo-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; names only, no secret values are printed.");

const supabase = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
const organizationId = "00000000-0000-0000-0000-000000000001";
const siteId = "00000000-0000-0000-0000-000000000002";
const auditId = "00000000-0000-0000-0000-000000000003";
const uuid = (number: number) => `00000000-0000-0000-0000-${String(number).padStart(12, "0")}`;
const isoMonth = (month: string, index: number) => `2025-${String(((index + 3) % 12) + 1).padStart(2, "0")}-01`;

async function upsert(table: string, rows: Record<string, unknown>[]) {
  const result = await supabase.from(table).upsert(rows, { onConflict: table === "organizations" ? "id" : "id" });
  if (result.error) throw new Error(`${table}: ${result.error.message}`);
}

await upsert("organizations", [{ id: organizationId, slug: "shakti-precision", name: company.name, is_demo: true }]);
await upsert("sites", [{ id: siteId, organization_id: organizationId, name: company.site, region: company.region, timezone: company.timezone }]);
await upsert("audits", [{ id: auditId, organization_id: organizationId, site_id: siteId, code: audit.id, name: audit.name, level: audit.level, period_start: "2025-04-01", period_end: "2026-03-31", state: audit.state, completeness: audit.completeness, owner_name: audit.owner, reviewer_name: audit.reviewer, boundary: audit.boundary, purpose: audit.purpose, snapshot_version: "AUDIT-SNAPSHOT-014-v3" }]);
await upsert("utility_bills", monthly.map((row, index) => ({ id: uuid(100 + index), organization_id: organizationId, site_id: siteId, billing_month: isoMonth(row.month, index), electricity_kwh: row.electricity, diesel_litres: row.diesel, natural_gas_kwh: row.gas, solar_kwh: row.solar, total_cost_inr: row.cost, production_units: row.production, source_id: "EV-0251", confidence: "A" })));
await upsert("assets", assets.map((asset, index) => ({ id: uuid(200 + index), organization_id: organizationId, site_id: siteId, external_id: asset.id, name: asset.name, equipment_type: asset.kind, system_name: asset.system, location: asset.location, rating: asset.rating, age_years: asset.age, operating_hours_year: asset.hours, criticality: asset.criticality, health_score: asset.health, status: asset.status, confidence: asset.confidence, note: asset.note })));
await upsert("ecms", ecms.map((item, index) => ({ id: uuid(300 + index), organization_id: organizationId, audit_id: auditId, code: item.id, title: item.title, system_name: item.system, observation: item.observation, proposed_action: item.action, savings_kwh: item.savingsKwh, cost_savings_inr: item.costSavings, carbon_tonnes: item.carbon, capex_low_inr: item.capexLow, capex_high_inr: item.capexHigh, payback_years: item.payback, confidence: item.confidence, effort: item.effort, risk: item.risk, status: item.status, interaction_group: item.interactionGroup, mv_method: item.mv, owner_name: item.owner, provenance: item.provenance })));
await upsert("calculations", [{ id: uuid(400), organization_id: organizationId, audit_id: auditId, calculation_id: "CALC-ENERGY-AGG-01", formula_version: "calc-2026.01", result: { annualElectricity: monthly.reduce((sum, row) => sum + row.electricity, 0) }, provenance: { sourceId: "EV-0251", status: "calculated", confidence: "A", unit: "kWh/year" }, approved: false }, { id: uuid(401), organization_id: organizationId, audit_id: auditId, calculation_id: "CALC-BAL-014", formula_version: "calc-2026.01", result: { utilityKwh: 5124000, endUseKwh: 2514000 }, provenance: { sourceId: "EV-0307", status: "calculated", confidence: "B", unit: "kWh/year" }, approved: false }]);
await upsert("solar_scenarios", [{ id: uuid(500), organization_id: organizationId, audit_id: auditId, code: "SCENARIO-01", name: "Rooftop PV · 180 kWp planning scenario", inputs: { roofArea: 2600, exclusions: 380, moduleW: 540 }, outputs: { capacityKw: 461 }, assumptions: ["Planning values only", "Structural and DISCOM validation pending"] }]);
await upsert("evidence", evidence.map((item, index) => ({ id: uuid(600 + index), organization_id: organizationId, audit_id: auditId, evidence_id: item.id, evidence_type: item.type, title: item.title, status: item.status, captured_at: item.date, confidence: item.confidence, note: item.note })));
await upsert("audit_events", [{ id: uuid(700), organization_id: organizationId, audit_id: auditId, event_type: "technical_review_requested", actor_name: "Ananya Rao", details: { state: audit.state }, occurred_at: "2026-06-18T15:20:00+05:30" }, { id: uuid(701), organization_id: organizationId, audit_id: auditId, event_type: "ecm_register_updated", actor_name: "Ananya Rao", details: { ecm: "ECM-03" }, occurred_at: "2026-06-16T11:04:00+05:30" }]);
await upsert("report_snapshots", [{ id: uuid(800), organization_id: organizationId, audit_id: auditId, snapshot_code: "AUDIT-SNAPSHOT-014-v3", version: 3, status: "technical_review", payload: { title: "Detailed energy performance audit", evidenceIds: evidence.map((item) => item.id), calculationIds: ["CALC-ENERGY-AGG-01", "CALC-BAL-014"] } }]);

const testerUserId = process.argv[2] ?? process.env.SEED_AUTH_USER_ID;
if (testerUserId) await upsert("organization_memberships", [{ organization_id: organizationId, user_id: testerUserId, role: "Admin", status: "active" }]);

console.log(`Seeded the explicitly labeled demo organization with ${monthly.length} bills, ${assets.length} assets, and ${ecms.length} ECMs.`);
