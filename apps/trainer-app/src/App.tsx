import { useState, useEffect, useCallback } from "react";
import { Pill, PanMark } from "@aval/ui";
import { createAvalClient } from "@aval/sdk/api";

const api = createAvalClient(import.meta.env.VITE_API_URL, import.meta.env.VITE_API_KEY);

const ISSUER_ADDRESS   = "0xFa7C7B4a7D1a95c1D4CeF94e8B6774aFE74a7A58";
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
const LOW_ETH_THRESHOLD = 0.005;

const T = {
  blueberry: "#1565ad",
  fig:       "#9e2064",
  ink:       "#131313",
  graphite:  "#3a3a3a",
  slate:     "#5f6469",
  pebble:    "#8a8f93",
  divider:   "rgba(19,19,19,0.08)",
  border:    "rgba(19,19,19,0.14)",
};

// ── types ─────────────────────────────────────────────────────────────────────

type ProviderType = "metamask" | "coinbase" | "brave" | "unknown";

interface WalletState {
  address: string;
  providerType: ProviderType;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      isBraveWallet?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function shortAddr(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }
function toDateInputValue(d: Date) { return d.toISOString().slice(0, 10); }

function detectProvider(): ProviderType {
  const eth = window.ethereum;
  if (!eth) return "unknown";
  if (eth.isCoinbaseWallet) return "coinbase";
  if (eth.isBraveWallet)   return "brave";
  if (eth.isMetaMask)      return "metamask";
  return "unknown";
}

function friendlyError(raw: string): string {
  if (/insufficient funds/i.test(raw))        return "Issuer wallet has insufficient ETH for gas. Top up on Base Sepolia.";
  if (/nonce/i.test(raw))                      return "Transaction nonce conflict. Wait a moment and retry.";
  if (/timeout|ETIMEDOUT|network/i.test(raw)) return "Network error reaching Base Sepolia. Check connectivity.";
  if (/revert/i.test(raw))                     return "EAS contract reverted. Schema or recipient address may be invalid.";
  if (/401|403|api key/i.test(raw))            return "API authentication failed. Check VITE_API_KEY.";
  if (/404/i.test(raw))                        return "API endpoint not found. Verify VITE_API_URL.";
  if (/5\d\d/i.test(raw))                     return "Server error from the Aval API. Check Lambda logs in CloudWatch.";
  return "Unexpected error while issuing credential.";
}

// ── wallet provider logos ─────────────────────────────────────────────────────

function MetaMaskLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#E8831A"/>
      <path d="M19 5L13.2 9.3l1.1-2.5L19 5z" fill="#E2761B" stroke="#E2761B" strokeWidth=".1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 5l5.75 4.35-1.05-2.55L5 5zM16.8 15.55l-1.55.95.2 1.35 1.35.15V15.55zM8.75 17.85l1.35-.15.2-1.35-1.55-.95v2.45z" fill="#E4761B" stroke="#E4761B" strokeWidth=".1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.7 10.95l-.5 1.9 3.55-.15-.45-1.9-2.6.15zM13.2 9.3l-2.5.05-.5 1.6 2.6-.15.4-1.5z" fill="#E4761B" stroke="#E4761B" strokeWidth=".1"/>
      <path d="M8.75 17.85l.85-1.35-.95-.65-.55.65.65 1.35zM14.4 16.5l.85 1.35.65-1.35-.55-.65-.95.65z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth=".1"/>
      <path d="M15.25 17.85l-.85-1.35-1.55.95.15.7 2.25-.3zM9.6 17.85l2.25.3.15-.7-1.55-.95-.85 1.35z" fill="#233447" stroke="#233447" strokeWidth=".1"/>
      <path d="M11.7 14.6l-.9-.4-.65.3.15.85 1.4-.75zM12.3 14.6l1.4.75.15-.85-.65-.3-.9.4z" fill="#CD6116" stroke="#CD6116" strokeWidth=".1"/>
      <path d="M10.1 15.55l-.55-.65-.95.65 1.5-.65v.65zM13.9 15.55v-.65l1.5.65-.95-.65-.55.65z" fill="#E4751F" stroke="#E4751F" strokeWidth=".1"/>
    </svg>
  );
}

function CoinbaseLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#0052FF"/>
      <circle cx="12" cy="12" r="7" fill="#0052FF"/>
      <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5" fill="none"/>
      <rect x="9.5" y="10.5" width="5" height="3" rx="1.5" fill="white"/>
    </svg>
  );
}

function BraveLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#FB542B"/>
      <path d="M12 5l5 3.5-1.8 7.5-3.2 3-3.2-3L7 8.5 12 5z" fill="white" opacity=".9"/>
    </svg>
  );
}

function WalletLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#5f6469"/>
      <rect x="5" y="8" width="14" height="9" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M5 11h14" stroke="white" strokeWidth="1.5"/>
      <circle cx="16" cy="14" r="1" fill="white"/>
    </svg>
  );
}

function ProviderLogo({ type }: { type: ProviderType }) {
  if (type === "metamask") return <MetaMaskLogo />;
  if (type === "coinbase") return <CoinbaseLogo />;
  if (type === "brave")    return <BraveLogo />;
  return <WalletLogo />;
}

// ── issuer wallet modal ───────────────────────────────────────────────────────

function IssuerWalletModal({
  balance, balanceLoading, balanceError, balanceLow, onRefresh, onClose,
}: {
  balance: number | null; balanceLoading: boolean; balanceError: boolean;
  balanceLow: boolean; onRefresh: () => void; onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    navigator.clipboard.writeText(ISSUER_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", width: 520, maxWidth: "90vw", boxShadow: "0 20px 50px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 3 }}>WCK EAS Signing Wallet</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>Issuer Wallet · Base Sepolia</div>
          </div>
          <button onClick={onClose} style={{ background: T.divider, border: "none", borderRadius: 6, color: T.slate, fontSize: 18, lineHeight: 1, padding: "6px 10px", cursor: "pointer" }}>×</button>
        </div>

        {/* address row */}
        <div style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 5 }}>Address</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#f8f7f5", borderRadius: 8, border: `1px solid ${T.border}` }}>
            <span className="mono" style={{ flex: 1, fontSize: 12.5, color: T.ink, wordBreak: "break-all" }}>{ISSUER_ADDRESS}</span>
            <button
              onClick={copyAddress}
              style={{ background: copied ? "#e8f5e9" : "#fff", border: `1px solid ${copied ? "#a5d6a7" : T.border}`, borderRadius: 5, padding: "5px 10px", fontSize: 11.5, fontWeight: 600, color: copied ? "#2e7d32" : T.slate, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* balance + network */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div style={{ padding: "12px 14px", background: "#f8f7f5", borderRadius: 8, border: `1px solid ${balanceLow ? "#ef6c00" : T.border}` }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>ETH Balance</div>
            {balanceLoading ? (
              <span style={{ fontSize: 13, color: T.pebble, fontStyle: "italic" }}>fetching…</span>
            ) : balanceError ? (
              <span style={{ fontSize: 13, color: "#c62828" }}>RPC error <button onClick={onRefresh} style={{ background: "none", border: "none", color: T.blueberry, cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0 }}>retry</button></span>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: balanceLow ? "#e65100" : T.ink }}>{balance!.toFixed(5)} ETH</span>
                {balanceLow && <Pill tone="warn">Low</Pill>}
              </div>
            )}
          </div>
          <div style={{ padding: "12px 14px", background: "#f8f7f5", borderRadius: 8, border: `1px solid ${T.border}` }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Network</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Base Sepolia</div>
            <div style={{ fontSize: 12, color: T.slate }}>Chain ID 84532</div>
          </div>
        </div>

        {balanceLow && (
          <div style={{ background: "#fff3e0", border: "1px solid #ef6c00", borderRadius: 6, padding: "8px 12px", fontSize: 12.5, color: "#bf360c", marginBottom: 14, display: "flex", gap: 6, alignItems: "center" }}>
            ⚠ Balance is low — issuances may fail on gas.
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href={`https://sepolia.basescan.org/address/${ISSUER_ADDRESS}`} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 14px", background: T.blueberry, color: "#fff", borderRadius: 7, fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>
            View on BaseScan ↗
          </a>
          <button onClick={onRefresh} style={{ padding: "10px 14px", background: "none", border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 14, color: T.slate, cursor: "pointer" }} title="Refresh balance">↻ Refresh</button>
        </div>
      </div>
    </div>
  );
}

// ── payload modal ─────────────────────────────────────────────────────────────

function PayloadModal({ payload, easScanUrl, onClose }: { payload: Record<string, unknown>; easScanUrl?: string; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1a1a2e", borderRadius: 12, padding: "26px 30px", width: 540, maxWidth: "90vw", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#7986cb", fontWeight: 700, marginBottom: 3 }}>Transaction Payload · Base Sepolia</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#e8eaf6" }}>EAS attestation data</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.08)", border: "none", borderRadius: 6, color: "#9fa8da", fontSize: 18, lineHeight: 1, padding: "6px 10px", cursor: "pointer" }}>×</button>
        </div>
        <pre style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, fontFamily: "ui-monospace,Menlo,Consolas,monospace", color: "#a5d6a7", background: "rgba(0,0,0,0.35)", borderRadius: 8, padding: "14px 18px", overflow: "auto", maxHeight: 340 }}>
          {JSON.stringify(payload, null, 2)}
        </pre>
        <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
          {easScanUrl && <a href={easScanUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#7986cb", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>View on EAS Scan ↗</a>}
          <button onClick={onClose} style={{ background: "#3949ab", border: "none", borderRadius: 6, color: "#fff", fontWeight: 600, fontSize: 13, padding: "8px 18px", cursor: "pointer", fontFamily: "inherit" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── holographic signature ─────────────────────────────────────────────────────

function HolographicSignature({ uid }: { uid?: string }) {
  const bytes = uid ? (uid.slice(2).match(/.{2}/g) ?? []) : null;
  return (
    <div style={{ marginTop: 14, borderRadius: 10, overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,0.18)" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      <div className="holo-shimmer" />
      <div style={{ position: "relative", zIndex: 1, padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 13 }}>🔏</span>
          <span style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>WCK Digital Signature</span>
          {uid && <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 700, color: "#4ade80", letterSpacing: ".04em" }}>✓ VERIFIED</span>}
        </div>
        {bytes ? (
          <>
            <div style={{ fontFamily: "ui-monospace,Menlo,Consolas,monospace", fontSize: 11, lineHeight: 1.85, display: "flex", flexWrap: "wrap", gap: "1px 4px", letterSpacing: ".04em" }}>
              {bytes.map((byte, i) => {
                const val = parseInt(byte, 16);
                const hue = (val / 255) * 260 + 160;
                const light = 65 + (val % 20);
                return <span key={i} style={{ color: `hsl(${hue},95%,${light}%)`, textShadow: `0 0 8px hsl(${hue},100%,${light}%)`, fontWeight: 500 }}>{byte}</span>;
              })}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 16, fontSize: 10.5, color: "rgba(255,255,255,0.4)", letterSpacing: ".03em" }}>
              <span>secp256k1</span><span>EAS v1.3.0</span><span>Base Sepolia</span>
              <span style={{ marginLeft: "auto" }}>Issuer {shortAddr(ISSUER_ADDRESS)}</span>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "ui-monospace,Menlo,Consolas,monospace", fontSize: 11, color: "rgba(255,255,255,0.18)", letterSpacing: ".12em", lineHeight: 1.85 }}>
              {["░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░",
                "░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░",
                "░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░"].map((r, i) => <div key={i}>{r}</div>)}
            </div>
            <div style={{ marginTop: 8, fontSize: 10.5, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>Awaiting issuance — signature will appear here</div>
          </>
        )}
      </div>
    </div>
  );
}

// ── credential data ───────────────────────────────────────────────────────────

const CREDENTIAL_TYPES = [
  { label: "Safe Food Distribution · L1", key: "WCK-SafeFoodDistribution-L1" },
  { label: "Kitchen Lead · L2",           key: "WCK-KitchenLead-L2"          },
  { label: "Supply Coordination · L1",    key: "WCK-SupplyCoordination-L1"   },
  { label: "Disaster Response · L1",      key: "WCK-DisasterResponse-L1"     },
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

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "8px 10px",
  border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13.5,
  background: "#fff", color: T.ink, fontFamily: "inherit", lineHeight: 1.4,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235f6469' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28, cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em",
  textTransform: "uppercase", color: T.slate, marginBottom: 4,
};

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: 10, ...style }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ── app ───────────────────────────────────────────────────────────────────────

export function App() {
  // wallet connection
  const [wallet, setWallet]           = useState<WalletState | null>(null);
  const [connecting, setConnecting]   = useState(false);
  const [showIssuerModal, setShowIssuerModal] = useState(false);

  // form
  const [selectedCred, setSelectedCred]   = useState(0);
  const [recipientAddr, setRecipientAddr] = useState("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
  const [recipientName, setRecipientName] = useState("Yamileth Cruz");
  const [competency, setCompetency]       = useState(COMPETENCY_OPTIONS[0]);
  const [region, setRegion]               = useState("Puerto Rico");
  const [issuedDate, setIssuedDate]       = useState(toDateInputValue(new Date()));
  const [expiresDate, setExpiresDate]     = useState(toDateInputValue(new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2)));
  const [issuerNote, setIssuerNote]       = useState("");

  // issue
  const [issuing, setIssuing]       = useState(false);
  const [result, setResult]         = useState<{ uid: string; easScanUrl: string } | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [rawError, setRawError]     = useState<string | null>(null);
  const [showRaw, setShowRaw]       = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  // issuer wallet balance
  const [balance, setBalance]               = useState<number | null>(null);
  const [balanceError, setBalanceError]     = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true); setBalanceError(false);
    try {
      const res = await fetch(BASE_SEPOLIA_RPC, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [ISSUER_ADDRESS, "latest"] }) });
      const { result: hex } = await res.json() as { result: string };
      setBalance(Number(BigInt(hex)) / 1e18);
    } catch { setBalanceError(true); }
    finally { setBalanceLoading(false); }
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  async function connectWallet() {
    if (!window.ethereum) { alert("No web3 wallet detected. Install MetaMask or Coinbase Wallet."); return; }
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      setWallet({ address: accounts[0], providerType: detectProvider() });
    } catch { /* user rejected */ }
    finally { setConnecting(false); }
  }

  async function disconnectWallet() {
    try {
      // Revoke dapp permission so the provider forgets the connection
      await window.ethereum?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch { /* provider may not support wallet_revokePermissions — clear state anyway */ }
    setWallet(null);
  }

  const credKey    = CREDENTIAL_TYPES[selectedCred]?.key ?? "";
  const credLabel  = CREDENTIAL_TYPES[selectedCred]?.label ?? "";
  const validUntil = Math.floor(new Date(expiresDate).getTime() / 1000);
  const balanceLow = balance !== null && balance < LOW_ETH_THRESHOLD;

  const payload = {
    schema: "WCK-Skill", credentialType: credKey, recipient: recipientAddr, issuer: ISSUER_ADDRESS,
    region, competency, issuedAt: Math.floor(new Date(issuedDate).getTime() / 1000), expiresAt: validUntil,
    ...(issuerNote ? { issuerNote } : {}), ...(result ? { attestationUid: result.uid } : {}),
  };

  async function handleIssue() {
    setIssuing(true); setResult(null); setError(null); setRawError(null); setShowRaw(false);
    try {
      const res = await api.attestIssue({ vendorAddress: recipientAddr as `0x${string}`, region, category: "other", validUntil, issuerNote: [credKey, competency, issuerNote].filter(Boolean).join(" | ") });
      setResult(res); fetchBalance();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setRawError(msg); setError(friendlyError(msg));
    } finally { setIssuing(false); }
  }

  return (
    <>
      <style>{`
        @keyframes holo {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .holo-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(125deg,
            rgba(0,255,180,0.22) 0%, rgba(80,80,255,0.28) 18%,
            rgba(255,180,0,0.22) 36%, rgba(0,210,255,0.28) 54%,
            rgba(255,0,160,0.22) 72%, rgba(0,255,180,0.22) 90%
          );
          background-size: 500% 500%;
          animation: holo 6s ease infinite;
          mix-blend-mode: screen; pointer-events: none;
        }
      `}</style>

      <div className="aval-app">

        {/* ── Custom AppBar ── */}
        <div className="aval-bar">
          <div className="aval-bar-brand"><PanMark /><span>Aval</span></div>
          <div className="aval-bar-divider" />
          <div className="aval-bar-app">Trainer App<small>· Issue skill credential</small></div>
          <Pill tone="saffron">WCK-Skill schema</Pill>
          <div className="aval-bar-spacer" />

          {wallet ? (
            /* connected: show provider logo — click opens issuer wallet modal */
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{shortAddr(wallet.address)}</div>
                <div style={{ fontSize: 11, color: T.slate }}>WCK Trainer</div>
              </div>
              <button
                onClick={() => setShowIssuerModal(true)}
                title="View issuer wallet"
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center" }}
              >
                <ProviderLogo type={wallet.providerType} />
              </button>
              <button
                onClick={disconnectWallet}
                title="Disconnect wallet"
                style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, color: T.slate, fontSize: 11.5, fontWeight: 600, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            /* not connected */
            <button
              onClick={connectWallet}
              disabled={connecting}
              style={{ background: T.blueberry, border: "none", borderRadius: 7, color: "#fff", fontWeight: 600, fontSize: 13, padding: "8px 16px", cursor: connecting ? "default" : "pointer", fontFamily: "inherit", opacity: connecting ? 0.7 : 1 }}
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>

        {/* ── Success banner ── */}
        {result && (
          <div style={{ background: "#e8f5e9", borderBottom: "1px solid #a5d6a7", padding: "9px 24px", display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
            <span>✓</span>
            <span style={{ color: "#1b5e20", fontWeight: 600 }}>Credential issued on-chain.</span>
            <span style={{ color: "#2e7d32" }}>UID: <span style={{ fontFamily: "monospace" }}>{result.uid.slice(0, 20)}…</span></span>
            <a href={result.easScanUrl} target="_blank" rel="noopener noreferrer" style={{ color: T.blueberry, fontWeight: 600, textDecoration: "none", marginLeft: "auto" }}>View on EAS Scan ↗</a>
          </div>
        )}

        {/* ── Error banner ── */}
        {error && (
          <div style={{ background: "#fff3e0", borderBottom: "2px solid #ef6c00" }}>
            <div style={{ padding: "9px 24px", display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
              <span style={{ color: "#e65100", fontSize: 15, lineHeight: 1.3 }}>⚠</span>
              <div style={{ flex: 1 }}>
                <span style={{ color: "#bf360c", fontWeight: 700 }}>Failed to issue credential — </span>
                <span style={{ color: "#6d4c41" }}>{error}</span>
              </div>
              <button onClick={() => setShowRaw(v => !v)} style={{ background: "none", border: `1px solid #ef6c00`, borderRadius: 4, padding: "3px 8px", fontSize: 11, color: "#e65100", cursor: "pointer", whiteSpace: "nowrap" }}>{showRaw ? "Hide" : "Show"} details</button>
              <button onClick={() => { setError(null); setRawError(null); setShowRaw(false); }} style={{ background: "none", border: "none", fontSize: 18, color: "#bf360c", cursor: "pointer", lineHeight: 1, padding: "0 2px" }}>×</button>
            </div>
            {showRaw && rawError && (
              <div style={{ borderTop: "1px solid #ffcc80", background: "#fff8e1", padding: "8px 24px 10px 52px" }}>
                <pre style={{ margin: 0, fontSize: 11, fontFamily: "ui-monospace,Menlo,Consolas,monospace", color: "#4e342e", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{rawError}</pre>
              </div>
            )}
          </div>
        )}

        {/* ── Main grid ── */}
        <div style={{ flex: 1, overflow: "hidden", padding: "14px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "stretch" }}>

          {/* ── Left: form only ── */}
          <div className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: T.ink, letterSpacing: "-.01em", flexShrink: 0 }}>
              Issue a community responder credential
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 10, flexShrink: 0 }}>
              <Field label="Recipient name">
                <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Full name" style={inputStyle} />
              </Field>
              <Field label="Wallet address">
                <input type="text" value={recipientAddr} onChange={e => setRecipientAddr(e.target.value)} placeholder="0x…" style={{ ...inputStyle, fontFamily: "ui-monospace,Menlo,Consolas,monospace", fontSize: 12 }} />
              </Field>
            </div>

            <Field label="Credential type" style={{ flexShrink: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {CREDENTIAL_TYPES.map((c, i) => (
                  <div key={i} onClick={() => { setSelectedCred(i); setResult(null); setError(null); setRawError(null); }}
                    style={{ padding: "9px 12px", borderRadius: 6, fontSize: 12.5, border: `2px solid ${i === selectedCred ? T.blueberry : T.divider}`, background: i === selectedCred ? "rgba(21,101,173,.05)" : "#fff", color: T.ink, fontWeight: i === selectedCred ? 600 : 400, cursor: "pointer", lineHeight: 1.35 }}>
                    {c.label}
                  </div>
                ))}
              </div>
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, flexShrink: 0 }}>
              <Field label="Competency area">
                <select value={competency} onChange={e => setCompetency(e.target.value)} style={selectStyle}>
                  {COMPETENCY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Region">
                <input type="text" value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Puerto Rico" style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flexShrink: 0 }}>
              <Field label="Issued">
                <input type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Expires">
                <input type="date" value={expiresDate} onChange={e => setExpiresDate(e.target.value)} style={inputStyle} />
              </Field>
            </div>

            <Field label="Issuer note (optional)" style={{ flexShrink: 0 }}>
              <textarea value={issuerNote} onChange={e => setIssuerNote(e.target.value)} placeholder="Training hours, location, cohort ID…" rows={1} style={{ ...inputStyle, resize: "none" }} />
            </Field>

            {balanceLow && (
              <div style={{ background: "#fff3e0", border: "1px solid #ef6c00", borderRadius: 6, padding: "7px 12px", fontSize: 12, color: "#bf360c", marginBottom: 10, display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                ⚠ Issuer ETH is low ({balance!.toFixed(4)} ETH). Issuance may fail on gas.
              </div>
            )}

            <div style={{ flex: 1 }} />

            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="btn btn-ghost" style={{ flex: 1, padding: "11px", fontSize: 14 }}>Save draft</button>
              <button className="btn btn-primary" style={{ flex: 1.5, opacity: issuing ? 0.7 : 1, padding: "11px 18px", fontSize: 14, fontWeight: 600, borderRadius: 7 }} onClick={handleIssue} disabled={issuing}>
                {issuing ? "Issuing…" : result ? "Issue again ↗" : "Issue credential ↗"}
              </button>
            </div>
          </div>

          {/* ── Right: credential card ── */}
          <div className="card" style={{ background: `linear-gradient(160deg, ${T.fig} 0%, #6e1547 100%)`, color: "#fff", padding: "22px 24px", borderColor: "transparent", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexShrink: 0 }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.75)", fontWeight: 700 }}>WCK · Skill Credential</div>
              <button onClick={() => setShowPayload(true)} style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 5, color: "rgba(255,255,255,.85)", fontSize: 11, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Payload ↗</button>
            </div>

            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.01em", lineHeight: 1.1, flexShrink: 0 }}>{credLabel.split(" · ")[0]}</div>
            <div style={{ fontSize: 16, fontWeight: 500, opacity: .78, marginTop: 3, marginBottom: 14, flexShrink: 0 }}>Level {credLabel.includes("L2") ? "2" : "1"} — Frontline</div>

            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)", lineHeight: 1.55, marginBottom: 14, flexShrink: 0 }}>
              Issued to <strong>{recipientName || "—"}</strong> by World Central Kitchen{region ? ` · ${region}` : ""}.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", fontSize: 12.5, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 12, flexShrink: 0 }}>
              <span style={{ opacity: .6 }}>Holder</span>  <span className="mono">{shortAddr(recipientAddr)}</span>
              <span style={{ opacity: .6 }}>Issuer</span>  <span className="mono">{shortAddr(ISSUER_ADDRESS)}</span>
              <span style={{ opacity: .6 }}>Schema</span>  <span className="mono" style={{ fontSize: 11.5 }}>{credKey}</span>
              <span style={{ opacity: .6 }}>Issued</span>  <span>{issuedDate}</span>
              <span style={{ opacity: .6 }}>Expires</span> <span>{expiresDate}</span>
              {result && <><span style={{ opacity: .6 }}>UID</span><span className="mono" style={{ wordBreak: "break-all", fontSize: 11 }}>{result.uid.slice(0, 28)}…</span></>}
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <HolographicSignature uid={result?.uid} />
            </div>
          </div>

        </div>
      </div>

      {showIssuerModal && (
        <IssuerWalletModal
          balance={balance} balanceLoading={balanceLoading} balanceError={balanceError} balanceLow={balanceLow}
          onRefresh={fetchBalance} onClose={() => setShowIssuerModal(false)}
        />
      )}
      {showPayload && <PayloadModal payload={payload} easScanUrl={result?.easScanUrl} onClose={() => setShowPayload(false)} />}
    </>
  );
}
