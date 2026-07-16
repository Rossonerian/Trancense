"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter(); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); if (password.length < 8 || password !== confirm) { setError(password.length < 8 ? "Password must be at least 8 characters." : "Passwords do not match."); return; } setLoading(true); try { const { error: authError } = await getSupabaseBrowserClient().auth.updateUser({ password }); if (authError) throw authError; setMessage("Password updated. You can now continue to your workspace."); setTimeout(() => { router.push("/overview"); router.refresh(); }, 500); } catch (caught) { setError(caught instanceof Error ? caught.message : "This reset link is invalid or expired."); } finally { setLoading(false); } }
  return <form onSubmit={submit} className="auth-form"><div><div className="kicker">Account recovery</div><h1>Choose a new password</h1><p className="auth-copy">Use at least 8 characters. Reset links expire according to your Supabase Auth settings.</p></div>{error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status">{message}</div>}<label>New password<input className="input" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><label>Confirm password<input className="input" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label><button className="btn primary auth-submit" disabled={loading}>{loading ? "Updating…" : "Update password"}</button><div className="auth-links"><Link href="/login">Back to sign in</Link></div></form>;
}
