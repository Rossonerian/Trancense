"use client";

import { useState } from "react";
import { FileCheck2 } from "lucide-react";

export function SaveReportSnapshotButton({ auditId, payload }: { auditId: string; payload: Record<string, unknown> }) { const [message, setMessage] = useState(""); const [saving, setSaving] = useState(false); async function save() { setSaving(true); setMessage(""); const response = await fetch("/api/report-snapshots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ auditId, snapshotCode: `REPORT-${Date.now()}`, payload }) }); const result = await response.json() as { error?: string; data?: { snapshot_code: string } }; setMessage(response.ok ? `Saved ${result.data?.snapshot_code ?? "snapshot"}` : result.error ?? "Unable to save snapshot."); setSaving(false); } return <div style={{ display: "flex", alignItems: "center", gap: 8 }}><button className="btn" onClick={() => void save()} disabled={saving}><FileCheck2 className="svg-icon" /> {saving ? "Saving…" : "Save snapshot"}</button>{message && <span className="card-subtitle" role="status">{message}</span>}</div>; }
