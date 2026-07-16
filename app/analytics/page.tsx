import { CircleAlert } from "lucide-react";
import { PageHeader, Signal } from "@/components/ui";
import { AnalyticsPanel } from "@/components/analytics-panel";

export default function AnalyticsPage() {
  return <div className="content"><PageHeader eyebrow="Performance / analytics" title="Find the pattern behind the bill." description="Electricity, demand, production, and benchmark context in one engineering view. Change the lens without changing the underlying evidence." /><Signal type="warning"><strong>Benchmark guardrail:</strong> A benchmark without facility type, climate, operating hours, geography, production driver, and completeness metadata is not a valid engineering conclusion.</Signal><div className="section"><AnalyticsPanel /></div><div className="card section"><div className="card-header"><div><h2 className="card-title">Data-quality note</h2><p className="card-subtitle">Interval sample is sufficient for screening, not a full-year M&V baseline.</p></div><CircleAlert className="svg-icon" style={{color:"#f4ad56"}} /></div><p className="empty-note" style={{paddingBottom:0}}>Weekday/weekend profile and shift comparison use 672 seeded readings across 7 days. Gap, overlap, and meter-reset checks pass for the sample; the compressed-air submeter has a 17-hour gap called out in the evidence register.</p></div></div>;
}
