import { SunMedium } from "lucide-react";
import { PageHeader, Signal } from "@/components/ui";
import { SolarScenario } from "@/components/solar-scenario";

export default function SolarPage() { return <div className="content"><PageHeader eyebrow="Planning / renewables" title="A solar scenario with its caveats visible." description="Test the shape of a rooftop PV decision using editable assumptions, lifetime cash flows, and sensitivity—not a promise of eligibility or performance." actions={<a className="btn primary" href="#scenario"><SunMedium className="svg-icon" /> Edit scenario</a>} /><Signal type="warning"><strong>Planning model:</strong> structural, fire, electrical, DISCOM/interconnection, shading, and site-survey validation remain mandatory before procurement.</Signal><div id="scenario" className="section"><SolarScenario /></div></div>; }
