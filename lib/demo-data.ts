import { energyCost, provenance, reconciliation, scopeEmissions, specificEnergyConsumption } from "./calculations";
import type { Asset, Audit, ECM, MonthlyPoint } from "./types";

export const company = { name: "Shakti Precision Components Pvt. Ltd.", site: "Pune Plant", region: "Maharashtra", timezone: "Asia/Kolkata" };
export const audit: Audit = { id: "AUD-2026-014", name: "Pune Plant · Detailed energy audit", level: "Detailed", period: "01 Apr 2025 — 31 Mar 2026", state: "Technical Review", completeness: 86, owner: "Ananya Rao", reviewer: "Vikram Shah", boundary: "Pune Plant, production + utilities", purpose: "Identify verified energy-performance opportunities while preserving production reliability." };

const raw = [
  ["Apr", 412000, 16800, 63000, 18400, 3620000, 810], ["May", 428000, 17200, 65000, 22100, 3790000, 842], ["Jun", 441000, 16900, 68000, 24700, 3920000, 858], ["Jul", 456000, 18100, 72000, 23800, 4110000, 876], ["Aug", 448000, 17600, 69000, 25200, 4050000, 864], ["Sep", 439000, 16500, 66000, 23900, 3970000, 850], ["Oct", 424000, 15800, 61000, 21600, 3820000, 826], ["Nov", 411000, 14900, 58000, 18200, 3690000, 802], ["Dec", 396000, 14200, 54000, 15500, 3540000, 768], ["Jan", 402000, 15100, 57000, 16800, 3610000, 780], ["Feb", 415000, 15700, 59000, 17900, 3720000, 798], ["Mar", 431000, 16100, 62000, 20100, 3860000, 824],
] as const;
export const monthly: MonthlyPoint[] = raw.map(([month, electricity, diesel, gas, solar, cost, production]) => ({ month, electricity, diesel, gas, solar, cost, production }));
export const annualElectricity = monthly.reduce((sum, item) => sum + item.electricity, 0);
export const annualSolar = monthly.reduce((sum, item) => sum + item.solar, 0);
export const annualCost = monthly.reduce((sum, item) => sum + item.cost, 0);
export const totalProduction = monthly.reduce((sum, item) => sum + item.production, 0);
export const emissions = scopeEmissions({ electricityKwh: annualElectricity, dieselLitres: 195000, gasKwh: monthly.reduce((sum, item) => sum + item.gas, 0), solarKwh: annualSolar });
export const totalEnergy = annualElectricity + monthly.reduce((sum, item) => sum + item.gas, 0) + 195000 * 10.2;
export const energyBalance = { utility: annualElectricity, endUse: 2514000, unallocated: annualElectricity - 2514000, ...reconciliation(annualElectricity, 2514000) };
export const completenessAlerts = [
  { label: "Compressed-air submeter gap", detail: "17 hours · 19 May 2025", tone: "warning" },
  { label: "DG fuel log needs review", detail: "Two readings lack an operator sign-off", tone: "exception" },
  { label: "Production driver coverage", detail: "96% of the reporting period is covered", tone: "info" },
];

export const assets: Asset[] = [
  { id: "AST-TX-01", name: "Main transformer T1", kind: "Transformer", system: "Electrical distribution", location: "Utility yard", rating: "1,250 kVA · 11/0.433 kV", age: 8, hours: 8760, criticality: "High", health: 91, status: "Operating", confidence: "A", note: "Thermography within normal band; 58% average loading." },
  { id: "AST-CA-01", name: "Plant air compressor C1", kind: "Compressor", system: "Compressed air", location: "Compressor house", rating: "110 kW · 8.5 bar", age: 6, hours: 6120, criticality: "High", health: 76, status: "Needs review", confidence: "B", note: "Load/unload cycling and leakage survey indicate avoidable baseload." },
  { id: "AST-PU-01", name: "Chilled-water pump P1", kind: "Pump", system: "HVAC", location: "Utility block", rating: "30 kW · 415 V 3φ", age: 5, hours: 4280, criticality: "Medium", health: 84, status: "Operating", confidence: "B", note: "Throttled at 61%; VFD feasibility is pending differential-pressure evidence." },
  { id: "AST-CT-01", name: "Cooling-tower fan CT-1", kind: "Fan", system: "HVAC", location: "Roof", rating: "22 kW · 415 V 3φ", age: 7, hours: 3940, criticality: "Medium", health: 81, status: "Operating", confidence: "B", note: "Seasonal control opportunity; no control change is automated in demo." },
  { id: "AST-AHU-01", name: "Assembly AHU-01", kind: "AHU", system: "HVAC", location: "Assembly hall", rating: "45 kW fan · 12,000 CFM", age: 10, hours: 5680, criticality: "High", health: 72, status: "Needs review", confidence: "C", note: "Operating schedule is inferred from BMS export, not a live connection." },
  { id: "AST-MT-07", name: "CNC line motor M-07", kind: "Production motor", system: "Machining", location: "Building A / Bay 2", rating: "18.5 kW · IE3", age: 4, hours: 5840, criticality: "High", health: 94, status: "Operating", confidence: "A", note: "Stable current signature across seven sampled days." },
  { id: "AST-LT-01", name: "Assembly lighting circuits", kind: "Lighting", system: "Lighting", location: "Building A", rating: "428 fixtures · 96 kW", age: 9, hours: 3510, criticality: "Medium", health: 69, status: "Needs review", confidence: "B", note: "LED retrofit and occupancy controls are screened as one interaction group." },
  { id: "AST-DG-01", name: "Emergency DG set", kind: "DG set", system: "Backup generation", location: "Utility yard", rating: "500 kVA · diesel", age: 11, hours: 142, criticality: "High", health: 88, status: "Standby", confidence: "B", note: "Fuel log is available; runtime is low and treated as Scope 1." },
  { id: "AST-PV-01", name: "Rooftop PV array", kind: "Rooftop PV", system: "Renewables", location: "Building A roof", rating: "180 kWp planning scenario", age: 0, hours: 1900, criticality: "Low", health: 100, status: "Standby", confidence: "C", note: "Planning scenario only; structural, DISCOM and shading checks are pending." },
];

const ecmBase = [
  ["ECM-01", "Compressed-air leakage repair", "Compressed air", "Leakage survey found 14 open points during unoccupied hours.", "Repair, tag and verify leakage points; add quarterly survey route.", 148000, 620000, 105, 0.35, "Low", "M&V Option A · pressure and runtime trend", "Maintenance"],
  ["ECM-02", "Compressor pressure reset", "Compressed air", "Header pressure is held at 8.5 bar despite a 7.2 bar process need.", "Sequence C1/C2 around a 7.5 bar setpoint with process validation.", 92000, 410000, 65, 0.53, "Medium", "M&V Option B · kW/pressure regression", "Utilities"],
  ["ECM-03", "Chilled-water pump VFD", "HVAC", "P1 is throttled at 61%; duty profile is available for 5 of 7 sampled days.", "Install VFD and reset differential pressure to the critical index.", 118000, 860000, 84, 0.8, "Medium", "M&V Option B · flow/DP/kW", "Projects"],
  ["ECM-04", "LED retrofit + occupancy controls", "Lighting", "Legacy fixtures account for a high share of evening baseload.", "Replace with high-efficiency luminaires and zone occupancy control.", 176000, 1280000, 125, 1.35, "Medium", "M&V Option A · fixture and runtime sample", "Projects"],
  ["ECM-05", "Demand management schedule", "Electrical distribution", "Three monthly peaks align with simultaneous HVAC and compressor starts.", "Stagger starts and add peak alert review to the daily production huddle.", 76000, 180000, 54, 0.25, "Low", "M&V Option C · interval demand comparison", "Facility"],
  ["ECM-06", "Rooftop PV · 180 kWp scenario", "Renewables", "Roof planning area can host a preliminary 180 kWp array.", "Validate structure, fire access, interconnection and shading before tender.", 248000, 11200000, 143, 5.4, "High", "M&V Option B · inverter + utility meter", "Sustainability"],
  ["ECM-07", "AHU schedule and setpoint reset", "HVAC", "AHU-01 runs through two low-occupancy windows each week.", "Align start/stop schedule and verify comfort boundary with facilities.", 63000, 290000, 44, 0.42, "Low", "M&V Option A · runtime and zone temperature", "Facilities"],
] as const;
export const ecms: ECM[] = ecmBase.map(([id, title, system, observation, action, savingsKwh, capex, carbon, payback, risk, mv, owner], index) => ({ id, title, system, observation, action, savingsKwh, costSavings: Math.round(savingsKwh * 8.35), carbon, capexLow: Math.round(capex * 0.85), capexHigh: Math.round(capex * 1.15), payback, confidence: index === 2 || index === 5 ? "C" : "B", effort: Math.min(5, index + 1), risk, status: index < 2 ? "Identified" : index === 4 ? "Approved" : "Screened", interactionGroup: id === "ECM-01" || id === "ECM-02" ? "CA-01" : id === "ECM-04" ? "LT-01" : undefined, mv, owner, provenance: provenance(`CALC-${id}`, "kWh/year", "calculated", index === 2 || index === 5 ? "C" : "B", ["Seeded demo measurements and conservative screening assumptions"], "FY25-26") }));

export const evidence = [
  { id: "EV-0251", type: "Utility bill", title: "MSEDCL April 2025 bill", status: "measured", date: "06 May 2025", confidence: "A", note: "Energy and demand charges transcribed from source bill." },
  { id: "EV-0307", type: "Interval export", title: "Main incomer · 15-minute data", status: "measured", date: "01 Apr 2025", confidence: "A", note: "Seven-day sample used for load profile and peak review." },
  { id: "EV-0418", type: "Walk-through note", title: "Compressed-air leakage survey", status: "estimated", date: "19 May 2025", confidence: "B", note: "14 points observed; repair pricing remains a range." },
  { id: "EV-0520", type: "Asset register", title: "Utility equipment nameplate pack", status: "measured", date: "27 May 2025", confidence: "B", note: "Ratings and operating context reviewed by auditor." },
];

export const endUses = [{ name: "Production motors", value: 832000, color: "#847DFF" }, { name: "HVAC & chilled water", value: 610000, color: "#00B3DD" }, { name: "Compressed air", value: 422000, color: "#DD90D8" }, { name: "Lighting", value: 284000, color: "#90B8F0" }, { name: "Other / unallocated", value: 366000, color: "#6A6B6B" }];
export const auditEvents = [{ date: "18 Jun 2026", text: "Technical review requested", actor: "Vikram Shah", tone: "iris" }, { date: "16 Jun 2026", text: "ECM register updated", actor: "Ananya Rao", tone: "cyan" }, { date: "11 Jun 2026", text: "Interval data import validated", actor: "System", tone: "muted" }];
export const totalEcmSavings = ecms.reduce((sum, ecm) => sum + ecm.costSavings, 0);
export const annualSec = specificEnergyConsumption(annualElectricity, totalProduction);
export const overviewMetrics = { annualEnergy: { value: totalEnergy, display: "4.76 GWh", provenance: provenance("CALC-ENERGY-AGG-01", "kWh/year", "calculated", "A", ["Utility bills and fuel logs aggregated for FY25-26"], "FY25-26") }, annualCost: { value: annualCost, display: "₹46.2L", provenance: provenance("CALC-COST-AGG-01", "INR/year", "calculated", "A", [`Tariff ${"MSEDCL-demo-v2"}; demand charges included`], "FY25-26") }, emissions: { value: emissions.scope1 + emissions.scope2, display: `${((emissions.scope1 + emissions.scope2) / 1000).toFixed(2)} ktCO₂e`, provenance: provenance("CALC-EMISSIONS-01", "tCO₂e/year", "calculated", "B", ["Demo emission factors are illustrative and versioned"], "FY25-26") }, renewable: { value: annualSolar / annualElectricity, display: `${Math.round(annualSolar / annualElectricity * 100)}%`, provenance: provenance("CALC-RENEWABLE-01", "%", "calculated", "B", ["On-site solar generation is measured at inverter output"], "FY25-26") } };
