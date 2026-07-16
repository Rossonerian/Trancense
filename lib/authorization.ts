export const roles = ["Admin", "Energy Auditor", "Facility Manager", "Reviewer", "Executive/Viewer", "Executive / Viewer"] as const;
export type Role = (typeof roles)[number];

export function canWrite(role: Role) { return role === "Admin" || role === "Energy Auditor" || role === "Facility Manager"; }
export function canReview(role: Role) { return role === "Admin" || role === "Reviewer"; }
export function canManageMembers(role: Role) { return role === "Admin"; }
