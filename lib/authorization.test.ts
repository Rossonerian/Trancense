import { describe, expect, it } from "vitest";
import { canManageMembers, canReview, canWrite } from "./authorization";

describe("tenant role capabilities", () => {
  it("keeps viewers read-only and prevents public admin elevation", () => {
    expect(canWrite("Executive/Viewer")).toBe(false);
    expect(canReview("Executive/Viewer")).toBe(false);
    expect(canManageMembers("Executive/Viewer")).toBe(false);
  });

  it("separates operational edits from technical approval", () => {
    expect(canWrite("Facility Manager")).toBe(true);
    expect(canReview("Facility Manager")).toBe(false);
    expect(canReview("Reviewer")).toBe(true);
    expect(canManageMembers("Admin")).toBe(true);
  });
});
