import { useState, useEffect, useCallback } from "react";
import { AppBar, Pill } from "@aval/ui";
import { createAvalClient } from "@aval/sdk/api";

const api = createAvalClient(import.meta.env.VITE_API_URL, import.meta.env.VITE_API_KEY);

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

// ── helpers ──────────────────────────────────────────────────────────────────

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function friendlyError(raw: string): string {
  if (/insufficient funds/i.test(raw))  return "Issuer wallet has insufficient ETH to pay gas. Top up the wallet on Base Sepolia.";
  if (/nonce/i.test(raw))              return "Transaction nonce conflict. Wait a moment and try again.";
  if (/timeout|ETIMEDOUT|network/i.test(raw)) return "Network error reaching Base Sepolia. Check connectivity and retry.";
  if (/revert/i.test(raw))             return "EAS contract reverted the transaction. The schema or recipient address may be invalid.";
  if (/401|403|api key/i.test(raw))    return "API authentication failed. Check that VITE_API_KEY is set correctly.";
  if (/404/i.test(raw))                return "API endpoint not found. Verify VITE_API_URL is pointing at the correct stage.";
  if (/5\d\d/i.test(raw))             return "Server error from the Aval API. Check Lambda logs in CloudWatch.";
  return "Unexpected error while issuing credential.";
}

// ── sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.slate, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px",
  border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 14,
  background: "#fff", color: T.ink, fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235f6469' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 32,
  cursor: "pointer",
};

function PayloadModal({ payload, easScanUrl, onClose }: {
  payload: Record<string, unknown>;
  easScanUrl?: string;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#1a1a2e", borderRadius: 12, padding: "28px 32px", width: 560, maxWidth: "90vw", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", position: "relative" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#7986cb", fontWeight: 700, marginBottom: 4 }}>Transaction Payload · Base Sepolia</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#e8eaf6" }}>EAS attestation data</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.08)", border: "none", borderRadius: 6, color: "#9fa8da", fontSize: 18, lineHeight: 1, padding: "6px 10px", cursor: "pointer" }}>×</button>
        </div>

        <pre style={{
          margin: 0, fontSize: 13, lineHeight: 1.7,
          fontFamily: "ui-monospace,Menlo,Consolas,monospace",
          color: "#a5d6a7", background: "rgba(0,0,0,0.35)",
          borderRadius: 8, padding: "16px 20px", overflow: "auto", maxHeight: 360,
        }}>
          {JSON.stringify(payload, null, 2)}
        </pre>

        <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
          {easScanUrl && (
            <a href={easScanUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: "#7986cb", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
              View on EAS Scan ↗
            </a>
          )}
          <button onClick={onClose} style={{ background: "#3949ab", border: "none", borderRadius: 6, color: "#fff", fontWeight: 600, fontSize: 13, padding: "8px 20px", cursor: "pointer", fontFamily: "inherit" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── credential types ──────────────────────────────────────────────────────────

const CREDENTIAL_TYPES = [
  { label: "Safe Food Distribution · L1", key: "WCK-SafeFoodDistribution-L1" },
  { label: "Kitchen Lead · L2",           key: "WCK-KitchenLead-L2" },
  { label: "Supply Coordination · L1",    key: "WCK-SupplyCoordination-L1" },
  { label: "Disaster Response · L1",      key: "WCK-DisasterResponse-L1" },
];

const COMPETENCY_OPTIONS = [
  "Frontline distribution · hot meals",
  "Frontline distribution · dry goods",
  "Kitchen operations · prep",
  "Kitchen operations · service",
  "Logistics & cold chain",
  "Community coordination",
  "Emergency water distribution",
];

// ── main component ───────────────────────────────────────────────────────────

export function App() {
  // form state
  const [selectedCred, setSelectedCred]     = useState(0);
  const [recipientAddr, setRecipientAddr]   = useState("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
  const [recipientName, setRecipientName]   = useState("Yamileth Cruz");
  const [competency, setCompetency]         = useState(COMPETENCY_OPTIONS[0]);
  const [region, setRegion]                 = useState("Puerto Rico");
  const [issuedDate, setIssuedDate]         = useState(toDateInputValue(new Date()));
  const [expiresDate, setExpiresDate]       = useState(toDateInputValue(new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2)));
  const [issuerNote, setIssuerNote]         = useState("");

  // issue state
  const [issuing, setIssuing]   = useState(false);
  const [result, setResult]     = useState<{ uid: string; easScanUrl: string } | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);
  const [showRaw, setShowRaw]   = useState(false);

  // modal
  const [showPayload, setShowPayload] = useState(false);

  // wallet
  const [balance, setBalance]           = useState<number | null>(null);
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

  const validUntil = Math.floor(new Date(expiresDate).getTime() / 1000);
  const credKey    = CREDENTIAL_TYPES[selectedCred]?.key ?? "";
  const credLabel  = CREDENTIAL_TYPES[selectedCred]?.label ?? "";

  const payload = {
    schema:         "WCK-Skill",
    credentialType: credKey,
    recipient:      recipientAddr,
    issuer:         ISSUER_ADDRESS,
    region,
    competency,
    issuedAt:       Math.floor(new Date(issuedDate).getTime() / 1000),
    expiresAt:      validUntil,
    issuerNote:     issuerNote || undefined,
    ...(result ? { attestationUid: result.uid } : {}),
  };

  async function handleIssue() {
    setIssuing(true);
    setResult(null);
    setError(null);
    setRawError(null);
    setShowRaw(false);
    try {
      const res = await api.attestIssue({
        vendorAddress: recipientAddr as `0x${string}`,
        region,
        category: "other",
        validUntil,
        issuerNote: [credKey, competency, issuerNote].filter(Boolean).join(" | "),
      });
      setResult(res);
      fetchBalance();
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
        <div style={{ background: "#fff3e0", borderBottom: "2px solid #ef6c00" }}>
          <div style={{ padding: "12px 28px", display: "flex", alignItems: "flex-start", gap: 14, fontSize: 14 }}>
            <span style={{ fontSize: 20, lineHeight: 1.2, color: "#e65100" }}>⚠</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#bf360c", fontWeight: 700, marginBottom: 2 }}>Failed to issue credential</div>
              <div style={{ color: "#6d4c41" }}>{error}</div>
            </div>
            <button onClick={() => setShowRaw(v => !v)} style={{ background: "none", border: `1px solid #ef6c00`, borderRadius: 4, padding: "4px 10px", fontSize: 12, color: "#e65100", cursor: "pointer", whiteSpace: "nowrap", marginTop: 2 }}>
              {showRaw ? "Hide" : "Show"} details
            </button>
            <button onClick={() => { setError(null); setRawError(null); setShowRaw(false); }} style={{ background: "none", border: "none", fontSize: 20, color: "#bf360c", cursor: "pointer", lineHeight: 1, padding: "0 4px" }} aria-label="Dismiss">×</button>
          </div>
          {showRaw && rawError && (
            <div style={{ borderTop: "1px solid #ffcc80", background: "#fff8e1", padding: "10px 28px 12px 66px" }}>
              <pre style={{ margin: 0, fontSize: 11, fontFamily: "ui-monospace,Menlo,Consolas,monospace", color: "#4e342e", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{rawError}</pre>
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* ── Left — form ── */}
        <div className="card card-pad">
          <div className="eyebrow" style={{ marginBottom: 6 }}>New Credential · single recipient</div>
          <h2 style={{ margin: "4px 0 20px", fontSize: 22, fontWeight: 700, color: T.ink, letterSpacing: "-.01em" }}>
            Issue a community responder credential
          </h2>

          <Field label="Recipient name">
            <input
              type="text"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder="Full name"
              style={inputStyle}
            />
          </Field>

          <Field label="Recipient wallet address">
            <input
              type="text"
              value={recipientAddr}
              onChange={e => setRecipientAddr(e.target.value)}
              placeholder="0x…"
              style={{ ...inputStyle, fontFamily: "ui-monospace,Menlo,Consolas,monospace", fontSize: 13 }}
            />
          </Field>

          <Field label="Credential type">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CREDENTIAL_TYPES.map((c, i) => (
                <div key={i} onClick={() => { setSelectedCred(i); setResult(null); setError(null); setRawError(null); }}
                  style={{ padding: "12px 14px", borderRadius: 6, fontSize: 13, border: `2px solid ${i === selectedCred ? T.blueberry : T.divider}`, background: i === selectedCred ? "rgba(21,101,173,.05)" : "#fff", color: T.ink, fontWeight: i === selectedCred ? 600 : 500, cursor: "pointer", lineHeight: 1.4 }}>
                  {c.label}
                </div>
              ))}
            </div>
          </Field>

          <Field label="Competency area">
            <select value={competency} onChange={e => setCompetency(e.target.value)} style={selectStyle}>
              {COMPETENCY_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>

          <Field label="Region">
            <input
              type="text"
              value={region}
              onChange={e => setRegion(e.target.value)}
              placeholder="e.g. Puerto Rico"
              style={inputStyle}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Issued">
              <input type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Expires">
              <input type="date" value={expiresDate} onChange={e => setExpiresDate(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <Field label="Issuer note (optional)">
            <textarea
              value={issuerNote}
              onChange={e => setIssuerNote(e.target.value)}
              placeholder="Training hours, location, cohort ID…"
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          {balanceLow && (
            <div style={{ background: "#fff3e0", border: "1px solid #ef6c00", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#bf360c", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 16 }}>⚠</span>
              Issuer wallet ETH is low ({balance!.toFixed(5)} ETH). Issuance may fail on gas.
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button className="btn btn-ghost" style={{ flex: 1, padding: "14px", fontSize: 15 }}>Save draft</button>
            <button className="btn btn-primary btn-lg" style={{ flex: 1.4, opacity: issuing ? 0.7 : 1 }} onClick={handleIssue} disabled={issuing}>
              {issuing ? "Issuing…" : result ? "Issue again ↗" : "Issue credential ↗"}
            </button>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Issuer wallet */}
          <div className="card card-pad" style={{ borderColor: balanceLow ? "#ef6c00" : T.divider }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Issuer wallet · Base Sepolia</div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "7px 16px", alignItems: "center", fontSize: 14 }}>
              <span style={{ color: T.slate }}>Address</span>
              <span className="mono" style={{ color: T.ink, fontSize: 13 }}>
                {shortAddr(ISSUER_ADDRESS)}
                <a href={`https://sepolia.basescan.org/address/${ISSUER_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ color: T.blueberry, fontSize: 12, marginLeft: 8, textDecoration: "none" }}>BaseScan ↗</a>
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
                    <span style={{ fontWeight: 700, color: balanceLow ? "#e65100" : T.ink, fontSize: 15 }}>{balance!.toFixed(5)} ETH</span>
                    {balanceLow && <Pill tone="warn">Low</Pill>}
                    <button onClick={fetchBalance} style={{ background: "none", border: "none", color: T.pebble, cursor: "pointer", fontSize: 14, padding: 0 }} title="Refresh">↻</button>
                  </>
                )}
              </span>

              <span style={{ color: T.slate }}>Network</span>
              <span style={{ color: T.graphite }}>Base Sepolia (chain 84532)</span>
            </div>
          </div>

          {/* Credential preview card */}
          <div className="card" style={{ background: `linear-gradient(160deg, ${T.fig} 0%, #6e1547 100%)`, color: "#fff", padding: "24px 26px", borderColor: "transparent", position: "relative", overflow: "hidden", flex: 1 }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
            <div style={{ fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase", color: "rgba(255,255,255,.85)", fontWeight: 700, marginBottom: 8 }}>WCK · Skill Credential</div>

            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.01em", lineHeight: 1.15 }}>
              {credLabel.split(" · ")[0]}
              <div style={{ fontSize: 17, fontWeight: 500, opacity: .85 }}>
                Level {credLabel.includes("L2") ? "2" : "1"} — Frontline
              </div>
            </div>

            <div style={{ marginTop: 16, fontSize: 14, color: "rgba(255,255,255,.92)", lineHeight: 1.55 }}>
              Issued to <strong>{recipientName || "—"}</strong> by World Central Kitchen
              {region ? ` · ${region}` : ""}.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 14px", marginTop: 14, fontSize: 13 }}>
              <span style={{ opacity: .75 }}>Holder</span>  <span className="mono">{shortAddr(recipientAddr)}</span>
              <span style={{ opacity: .75 }}>Issuer</span>  <span className="mono">{shortAddr(ISSUER_ADDRESS)}</span>
              <span style={{ opacity: .75 }}>Schema</span>  <span className="mono">{credKey}</span>
              <span style={{ opacity: .75 }}>Issued</span>  <span>{issuedDate}</span>
              <span style={{ opacity: .75 }}>Expires</span> <span>{expiresDate}</span>
              {result && <><span style={{ opacity: .75 }}>UID</span><span className="mono" style={{ wordBreak: "break-all" }}>{result.uid.slice(0, 24)}…</span></>}
            </div>

            <button
              onClick={() => setShowPayload(true)}
              style={{ marginTop: 20, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 6, color: "#fff", fontWeight: 600, fontSize: 13, padding: "9px 16px", cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "center" }}
            >
              See Transaction Payload →
            </button>
          </div>

        </div>
      </div>

      {showPayload && (
        <PayloadModal payload={payload} easScanUrl={result?.easScanUrl} onClose={() => setShowPayload(false)} />
      )}
    </div>
  );
}
