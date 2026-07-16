import { describe, expect, it } from "vitest";
import { knownDemoSlug, purgeFlagIsExplicit } from "./demo-cleanup";

describe("guarded demo cleanup", () => {
  it("requires the explicit safety flag", () => {
    expect(purgeFlagIsExplicit(undefined)).toBe(false);
    expect(purgeFlagIsExplicit("false")).toBe(false);
    expect(purgeFlagIsExplicit("true")).toBe(true);
    expect(knownDemoSlug).toBe("shakti-precision");
  });
});
