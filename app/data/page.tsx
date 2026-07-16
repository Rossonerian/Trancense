import Link from "next/link";
import { Database, FileCheck2, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { CardHeader, PageHeader, StatusPill } from "@/components/ui";
import { ImportPanel } from "@/components/import-panel";
import { getWorkspaceSnapshot } from "@/lib/data-access";
import { getDataMode } from "@/lib/runtime-config";
import { WorkspaceDataError } from "@/components/workspace-data-error";

export default async function DataPage() {
  const snapshot = await getWorkspaceSnapshot();
  if (snapshot.configurationError) return <WorkspaceDataError message={snapshot.configurationError} />;
  const dataMode = getDataMode();
  return <div className="content"><PageHeader eyebrow="Evidence / imports" title="Data that can stand up to review." description="Bring utility bills and asset registers into a safe, inspectable validation flow. Every batch keeps its source, warnings, and calculation lineage." actions={<Link className="btn primary" href="#upload"><FileSpreadsheet className="svg-icon" /> Go to import</Link>} />
    <div className="grid three"><div className="card"><FileCheck2 className="svg-icon" style={{ color: "var(--cyan)" }} /><h3 style={{ marginTop: 17 }}>Bills & readings</h3><p className="card-subtitle">{snapshot.monthly.length ? `${snapshot.monthly.length} persisted billing periods` : "No utility bills yet"}</p><StatusPill tone={snapshot.monthly.length ? "good" : "warn"}>{snapshot.monthly.length ? "Available" : "Next action"}</StatusPill></div><div className="card"><Database className="svg-icon" style={{ color: "var(--iris)" }} /><h3 style={{ marginTop: 17 }}>Asset register</h3><p className="card-subtitle">{snapshot.assets.length ? `${snapshot.assets.length} persisted equipment records` : "No assets yet"}</p><StatusPill tone={snapshot.assets.length ? "cyan" : "warn"}>{snapshot.assets.length ? "Available" : "Next action"}</StatusPill></div><div className="card"><ShieldCheck className="svg-icon" style={{ color: "var(--pale)" }} /><h3 style={{ marginTop: 17 }}>Quality gate</h3><p className="card-subtitle">Validation findings appear after a real import.</p><StatusPill tone="warn">{dataMode === "supabase" ? "Tenant scoped" : "Demo mode"}</StatusPill></div></div>
    <div id="upload" className="section"><ImportPanel defaultMode={dataMode} /></div>
    <div className="card section"><CardHeader title="Recent import batches" subtitle={dataMode === "supabase" ? "Tenant-scoped persisted records" : "Explicit local demo mode"} />{snapshot.monthly.length || snapshot.assets.length ? <div className="empty-note">Import history is stored in Supabase in persistent mode. Connect a workspace role with write access to see and review batches here.</div> : <div className="empty-note">No import batches exist yet. Choose a CSV above to create the first real batch.</div>}</div>
  </div>;
}
