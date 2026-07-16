import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";

export function WorkspaceEmptyState({ title, description, href = "/onboarding", action = "Set up workspace" }: { title: string; description: string; href?: string; action?: string }) {
  return <div className="card empty-state"><Database className="empty-state-icon" /><h2>{title}</h2><p>{description}</p><Link className="btn primary" href={href}>{action}<ArrowRight className="svg-icon" /></Link></div>;
}
