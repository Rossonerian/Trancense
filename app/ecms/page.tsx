import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { PageHeader, Signal } from "@/components/ui";
import { EcmRegister } from "@/components/ecm-register";
import { PrintButton } from "@/components/print-button";
import { getWorkspaceSnapshot } from "@/lib/data-access";

export default async function EcmsPage() { const snapshot = await getWorkspaceSnapshot(); return <div className="content"><PageHeader eyebrow="Decisions / ECM register" title="Turn observations into decisions." description="Persisted energy conservation measures with engineering provenance, financial ranges, risk context, owners, and a human approval path." actions={<><PrintButton /><Link className="btn primary" href="/reports"><ClipboardList className="svg-icon" /> Review report</Link></>} /><Signal type="info">Authoritative savings are produced by typed calculation functions. User-entered ECMs remain uncalculated until validated records and a formula version are attached.</Signal><div className="section"><EcmRegister initialItems={snapshot.ecms} dataMode={snapshot.source} /></div></div>; }
