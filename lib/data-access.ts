import "server-only";

import { assets as demoAssets, audit as demoAudit, company, ecms as demoEcms, evidence as demoEvidence, monthly as demoMonthly, overviewMetrics } from "./demo-data";
import { provenance, scopeEmissions } from "./calculations";
import type { Asset, ECM, MonthlyPoint } from "./types";
import { getDataMode } from "./runtime-config";
import { getSupabaseAdmin } from "./supabase-admin";

export type WorkspaceSnapshot = {
  source: "demo" | "supabase" | "demo-fallback";
  company: typeof company;
  audit: typeof demoAudit;
  monthly: MonthlyPoint[];
  assets: Asset[];
  ecms: ECM[];
  evidence: typeof demoEvidence;
  overviewMetrics: typeof overviewMetrics;
  fallbackReason?: string;
};

const demoSnapshot: WorkspaceSnapshot = { source: "demo", company, audit: demoAudit, monthly: demoMonthly, assets: demoAssets, ecms: demoEcms, evidence: demoEvidence, overviewMetrics };

function metricsFor(rows: MonthlyPoint[]) {
  const electricity = rows.reduce((sum, row) => sum + row.electricity, 0);
  const gas = rows.reduce((sum, row) => sum + row.gas, 0);
  const diesel = rows.reduce((sum, row) => sum + row.diesel, 0);
  const solar = rows.reduce((sum, row) => sum + row.solar, 0);
  const cost = rows.reduce((sum, row) => sum + row.cost, 0);
  const emissions = scopeEmissions({ electricityKwh: electricity, dieselLitres: diesel, gasKwh: gas, solarKwh: solar });
  return {
    annualEnergy: { value: electricity, display: `${(electricity / 1000000).toFixed(2)} GWh`, provenance: provenance("CALC-ENERGY-AGG-01", "kWh/year", "calculated", "A", ["Supabase electricity bills aggregated"], "FY25-26") },
    annualCost: { value: cost, display: `₹${(cost / 100000).toFixed(1)}L`, provenance: provenance("CALC-COST-AGG-01", "INR/year", "calculated", "A", ["Seeded tariff metadata; demand charges included"], "FY25-26") },
    emissions: { value: emissions.scope1 + emissions.scope2, display: `${((emissions.scope1 + emissions.scope2) / 1000).toFixed(2)} ktCO₂e`, provenance: provenance("CALC-EMISSIONS-01", "tCO₂e/year", "calculated", "B", ["Illustrative versioned emission factors"], "FY25-26") },
    renewable: { value: electricity > 0 ? solar / electricity : 0, display: `${Math.round(electricity > 0 ? solar / electricity * 100 : 0)}%`, provenance: provenance("CALC-RENEWABLE-01", "%", "calculated", "B", ["On-site solar generation"], "FY25-26") },
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

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  if (getDataMode() !== "supabase") return demoSnapshot;
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ...demoSnapshot, source: "demo-fallback", fallbackReason: "Supabase server variables are missing" };

  const organization = await supabase.from("organizations").select("id").eq("slug", "shakti-precision").maybeSingle();
  if (organization.error || !organization.data) return { ...demoSnapshot, source: "demo-fallback", fallbackReason: organization.error?.message ?? "Seed organization was not found" };
  const [bills, assets] = await Promise.all([
    supabase.from("utility_bills").select("billing_month,electricity_kwh,diesel_litres,natural_gas_kwh,solar_kwh,total_cost_inr,production_units").eq("organization_id", organization.data.id).order("billing_month"),
    supabase.from("assets").select("id,external_id,name,equipment_type,system_name,location,rating,age_years,operating_hours_year,criticality,health_score,status,confidence,note").eq("organization_id", organization.data.id).order("name"),
  ]);
  if (bills.error || !bills.data?.length) return { ...demoSnapshot, source: "demo-fallback", fallbackReason: bills.error?.message ?? "No seeded utility bills found" };
  const monthly = mapMonthly(bills.data);
  return { ...demoSnapshot, source: "supabase", monthly, assets: assets.data?.length ? assets.data.map(mapAsset) : demoAssets, overviewMetrics: metricsFor(monthly) };
}
