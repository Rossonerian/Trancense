"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getAuthRecoveryReason, type AuthRecoveryReason } from "@/lib/auth-recovery";
import { getTrustedAppOrigin } from "@/lib/app-origin";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";

const copy: Record<AuthRecoveryReason, { title: string; message: string }> = {
  expired: { title: "This confirmation link has expired or has already been used.", message: "Confirmation links can only be used once. Request a new confirmation email and try again." },
  invalid: { title: "This confirmation link is invalid.", message: "The link may be incomplete or no longer valid. Request a fresh confirmation email and try again." },
  missing_code: { title: "This confirmation link is incomplete.", message: "Open the newest confirmation email, or request a fresh link below." },
  exchange_failed: { title: "We could not confirm this account.", message: "Request a new confirmation email and try again. If the problem continues, return to sign in." },
  configuration: { title: "Authentication setup is unavailable.", message: "The application could not complete confirmation. Return to sign in or contact the workspace administrator." },
};

export function AuthRecovery({ reason }: { reason?: string | null }) {
  const normalized = getAuthRecoveryReason({ error: reason }) ?? "exchange_failed";
  const text = copy[normalized];
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function resend(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const origin = getTrustedAppOrigin({ browserOrigin: window.location.origin });
      const { error: resendError } = await getSupabaseBrowserClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: `${origin}/auth/callback` } });
      if (resendError) throw resendError;
      setMessage("If the account can receive confirmation mail, a new confirmation link has been sent. Use the newest link only once.");
    } catch (caught) {
      setError(authErrorMessage(caught, "Unable to request a new confirmation email."));
    } finally { setLoading(false); }
  }

  return <div className="auth-form"><div><div className="kicker">Account recovery</div><h1>{text.title}</h1><p className="auth-copy">{text.message}</p></div>{error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status">{message}</div>}<form onSubmit={resend}><label>Email for a new confirmation<input className="input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><button className="btn primary auth-submit" disabled={loading}>{loading ? "Requesting…" : "Resend confirmation"}</button></form><div className="auth-links"><Link href="/login">Return to sign in</Link><Link href="/signup">Return to signup</Link></div></div>;
}
