import { Database } from "lucide-react";

export function WorkspaceDataError({ message }: { message: string }) {
  return <div className="content"><div className="card"><Database className="svg-icon" style={{ color: "var(--cyan)" }} /><h1 style={{ marginTop: 16 }}>Workspace data is unavailable</h1><p className="auth-copy">{message}</p><p className="empty-note">No demo records were loaded. Check Supabase configuration, session status, and organization membership, then refresh.</p></div></div>;
}
