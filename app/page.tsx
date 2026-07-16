import { redirect } from "next/navigation";
import { getAuthRecoveryReason } from "@/lib/auth-recovery";

type HomeProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ? await searchParams : {};
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const reason = getAuthRecoveryReason({ error: first(params.error), errorCode: first(params.error_code), description: first(params.error_description) });
  if (reason) redirect(`/auth/recovery?reason=${reason}`);
  redirect("/overview");
}
