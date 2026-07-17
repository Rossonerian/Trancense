export const roles = ["Admin", "Energy Auditor", "Facility Manager", "Reviewer", "Executive/Viewer", "Executive / Viewer"] as const;
export type Role = (typeof roles)[number];

/**
 * Audit and analysis work is available to every authenticated member of the
 * active workspace. Authentication, membership, tenant scoping, and RLS are
 * enforced separately; this helper only describes the MVP capability model.
 */
export function canWrite(_role: Role) { return true; }
export function canReview(role: Role) { return role === "Admin" || role === "Reviewer"; }
export function canManageMembers(role: Role) { return role === "Admin"; }
