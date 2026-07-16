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

export function AppShell({ children, dataStatus, identity }: { children: React.ReactNode; dataStatus: { label: string; detail: string }; identity?: { userName?: string | null; organizationName?: string | null; role?: string | null; siteName?: string | null } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  if (["/login", "/signup", "/forgot-password", "/reset-password", "/onboarding"].includes(pathname) || pathname.startsWith("/auth/")) return <>{children}</>;
  const displayName = identity?.userName?.trim() || (dataStatus.label === "Demo Data" ? "Demo workspace" : "Workspace user");
  const initials = displayName === "Demo workspace" ? "D" : displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <div className="app-shell">
    <aside className={`sidebar ${open ? "mobile-open" : ""}`}>
      <div className="brand"><div className="brand-mark">T</div><div><div className="brand-name">trancense</div><div className="brand-sub">energy intelligence</div></div><button className="top-icon hide-mobile" aria-label="Close navigation" onClick={() => setOpen(false)}><X /></button></div>
      <nav>
        <div className="nav-section"><div className="nav-label">Workspace</div><div className="nav-links">{nav.map((item) => { const Icon = item.icon; const active = item.href === "/overview" ? pathname === "/" || pathname === "/overview" : pathname.startsWith(item.href); return <Link onClick={() => setOpen(false)} className={`nav-link ${active ? "active" : ""}`} href={item.href} key={item.href}><Icon /><span>{item.label}</span></Link>; })}</div></div>
        <div className="nav-section"><div className="nav-label">Governance</div><div className="nav-links"><Link className={`nav-link ${pathname.startsWith("/settings") ? "active" : ""}`} href="/settings"><Settings2 /><span>Settings & controls</span></Link></div></div>
      </nav>
      <div className="sidebar-footer"><div className="demo-badge">{dataStatus.label}</div><p>{dataStatus.detail}<br />{identity?.organizationName ?? (dataStatus.label === "Demo Data" ? "Explicit local demo workspace" : "No organization selected")} · {identity?.siteName ?? "No site selected"}</p></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="crumb"><button className="top-icon mobile-menu" aria-label="Open navigation" onClick={() => setOpen(!open)}><Menu /></button><span className="hide-mobile">Workspace /</span><strong>{pathname.startsWith("/audits") ? "Audit workspace" : pathname === "/" || pathname === "/overview" ? "Portfolio overview" : pathname.slice(1).replaceAll("-", " ")}</strong></div><div className="top-actions"><button className="top-icon" aria-label="Search"><Search /></button><button className="top-icon" aria-label="Notifications"><Bell /><span className="dot" /></button><div className="account-wrap"><button className="user-chip" aria-label="Open account menu" aria-expanded={accountOpen} onClick={() => setAccountOpen((value) => !value)}><div className="avatar">{initials}</div><span className="hide-mobile">{displayName}</span><ChevronDown className="hide-mobile svg-icon" /></button>{accountOpen && <div className="account-menu" role="menu"><div className="account-menu-heading">{displayName}</div><div className="account-menu-item">Profile <strong>{identity?.userName ?? "Not completed"}</strong></div><div className="account-menu-item">Organization <strong>{identity?.organizationName ?? "No organization"}</strong></div><div className="account-menu-item">Role <strong>{identity?.role ?? "Not assigned"}</strong></div><Link className="account-menu-link" href="/settings" onClick={() => setAccountOpen(false)}>Settings & controls</Link><LogoutButton /></div>}</div>{!accountOpen && <LogoutButton />}</div></header>
      <main>{children}</main>
    </div>
  </div>;
}
