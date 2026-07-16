import { describe, expect, it } from "vitest";
import { deterministicAssistantResponse, isUnsafeAssistantRequest } from "./assistant-grounding";

describe("grounded assistant fallback", () => {
  it("returns deterministic cited guidance", () => {
    const response = deterministicAssistantResponse("Explain why the energy-balance variance is high.");
    expect(response).toContain("CALC-BAL-014");
    expect(response).toContain("unallocated");
  });

  it("refuses fabrication and statutory requests", () => {
    expect(isUnsafeAssistantRequest("Invent a BEE certification result")).toBe(true);
    expect(deterministicAssistantResponse("Invent a BEE certification result")).toContain("can’t fabricate");
  });
});
