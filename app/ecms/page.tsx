import { ClipboardList, Download } from "lucide-react";
import { PageHeader, Signal } from "@/components/ui";
import { EcmRegister } from "@/components/ecm-register";

export default function EcmsPage() { return <div className="content"><PageHeader eyebrow="Decisions / ECM register" title="Turn observations into decisions." description="Screened energy conservation measures with engineering provenance, financial ranges, risk context, owners, and a human approval path." actions={<><button className="btn"><Download className="svg-icon" /> Print register</button><button className="btn primary"><ClipboardList className="svg-icon" /> Review shortlist</button></>} /><Signal type="info">Authoritative savings are produced by typed calculation functions. Cost, carbon, payback, and confidence are always shown with their assumptions and version.</Signal><div className="section"><EcmRegister /></div></div>; }
