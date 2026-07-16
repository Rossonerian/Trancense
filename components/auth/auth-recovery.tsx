"use client";

import Link from "next/link";
import { getAuthRecoveryReason, type AuthRecoveryReason } from "@/lib/auth-recovery";

const copy: Record<AuthRecoveryReason, { title: string; message: string }> = {
  expired: { title: "This sign-in link has expired.", message: "Start sign-in again to receive a fresh authentication request." },
  invalid: { title: "This sign-in link is invalid.", message: "The authentication request is incomplete or no longer valid. Start sign-in again." },
  missing_code: { title: "This sign-in link is incomplete.", message: "Return to sign in and start the authentication flow again." },
  exchange_failed: { title: "We could not complete sign-in.", message: "Start sign-in again. If the problem continues, contact the workspace administrator." },
  configuration: { title: "Authentication setup is unavailable.", message: "The application could not complete sign-in. Contact the workspace administrator." },
};

export function AuthRecovery({ reason }: { reason?: string | null }) {
  const normalized = getAuthRecoveryReason({ error: reason }) ?? "exchange_failed";
  const text = copy[normalized];
  return <div className="auth-form"><div><div className="kicker">Authentication issue</div><h1>{text.title}</h1><p className="auth-copy">{text.message}</p></div><div className="auth-links"><Link className="btn primary auth-submit" href="/login">Return to sign in</Link><Link href="/signup">Create an account</Link></div></div>;
}
