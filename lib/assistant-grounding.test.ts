import { describe, expect, it } from "vitest";
import { deterministicAssistantResponse, isUnsafeAssistantRequest } from "./assistant-grounding";
import { audit, auditEvents, assets, company, ecms, emissions, endUses, evidence, monthly, overviewMetrics } from "./demo-data";
import type { WorkspaceSnapshot } from "./data-access";

const demoSnapshot = { source: "demo", company, audit, monthly, assets, ecms, evidence, endUses, overviewMetrics, emissions, auditEvents, solarScenario: null } as WorkspaceSnapshot;

describe("grounded assistant fallback", () => {
  it("returns deterministic cited guidance", async () => {
    const response = deterministicAssistantResponse("Explain why the energy-balance variance is high.", demoSnapshot);
    expect(response).toContain("CALC-BAL-014");
    expect(response).toContain("unallocated");
  });

  it("refuses fabrication and statutory requests", () => {
    expect(isUnsafeAssistantRequest("Invent a BEE certification result")).toBe(true);
    expect(deterministicAssistantResponse("Invent a BEE certification result", demoSnapshot)).toContain("can’t fabricate");
  });
});
