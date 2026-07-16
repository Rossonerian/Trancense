import { createClient } from "@supabase/supabase-js";

const userId = process.argv[2];
const organizationId = process.argv[3];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!userId || !organizationId) throw new Error("Usage: npm run grant:admin -- USER_UUID ORGANIZATION_UUID");
if (!url || !serviceRole) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; names only, no secret values are printed.");
const supabase = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
const { error } = await supabase.from("organization_memberships").upsert({ organization_id: organizationId, user_id: userId, role: "Admin", status: "active" }, { onConflict: "organization_id,user_id" });
if (error) throw error;
console.log("Admin membership granted.");
