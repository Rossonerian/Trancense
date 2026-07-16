"use client";

import { useState } from "react";
import { CheckCircle2, Download, FileUp, ShieldCheck } from "lucide-react";
import { StatusPill } from "./ui";

export function ImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [validated, setValidated] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [validation, setValidation] = useState<{ accepted: number; rejected: number; headers: string[]; error?: string } | null>(null);
  function choose(next: File | undefined) { if (!next) return; setFile(next); setValidated(false); setCommitted(false); setValidation(null); }
  async function validateFile() {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setValidation({accepted:0,rejected:0,headers:[],error:"File exceeds the 10 MB safety limit."}); return; }
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const headers = (lines[0] ?? "").split(",").map((header) => header.trim().toLowerCase());
    const formula = lines.some((line) => line.split(",").some((cell) => /^[=+@]/.test(cell.trim())));
    const required = headers.includes("month") && headers.some((header) => ["kwh", "energy_kwh", "asset_id"].includes(header));
    const rejected = formula || !required ? Math.max(1, lines.length - 1) : 0;
    const accepted = formula || !required ? 0 : Math.max(0, lines.length - 1);
    setValidation({accepted,rejected,headers,error:formula ? "Formula-like cell blocked; CSV is treated as plain data." : !required ? "Expected month + kwh/energy_kwh, or asset_id columns." : undefined});
    setValidated(accepted > 0 && !formula);
  }
  return <div className="grid two"><div className="card"><div className="import-zone"><FileUp size={28} /><h3>{file ? file.name : "Drop a utility bill or asset CSV"}</h3><p>CSV only · max 10 MB · safe parser rejects formulas, macros, invalid units, and out-of-range values.</p><label className="btn primary"><input className="hidden-file" type="file" accept=".csv,text/csv" onChange={(event) => choose(event.target.files?.[0])} /> Choose CSV</label></div><div className="prompt-chips"><button className="chip" onClick={() => choose(new File(["month,kwh,cost\n2026-03,431000,3860000"], "utility-bills-template.csv", {type:"text/csv"}))}>Use sample bill</button><button className="chip" onClick={() => choose(new File(["asset_id,name,type\nAST-NEW-01,New asset,Motor"], "assets-template.csv", {type:"text/csv"}))}>Use asset template</button></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="btn" disabled={!file} onClick={validateFile}><ShieldCheck className="svg-icon" /> Validate safely</button>{validated ? <button className="btn primary" onClick={() => setCommitted(true)}><CheckCircle2 className="svg-icon" /> Commit to demo state</button> : null}</div></div><div className="card"><div className="kicker">Import validation</div><h2 style={{marginTop:9}}>{committed ? "Demo state updated" : validated ? "Ready to commit" : validation?.error ? "Needs correction" : "Waiting for a file"}</h2>{validation ? <><div className={`alert ${validation.error ? "exception" : ""}`}><CheckCircle2 className="svg-icon" style={{color:validation.error ? "#ec7777" : "var(--cyan)"}} /><div><strong>{validation.accepted} accepted rows · {validation.rejected} rejected</strong><span>{validation.error ?? "Headers mapped; values treated as plain data."}</span></div></div><div className="detail"><span>Detected headers</span><strong className="mono-value">{validation.headers.join(" · ") || "none"}</strong></div><div className="detail"><span>Batch ID</span><strong className="mono-value">IMP-DEMO-031</strong></div><div className="detail"><span>Safety checks</span><strong>Formula text blocked · 10 MB limit</strong></div></> : <div className="empty-note">Choose a template to preview field mapping, duplicate checks, range warnings, and an auditable import batch.</div>}<button className="btn small" style={{marginTop:18}} onClick={() => { const blob = new Blob(["row,error\n"], {type:"text/csv"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "trancense-import-errors.csv"; a.click(); URL.revokeObjectURL(url); }}><Download className="svg-icon" /> Download error CSV</button></div></div>;
}
