export const roles = ["Admin", "Energy Auditor", "Facility Manager", "Reviewer", "Executive/Viewer", "Executive / Viewer"] as const;
export type Role = (typeof roles)[number];
