"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingForm() {
  const router = useRouter();
  const [fields, setFields] = useState({ organizationName: "", siteName: "", region: "", country: "", jobRole: "", phone: "" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const update = (key: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(""); try { const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || "Unable to complete onboarding."); router.push("/overview"); router.refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to complete onboarding."); } finally { setLoading(false); } }
  return <form onSubmit={submit} className="auth-form"><div><div className="kicker">Workspace setup</div><h1>Set up your first workspace</h1><p className="auth-copy">Add your first operating context. Every active workspace member has the same product access; role labels are informational.</p></div>{error && <div className="form-error" role="alert">{error}</div>}<label>Organization / company<input className="input" required value={fields.organizationName} onChange={(event) => update("organizationName", event.target.value)} /></label><div className="form-grid"><label>First site<input className="input" required value={fields.siteName} onChange={(event) => update("siteName", event.target.value)} /></label><label>Region<input className="input" required value={fields.region} onChange={(event) => update("region", event.target.value)} /></label></div><div className="form-grid"><label>Country<input className="input" required value={fields.country} onChange={(event) => update("country", event.target.value)} /></label><label>Job role<input className="input" required value={fields.jobRole} onChange={(event) => update("jobRole", event.target.value)} /></label></div><label>Phone <span className="card-subtitle">optional</span><input className="input" value={fields.phone} onChange={(event) => update("phone", event.target.value)} /></label><button className="btn primary auth-submit" disabled={loading}>{loading ? "Saving workspace…" : "Enter workspace"}</button></form>;
}
