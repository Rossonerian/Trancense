"use client";

import { useState } from "react";
import { getTrustedAppOrigin } from "@/lib/app-origin";
import { googleOAuthCallbackPath, googleOAuthErrorMessage } from "@/lib/google-oauth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleOAuthButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function continueWithGoogle() {
    setLoading(true); setError("");
    try {
      const origin = getTrustedAppOrigin({ browserOrigin: window.location.origin });
      const { error: authError } = await getSupabaseBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}${googleOAuthCallbackPath}` } });
      if (authError) throw authError;
    } catch (caught) {
      setError(googleOAuthErrorMessage(caught));
      setLoading(false);
    }
  }
  return <div><button type="button" className="btn auth-submit" aria-busy={loading} onClick={() => void continueWithGoogle()} disabled={loading}>{loading ? "Connecting…" : "Continue with Google"}</button>{error && <div className="form-error" role="alert" style={{ marginTop: 10 }}>{error}</div>}<div className="empty-note" style={{ textAlign: "center", padding: "12px 0" }}>or continue with email</div></div>;
}
