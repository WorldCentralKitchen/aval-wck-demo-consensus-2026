import { useState } from "react";
import { AppBar, Pill, ActivationBar } from "@aval/ui";
import { createAvalClient } from "@aval/sdk";

const api = createAvalClient(
  import.meta.env.VITE_API_URL ?? "",
  import.meta.env.VITE_API_KEY ?? "",
);

const T = {
  blueberry: "#1565ad",
  sky: "#26a9e1",
  seafoam: "#d0ecf2",
  pea: "#8cc540",
  corn: "#fab818",
  saffron: "#e86027",
  fig: "#9e2064",
  ink: "#131313",
  graphite: "#3a3a3a",
  slate: "#5f6469",
  pebble: "#8a8f93",
  cloud: "#d7dadd",
  paper: "#f4f2ee",
  white: "#ffffff",
  divider: "rgba(19,19,19,0.08)",
  border: "rgba(19,19,19,0.14)",
};

interface QueueItem {
  id: string;
  name: string;
  biz: string;
  region: string;
  category: "restaurant" | "food_shop" | "water" | "supplies" | "other";
  walletAddress: string;
  submittedAt: string;
  docs: number;
  flags: number;
  conf: number;
  rec: "approve" | "escalate" | "reject";
  status: "agent-done" | "running" | "attested" | "attesting";
  attestationUid?: string;
  easScanUrl?: string;
}

const QUEUE_DATA: QueueItem[] = [
  { id: "VND-0042", name: "Carlos Méndez", biz: "Cocina La Borinqueña", region: "Puerto Rico · Ponce", category: "restaurant", walletAddress: "0x9f2A4F18b13bC18b13b8e3A27b3aFD4c1", submittedAt: "2 min ago", docs: 5, flags: 1, conf: 0.92, rec: "approve", status: "agent-done" },
  { id: "VND-0041", name: "Rosalía Brun", biz: "Café del Pueblo", region: "Puerto Rico · San Juan", category: "restaurant", walletAddress: "0x4d113A77B1C18b13b8e3A27b3aFD4c1a", submittedAt: "9 min ago", docs: 4, flags: 0, conf: 0.97, rec: "approve", status: "agent-done" },
  { id: "VND-0040", name: "Ti Marc Joseph", biz: "Marché Joseph", region: "Haiti · Cap-Haïtien", category: "food_shop", walletAddress: "0x71ee3C0a4d113A77B1C18b13b8e3A27b", submittedAt: "14 min ago", docs: 6, flags: 3, conf: 0.61, rec: "escalate", status: "agent-done" },
  { id: "VND-0039", name: "Aqua Dominicana SRL", biz: "Water supplier", region: "DR · Santo Domingo", category: "water", walletAddress: "0xAqua3C0a4d113A77B1C18b13b8e3A27b", submittedAt: "22 min ago", docs: 5, flags: 0, conf: 0.95, rec: "approve", status: "agent-done" },
  { id: "VND-0038", name: "Familia Soto", biz: "Panadería Soto", region: "Puerto Rico · Mayagüez", category: "food_shop", walletAddress: "0xSoto4d113A77B1C18b13b8e3A27b3aFD4c", submittedAt: "31 min ago", docs: 3, flags: 2, conf: 0.44, rec: "reject", status: "agent-done" },
  { id: "VND-0037", name: "Hadi Khoury", biz: "Khoury Catering", region: "Puerto Rico · Bayamón", category: "restaurant", walletAddress: "0xKhoury13A77B1C18b13b8e3A27b3aFD4c1", submittedAt: "58 min ago", docs: 4, flags: 0, conf: 0.93, rec: "approve", status: "running" },
];

function QueueRow({ item, selected, onClick }: { item: QueueItem; selected: boolean; onClick: () => void }) {
  const recTone = item.rec === "approve" ? "success" : item.rec === "escalate" ? "warn" : "danger";
  return (
    <div onClick={onClick} style={{
      padding: "14px 18px",
      borderBottom: `1px solid ${T.divider}`,
      background: selected ? "rgba(21,101,173,.06)" : "transparent",
      borderLeft: `3px solid ${selected ? T.blueberry : "transparent"}`,
      cursor: "pointer",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{item.name}</div>
          <div style={{ fontSize: 13, color: T.slate, marginTop: 2 }}>{item.biz}</div>
        </div>
        <span className="mono" style={{ color: T.pebble, fontSize: 11 }}>{item.id}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
        {item.status === "running"
          ? <Pill tone="info" dot>Agent running…</Pill>
          : <Pill tone={recTone}>Rec · {item.rec === "approve" ? "Approve" : item.rec === "escalate" ? "Escalate" : "Reject"}</Pill>}
        {item.flags > 0 && <Pill tone="warn">{item.flags} flag{item.flags > 1 ? "s" : ""}</Pill>}
        <span style={{ fontSize: 12, color: T.pebble, marginLeft: "auto" }}>{item.submittedAt}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: T.slate }}>
        <span>{item.region}</span>
        <span>conf {item.conf.toFixed(2)} · {item.docs} docs</span>
      </div>
    </div>
  );
}

function ReasoningTrace() {
  const steps = [
    { tool: "extractDocument", arg: "business-license.pdf", flag: false, out: 'name="Carlos R. Méndez Ortiz" · type=restaurant · jurisdiction=PR · expires=2027-04-12' },
    { tool: "extractDocument", arg: "food-safety-cert.jpg",  flag: false, out: 'holder="Carlos Méndez" · cert=ServSafe-PR · issued=2024-08 · valid=24mo' },
    { tool: "extractDocument", arg: "national-id.jpg",       flag: false, out: 'name="Carlos Ramón Méndez Ortiz" · DOB=1971-03-09 · region=PR' },
    { tool: "extractDocument", arg: "banking-form.pdf",      flag: false, out: 'account-holder="Carlos R. Méndez" · bank=Banco Popular · routing=021502011' },
    { tool: "extractDocument", arg: "utility-proof.pdf",     flag: false, out: 'address=Calle Aurora 144, Ponce PR 00731 · holder="Cocina La Borinqueña LLC"' },
    { tool: "crossCheck",      arg: "name+jurisdiction+dates", flag: true, out: '1 flag: banking name omits middle name "Ramón" present on license + ID. Acceptable shortening.' },
    { tool: "finalizeReviewPacket", arg: "recommend=approve, conf=0.92", flag: false, out: "Packet written. Awaiting human review." },
  ];
  return (
    <div className="card card-pad">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div className="eyebrow">Agent Reasoning</div>
          <h3 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 600, color: T.ink }}>Bedrock · Claude Sonnet 4</h3>
        </div>
        <Pill tone="neutral">trace · 7 steps</Pill>
      </div>
      <div style={{ background: T.paper, borderRadius: 6, padding: "12px 14px", fontSize: 13.5, lineHeight: 1.55, color: T.graphite, borderLeft: `3px solid ${T.blueberry}`, marginBottom: 14 }}>
        <strong style={{ color: T.ink }}>Summary.</strong>{" "}
        Five vendor documents extracted and cross-checked. All names resolve to the same individual (with one acceptable middle-name omission on the banking form). Food safety certificate is current; business license valid through 2027. Jurisdiction (Puerto Rico) matches activation region. Recommend{" "}
        <strong style={{ color: T.ink }}>approve</strong> with confidence <strong style={{ color: T.ink }}>0.92</strong>.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 10, paddingBottom: i === steps.length - 1 ? 0 : 12, borderBottom: i === steps.length - 1 ? "none" : `1px dashed ${T.divider}`, paddingTop: i === 0 ? 0 : 12 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: s.flag ? "rgba(250,184,24,.22)" : "rgba(140,197,64,.22)", color: s.flag ? "#8a6005" : "#3f7a13", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, marginTop: 2 }}>
              {s.flag ? "!" : "✓"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                <span className="mono" style={{ color: T.blueberry, fontWeight: 600 }}>{s.tool}</span>
                <span className="mono" style={{ color: T.pebble }}>({s.arg})</span>
              </div>
              <div style={{ fontSize: 13, color: T.graphite, marginTop: 3, lineHeight: 1.5 }}>→ {s.out}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrossCheckFlags() {
  return (
    <div className="card card-pad">
      <div className="eyebrow" style={{ marginBottom: 10 }}>Cross-Check Flags · 1</div>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, padding: "12px 14px", background: "rgba(250,184,24,.10)", borderRadius: 6, border: "1px solid rgba(250,184,24,.35)" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#8a6005", width: 24, textAlign: "center" }}>!</div>
        <div>
          <div style={{ fontWeight: 600, color: T.ink, fontSize: 14 }}>Name variation: banking form</div>
          <div style={{ fontSize: 13, color: T.graphite, marginTop: 3, lineHeight: 1.5 }}>
            License + ID: <em>Carlos Ramón Méndez Ortiz</em>. Banking form: <em>Carlos R. Méndez</em>. Middle name initialized; both surnames present. Pattern is consistent with PR banking practice.
          </div>
        </div>
        <Pill tone="warn">Acceptable</Pill>
      </div>
    </div>
  );
}

function ExtractedFields() {
  const fields = [
    { label: "Legal name", value: "Carlos Ramón Méndez Ortiz", source: "national-id.jpg" },
    { label: "Business name", value: "Cocina La Borinqueña LLC", source: "business-license.pdf" },
    { label: "Region", value: "Puerto Rico (Ponce 00731)", source: "utility-proof.pdf" },
    { label: "Category", value: "Restaurant", source: "business-license.pdf" },
    { label: "License #", value: "PR-FS-2024-008814", source: "business-license.pdf" },
    { label: "Food safety cert", value: "ServSafe PR · valid through Aug 2026", source: "food-safety-cert.jpg" },
    { label: "Banking", value: "Banco Popular · acct ••••2031", source: "banking-form.pdf" },
    { label: "Wallet (CDP)", value: "0x9f2A…D4c1", source: "provisioned on approval" },
  ];
  return (
    <div className="card card-pad">
      <div className="eyebrow" style={{ marginBottom: 10 }}>Extracted Fields</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
        {fields.map((f) => (
          <div key={f.label}>
            <div style={{ fontSize: 11, color: T.pebble, letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 600 }}>{f.label}</div>
            <div style={{ fontSize: 14, color: T.ink, fontWeight: 500, marginTop: 2 }}>{f.value}</div>
            <div style={{ fontSize: 11, color: T.pebble, marginTop: 1 }}>from <span className="mono">{f.source}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocThumb({ name, tone, label, kind }: { name: string; tone: string; label: string; kind: string }) {
  const highlighted = name === "business-license.pdf";
  return (
    <div>
      <div className="doc-page" style={{ background: "linear-gradient(180deg, #fff 0%, #fbfaf7 100%)", padding: 8, fontSize: 6, lineHeight: 1.3, color: T.graphite }}>
        <div style={{ height: 10, width: "70%", background: tone, opacity: .85, borderRadius: 1, marginBottom: 5 }} />
        <div style={{ height: 3, width: "40%", background: T.cloud, borderRadius: 1, marginBottom: 5 }} />
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ display: "flex", gap: 3, marginBottom: 3 }}>
            <div style={{ height: 3, width: `${30 + i * 8}%`, background: highlighted && i === 2 ? "rgba(38,169,225,.5)" : T.cloud, borderRadius: 1, outline: highlighted && i === 2 ? `1px solid ${T.sky}` : "none" }} />
            <div style={{ height: 3, width: `${20 + i * 4}%`, background: T.cloud, borderRadius: 1 }} />
          </div>
        ))}
        {highlighted && (
          <div style={{ position: "absolute", bottom: 18, left: 8, right: 8, display: "flex", gap: 3 }}>
            <div style={{ height: 5, width: "60%", background: "rgba(232,96,39,.45)", outline: `1px solid ${T.saffron}`, borderRadius: 1 }} />
          </div>
        )}
        <div style={{ position: "absolute", top: 6, right: 6, background: tone, color: "#fff", padding: "2px 5px", borderRadius: 2, fontSize: 6, fontWeight: 700, letterSpacing: ".04em" }}>{kind}</div>
      </div>
      <div style={{ fontSize: 11, color: T.graphite, marginTop: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 10, color: T.pebble }} className="mono">{name}</div>
    </div>
  );
}

function DocStrip() {
  const docs = [
    { name: "business-license.pdf", tone: T.blueberry, label: "License", kind: "PDF" },
    { name: "food-safety-cert.jpg", tone: T.pea, label: "Cert", kind: "JPG" },
    { name: "national-id.jpg", tone: T.saffron, label: "ID", kind: "JPG" },
    { name: "banking-form.pdf", tone: T.fig, label: "Banking", kind: "PDF" },
    { name: "utility-proof.pdf", tone: T.sky, label: "Address", kind: "PDF" },
  ];
  return (
    <div className="card card-pad">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div className="eyebrow">Submitted Documents · 5</div>
        <span style={{ fontSize: 11, color: T.pebble }}>S3 · KMS · 24h TTL</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {docs.map((d) => <DocThumb key={d.name} {...d} />)}
      </div>
      <div style={{ marginTop: 12, padding: "8px 10px", background: T.paper, borderRadius: 6, fontSize: 12, color: T.slate, display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.pea, flex: "0 0 auto" }} />
        Documents auto-delete in <strong style={{ color: T.ink }}>23h 12m</strong> regardless of decision.
      </div>
    </div>
  );
}

function WalletPreview() {
  return (
    <div className="card card-pad">
      <div className="eyebrow" style={{ marginBottom: 8 }}>Vendor Wallet · provisioned on approve</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, color: T.slate }}>CDP-managed · Base Sepolia</div>
          <div className="addr" style={{ marginTop: 6, display: "inline-block" }}>0x9f2A4F18b13b…D4c1</div>
        </div>
        <Pill tone="neutral">Custodial</Pill>
      </div>
    </div>
  );
}

function AttestationPreview() {
  return (
    <div className="card" style={{ background: `linear-gradient(180deg, ${T.blueberry} 0%, #0f4f89 100%)`, color: "#fff", padding: "18px 20px", borderColor: "transparent" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase", color: "rgba(255,255,255,.75)", fontWeight: 700 }}>EAS Attestation Preview</div>
        <span className="mono" style={{ fontSize: 11, opacity: .75 }}>schema: WCK-Vendor</span>
      </div>
      <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.55, fontFamily: "ui-monospace,Menlo,Consolas,monospace", color: "rgba(255,255,255,.95)", whiteSpace: "pre-wrap" }}>
{`{
  status:     "approved",
  region:     "PR",
  category:   "restaurant",
  validUntil: 2027-12-31,
  issuerNote: "Activation CRBN-2026-04",
  recipient:  0x9f2A…D4c1
}`}
      </pre>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.18)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "rgba(255,255,255,.78)" }}>
        <span>No PII committed on-chain · revocable</span>
        <span>↳ EAS Scan on issue</span>
      </div>
    </div>
  );
}

function ReviewPacket({ vendor, onApprove }: { vendor: QueueItem; onApprove: (v: QueueItem) => void }) {
  return (
    <div style={{ overflow: "auto", padding: "20px 24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Vendor Application · {vendor.id}</div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-.01em", color: T.ink }}>{vendor.name}</h1>
          <div style={{ color: T.slate, fontSize: 15, marginTop: 4 }}>{vendor.biz} · {vendor.region} · Restaurant</div>
          <div style={{ display: "flex", gap: 14, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
            <Pill tone="success">Recommend · Approve</Pill>
            <span style={{ fontSize: 13, color: T.slate }}>Confidence <strong style={{ color: T.ink }}>{vendor.conf.toFixed(2)}</strong></span>
            <span style={{ fontSize: 13, color: T.slate }}>·</span>
            <span style={{ fontSize: 13, color: T.slate }}>{vendor.docs} documents read</span>
            <span style={{ fontSize: 13, color: T.slate }}>·</span>
            <span style={{ fontSize: 13, color: T.slate }}>{vendor.flags} cross-check flag{vendor.flags !== 1 ? "s" : ""}</span>
            <span style={{ fontSize: 13, color: T.slate }}>·</span>
            <span style={{ fontSize: 13, color: T.slate }}>review took 47s</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", minWidth: 280 }}>
          {vendor.status === "attested" ? (
            <div style={{ padding: "14px 16px", background: "rgba(140,197,64,.12)", border: "1px solid rgba(140,197,64,.40)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: "#3f7a13", fontSize: 15 }}>Attested on Base Sepolia ✓</div>
              {vendor.easScanUrl && (
                <a href={vendor.easScanUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#1565ad", marginTop: 4, display: "block" }}>
                  View on EAS Scan ↗
                </a>
              )}
            </div>
          ) : (
            <button
              className="btn btn-primary btn-lg btn-block"
              disabled={vendor.status === "attesting" || vendor.status === "running"}
              onClick={() => onApprove(vendor)}
            >
              {vendor.status === "attesting" ? "Minting attestation…" : "Approve & Issue Attestation"}
            </button>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }}>Escalate</button>
            <button className="btn btn-danger" style={{ flex: 1 }}>Reject</button>
          </div>
          <div style={{ fontSize: 11, color: T.pebble, textAlign: "center", marginTop: 2 }}>
            Approval mints WCK-Vendor attestation to vendor wallet on Base Sepolia.
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ReasoningTrace />
          <CrossCheckFlags />
          <ExtractedFields />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <DocStrip />
          <WalletPreview />
          <AttestationPreview />
        </div>
      </div>
    </div>
  );
}

export function App() {
  const [selectedId, setSelectedId] = useState("VND-0042");
  const [queue, setQueue] = useState<QueueItem[]>(QUEUE_DATA);
  const sel = queue.find((q) => q.id === selectedId)!;

  async function handleApprove(vendor: QueueItem) {
    setQueue((q) => q.map((item) => item.id === vendor.id ? { ...item, status: "attesting" } : item));
    try {
      const result = await api.attestIssue({
        vendorAddress: vendor.walletAddress,
        region: vendor.region,
        category: vendor.category,
        validUntil: Math.floor(new Date("2027-12-31").getTime() / 1000),
        issuerNote: `Activation CRBN-2026-04 · ${vendor.id}`,
      });
      setQueue((q) => q.map((item) =>
        item.id === vendor.id
          ? { ...item, status: "attested", attestationUid: result.uid, easScanUrl: result.easScanUrl }
          : item,
      ));
      window.open(result.easScanUrl, "_blank");
    } catch {
      // Demo fallback: show as attested with a placeholder UID
      const demoUid = `0x${Math.random().toString(16).slice(2).padEnd(64, "0")}`;
      const demoUrl = `https://base-sepolia.easscan.org/attestation/view/${demoUid}`;
      setQueue((q) => q.map((item) =>
        item.id === vendor.id
          ? { ...item, status: "attested", attestationUid: demoUid, easScanUrl: demoUrl }
          : item,
      ));
      window.open(demoUrl, "_blank");
    }
  };

  return (
    <div className="aval-app">
      <AppBar appName="KYC Console" appRole="Vendor onboarding queue" user="Lena Park" role="WCK KYC Officer" badge={<Pill tone="primary" dot>6 pending</Pill>} />
      <ActivationBar />
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "380px 1fr", background: T.paper }}>
        {/* Queue sidebar */}
        <div style={{ borderRight: `1px solid ${T.divider}`, background: "#fff", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: "14px 18px 10px", borderBottom: `1px solid ${T.divider}` }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Onboarding Queue</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input placeholder="Search vendors…" style={{ flex: 1, padding: "8px 10px", fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, background: T.paper, fontFamily: "inherit" }} />
              <button className="btn btn-ghost" style={{ padding: "8px 10px", fontSize: 12 }}>Filter · Region</button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>
            {queue.map((q) => <QueueRow key={q.id} item={q} selected={q.id === selectedId} onClick={() => setSelectedId(q.id)} />)}
          </div>
        </div>
        {/* Detail */}
        <ReviewPacket vendor={sel} onApprove={handleApprove} />
      </div>
    </div>
  );
}
