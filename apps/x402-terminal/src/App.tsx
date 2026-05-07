import { useState, useEffect } from "react";
import type { ReactNode } from "react";

function L({ children }: { children?: ReactNode }) {
  return <div style={{ minHeight: "1.7em" }}>{children}</div>;
}

const cy = (s: string) => <span style={{ color: "#7dd3fc" }}>{s}</span>;
const gr = (s: string) => <span style={{ color: "#86efac" }}>{s}</span>;
const ye = (s: string) => <span style={{ color: "#fde047" }}>{s}</span>;
const re = (s: string) => <span style={{ color: "#fca5a5" }}>{s}</span>;
const pk = (s: string) => <span style={{ color: "#f0abfc" }}>{s}</span>;
const mu = (s: string) => <span style={{ color: "#5b6470" }}>{s}</span>;
const bl = (s: string) => <span style={{ color: "#93c5fd" }}>{s}</span>;

interface Step { delay: number; node: ReactNode; }

const STEPS: Step[] = [
  { delay: 0,    node: <L>{mu("$")} <span style={{color:"#f3f5f8"}}>node verify-agent.js --vendor=carlos --activation=CRBN-2026-04</span></L> },
  { delay: 300,  node: <L /> },
  { delay: 500,  node: <L>{cy("▸")} {bl("Aval Donor-Agent SDK")} {mu("v0.1.2")}</L> },
  { delay: 700,  node: <L>{cy("▸")} Loaded wallet {ye("0xC0FFEE…D0n0r")} · balance {gr("10.00 USDC")}</L> },
  { delay: 900,  node: <L>{cy("▸")} Target endpoint {pk("https://aval.wck.dev/credential/verify")}</L> },
  { delay: 1100, node: <L /> },
  { delay: 1300, node: <L>{cy("[1/4]")} Probing endpoint…</L> },
  { delay: 1600, node: <L>{"      "}GET /credential/verify?vendor=carlos&activation=CRBN-2026-04</L> },
  { delay: 2200, node: <L>{"      "}{re("← HTTP 402 Payment Required")}</L> },
  { delay: 2400, node: <L>{"      "}{mu("x-payment-amount:  10000   (0.01 USDC)")}</L> },
  { delay: 2600, node: <L>{"      "}{mu("x-payment-address: 0x2A0e…1f44")}</L> },
  { delay: 2800, node: <L>{"      "}{mu("x-payment-asset:   USDC on Base Sepolia (chainId 84532)")}</L> },
  { delay: 3000, node: <L /> },
  { delay: 3200, node: <L>{cy("[2/4]")} Signing payment via Coinbase Facilitator…</L> },
  { delay: 3600, node: <L>{"      "}{gr("✓")} EIP-3009 transferWithAuthorization signed</L> },
  { delay: 3900, node: <L>{"      "}{gr("✓")} Facilitator verified · settlement scheduled</L> },
  { delay: 4100, node: <L>{"      "}{mu("tx: 0x9c1d2eaf…a4017c   nonce: 0x88…2b")}</L> },
  { delay: 4300, node: <L /> },
  { delay: 4500, node: <L>{cy("[3/4]")} Retrying with X-Payment header…</L> },
  { delay: 4800, node: <L>{"      "}GET /credential/verify {"  "}{mu("(retry)")}</L> },
  { delay: 5400, node: <L>{"      "}{gr("← HTTP 200 OK")} · {mu("signed by 0x2A0e…1f44 (WCK Issuer)")}</L> },
  { delay: 5600, node: <L /> },
  { delay: 5800, node: <L>{cy("[4/4]")} Attestation chain returned:</L> },
  { delay: 6000, node: <L /> },
];

const JSON_DELAY = 6200;

const TAIL: Step[] = [
  { delay: 7000, node: <L>{gr("✓")} Verified on-chain · cost {ye("$0.01 USDC")} · elapsed {ye("1.84s")}</L> },
  { delay: 7200, node: <L><span style={{color:"#7e8794"}}>{"  "}No API key. No subscription. Pay-per-call. Aval speaks x402.</span></L> },
  { delay: 7400, node: <L /> },
];

export function App() {
  const [count, setCount] = useState(0);
  const [showJson, setShowJson] = useState(false);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    setCount(0);
    setShowJson(false);
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((s, i) => {
      timers.push(setTimeout(() => setCount(i + 1), s.delay));
    });
    TAIL.forEach((s, i) => {
      timers.push(setTimeout(() => setCount(STEPS.length + i + 1), s.delay));
    });
    timers.push(setTimeout(() => setShowJson(true), JSON_DELAY));
    return () => timers.forEach(clearTimeout);
  }, [replay]);

  const totalSteps = STEPS.length + TAIL.length;

  return (
    <div className="aval-app" style={{ background: "#0e1116" }}>
      <div style={{ flex: "0 0 auto", background: "#1a1f26", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #000" }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ed6a5e", display: "inline-block" }} />
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#f5bf4f", display: "inline-block" }} />
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#62c554", display: "inline-block" }} />
        <span style={{ color: "#7e8794", fontSize: 12, marginLeft: 14, fontFamily: "ui-monospace,Menlo,Consolas,monospace" }}>
          donor-agent ▸ ~/aval-demo ▸ node verify-agent.js
        </span>
        <span style={{ marginLeft: "auto", color: "#7e8794", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700 }}>
          Live · Coinbase x402 · Base Sepolia
        </span>
        <button onClick={() => setReplay((r) => r + 1)} style={{ marginLeft: 12, background: "rgba(255,255,255,.10)", border: "none", color: "#cfd6df", borderRadius: 4, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          ↺ Replay
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "22px 28px", fontFamily: "ui-monospace,Menlo,Consolas,monospace", fontSize: 13, lineHeight: 1.7, color: "#cfd6df" }}>
        {STEPS.slice(0, count).map((s, i) => <div key={i}>{s.node}</div>)}

        {showJson && (
          <div style={{ background: "#161b22", border: "1px solid #2a3140", borderRadius: 6, padding: "14px 18px", marginBottom: 14, marginTop: 6 }}>
            <L>{gr("{")}</L>
            <L>{"  "}{bl('"vendor"')}: {"{"}</L>
            <L>{"    "}{bl('"holder"')}:     {ye('"0x9f2A4F18b13b…D4c1"')},</L>
            <L>{"    "}{bl('"schema"')}:     {pk('"WCK-Vendor"')},</L>
            <L>{"    "}{bl('"status"')}:     {gr('"approved"')},</L>
            <L>{"    "}{bl('"region"')}:     {ye('"PR"')},</L>
            <L>{"    "}{bl('"category"')}:   {ye('"restaurant"')},</L>
            <L>{"    "}{bl('"validUntil"')}: {ye('"2027-12-31"')},</L>
            <L>{"    "}{bl('"easUid"')}:     {ye('"0x83fc09d11e21d…"')}</L>
            <L>{"  "}{"}"},{" "}</L>
            <L>{"  "}{bl('"activity"')}: {"{"}</L>
            <L>{"    "}{bl('"mealsToday"')}:       {gr("12")},</L>
            <L>{"    "}{bl('"usdcSettledToday"')}: {gr("80.00")},</L>
            <L>{"    "}{bl('"lastSettlementTx"')}: {ye('"0x4a1c…f88e"')}</L>
            <L>{"  "}{"}"},{" "}</L>
            <L>{"  "}{bl('"signature"')}: {ye('"0x71b3…ed9f02ac"')}</L>
            <L>{gr("}")}</L>
          </div>
        )}

        {TAIL.slice(0, Math.max(0, count - STEPS.length)).map((s, i) => <div key={i}>{s.node}</div>)}

        {count >= totalSteps && (
          <L>
            {mu("$")}{" "}
            <span style={{ display: "inline-block", width: 8, height: 14, background: "#cfd6df", verticalAlign: "middle", animation: "blink 1.05s steps(1) infinite" }} />
          </L>
        )}
      </div>

      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}
