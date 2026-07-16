"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getTrustedAppOrigin } from "@/lib/app-origin";
import { googleOAuthCallbackPath } from "@/lib/google-oauth";
import { authErrorMessage, validatePasswordPair } from "@/lib/auth-errors";
import { GoogleOAuthButton } from "./google-oauth-button";

export function SignupForm({ demoMode = false, configurationMessage }: { demoMode?: boolean; configurationMessage?: string }) {
  const router = useRouter();
  const [fields, setFields] = useState({ fullName: "", organization: "", role: "", country: "India", phone: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false); const [resending, setResending] = useState(false);
  const update = (key: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    const passwordError = validatePasswordPair(fields.password, fields.confirmPassword);
    if (passwordError) { setError(passwordError); return; }
    setLoading(true);
    try {
      const origin = getTrustedAppOrigin({ browserOrigin: window.location.origin });
      const { data, error: authError } = await getSupabaseBrowserClient().auth.signUp({ email: fields.email, password: fields.password, options: { emailRedirectTo: `${origin}${googleOAuthCallbackPath}`, data: { full_name: fields.fullName, organization_name: fields.organization, job_role: fields.role, country: fields.country, phone: fields.phone } } });
      if (authError) throw authError;
      if (data.session) router.push("/onboarding"); else setMessage(`Check ${fields.email} to confirm your account, then return here to sign in.`);
    } catch (caught) { setError(authErrorMessage(caught, "Unable to create the account.")); }
    finally { setLoading(false); }
  }
  async function resend() { setResending(true); setError(""); try { const origin = getTrustedAppOrigin({ browserOrigin: window.location.origin }); const { error: resendError } = await getSupabaseBrowserClient().auth.resend({ type: "signup", email: fields.email, options: { emailRedirectTo: `${origin}${googleOAuthCallbackPath}` } }); if (resendError) throw resendError; setMessage("If the account can receive confirmation mail, a new link has been sent. Use the newest link only once."); } catch (caught) { setError(authErrorMessage(caught, "Unable to request a new confirmation email.")); } finally { setResending(false); } }
  if (demoMode) return <div className="auth-form"><div><div className="kicker">Explicit local demo</div><h1>Demo data is already available</h1><p className="auth-copy">Select <code>DATA_MODE=supabase</code> for real authentication and user-owned workspaces.</p></div><Link className="btn primary auth-submit" href="/overview">Open Demo Data</Link><div className="auth-links"><Link href="/login">Back to sign in</Link></div></div>;
  return <form onSubmit={submit} className="auth-form"><div><div className="kicker">New workspace</div><h1>Create your workspace</h1><p className="auth-copy">Start with the safest viewer permission. You can invite and promote testers from the protected admin area.</p></div><GoogleOAuthButton />{configurationMessage && <div className="form-error" role="alert">{configurationMessage}</div>}{error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status">{message} <Link href="/login">Go to sign in</Link><button type="button" className="btn small" style={{ marginTop: 10 }} disabled={resending} onClick={() => void resend()}>{resending ? "Resending…" : "Resend confirmation"}</button></div>}<div className="form-grid"><label>Full name<input className="input" required value={fields.fullName} onChange={(event) => update("fullName", event.target.value)} /></label><label>Job role<input className="input" required value={fields.role} onChange={(event) => update("role", event.target.value)} /></label></div><label>Organization / company<input className="input" required value={fields.organization} onChange={(event) => update("organization", event.target.value)} /></label><div className="form-grid"><label>Country<input className="input" required value={fields.country} onChange={(event) => update("country", event.target.value)} /></label><label>Phone <span className="card-subtitle">optional</span><input className="input" value={fields.phone} onChange={(event) => update("phone", event.target.value)} /></label></div><label>Email<input className="input" type="email" autoComplete="email" required value={fields.email} onChange={(event) => update("email", event.target.value)} /></label><label>Password <span className="card-subtitle">minimum 8 characters</span><input className="input" type="password" minLength={8} autoComplete="new-password" required value={fields.password} onChange={(event) => update("password", event.target.value)} /></label><label>Confirm password<input className="input" type="password" minLength={8} autoComplete="new-password" required value={fields.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} /></label><button className="btn primary auth-submit" disabled={loading}>{loading ? "Creating…" : "Create account"}</button><div className="auth-links"><span>Already have access? <Link href="/login">Sign in</Link></span></div></form>;
}
