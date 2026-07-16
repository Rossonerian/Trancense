"use client";

import type { ECM } from "@/lib/types";

export function RankingChart({ items }: { items: ECM[] }) {
  const top = [...items].sort((a, b) => b.costSavings / Math.max(0.1, a.payback) - a.costSavings / Math.max(0.1, b.payback)).slice(0, 5);
  const max = Math.max(...top.map((item) => item.costSavings));
  return <div>{top.map((item) => <div className="bar-row" key={item.id}><div className="bar-label">{item.title.replace("Rooftop PV · ", "PV · ")}</div><div className="bar-track"><div className="bar-fill" style={{width:`${item.costSavings/max*100}%`,background:item.id === "ECM-06" ? "var(--orchid)" : "var(--iris)"}} /></div><div className="bar-value">₹{(item.costSavings/100000).toFixed(1)}L</div></div>)}</div>;
}
