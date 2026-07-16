import { describe, expect, it } from "vitest";
import { demandFactor, effectiveTariff, irr, lightingSavings, loadFactor, npv, pumpFanSavings, reconciliation, simplePayback, solarModel, specificEnergyConsumption } from "./calculations";

describe("energy calculations", () => {
  it("handles safe zero and negative inputs", () => {
    expect(loadFactor(450, 900)).toBe(0.5);
    expect(loadFactor(450, 0)).toBe(0);
    expect(demandFactor(1000, 500)).toBe(0.5);
    expect(specificEnergyConsumption(100, 0)).toBe(0);
    expect(effectiveTariff(100, 20, 10, 0)).toBe(0);
  });

  it("reconciles an energy balance using a five percent tolerance", () => {
    expect(reconciliation(1000, 960).withinTolerance).toBe(true);
    expect(reconciliation(1000, 900).withinTolerance).toBe(false);
    expect(reconciliation(0, 0).variancePct).toBe(0);
  });

  it("calculates equipment savings with physical relationships", () => {
    const pump = pumpFanSavings({ baselineKw: 30, speedRatio: 0.8, hours: 4000 });
    expect(pump.savingsKwh).toBeGreaterThan(0);
    const lighting = lightingSavings({ fixtures: 400, watts: 180, proposedWatts: 90, hours: 3000, controlsFactor: 0.9 });
    expect(lighting.savingsKwh).toBeGreaterThan(20000);
  });

  it("protects payback and finance functions from invalid cases", () => {
    expect(simplePayback(100, 0)).toBeNull();
    expect(simplePayback(1000, 250)).toBe(4);
    expect(npv([-100, 60, 60], 0.1)).toBeCloseTo(4.13, 1);
    expect(irr([-100, 60, 60])).toBeCloseTo(0.1307, 3);
    expect(irr([100, 20])).toBeNull();
  });

  it("models solar degradation and a bounded generation scenario", () => {
    const base = solarModel({ roofArea: 2600, exclusions: 380, moduleW: 540, moduleArea: 2.6, yieldKwhPerKw: 1450, losses: 0.16, selfConsumption: 0.82, capex: 11200000, annualOm: 150000, tariff: 8.35, life: 25, discountRate: 0.1, degradation: 0.005 });
    const noLosses = solarModel({ roofArea: 2600, exclusions: 380, moduleW: 540, moduleArea: 2.6, yieldKwhPerKw: 1450, losses: 0, selfConsumption: 0.82, capex: 11200000, annualOm: 150000, tariff: 8.35, life: 25, discountRate: 0.1, degradation: 0.005 });
    expect(base.capacityKw).toBeCloseTo(461.08, 1);
    expect(noLosses.generation).toBeGreaterThan(base.generation);
    expect(base.flows).toHaveLength(26);
  });
});
