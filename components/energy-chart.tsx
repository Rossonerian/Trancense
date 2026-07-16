"use client";

import { useState } from "react";
import type { MonthlyPoint } from "@/lib/types";

export function EnergyTrendChart({ data }: { data: MonthlyPoint[] }) {
  const [mode, setMode] = useState<"energy" | "cost">("energy");
  const values = data.map((item) => mode === "energy" ? item.electricity / 1000 : item.cost / 100000);
  const max = Math.max(...values) * 1.12;
  const points = values.map((value, i) => `${i * 55 + 18},${220 - value / max * 175}`).join(" ");
  return <><div className="card-header"><div><h2 className="card-title">Energy and cost trend</h2><p className="card-subtitle">Twelve-month utility performance · FY25–26</p></div><div className="filters" style={{marginBottom:0}}><button className={`btn small ${mode === "energy" ? "primary" : ""}`} onClick={() => setMode("energy")}>Energy</button><button className={`btn small ${mode === "cost" ? "primary" : ""}`} onClick={() => setMode("cost")}>Cost</button></div></div><div className="legend"><span><i /> {mode === "energy" ? "Electricity · MWh" : "Utility cost · ₹L"}</span><span><i className="dashed" /> baseline</span></div><div className="chart-wrap"><svg className="chart-svg" viewBox="0 0 650 250" role="img" aria-label={`${mode} trend chart`} preserveAspectRatio="none"><line className="gridline" x1="18" y1="45" x2="622" y2="45" /><line className="gridline" x1="18" y1="102" x2="622" y2="102" /><line className="gridline" x1="18" y1="159" x2="622" y2="159" /><line className="gridline" x1="18" y1="220" x2="622" y2="220" /><polyline className="line-cost" points="18,122 622,122" /><polyline className="line-electricity" points={points} />{values.map((value, i) => <circle key={data[i].month} className="chart-dot" cx={i * 55 + 18} cy={220 - value / max * 175} r="3.5" />)}{data.map((item, i) => <text key={item.month} className="axis" x={i * 55 + 18} y="243" textAnchor="middle">{item.month}</text>)}</svg></div></>;
}
