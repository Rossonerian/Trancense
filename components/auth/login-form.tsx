"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSafeInternalPath } from "@/lib/app-origin";
import { GoogleOAuthButton } from "./google-oauth-button";
import { authErrorMessage } from "@/lib/auth-errors";

export function LoginForm({ demoMode = false, configurationMessage }: { demoMode?: boolean; configurationMessage?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("error") === "configuration" ? configurationMessage ?? "Supabase authentication is not configured for this deployment." : configurationMessage ?? "");
  const confirmed = params.get("confirmed") === "1";
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      if (demoMode) return;
      const client = getSupabaseBrowserClient();
      const { error: authError } = await client.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const { data: profile } = await client.from("profiles").select("onboarding_completed").eq("id", (await client.auth.getUser()).data.user?.id ?? "").maybeSingle();
      router.push(profile?.onboarding_completed ? getSafeInternalPath(params.get("next"), "/overview") : "/onboarding"); router.refresh();
    } catch (caught) { setError(authErrorMessage(caught, "Unable to sign in.")); }
    finally { setLoading(false); }
  }

  if (demoMode) return <div className="auth-form"><div><div className="kicker">Explicit local demo</div><h1>Open the local demo workspace</h1><p className="auth-copy">This environment is using deterministic demo data because <code>DATA_MODE=demo</code> was explicitly selected.</p></div><Link className="btn primary auth-submit" href="/overview">Open Demo Data</Link><div className="auth-links"><Link href="/signup">Use Supabase mode instead</Link></div></div>;
  return <form onSubmit={submit} className="auth-form"><div><div className="kicker">Secure workspace</div><h1>Sign in to Trancense</h1><p className="auth-copy">Access your organization’s evidence, calculations, and review workflow.</p></div><GoogleOAuthButton />{confirmed && <div className="form-success" role="status">Your email is confirmed. Sign in to continue.</div>}{error && <div className="form-error" role="alert">{error}</div>}<label>Email<input className="input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input className="input" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="btn primary auth-submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button><div className="auth-links"><Link href="/forgot-password">Forgot password?</Link><span>New here? <Link href="/signup">Create workspace</Link></span></div></form>;
}
