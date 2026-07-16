"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Bell, Bot, Building2, Calculator, ChevronDown, ClipboardCheck, FileBarChart, Gauge, GitBranch, LayoutDashboard, Menu, Search, Settings2, SunMedium, Upload, X } from "lucide-react";
import { useState } from "react";
import { LogoutButton } from "./logout-button";

const nav = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/audits", label: "Audit workspace", icon: ClipboardCheck },
  { href: "/data", label: "Data & evidence", icon: Upload },
  { href: "/assets", label: "Assets", icon: Building2 },
  { href: "/energy-balance", label: "Energy balance", icon: GitBranch },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ecms", label: "ECM register", icon: Gauge },
  { href: "/solar", label: "Solar scenario", icon: SunMedium },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/assistant", label: "Grounded assistant", icon: Bot },
];

export function AppShell({ children, dataStatus }: { children: React.ReactNode; dataStatus: { label: string; detail: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (["/login", "/signup", "/forgot-password", "/reset-password", "/onboarding"].includes(pathname) || pathname.startsWith("/auth/")) return <>{children}</>;
  return <div className="app-shell">
    <aside className={`sidebar ${open ? "mobile-open" : ""}`}>
      <div className="brand"><div className="brand-mark">T</div><div><div className="brand-name">trancense</div><div className="brand-sub">energy intelligence</div></div><button className="top-icon hide-mobile" aria-label="Close navigation" onClick={() => setOpen(false)}><X /></button></div>
      <nav>
        <div className="nav-section"><div className="nav-label">Workspace</div><div className="nav-links">{nav.map((item) => { const Icon = item.icon; const active = item.href === "/overview" ? pathname === "/" || pathname === "/overview" : pathname.startsWith(item.href); return <Link onClick={() => setOpen(false)} className={`nav-link ${active ? "active" : ""}`} href={item.href} key={item.href}><Icon /><span>{item.label}</span></Link>; })}</div></div>
        <div className="nav-section"><div className="nav-label">Governance</div><div className="nav-links"><Link className={`nav-link ${pathname.startsWith("/settings") ? "active" : ""}`} href="/settings"><Settings2 /><span>Settings & controls</span></Link></div></div>
      </nav>
      <div className="sidebar-footer"><div className="demo-badge">{dataStatus.label}</div><p>{dataStatus.detail}<br />FY25–26 · Pune Plant</p></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="crumb"><button className="top-icon mobile-menu" aria-label="Open navigation" onClick={() => setOpen(!open)}><Menu /></button><span className="hide-mobile">Workspace /</span><strong>{pathname.startsWith("/audits") ? "Audit workspace" : pathname === "/" || pathname === "/overview" ? "Portfolio overview" : pathname.slice(1).replaceAll("-", " ")}</strong></div><div className="top-actions"><button className="top-icon" aria-label="Search"><Search /></button><button className="top-icon" aria-label="Notifications"><Bell /><span className="dot" /></button><div className="user-chip"><div className="avatar">AR</div><span className="hide-mobile">Workspace user</span><ChevronDown className="hide-mobile svg-icon" /></div><LogoutButton /></div></header>
      <main>{children}</main>
    </div>
  </div>;
}
