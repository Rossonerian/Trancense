"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter(); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false); const [checking, setChecking] = useState(true); const [hasRecoverySession, setHasRecoverySession] = useState(false);
  useEffect(() => {
    let mounted = true;
    const locationParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const linkError = locationParams.get("error") || hashParams.get("error") || locationParams.get("error_code") || hashParams.get("error_code");
    if (linkError) {
      const timer = window.setTimeout(() => { if (mounted) { setError("This password reset link has expired or has already been used. Request a new reset link."); setChecking(false); } }, 0);
      return () => { mounted = false; window.clearTimeout(timer); };
    }
    try {
      const client = getSupabaseBrowserClient();
      const { data: listener } = client.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        if (event === "PASSWORD_RECOVERY" || session) { setHasRecoverySession(true); setChecking(false); }
      });
      void client.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        setHasRecoverySession(Boolean(session));
        setChecking(false);
        if (!session) setError("This password reset link is invalid or expired. Request a new reset link.");
      }).catch(() => { if (mounted) { setChecking(false); setError("Unable to validate this password reset link."); } });
      return () => { mounted = false; listener.subscription.unsubscribe(); };
    } catch {
      const timer = window.setTimeout(() => { if (mounted) { setChecking(false); setError("Supabase authentication is not configured for password recovery."); } }, 0);
      return () => { mounted = false; window.clearTimeout(timer); };
    }
  }, []);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); if (password.length < 8 || password !== confirm) { setError(password.length < 8 ? "Password must be at least 8 characters." : "Passwords do not match."); return; } setLoading(true); try { const { error: authError } = await getSupabaseBrowserClient().auth.updateUser({ password }); if (authError) throw authError; setMessage("Password updated. You can now continue to your workspace."); setTimeout(() => { router.push("/overview"); router.refresh(); }, 500); } catch (caught) { setError(caught instanceof Error ? caught.message : "This reset link is invalid or expired."); } finally { setLoading(false); } }
  return <form onSubmit={submit} className="auth-form"><div><div className="kicker">Account recovery</div><h1>Choose a new password</h1><p className="auth-copy">Use at least 8 characters. Reset links expire according to your Supabase Auth settings.</p></div>{checking && <div className="empty-note" role="status">Validating your recovery link…</div>}{error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status">{message}</div>}<label>New password<input className="input" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} disabled={!hasRecoverySession || checking} /></label><label>Confirm password<input className="input" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} disabled={!hasRecoverySession || checking} /></label><button className="btn primary auth-submit" disabled={loading || checking || !hasRecoverySession}>{loading ? "Updating…" : "Update password"}</button><div className="auth-links"><Link href="/login">Back to sign in</Link><Link href="/forgot-password">Request another reset link</Link></div></form>;
}
