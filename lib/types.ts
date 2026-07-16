export type EvidenceStatus = "measured" | "calculated" | "estimated" | "assumed" | "AI-described";
export type Confidence = "A" | "B" | "C" | "D";
export type ECMStatus = "Identified" | "Screened" | "Approved" | "In progress";

export type Provenance = {
  sourceId: string;
  period?: string;
  unit: string;
  status: EvidenceStatus;
  confidence: Confidence;
  assumptions: string[];
  formulaVersion: string;
};

export type Metric = { value: number; display: string; provenance: Provenance };

export type MonthlyPoint = {
  month: string;
  electricity: number;
  diesel: number;
  gas: number;
  solar: number;
  cost: number;
  production: number;
};

export type Asset = {
  id: string;
  name: string;
  kind: string;
  system: string;
  location: string;
  rating: string;
  age: number;
  hours: number;
  criticality: "High" | "Medium" | "Low";
  health: number;
  status: "Operating" | "Needs review" | "Standby";
  confidence: Confidence;
  note: string;
};

export type ECM = {
  id: string;
  title: string;
  system: string;
  observation: string;
  action: string;
  savingsKwh: number;
  costSavings: number;
  carbon: number;
  capexLow: number;
  capexHigh: number;
  payback: number;
  confidence: Confidence;
  effort: number;
  risk: "Low" | "Medium" | "High";
  status: ECMStatus;
  interactionGroup?: string;
  mv: string;
  owner: string;
  provenance: Provenance;
};

export type Audit = {
  id: string;
  name: string;
  level: string;
  period: string;
  state: string;
  completeness: number;
  owner: string;
  reviewer: string;
  boundary: string;
  purpose: string;
};
