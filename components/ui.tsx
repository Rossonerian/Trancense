import { ArrowUpRight, CheckCircle2, CircleAlert, Info, Minus, TrendingUp } from "lucide-react";
import type { Provenance } from "@/lib/types";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{actions ? <div className="heading-actions">{actions}</div> : null}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="card-header"><div><h2 className="card-title">{title}</h2>{subtitle ? <p className="card-subtitle">{subtitle}</p> : null}</div>{action}</div>;
}

export function MetricCard({ label, value, detail, tone = "default", provenance: source }: { label: string; value: string; detail: string; tone?: "default" | "inverted"; provenance?: Provenance }) {
  return <div className={`card metric-card ${tone === "inverted" ? "inverted" : ""}`}><div><div className="kicker">{label}</div><div className="metric-value">{value}</div></div><div className="metric-foot"><TrendingUp className="svg-icon trend-up" />{detail}</div>{source ? <div className="source-line"><span>{source.formulaVersion}</span> {source.sourceId} · {source.status}</div> : null}</div>;
}

export function StatusPill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "iris" | "cyan" | "warn" | "good" | "orchid" }) { return <span className={`pill ${tone}`}>{children}</span>; }
export function ConfidencePill({ grade }: { grade: string }) { return <StatusPill tone={grade === "A" ? "good" : grade === "B" ? "cyan" : grade === "C" ? "warn" : "default"}>Grade {grade}</StatusPill>; }
export function ProvenanceLine({ source }: { source: Provenance }) { return <div className="source-line"><span>{source.sourceId}</span><span>{source.formulaVersion}</span><span>{source.status}</span><span>{source.unit}</span><span>{source.period ?? "FY25–26"}</span></div>; }
export function Signal({ type = "info", children }: { type?: "info" | "warning" | "good"; children: React.ReactNode }) { const Icon = type === "warning" ? CircleAlert : type === "good" ? CheckCircle2 : Info; return <div className={`alert ${type === "warning" ? "warning" : ""}`}><Icon className="svg-icon" /><span>{children}</span></div>; }
export function MiniBar({ value, max, color = "var(--iris)" }: { value: number; max: number; color?: string }) { return <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(100, max ? value / max * 100 : 0)}%`, background: color }} /></div>; }
export function ArrowAction({ children }: { children: React.ReactNode }) { return <span className="btn small">{children}<ArrowUpRight className="svg-icon" /></span>; }
export function Delta({ children }: { children: React.ReactNode }) { return <span className="trend-up"><TrendingUp className="svg-icon" /> {children}</span>; }
export function NeutralDelta({ children }: { children: React.ReactNode }) { return <span style={{color:"var(--ash)"}}><Minus className="svg-icon" /> {children}</span>; }
