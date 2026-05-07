import { useState, useEffect, useCallback } from "react";
import { AppBar, Pill } from "@aval/ui";
import { createAvalClient } from "@aval/sdk/api";

const api = createAvalClient(import.meta.env.VITE_API_URL, import.meta.env.VITE_API_KEY);

const TRAINEE_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const ISSUER_ADDRESS  = "0xFa7C7B4a7D1a95c1D4CeF94e8B6774aFE74a7A58";
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
const LOW_ETH_THRESHOLD = 0.005;

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

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function friendlyError(raw: string): string {
  if (/insufficient funds/i.test(raw)) return "Issuer wallet has insufficient ETH to pay gas. Top up the wallet on Base Sepolia.";
  if (/nonce/i.test(raw)) return "Transaction nonce conflict. Wait a moment and try again.";
  if (/timeout|ETIMEDOUT|network/i.test(raw)) return "Network error reaching Base Sepolia. Check connectivity and retry.";
  if (/revert/i.test(raw)) return "EAS contract reverted the transaction. The schema or recipient may be invalid.";
  if (/401|403|api key/i.test(raw)) return "API authentication failed. Check that VITE_API_KEY is set correctly.";
  if (/404/i.test(raw)) return "API endpoint not found. Verify VITE_API_URL is pointing at the correct stage.";
  if (/5\d\d/i.test(raw)) return "Server error from the Aval API. Check Lambda logs in CloudWatch.";
  return "Unexpected error while issuing credential.";
}

export function App() {
  const [selectedCred, setSelectedCred] = useState(0);
  const [issuing, setIssuing] = useState(false);
  const [result, setResult] = useState<{ uid: string; easScanUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    setBalanceError(false);
    try {
      const res = await fetch(BASE_SEPOLIA_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [ISSUER_ADDRESS, "latest"] }),
      });
      const { result: hex } = await res.json() as { result: string };
      setBalance(Number(BigInt(hex)) / 1e18);
    } catch {
      setBalanceError(true);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  async function handleIssue() {
    setIssuing(true);
    setResult(null);
    setError(null);
    setRawError(null);
    setShowRaw(false);
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
      fetchBalance(); // refresh after gas spend
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setRawError(msg);
      setError(friendlyError(msg));
    } finally {
      setIssuing(false);
    }
  }

  const balanceLow = balance !== null && balance < LOW_ETH_THRESHOLD;

  return (
    <div className="aval-app">
      <AppBar appName="Trainer App" appRole="Issue skill credential" user="Carmen Vega" role="WCK Trainer · Lead" badge={<Pill tone="saffron">WCK-Skill schema</Pill>} />

      {/* ── Success banner ── */}
      {result && (
        <div style={{ background: "#e8f5e9", borderBottom: "1px solid #a5d6a7", padding: "12px 28px", display: "flex", alignItems: "center", gap: 16, fontSize: 14 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>✓</span>
          <span style={{ color: "#1b5e20", fontWeight: 600 }}>Credential issued on-chain.</span>
          <span style={{ color: "#2e7d32" }}>UID: <span style={{ fontFamily: "monospace" }}>{result.uid.slice(0, 20)}…</span></span>
          <a href={result.easScanUrl} target="_blank" rel="noopener noreferrer" style={{ color: T.blueberry, fontWeight: 600, textDecoration: "none", marginLeft: "auto" }}>View on EAS Scan ↗</a>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div style={{ background: "#fff3e0", borderBottom: "2px solid #ef6c00", padding: "0" }}>
          <div style={{ padding: "12px 28px", display: "flex", alignItems: "flex-start", gap: 14, fontSize: 14 }}>
            <span style={{ fontSize: 20, lineHeight: 1.2, color: "#e65100" }}>⚠</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#bf360c", fontWeight: 700, marginBottom: 2 }}>Failed to issue credential</div>
              <div style={{ color: "#6d4c41" }}>{error}</div>
            </div>
            <button
              onClick={() => setShowRaw(v => !v)}
              style={{ background: "none", border: `1px solid #ef6c00`, borderRadius: 4, padding: "4px 10px", fontSize: 12, color: "#e65100", cursor: "pointer", whiteSpace: "nowrap", marginTop: 2 }}
            >
              {showRaw ? "Hide" : "Show"} details
            </button>
            <button
              onClick={() => { setError(null); setRawError(null); setShowRaw(false); }}
              style={{ background: "none", border: "none", fontSize: 18, color: "#bf360c", cursor: "pointer", lineHeight: 1, padding: "0 4px" }}
              aria-label="Dismiss"
            >×</button>
          </div>
          {showRaw && rawError && (
            <div style={{ borderTop: "1px solid #ffcc80", background: "#fff8e1", padding: "10px 28px 12px 62px" }}>
              <pre style={{ margin: 0, fontSize: 11, fontFamily: "ui-monospace,Menlo,Consolas,monospace", color: "#4e342e", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{rawError}</pre>
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* ── Left — form ── */}
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
                <div key={i} onClick={() => { setSelectedCred(i); setResult(null); setError(null); setRawError(null); }} style={{ padding: "12px 14px", borderRadius: 6, fontSize: 14, border: `2px solid ${i === selectedCred ? T.blueberry : T.divider}`, background: i === selectedCred ? "rgba(21,101,173,.05)" : "#fff", color: T.ink, fontWeight: i === selectedCred ? 600 : 500, cursor: "pointer" }}>
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

          {/* Low balance warning inline */}
          {balanceLow && (
            <div style={{ background: "#fff3e0", border: "1px solid #ef6c00", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#bf360c", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 16 }}>⚠</span>
              Issuer wallet ETH is low ({balance!.toFixed(5)} ETH). Issuance may fail on gas.
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn btn-ghost" style={{ flex: 1, padding: "14px", fontSize: 15 }}>Save draft</button>
            <button
              className="btn btn-primary btn-lg"
              style={{ flex: 1.4, opacity: issuing ? 0.7 : 1 }}
              onClick={handleIssue}
              disabled={issuing}
            >
              {issuing ? "Issuing…" : result ? "Issue again ↗" : "Issue credential ↗"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: T.pebble, textAlign: "center", marginTop: 8 }}>
            Mints WCK-Skill attestation on Base Sepolia · pins VC payload to IPFS · revocable.
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Issuer wallet */}
          <div className="card card-pad" style={{ background: balanceLow ? "#fff8f0" : "#fff", borderColor: balanceLow ? "#ef6c00" : T.divider }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Issuer wallet · Base Sepolia</div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", alignItems: "center", fontSize: 14 }}>
              <span style={{ color: T.slate }}>Address</span>
              <span className="mono" style={{ color: T.ink, fontSize: 13 }}>
                {shortAddr(ISSUER_ADDRESS)}
                <a
                  href={`https://sepolia.basescan.org/address/${ISSUER_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: T.blueberry, fontSize: 12, marginLeft: 8, textDecoration: "none" }}
                >BaseScan ↗</a>
              </span>

              <span style={{ color: T.slate }}>ETH balance</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {balanceLoading ? (
                  <span style={{ color: T.pebble, fontStyle: "italic" }}>fetching…</span>
                ) : balanceError ? (
                  <span style={{ color: "#c62828", fontSize: 13 }}>
                    RPC error
                    <button onClick={fetchBalance} style={{ background: "none", border: "none", color: T.blueberry, cursor: "pointer", fontSize: 12, marginLeft: 8, textDecoration: "underline", padding: 0 }}>retry</button>
                  </span>
                ) : (
                  <>
                    <span style={{ fontWeight: 700, color: balanceLow ? "#e65100" : T.ink, fontSize: 15 }}>
                      {balance!.toFixed(5)} ETH
                    </span>
                    {balanceLow && <Pill tone="warn">Low</Pill>}
                    <button onClick={fetchBalance} style={{ background: "none", border: "none", color: T.pebble, cursor: "pointer", fontSize: 12, padding: 0 }} title="Refresh balance">↻</button>
                  </>
                )}
              </span>

              <span style={{ color: T.slate }}>Network</span>
              <span style={{ color: T.graphite }}>Base Sepolia (chain 84532)</span>
            </div>
          </div>

          {/* Credential preview card */}
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
              <span style={{ opacity: .75 }}>Issuer</span>   <span className="mono">{shortAddr(ISSUER_ADDRESS)}</span>
              <span style={{ opacity: .75 }}>Schema</span>   <span className="mono">{CRED_KEYS[selectedCred]}</span>
              <span style={{ opacity: .75 }}>Standards</span><span>EAS · W3C VC · Open Badges 3.0</span>
              {result && <><span style={{ opacity: .75 }}>UID</span><span className="mono" style={{ wordBreak: "break-all" }}>{result.uid.slice(0, 24)}…</span></>}
            </div>
          </div>

          {/* Payload preview */}
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

          {/* Verifiable by */}
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
