import type { Provenance } from "./types";

export const FORMULA_VERSION = "calc-2026.01";
export const TARIFF_VERSION = "MSEDCL-demo-v2";
export const EMISSION_FACTOR_VERSION = "India-grid-CEA-demo-2025";

export function provenance(sourceId: string, unit: string, status: Provenance["status"], confidence: Provenance["confidence"] = "B", assumptions: string[] = [], period?: string): Provenance {
  return { sourceId, unit, status, confidence, assumptions, period, formulaVersion: FORMULA_VERSION };
}

export function aggregate(values: number[]): number {
  return values.filter(Number.isFinite).reduce((sum, value) => sum + value, 0);
}

export function energyCost(kwh: number, tariff: number): number {
  return Math.max(0, kwh) * Math.max(0, tariff);
}

export function effectiveTariff(energyCharge: number, demandCharge: number, fixedCharge: number, kwh: number): number {
  if (kwh <= 0) return 0;
  return (Math.max(0, energyCharge) + Math.max(0, demandCharge) + Math.max(0, fixedCharge)) / kwh;
}

export function loadFactor(averageKw: number, maximumKw: number): number {
  if (maximumKw <= 0 || averageKw < 0) return 0;
  return Math.min(1, averageKw / maximumKw);
}

export function demandFactor(connectedKw: number, maximumKw: number): number {
  if (connectedKw <= 0 || maximumKw < 0) return 0;
  return maximumKw / connectedKw;
}

export function utilization(actualHours: number, availableHours: number): number {
  if (availableHours <= 0 || actualHours < 0) return 0;
  return Math.min(1, actualHours / availableHours);
}

export function specificEnergyConsumption(kwh: number, production: number): number {
  if (kwh < 0 || production <= 0) return 0;
  return kwh / production;
}

export function reconciliation(utilityInput: number, endUseTotal: number) {
  const variance = utilityInput - endUseTotal;
  const variancePct = utilityInput > 0 ? variance / utilityInput : 0;
  return { variance, variancePct, withinTolerance: Math.abs(variancePct) <= 0.05 };
}

export function pumpFanSavings(input: { baselineKw: number; speedRatio: number; hours: number; controlsFactor?: number }) {
  const ratio = Math.max(0, Math.min(1, input.speedRatio));
  const factor = Math.max(0, Math.min(1, input.controlsFactor ?? 1));
  const baseline = Math.max(0, input.baselineKw) * Math.max(0, input.hours);
  const proposed = baseline * Math.pow(ratio, 3) * factor;
  return { baselineKwh: baseline, proposedKwh: proposed, savingsKwh: Math.max(0, baseline - proposed) };
}

export function lightingSavings(input: { fixtures: number; watts: number; proposedWatts: number; hours: number; controlsFactor?: number }) {
  const count = Math.max(0, input.fixtures);
  const hours = Math.max(0, input.hours);
  const control = Math.max(0, Math.min(1, input.controlsFactor ?? 1));
  const baseline = count * Math.max(0, input.watts) * hours / 1000;
  const proposed = count * Math.max(0, input.proposedWatts) * hours / 1000 * control;
  return { baselineKwh: baseline, proposedKwh: proposed, savingsKwh: Math.max(0, baseline - proposed) };
}

export function simplePayback(capex: number, annualSavings: number): number | null {
  if (capex < 0 || annualSavings <= 0) return null;
  return capex / annualSavings;
}

export function npv(cashFlows: number[], discountRate: number): number {
  if (discountRate <= -1) return Number.NaN;
  return cashFlows.reduce((total, flow, year) => total + flow / Math.pow(1 + discountRate, year), 0);
}

export function irr(cashFlows: number[]): number | null {
  if (cashFlows.length < 2 || !cashFlows.some((flow) => flow < 0) || !cashFlows.some((flow) => flow > 0)) return null;
  let rate = 0.1;
  for (let i = 0; i < 100; i += 1) {
    const value = npv(cashFlows, rate);
    const derivative = cashFlows.reduce((total, flow, year) => year === 0 ? total : total - year * flow / Math.pow(1 + rate, year + 1), 0);
    if (!Number.isFinite(value) || !Number.isFinite(derivative) || Math.abs(derivative) < 1e-9) return null;
    const next = rate - value / derivative;
    if (next <= -0.999 || !Number.isFinite(next)) return null;
    if (Math.abs(next - rate) < 1e-7) return next;
    rate = next;
  }
  return null;
}

export function solarModel(input: { roofArea: number; exclusions: number; moduleW: number; moduleArea: number; yieldKwhPerKw: number; losses: number; selfConsumption: number; capex: number; annualOm: number; tariff: number; life: number; discountRate: number; degradation: number }) {
  const usableArea = Math.max(0, input.roofArea - input.exclusions);
  const capacityKw = input.moduleArea > 0 ? usableArea / input.moduleArea * Math.max(0, input.moduleW) / 1000 : 0;
  const generation = capacityKw * Math.max(0, input.yieldKwhPerKw) * (1 - Math.max(0, Math.min(1, input.losses)));
  const selfConsumed = generation * Math.max(0, Math.min(1, input.selfConsumption));
  const exported = Math.max(0, generation - selfConsumed);
  const annualBenefit = selfConsumed * Math.max(0, input.tariff) + exported * Math.max(0, input.tariff) * 0.7;
  const flows = [-Math.max(0, input.capex), ...Array.from({ length: Math.max(0, input.life) }, (_, year) => annualBenefit * Math.pow(1 - Math.max(0, input.degradation), year) - Math.max(0, input.annualOm))];
  const annualNet = flows[1] ?? 0;
  return { usableArea, capacityKw, generation, selfConsumed, exported, annualBenefit, payback: simplePayback(input.capex, annualNet), npv: npv(flows, Math.max(0, input.discountRate)), irr: irr(flows), lcoe: flows.length > 1 && generation > 0 ? input.capex / (generation * input.life) : null, flows };
}

export function scopeEmissions(input: { electricityKwh: number; dieselLitres: number; gasKwh: number; solarKwh: number }) {
  const grid = Math.max(0, input.electricityKwh - Math.max(0, input.solarKwh));
  return { scope1: Math.max(0, input.dieselLitres) * 2.68 + Math.max(0, input.gasKwh) * 0.202, scope2: grid * 0.708, avoided: Math.max(0, input.solarKwh) * 0.708 };
}
