import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppShell } from "@/components/app-shell";
import { getHealthStatus } from "@/lib/health";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trancense · AI Energy Audit Platform",
  description: "Evidence-led energy audit and engineering decision support for Indian facilities.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const health = await getHealthStatus();
  return <html lang="en"><body><AppShell dataStatus={{ label: health.dataLabel, detail: health.status === "ok" ? health.dataLabel === "Supabase Data" ? "Persistent workspace" : "Deterministic seeded workspace" : health.dataMode === "supabase" ? `Supabase setup required · missing ${health.missingVariables.join(", ") || "database connection"}` : "Deterministic seeded workspace" }}>{children}</AppShell><Analytics /><SpeedInsights /></body></html>;
}
