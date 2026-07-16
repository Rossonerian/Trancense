import type { WorkspaceSnapshot } from "./data-access";

export const assistantPrompts = ["Explain why the energy-balance variance is high.", "Summarize the top three ECMs for management.", "What evidence is missing before the pump VFD ECM is investment-grade?", "Draft the executive summary from approved calculations."];

export function buildGroundedContext(snapshot: WorkspaceSnapshot) {
  const audit = snapshot.audit ? `Audit: ${snapshot.audit.name}; period ${snapshot.audit.period}; state ${snapshot.audit.state}.` : "Audit: no audit record exists for this organization.";
  const electricity = snapshot.monthly.reduce((sum, row) => sum + row.electricity, 0);
  const allocated = snapshot.endUses.reduce((sum, row) => sum + row.value, 0);
  const balance = snapshot.endUses.length ? `Energy balance: utility input ${electricity} kWh; persisted end-use allocation ${allocated} kWh; unallocated ${electricity - allocated} kWh; source CALC-BAL-014 where present.` : "Energy balance: no persisted bottom-up allocation is available; do not infer a variance.";
  const ecmText = snapshot.ecms.length ? snapshot.ecms.slice(0, 7).map((item) => `${item.id} ${item.title}; annual cost savings INR ${item.costSavings}; payback ${item.payback} years; confidence ${item.confidence}; interaction ${item.interactionGroup ?? "none"}`).join(" | ") : "No ECM records exist for this organization.";
  const evidenceText = snapshot.evidence.length ? snapshot.evidence.map((item) => `${item.id} (${item.status}, Grade ${item.confidence})`).join(", ") : "No evidence records exist for this organization.";
  return [audit, balance, `ECMs: ${ecmText}.`, `Evidence IDs: ${evidenceText}.`, "Guardrail: Use only the supplied authorized records. Never create readings, savings, financial returns, tariffs, emissions, compliance status, or certification claims. Label uncertainty and cite IDs.", `Data source: ${snapshot.source === "demo" ? "explicit local demo seed" : "authenticated Supabase organization records"}.`].join("\n");
}

export function isUnsafeAssistantRequest(prompt: string): boolean {
  return /invent|make up|fabricat|statutory\s+(bee|pat|compliance)|legal\s+compliance|certif(y|ication)|automatic(ally)?\s+(control|operate)|guarantee\s+(saving|return)|another\s+(organization|tenant)|other\s+(customer|tenant)/i.test(prompt);
}

export function deterministicAssistantResponse(prompt: string, snapshot: WorkspaceSnapshot): string {
  if (isUnsafeAssistantRequest(prompt)) return "I can’t fabricate evidence, expose another organization’s data, or provide statutory, legal, certification, or automatic-control conclusions. I can explain authorized calculations and identify the evidence still needed.";
  if (snapshot.source === "supabase" && !snapshot.monthly.length && !snapshot.ecms.length && !snapshot.evidence.length) return "There are no authorized audit records in this organization yet. Create a site, audit, and evidence records before asking for an engineering summary. I will not invent missing values.";
  const lower = prompt.toLowerCase();
  const electricity = snapshot.monthly.reduce((sum, row) => sum + row.electricity, 0);
  const allocated = snapshot.endUses.reduce((sum, row) => sum + row.value, 0);
  if (lower.includes("variance")) {
    if (!snapshot.endUses.length) return "I cannot explain an energy-balance variance because this organization has no persisted bottom-up allocation. Add validated end-use or calculation records first. Sources: persisted utility bills only.";
    return `The current records show ${(electricity / 1000000).toFixed(2)} GWh of utility input and ${(allocated / 1000000).toFixed(2)} GWh allocated to end uses. The remaining ${((electricity - allocated) / 1000).toFixed(0)} MWh is unallocated, not a measured-loss conclusion. Validate submeter coverage and schedule factors before treating it as an engineering conclusion. Sources: CALC-BAL-014 where present.`;
  }
  if (lower.includes("top three")) {
    const top = [...snapshot.ecms].sort((a, b) => a.payback - b.payback).slice(0, 3);
    if (!top.length) return "No ECM records are available for this organization. Create an evidence-backed observation before ranking opportunities.";
    return `The shortest current screened paybacks are ${top.map((item) => `${item.title} (${item.payback.toFixed(2)} years)`).join(", ")}. Treat these as persisted screening records, not an approved business case. Sources: ${top.map((item) => item.id).join(", ")}.`;
  }
  if (lower.includes("pump")) return "Before a pump VFD measure is investment-grade, collect a longer flow/differential-pressure/kW baseline, confirm the critical index, validate operating hours, and document the control sequence. Do not fill gaps with estimates. Sources: the authorized ECM and linked evidence records, when present.";
  return `The authorized workspace contains ${snapshot.monthly.length} billing periods, ${snapshot.ecms.length} ECM records, and ${snapshot.evidence.length} evidence records. I can summarize those records, but I will not create missing engineering values. Sources: persisted record IDs and calculation citations attached to the workspace.`;
}
