"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getTrustedAppOrigin } from "@/lib/app-origin";
import { authErrorMessage } from "@/lib/auth-errors";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(""); setMessage(""); try { const origin = getTrustedAppOrigin({ browserOrigin: window.location.origin }); const { error: authError } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` }); if (authError) throw authError; setMessage("If an account exists for that address, a password reset link has been sent. Check your inbox and use the newest link only once."); } catch (caught) { setError(authErrorMessage(caught, "Unable to request a reset link.")); } finally { setLoading(false); } }
  return <form onSubmit={submit} className="auth-form"><div><div className="kicker">Account recovery</div><h1>Reset your password</h1><p className="auth-copy">We’ll send a time-limited link to the email on your account.</p></div>{error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status">{message}</div>}<label>Email<input className="input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><button className="btn primary auth-submit" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</button><div className="auth-links"><Link href="/login">Back to sign in</Link></div></form>;
}
