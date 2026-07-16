import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";

export default function LoginPage() { return <AuthShell><Suspense fallback={<div className="empty-note">Loading sign-in…</div>}><LoginForm /></Suspense></AuthShell>; }
