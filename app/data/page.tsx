import Link from "next/link";
import { Database, FileCheck2, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { CardHeader, PageHeader, StatusPill } from "@/components/ui";
import { ImportPanel } from "@/components/import-panel";

export default function DataPage() {
  return <div className="content">
    <PageHeader eyebrow="Evidence / imports" title="Data that can stand up to review." description="Bring utility bills and asset registers into a safe, inspectable validation flow. Every batch keeps its source, warnings, and calculation lineage." actions={<Link className="btn primary" href="#upload"><FileSpreadsheet className="svg-icon" /> Go to import</Link>} />
    <div className="grid three"><div className="card"><FileCheck2 className="svg-icon" style={{color:"var(--cyan)"}} /><h3 style={{marginTop:17}}>Bills & readings</h3><p className="card-subtitle">12 bills · 7 days interval sample · 15-minute resolution</p><StatusPill tone="good">Validated</StatusPill></div><div className="card"><Database className="svg-icon" style={{color:"var(--iris)"}} /><h3 style={{marginTop:17}}>Asset register</h3><p className="card-subtitle">9 equipment records · 4 linked evidence packs</p><StatusPill tone="cyan">In sync</StatusPill></div><div className="card"><ShieldCheck className="svg-icon" style={{color:"var(--pale)"}} /><h3 style={{marginTop:17}}>Quality gate</h3><p className="card-subtitle">3 warnings · no blocking errors · Grade B completeness</p><StatusPill tone="warn">Review needed</StatusPill></div></div>
    <div id="upload" className="section"><ImportPanel /></div>
    <div className="card section"><CardHeader title="Recent import batches" subtitle="Tenant-scoped demo records · immutable source metadata" /><table className="mini-table"><thead><tr><th>Batch</th><th>Source</th><th>Rows</th><th>Imported by</th><th className="right">Status</th></tr></thead><tbody><tr><td className="mono-value">IMP-2026-011</td><td>FY25–26 utility bills</td><td>12 accepted</td><td>Ananya Rao · 18 Jun 2026</td><td className="right"><StatusPill tone="good">Committed</StatusPill></td></tr><tr><td className="mono-value">IMP-2026-008</td><td>Main incomer interval export</td><td>672 accepted · 4 warnings</td><td>System · 12 Jun 2026</td><td className="right"><StatusPill tone="warn">Review</StatusPill></td></tr></tbody></table></div>
  </div>;
}
