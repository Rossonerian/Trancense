"use client";

import { useState } from "react";
import { ArrowUp, Bot, FileSearch, ShieldAlert } from "lucide-react";
import { assistantPrompts } from "@/lib/assistant-grounding";
import { energyBalance, evidence } from "@/lib/demo-data";
import { ProvenanceLine, StatusPill } from "./ui";

type AssistantReply = { text: string; mode: "provider" | "demo"; provider: string; model: string | null; label: string };

export function AssistantPanel() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<AssistantReply | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function ask(value: string) {
    const clean = value.trim();
    if (!clean || loading) return;
    setPrompt(clean); setLoading(true); setError("");
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: clean }) });
      const data = await response.json() as AssistantReply & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Assistant request failed");
      setReply(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Assistant request failed"); }
    finally { setLoading(false); }
  }
  return <><div className="card" style={{background:"linear-gradient(135deg,#262439,#2e2e2e 58%,#23333a)"}}><div className="kicker" style={{color:"var(--pale)"}}>Grounded provider boundary</div><h2 style={{fontSize:24,marginTop:10}}>Ask from the evidence, not around it.</h2><p className="card-subtitle" style={{maxWidth:620}}>The deterministic fallback is always available. Optional providers may explain approved evidence, but they cannot author authoritative energy, financial, carbon, tariff, compliance, or savings values.</p><div className="prompt-chips">{assistantPrompts.map((item) => <button className="chip" key={item} onClick={() => ask(item)}>{item}</button>)}</div><div style={{display:"flex",gap:8}}><input className="input" style={{flex:1}} placeholder="Ask a grounded question…" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void ask(prompt); }} /><button className="btn primary" aria-label="Ask assistant" disabled={loading} onClick={() => void ask(prompt)}><ArrowUp className="svg-icon" /></button></div>{error ? <p className="footer-note" style={{color:"#f4a2a2",marginTop:10}}>{error}</p> : null}</div>{reply ? <div className="card section"><div className="card-header"><div><div className="kicker">{reply.label}</div><h2 style={{marginTop:8}}>{reply.text}</h2></div><Bot className="svg-icon" style={{color:"var(--iris)"}} /></div><div className="grid three" style={{marginTop:22}}><div><div className="kicker">Calculations</div><div className="source-line"><span>CALC-BAL-014</span><span>CALC-ECM-01</span></div></div><div><div className="kicker">Evidence</div><div className="source-line"><span>EV-0307</span><span>{evidence[2].id}</span></div></div><div><div className="kicker">Provider</div><StatusPill tone={reply.mode === "provider" ? "iris" : "cyan"}>{reply.provider}{reply.model ? ` · ${reply.model}` : " · deterministic"}</StatusPill></div></div><ProvenanceLine source={{sourceId:"ASSIST-API-01",unit:"grounded response",status:reply.mode === "provider" ? "AI-described" : "AI-described",confidence:"B",assumptions:["Only seeded calculations and approved evidence are supplied to the provider"],formulaVersion:"assistant-2026.01"}} /></div> : <div className="card section"><div className="empty-note"><FileSearch className="svg-icon" style={{color:"var(--cyan)",verticalAlign:"middle",marginRight:8}} /> Choose a prompt to see citations, assumptions, calculation IDs, and guardrail language.</div></div>}<div className="card section"><div className="alert"><ShieldAlert className="svg-icon" style={{color:"#f4ad56"}} /><div><strong>Guardrail active</strong><span>Requests for statutory certification, legal compliance conclusions, automatic equipment control, or invented evidence are refused.</span></div></div><div className="footer-note">Balance context: {(energyBalance.variancePct * 100).toFixed(1)}% variance · {evidence.length} seeded evidence records</div></div></>;
}
