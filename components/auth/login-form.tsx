"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSafeInternalPath } from "@/lib/app-origin";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("error") === "configuration" ? "Supabase authentication is not configured. Set the documented server variables or use DATA_MODE=demo locally." : "");
  const confirmed = params.get("confirmed") === "1";
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const client = getSupabaseBrowserClient();
      const { error: authError } = await client.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const { data: profile } = await client.from("profiles").select("onboarding_completed").eq("id", (await client.auth.getUser()).data.user?.id ?? "").maybeSingle();
      router.push(profile?.onboarding_completed ? getSafeInternalPath(params.get("next"), "/overview") : "/onboarding"); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to sign in."); }
    finally { setLoading(false); }
  }

  return <form onSubmit={submit} className="auth-form"><div><div className="kicker">Secure workspace</div><h1>Sign in to Trancense</h1><p className="auth-copy">Access your organization’s evidence, calculations, and review workflow.</p></div>{confirmed && <div className="form-success" role="status">Your email is confirmed. Sign in to continue.</div>}{error && <div className="form-error" role="alert">{error}</div>}<label>Email<input className="input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input className="input" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="btn primary auth-submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button><div className="auth-links"><Link href="/forgot-password">Forgot password?</Link><span>New here? <Link href="/signup">Create workspace</Link></span></div></form>;
}
