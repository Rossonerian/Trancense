import { Bot, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { AssistantPanel } from "@/components/assistant-panel";
import { getWorkspaceSnapshot } from "@/lib/data-access";
import { WorkspaceDataError } from "@/components/workspace-data-error";

export default async function AssistantPage() { const snapshot = await getWorkspaceSnapshot(); if (snapshot.configurationError) return <WorkspaceDataError message={snapshot.configurationError} />; return <div className="content"><PageHeader eyebrow="Decision support / assistant" title="A calm layer over the audit." description="Use the assistant to explain approved calculations, summarize evidence, and draft review language—with every material claim still traceable." actions={<div className="demo-badge"><Sparkles className="svg-icon" /> {snapshot.source === "demo" ? "Grounded Demo Response" : "Supabase Data"}</div>} /><AssistantPanel evidenceIds={snapshot.evidence.map((item) => item.id)} dataSource={snapshot.source === "demo" ? "Demo Data" : "Supabase Data"} /></div>; }
