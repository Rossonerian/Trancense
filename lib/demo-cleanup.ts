export const knownDemoSlug = "shakti-precision";
export const demoCleanupTables = ["organization_memberships", "sites", "audits", "assets", "meters", "utility_bills", "calculations", "ecms", "solar_scenarios", "evidence", "audit_events", "report_snapshots", "audit_boundaries", "audit_versions", "meter_readings", "production_records", "tariffs", "emission_factors", "evidence_items", "import_batches", "import_rows", "validation_findings", "calculation_runs", "calculation_results", "ecm_interactions", "mv_plans", "workflow_transitions", "approvals", "comments", "citations"] as const;

export function purgeFlagIsExplicit(value: string | undefined) {
  return value === "true";
}
