import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppShell } from "@/components/app-shell";
import { getHealthStatus } from "@/lib/health";
import { getSafeAuthContext } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trancense · AI Energy Audit Platform",
  description: "Evidence-led energy audit and engineering decision support for Indian facilities.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [health, context] = await Promise.all([getHealthStatus(), getSafeAuthContext()]);
  const authenticatedSupabase = health.status === "ok" && health.dataMode === "supabase" && Boolean(context.user) && Boolean(context.activeOrganization);
  const dataLabel = health.dataMode === "demo" ? "Demo Data" : authenticatedSupabase ? "Supabase Data" : "Supabase Setup Required";
  const detail = health.status === "ok" && dataLabel === "Supabase Data" ? context.activeOrganization ? "Authenticated workspace records" : "Authenticated Supabase mode · no organization yet" : health.dataMode === "supabase" ? `Supabase setup required · missing ${health.missingVariables.join(", ") || "database connection"}` : "Deterministic seeded workspace";
  return <html lang="en"><body><AppShell dataStatus={{ label: dataLabel, detail }} identity={{ userName: context.profile?.full_name || context.user?.user_metadata?.full_name, organizationName: context.activeOrganization?.name, role: context.role, siteName: context.activeSite?.name }}>{children}</AppShell><Analytics /><SpeedInsights /></body></html>;
}
