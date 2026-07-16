import { AuthRecovery } from "@/components/auth/auth-recovery";
import { AuthShell } from "@/components/auth/auth-shell";
import { normalizeAuthRecoveryReason } from "@/lib/auth-recovery";

type RecoveryPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function RecoveryPage({ searchParams }: RecoveryPageProps) {
  const params = searchParams ? await searchParams : {};
  const rawReason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  return <AuthShell><AuthRecovery reason={normalizeAuthRecoveryReason(rawReason)} /></AuthShell>;
}
