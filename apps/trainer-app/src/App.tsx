import { useState } from "react";
import { AppBar, Pill } from "@aval/ui";
import { createAvalClient } from "@aval/sdk/api";

const api = createAvalClient(import.meta.env.VITE_API_URL, import.meta.env.VITE_API_KEY);

const TRAINEE_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

const T = {
  blueberry: "#1565ad",
  fig: "#9e2064",
  ink: "#131313",
  graphite: "#3a3a3a",
  slate: "#5f6469",
  pebble: "#8a8f93",
  paper: "#f4f2ee",
  divider: "rgba(19,19,19,0.08)",
  border: "rgba(19,19,19,0.14)",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.slate, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function Inert({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "10px 12px", border: `1px solid ${T.divider}`, borderRadius: 6, background: T.paper, color: T.graphite, fontSize: 14 }}>{children}</div>
  );
}

const CREDENTIAL_TYPES = [
  "Safe Food Distribution · L1",
  "Kitchen Lead · L2",
  "Supply Coordination · L1",
  "Disaster Response · L1",
];

const CRED_KEYS = [
  "WCK-SafeFoodDistribution-L1",
  "WCK-KitchenLead-L2",
  "WCK-SupplyCoordination-L1",
  "WCK-DisasterResponse-L1",
];

export function App() {
  const [selectedCred, setSelectedCred] = useState(0);
  const [issuing, setIssuing] = useState(false);
  const [result, setResult] = useState<{ uid: string; easScanUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleIssue() {
    setIssuing(true);
    setResult(null);
    setError(null);
    try {
      const twoYears = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 2;
      const res = await api.attestIssue({
        vendorAddress: TRAINEE_ADDRESS,
        region: "Puerto Rico",
        category: "other",
        validUntil: twoYears,
        issuerNote: CRED_KEYS[selectedCred],
      });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIssuing(false);
    }
  }

  return (
    <div className="aval-app">
      <AppBar appName="Trainer App" appRole="Issue skill credential" user="Carmen Vega" role="WCK Trainer · Lead" badge={<Pill tone="saffron">WCK-Skill schema</Pill>} />

      {result && (
        <div style={{ background: "#e8f5e9", borderBottom: "1px solid #a5d6a7", padding: "12px 28px", display: "flex", alignItems: "center", gap: 16, fontSize: 14 }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <span style={{ color: "#1b5e20", fontWeight: 600 }}>Credential issued on-chain.</span>
          <span style={{ color: "#2e7d32" }}>UID: <span style={{ fontFamily: "monospace" }}>{result.uid.slice(0, 20)}…</span></span>
          <a href={result.easScanUrl} target="_blank" rel="noopener noreferrer" style={{ color: T.blueberry, fontWeight: 600, textDecoration: "none" }}>View on EAS Scan ↗</a>
        </div>
      )}

      {error && (
        <div style={{ background: "#ffebee", borderBottom: "1px solid #ef9a9a", padding: "12px 28px", fontSize: 14, color: "#b71c1c" }}>
          Error: {error}
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* Left — form */}
        <div className="card card-pad">
          <div className="eyebrow" style={{ marginBottom: 6 }}>New Credential · single recipient</div>
          <h2 style={{ margin: "4px 0 18px", fontSize: 24, fontWeight: 700, color: T.ink, letterSpacing: "-.01em" }}>
            Issue a community responder credential
          </h2>

          <Field label="Recipient wallet">
            <div style={{ display: "flex", gap: 8, padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 6, background: "#fff" }}>
              <span className="mono" style={{ flex: 1, color: T.ink, fontSize: 13 }}>0x3C44CdDdB6a9…3BC</span>
              <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>Scan QR</button>
            </div>
            <div style={{ fontSize: 12, color: T.pebble, marginTop: 4 }}>
              Recipient: <strong style={{ color: T.graphite }}>Yamileth Cruz</strong> · Trainee 2024-PR-018
            </div>
          </Field>

          <Field label="Credential type">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CREDENTIAL_TYPES.map((c, i) => (
                <div key={i} onClick={() => { setSelectedCred(i); setResult(null); setError(null); }} style={{ padding: "12px 14px", borderRadius: 6, fontSize: 14, border: `2px solid ${i === selectedCred ? T.blueberry : T.divider}`, background: i === selectedCred ? "rgba(21,101,173,.05)" : "#fff", color: T.ink, fontWeight: i === selectedCred ? 600 : 500, cursor: "pointer" }}>
                  {c}
                </div>
              ))}
            </div>
          </Field>

          <Field label="Competency area">
            <select style={{ width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 14, background: "#fff", color: T.ink, fontFamily: "inherit" }}>
              <option>Frontline distribution · hot meals</option>
            </select>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Issued"><Inert>Apr 13, 2026</Inert></Field>
            <Field label="Expires"><Inert>Apr 13, 2028</Inert></Field>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn btn-ghost" style={{ flex: 1, padding: "14px", fontSize: 15 }}>Save draft</button>
            <button className="btn btn-primary btn-lg" style={{ flex: 1.4, opacity: issuing ? 0.7 : 1 }} onClick={handleIssue} disabled={issuing}>
              {issuing ? "Issuing…" : result ? "Issue again ↗" : "Issue credential ↗"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: T.pebble, textAlign: "center", marginTop: 8 }}>
            Mints WCK-Skill attestation on Base Sepolia · pins VC payload to IPFS · revocable.
          </div>
        </div>

        {/* Right — preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ background: `linear-gradient(160deg, ${T.fig} 0%, #6e1547 100%)`, color: "#fff", padding: "24px 26px", borderColor: "transparent", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
            <div style={{ fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase", color: "rgba(255,255,255,.85)", fontWeight: 700, marginBottom: 8 }}>WCK · Skill Credential</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.01em", lineHeight: 1.15 }}>
              {(CREDENTIAL_TYPES[selectedCred] ?? "").split(" · ")[0]}
              <div style={{ fontSize: 18, fontWeight: 500, opacity: .85 }}>
                Level {(CREDENTIAL_TYPES[selectedCred] ?? "").includes("L2") ? "2" : "1"} — Frontline
              </div>
            </div>
            <div style={{ marginTop: 18, fontSize: 14, color: "rgba(255,255,255,.92)", lineHeight: 1.55 }}>
              Issued to <strong>Yamileth Cruz</strong> by World Central Kitchen on completion of 18 hours of in-person training in Ponce, Puerto Rico.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", marginTop: 16, fontSize: 13 }}>
              <span style={{ opacity: .75 }}>Holder</span>   <span className="mono">0x3C44…3BC</span>
              <span style={{ opacity: .75 }}>Issuer</span>   <span>WCK · 0x2A0e…1f44</span>
              <span style={{ opacity: .75 }}>Schema</span>   <span className="mono">{CRED_KEYS[selectedCred]}</span>
              <span style={{ opacity: .75 }}>Standards</span> <span>EAS · W3C VC · Open Badges 3.0</span>
              {result && <><span style={{ opacity: .75 }}>UID</span><span className="mono" style={{ wordBreak: "break-all" }}>{result.uid.slice(0, 24)}…</span></>}
            </div>
          </div>

          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 8 }}>On-chain payload (preview)</div>
            <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.55, fontFamily: "ui-monospace,Menlo,Consolas,monospace", color: T.graphite, whiteSpace: "pre-wrap" }}>
{`{
  credentialType:  "${CRED_KEYS[selectedCred]}",
  competencyArea:  "frontline-hot-meals",
  issuedAt:        ${Math.floor(Date.now() / 1000)},
  expiresAt:       ${Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 2},
  issuerOrg:       "World Central Kitchen",
  vcPayloadCid:    "${result ? result.uid.slice(2, 14) : "bafyrei…ob4qm"}"
}`}
            </pre>
          </div>

          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 8 }}>Verifiable by</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {result
                ? <a href={result.easScanUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}><Pill tone="primary">EAS Scan ↗</Pill></a>
                : <Pill tone="primary">EAS Scan</Pill>
              }
              <Pill tone="info">Any W3C VC verifier</Pill>
              <Pill tone="saffron">x402 /credential/verify</Pill>
              <Pill tone="success">1EdTech Open Badges 3.0</Pill>
            </div>
            <div style={{ fontSize: 13, color: T.slate, marginTop: 10, lineHeight: 1.5 }}>
              The community member owns this credential. WCK can revoke it. No party can rewrite history.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
