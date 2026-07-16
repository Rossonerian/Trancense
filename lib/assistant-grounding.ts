import { energyBalance, ecms, evidence } from "./demo-data";

export const assistantPrompts = ["Explain why the energy-balance variance is high.", "Summarize the top three ECMs for management.", "What evidence is missing before the pump VFD ECM is investment-grade?", "Draft the executive summary from approved calculations."];

export function buildGroundedContext() {
  return [
    `Audit: Detailed audit for Pune Plant, FY25-26.`,
    `Energy balance: utility input ${energyBalance.utility} kWh; end-use allocation ${energyBalance.endUse} kWh; unallocated ${energyBalance.unallocated} kWh; variance ${(energyBalance.variancePct * 100).toFixed(1)}%; tolerance 5%; source CALC-BAL-014 / EV-0307.`,
    `ECMs: ${ecms.slice(0, 7).map((item) => `${item.id} ${item.title}; annual cost savings INR ${item.costSavings}; payback ${item.payback} years; confidence ${item.confidence}; interaction ${item.interactionGroup ?? "none"}`).join(" | ")}`,
    `Evidence IDs: ${evidence.map((item) => `${item.id} (${item.status}, Grade ${item.confidence})`).join(", ")}.`,
    "Guardrail: Explain or summarize only these approved/seeded facts. Do not create readings, savings, financial returns, tariffs, emissions, compliance status, or certification claims. Label any response as decision support and cite IDs.",
  ].join("\n");
}

export function isUnsafeAssistantRequest(prompt: string): boolean {
  return /invent|make up|fabricat|statutory\s+(bee|pat|compliance)|legal\s+compliance|certif(y|ication)|automatic(ally)?\s+(control|operate)|guarantee\s+(saving|return)/i.test(prompt);
}

export function deterministicAssistantResponse(prompt: string): string {
  if (isUnsafeAssistantRequest(prompt)) return "I can’t fabricate evidence or provide statutory, legal, certification, or automatic-control conclusions. I can explain approved calculations and identify the evidence still needed. Sources: CALC-BAL-014, EV-0307.";
  if (prompt.toLowerCase().includes("variance")) return `The balance is high because utility input is ${(energyBalance.utility / 1000000).toFixed(2)} GWh while the current bottom-up allocation covers ${(energyBalance.endUse / 1000000).toFixed(2)} GWh. The remaining ${(energyBalance.unallocated / 1000).toFixed(0)} MWh is explicitly unallocated, not a measured loss. Validate submeter coverage and schedule factors before treating it as an engineering conclusion. Sources: CALC-BAL-014, EV-0307.`;
  if (prompt.toLowerCase().includes("top three")) return `For management, the shortest screened paybacks are compressed-air leakage repair, demand management scheduling, and compressor pressure reset. Their current combined screen is about ₹${((ecms[0].costSavings + ecms[4].costSavings + ecms[1].costSavings) / 100000).toFixed(1)}L/year. ECM-01 and ECM-02 share interaction group CA-01, so do not add their savings without a combined model. Sources: CALC-ECM-01, CALC-ECM-05, CALC-ECM-02, EV-0418.`;
  if (prompt.toLowerCase().includes("pump")) return "Before the pump VFD ECM is investment-grade, collect a longer flow/differential-pressure/kW baseline, confirm the critical index, validate operating hours, and document the control sequence. Current evidence is Grade C for the measure and covers 5 of 7 sampled days. Sources: CALC-ECM-03, EV-0307, EV-0520.";
  return `The approved calculation snapshot describes a Detailed audit for Pune Plant covering FY25–26. It reports ${(energyBalance.utility / 1000000).toFixed(2)} GWh of electricity input and keeps the visible balance variance and assumptions attached to the executive narrative. Sources: CALC-ENERGY-AGG-01, CALC-BAL-014, EV-0251.`;
}
