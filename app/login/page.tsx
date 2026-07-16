import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";
import { getDataMode, getMissingSupabaseVariables, isSupabaseConfigured } from "@/lib/runtime-config";

export default function LoginPage() { const supabaseMode = getDataMode() === "supabase"; const configurationMessage = supabaseMode && !isSupabaseConfigured() ? `Supabase authentication is not configured for this deployment. Missing variables: ${getMissingSupabaseVariables().join(", ") || "Supabase configuration"}.` : undefined; return <AuthShell><Suspense fallback={<div className="empty-note">Loading sign-in…</div>}><LoginForm demoMode={!supabaseMode} configurationMessage={configurationMessage} /></Suspense></AuthShell>; }
