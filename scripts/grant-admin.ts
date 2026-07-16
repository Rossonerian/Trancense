import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig, getSupabaseServiceRoleKey } from "../lib/supabase/config";

const userId = process.argv[2];
const organizationId = process.argv[3];
const config = getSupabasePublicConfig();
const url = config.url;
const serviceRole = getSupabaseServiceRoleKey();
if (!userId || !organizationId) throw new Error("Usage: npm run grant:admin -- USER_UUID ORGANIZATION_UUID");
if (!url || !serviceRole || config.invalidUrl) throw new Error("Missing or invalid Supabase configuration; names only, no secret values are printed.");
const supabase = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
const { error } = await supabase.from("organization_memberships").upsert({ organization_id: organizationId, user_id: userId, role: "Admin", status: "active" }, { onConflict: "organization_id,user_id" });
if (error) throw error;
console.log("Admin membership granted.");
