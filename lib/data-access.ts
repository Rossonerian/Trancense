import "server-only";

import { assets as demoAssets, audit as demoAudit, auditEvents as demoAuditEvents, company, ecms as demoEcms, emissions as demoEmissions, endUses as demoEndUses, evidence as demoEvidence, monthly as demoMonthly, overviewMetrics } from "./demo-data";
import { provenance, scopeEmissions } from "./calculations";
import type { Asset, ECM, MonthlyPoint } from "./types";
import { getDataMode, isSupabaseConfigured } from "./runtime-config";
import { getAuthContext } from "./auth";
import { getSupabaseServerClient } from "./supabase/server";

export type WorkspaceSnapshot = {
  source: "demo" | "supabase";
  company: typeof company | null;
  audit: typeof demoAudit | null;
  monthly: MonthlyPoint[];
  assets: Asset[];
  ecms: ECM[];
  evidence: typeof demoEvidence;
  endUses: Array<{ name: string; value: number; color: string }>;
  overviewMetrics: typeof overviewMetrics | null;
  solarScenario: { code: string; name: string; inputs: Record<string, number>; outputs: Record<string, number>; assumptions: string[] } | null;
  emissions: { scope1: number; scope2: number };
  organizationId?: string;
  siteId?: string;
  auditEvents: typeof demoAuditEvents;
  configurationError?: string;
};

const demoSnapshot: WorkspaceSnapshot = { source: "demo", company, audit: demoAudit, monthly: demoMonthly, assets: demoAssets, ecms: demoEcms, evidence: demoEvidence, endUses: demoEndUses, overviewMetrics, solarScenario: { code: "SCENARIO-01", name: "Rooftop PV · 180 kWp planning scenario", inputs: { roofArea: 2600, exclusions: 380, moduleW: 540 }, outputs: { capacityKw: 461 }, assumptions: ["Planning values only", "Structural and DISCOM validation pending"] }, emissions: demoEmissions, auditEvents: demoAuditEvents };

const emptySnapshot: WorkspaceSnapshot = { source: "supabase", company: null, audit: null, monthly: [], assets: [], ecms: [], evidence: [], endUses: [], overviewMetrics: null, solarScenario: null, emissions: { scope1: 0, scope2: 0 }, auditEvents: [] };

function metricsFor(rows: MonthlyPoint[]) {
  const electricity = rows.reduce((sum, row) => sum + row.electricity, 0);
  const gas = rows.reduce((sum, row) => sum + row.gas, 0);
  const diesel = rows.reduce((sum, row) => sum + row.diesel, 0);
  const solar = rows.reduce((sum, row) => sum + row.solar, 0);
  const cost = rows.reduce((sum, row) => sum + row.cost, 0);
  const emissions = scopeEmissions({ electricityKwh: electricity, dieselLitres: diesel, gasKwh: gas, solarKwh: solar });
  return {
    annualEnergy: { value: electricity, display: `${(electricity / 1000000).toFixed(2)} GWh`, provenance: provenance("CALC-ENERGY-AGG-01", "kWh/year", "calculated", "A", ["Persisted utility bills aggregated"], "persisted-records") },
    annualCost: { value: cost, display: `₹${(cost / 100000).toFixed(1)}L`, provenance: provenance("CALC-COST-AGG-01", "INR/year", "calculated", "B", ["Persisted utility bill cost fields; tariff validation required"], "persisted-records") },
    emissions: { value: emissions.scope1 + emissions.scope2, display: `${((emissions.scope1 + emissions.scope2) / 1000).toFixed(2)} ktCO₂e`, provenance: provenance("CALC-EMISSIONS-01", "tCO₂e/year", "calculated", "C", ["Configured emission factors must be reviewed before authoritative use"], "persisted-records") },
    renewable: { value: electricity > 0 ? solar / electricity : 0, display: `${Math.round(electricity > 0 ? solar / electricity * 100 : 0)}%`, provenance: provenance("CALC-RENEWABLE-01", "%", "calculated", "C", ["Persisted solar output divided by persisted electricity input"], "persisted-records") },
  };
}

function monthLabel(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

function mapMonthly(rows: Array<Record<string, unknown>>): MonthlyPoint[] {
  return rows.map((row) => ({
    month: monthLabel(String(row.billing_month)),
    electricity: Number(row.electricity_kwh) || 0,
    diesel: Number(row.diesel_litres) || 0,
    gas: Number(row.natural_gas_kwh) || 0,
    solar: Number(row.solar_kwh) || 0,
    cost: Number(row.total_cost_inr) || 0,
    production: Number(row.production_units) || 0,
  }));
}

function mapAsset(row: Record<string, unknown>): Asset {
  return {
    id: String(row.external_id ?? row.id), name: String(row.name), kind: String(row.equipment_type ?? "Equipment"), system: String(row.system_name ?? "Unclassified"), location: String(row.location ?? "Pune Plant"), rating: String(row.rating ?? "—"), age: Number(row.age_years) || 0, hours: Number(row.operating_hours_year) || 0, criticality: row.criticality === "High" || row.criticality === "Low" ? row.criticality : "Medium", health: Number(row.health_score) || 0, status: row.status === "Needs review" || row.status === "Standby" ? row.status : "Operating", confidence: row.confidence === "A" || row.confidence === "C" || row.confidence === "D" ? row.confidence : "B", note: String(row.note ?? "")
  };
}

function mapAudit(row: Record<string, unknown>): typeof demoAudit {
  return { id: String(row.code ?? row.id), name: String(row.name), level: String(row.level), period: `${String(row.period_start)} — ${String(row.period_end)}`, state: String(row.state), completeness: Number(row.completeness) || 0, owner: String(row.owner_name ?? "Unassigned"), reviewer: String(row.reviewer_name ?? "Unassigned"), boundary: String(row.boundary ?? "Not defined"), purpose: String(row.purpose ?? "") };
}

function mapEcm(row: Record<string, unknown>): ECM {
  const confidence = row.confidence === "A" || row.confidence === "C" || row.confidence === "D" ? row.confidence : "B";
  const risk = row.risk === "Low" || row.risk === "High" ? row.risk : "Medium";
  const status = row.status === "Approved" || row.status === "In progress" || row.status === "Screened" ? row.status : "Identified";
  return { id: String(row.code ?? row.id), title: String(row.title), system: String(row.system_name ?? "Unclassified"), observation: String(row.observation ?? ""), action: String(row.proposed_action ?? ""), savingsKwh: Number(row.savings_kwh) || 0, costSavings: Number(row.cost_savings_inr) || 0, carbon: Number(row.carbon_tonnes) || 0, capexLow: Number(row.capex_low_inr) || 0, capexHigh: Number(row.capex_high_inr) || 0, payback: Number(row.payback_years) || 0, confidence, effort: Number(row.effort) || 0, risk, status, interactionGroup: row.interaction_group ? String(row.interaction_group) : undefined, mv: String(row.mv_method ?? "Not defined"), owner: String(row.owner_name ?? "Unassigned"), provenance: (row.provenance as ECM["provenance"]) ?? provenance(String(row.code ?? row.id), "kWh/year", "calculated", confidence, ["Persisted ECM record"], "persisted-records") };
}

function mapEvidence(row: Record<string, unknown>): (typeof demoEvidence)[number] {
  const confidence = row.confidence === "A" || row.confidence === "C" || row.confidence === "D" ? row.confidence : "B";
  return { id: String(row.evidence_id ?? row.id), type: String(row.evidence_type ?? "Evidence"), title: String(row.title), status: String(row.status ?? "pending"), date: String(row.captured_at ?? "Not dated"), confidence, note: String(row.note ?? "") };
}

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  if (getDataMode() !== "supabase") return demoSnapshot;
  if (!isSupabaseConfigured()) throw new Error("SUPABASE_CONFIGURATION_MISSING");
  const context = await getAuthContext();
  if (!context.user || !context.memberships[0]) return emptySnapshot;
  const organizationId = context.memberships[0].organization_id;
  const supabase = await getSupabaseServerClient();
  const [organization, site, audit, bills, assets, ecms, evidence, solarScenario, auditEvents] = await Promise.all([
    supabase.from("organizations").select("id,name,slug").eq("id", organizationId).maybeSingle(),
    supabase.from("sites").select("id,name,region,timezone").eq("organization_id", organizationId).order("created_at").limit(1).maybeSingle(),
    supabase.from("audits").select("id,code,name,level,period_start,period_end,state,completeness,owner_name,reviewer_name,boundary,purpose").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("utility_bills").select("billing_month,electricity_kwh,diesel_litres,natural_gas_kwh,solar_kwh,total_cost_inr,production_units").eq("organization_id", organizationId).order("billing_month"),
    supabase.from("assets").select("id,external_id,name,equipment_type,system_name,location,rating,age_years,operating_hours_year,criticality,health_score,status,confidence,note").eq("organization_id", organizationId).order("name"),
    supabase.from("ecms").select("id,code,title,system_name,observation,proposed_action,savings_kwh,cost_savings_inr,carbon_tonnes,capex_low_inr,capex_high_inr,payback_years,confidence,effort,risk,status,interaction_group,mv_method,owner_name,provenance").eq("organization_id", organizationId).order("created_at"),
    supabase.from("evidence").select("id,evidence_id,evidence_type,title,status,captured_at,confidence,note").eq("organization_id", organizationId).order("created_at"),
    supabase.from("solar_scenarios").select("code,name,inputs,outputs,assumptions").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("audit_events").select("event_type,actor_name,occurred_at,details").eq("organization_id", organizationId).order("occurred_at", { ascending: false }).limit(20),
  ]);
  const failed = [organization, site, audit, bills, assets, ecms, evidence, solarScenario, auditEvents].find((result) => result.error);
  if (failed?.error) throw new Error(`SUPABASE_QUERY_FAILED:${failed.error.message}`);
  const monthly = mapMonthly(bills.data ?? []);
  const organizationData = organization.data;
  const siteData = site.data;
  const scenario = solarScenario.data ? { code: String(solarScenario.data.code), name: String(solarScenario.data.name), inputs: (solarScenario.data.inputs as Record<string, number>) ?? {}, outputs: (solarScenario.data.outputs as Record<string, number>) ?? {}, assumptions: Array.isArray(solarScenario.data.assumptions) ? solarScenario.data.assumptions.map(String) : [] } : null;
  const derivedEmissions = scopeEmissions({ electricityKwh: monthly.reduce((sum, row) => sum + row.electricity, 0), dieselLitres: monthly.reduce((sum, row) => sum + row.diesel, 0), gasKwh: monthly.reduce((sum, row) => sum + row.gas, 0), solarKwh: monthly.reduce((sum, row) => sum + row.solar, 0) });
  const mappedEvents = (auditEvents.data ?? []).map((event) => ({ date: new Date(String(event.occurred_at)).toLocaleDateString("en-IN"), text: String(event.event_type).replaceAll("_", " "), actor: String(event.actor_name), tone: "muted" as const }));
  return { source: "supabase", organizationId, siteId: siteData?.id, company: organizationData ? { name: organizationData.name, site: siteData?.name ?? "No site created", region: siteData?.region ?? "", timezone: siteData?.timezone ?? "Asia/Kolkata" } : null, audit: audit.data ? mapAudit(audit.data) : null, monthly, assets: (assets.data ?? []).map(mapAsset), ecms: (ecms.data ?? []).map(mapEcm), evidence: (evidence.data ?? []).map(mapEvidence), endUses: [], overviewMetrics: monthly.length ? metricsFor(monthly) : null, solarScenario: scenario, emissions: derivedEmissions, auditEvents: mappedEvents };
}
