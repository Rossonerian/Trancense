import { describe, expect, it } from "vitest";
import { canManageMembers, canReview, canWrite } from "./authorization";

describe("tenant role capabilities", () => {
  it("allows every active member to work with audit and analysis data", () => {
    expect(canWrite("Executive/Viewer")).toBe(true);
    expect(canWrite("Reviewer")).toBe(true);
    expect(canWrite("Facility Manager")).toBe(true);
    expect(canWrite("Energy Auditor")).toBe(true);
    expect(canWrite("Admin")).toBe(true);
  });

  it("keeps governance and membership administration restricted", () => {
    expect(canReview("Executive/Viewer")).toBe(false);
    expect(canManageMembers("Executive/Viewer")).toBe(false);
    expect(canReview("Facility Manager")).toBe(false);
    expect(canManageMembers("Reviewer")).toBe(false);
    expect(canManageMembers("Admin")).toBe(true);
  });

  it("separates audit editing from technical approval", () => {
    expect(canReview("Facility Manager")).toBe(false);
    expect(canReview("Reviewer")).toBe(true);
  });
});
