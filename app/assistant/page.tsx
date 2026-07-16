import { Bot, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { AssistantPanel } from "@/components/assistant-panel";

export default function AssistantPage() { return <div className="content"><PageHeader eyebrow="Decision support / assistant" title="A calm layer over the audit." description="Use the assistant to explain approved calculations, summarize evidence, and draft review language—with every material claim still traceable." actions={<div className="demo-badge"><Sparkles className="svg-icon" /> deterministic fallback</div>} /><AssistantPanel /></div>; }
