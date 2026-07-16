"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    try { await getSupabaseBrowserClient().auth.signOut(); } finally { router.push("/login"); router.refresh(); }
  }
  return <button className="top-icon" aria-label="Sign out" title="Sign out" onClick={logout}><LogOut /></button>;
}
