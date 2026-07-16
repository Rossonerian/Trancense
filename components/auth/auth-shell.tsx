"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className="auth-page"><div className="auth-brand"><div className="brand-mark">T</div><div><div className="brand-name">trancense</div><div className="brand-sub">energy intelligence</div></div></div><div className="auth-card">{children}</div><div className="auth-footer"><Link href="/">Trancense</Link><span>Evidence-led energy decisions</span><span>{pathname === "/login" ? "Secure workspace access" : "Tester-ready workspace"}</span></div></div>;
}
