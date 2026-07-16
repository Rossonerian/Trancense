import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getDataMode } from "@/lib/runtime-config";

export default function SignupPage() { return <AuthShell><SignupForm demoMode={getDataMode() === "demo"} /></AuthShell>; }
