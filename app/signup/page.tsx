import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getDataMode, getMissingSupabaseVariables, isSupabaseConfigured } from "@/lib/runtime-config";

export default function SignupPage() { const supabaseMode = getDataMode() === "supabase"; const configurationMessage = supabaseMode && !isSupabaseConfigured() ? `Supabase authentication is not configured for this deployment. Missing variables: ${getMissingSupabaseVariables().join(", ") || "Supabase configuration"}.` : undefined; return <AuthShell><SignupForm demoMode={!supabaseMode} configurationMessage={configurationMessage} /></AuthShell>; }
