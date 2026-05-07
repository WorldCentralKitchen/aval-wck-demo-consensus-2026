import { useEffect, useState } from "react";
import { AppBar, Pill } from "@aval/ui";
import { createAvalClient, type AttestVerifyResult } from "@aval/sdk/api";

const api = createAvalClient(
  import.meta.env.VITE_API_URL ?? "",
  import.meta.env.VITE_API_KEY ?? "",
);

// Demo default — judges can override with ?address=0x...
const DEMO_VENDOR_ADDRESS = "0xFa7C7B4a7D1a95c1D4CeF94e8B6774aFE74a7A58";

function getVendorAddress(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("address") ?? DEMO_VENDOR_ADDRESS;
}

function fmtTimestamp(ts: string): string {
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

const T = {
  blueberry: "#1565ad",
  saffron:   "#e86027",
  seafoam:   "#d0ecf2",
  pea:       "#8cc540",
  ink:       "#131313",
  graphite:  "#3a3a3a",
  slate:     "#5f6469",
  pebble:    "#8a8f93",
  paper:     "#f4f2ee",
  divider:   "rgba(19,19,19,0.08)",
};

const DISBURSEMENTS = [
  { date: "Today · 14:32",      meals: 12, usdc: 80.00,  tx: "0x4a1c…f88e" },
  { date: "Yesterday · 14:18",  meals: 18, usdc: 120.00, tx: "0x9b3d…a201" },
  { date: "Apr 12 · 14:21",     meals: 9,  usdc: 60.00,  tx: "0x71ee…3c0a" },
  { date: "Apr 11 · 14:05",     meals: 14, usdc: 93.33,  tx: "0x223a…ee71" },
];

export function App() {
  const vendorAddress = getVendorAddress();
  const [status, setStatus] = useState<"loading" | "verified" | "unverified" | "error">("loading");
  const [attestation, setAttestation] = useState<AttestVerifyResult["attestation"] | null>(null);

  useEffect(() => {
    api.attestVerify({ vendorAddress })
      .then((res) => {
        if (res.attested && res.attestation) {
          setAttestation(res.attestation);
          setStatus("verified");
        } else {
          setStatus("unverified");
        }
      })
      .catch(() => setStatus("error"));
  }, [vendorAddress]);

  const isVerified = status === "verified";

  return (
    <div className="aval-app">
      <AppBar
        appName="Vendor Portal"
        user="Carlos Méndez"
        role="Cocina La Borinqueña"
        badge={
          status === "loading"  ? <Pill tone="neutral" dot>Checking…</Pill> :
          isVerified            ? <Pill tone="success" dot>Verified vendor</Pill> :
          status === "error"    ? <Pill tone="warn">Check failed</Pill> :
                                  <Pill tone="neutral">Not yet verified</Pill>
        }
      />

      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
        {/* Hero */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, marginBottom: 18 }}>

          {/* Attestation card */}
          {status === "loading" ? (
            <div className="card" style={{ padding: "24px 26px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
              <div style={{ color: T.slate, fontSize: 14 }}>Checking attestation on Base Sepolia…</div>
            </div>
          ) : isVerified && attestation ? (
            <div className="card" style={{ background: `linear-gradient(135deg, ${T.blueberry} 0%, #0f4f89 100%)`, color: "#fff", padding: "24px 26px", borderColor: "transparent", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase", color: "rgba(255,255,255,.75)", fontWeight: 700 }}>WCK-Vendor Attestation</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>You're verified.</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.85)", marginTop: 6, lineHeight: 1.5 }}>
                  Attested on {fmtTimestamp(attestation.time)}. Your credential is live on Base Sepolia and recognized by every WCK distribution point in this activation.
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", padding: "12px 14px", background: "rgba(255,255,255,.10)", borderRadius: 6, fontSize: 13 }}>
                <span style={{ color: "rgba(255,255,255,.7)" }}>Schema</span>
                <span className="mono" style={{ color: "#fff" }}>WCK-Vendor</span>
                <span style={{ color: "rgba(255,255,255,.7)" }}>Holder</span>
                <span className="mono" style={{ color: "#fff" }}>{shortAddr(attestation.recipient)}</span>
                <span style={{ color: "rgba(255,255,255,.7)" }}>Attested</span>
                <span style={{ color: "#fff" }}>{fmtTimestamp(attestation.time)}</span>
                <span style={{ color: "rgba(255,255,255,.7)" }}>UID</span>
                <span className="mono" style={{ color: "#fff" }}>{shortAddr(attestation.uid)}</span>
              </div>
              <a
                href={`https://base-sepolia.easscan.org/attestation/view/${attestation.uid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ alignSelf: "flex-start", background: "rgba(255,255,255,.16)", color: "#fff", borderRadius: 6, padding: "10px 14px", textDecoration: "none" }}
              >
                View on EAS Scan ↗
              </a>
            </div>
          ) : (
            <div className="card" style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 14, borderTop: `3px solid ${T.pebble}` }}>
              <div style={{ fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase", color: T.pebble, fontWeight: 700 }}>WCK-Vendor Attestation</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.graphite }}>Not yet verified.</div>
                <div style={{ fontSize: 14, color: T.slate, marginTop: 6, lineHeight: 1.5 }}>
                  {status === "error"
                    ? "Could not reach the attestation service. Please try again."
                    : "Your onboarding application is under review. A WCK KYC officer will issue your on-chain credential once approved."}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", padding: "12px 14px", background: T.paper, borderRadius: 6, fontSize: 13 }}>
                <span style={{ color: T.pebble }}>Address</span>
                <span className="mono" style={{ color: T.graphite }}>{shortAddr(vendorAddress)}</span>
                <span style={{ color: T.pebble }}>Schema</span>
                <span style={{ color: T.graphite }}>WCK-Vendor</span>
                <span style={{ color: T.pebble }}>Status</span>
                <span style={{ color: T.graphite }}>Pending KYC review</span>
              </div>
            </div>
          )}

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="card card-pad">
              <div className="stat-label">USDC Wallet</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                <div className="stat-value">353.33</div>
                <div style={{ fontSize: 14, color: T.slate, fontWeight: 600 }}>USDC</div>
              </div>
              <div className="stat-sub">on Base Sepolia · CDP-managed</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button className="btn btn-accent" style={{ fontSize: 13, padding: "8px 12px" }}>Off-ramp</button>
                <button className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 12px" }}>History</button>
              </div>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.divider}`, fontSize: 12, color: T.slate, lineHeight: 1.5 }}>
                Off-ramp ready via <strong style={{ color: T.graphite }}>Bitso PR</strong>{" · "}ACH 1–2 business days.
              </div>
            </div>

            <div className="card card-pad">
              <div className="stat-label">Today</div>
              <div style={{ display: "flex", gap: 18, marginTop: 6, alignItems: "baseline" }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.ink, lineHeight: 1 }}>12</div>
                  <div className="stat-sub" style={{ marginTop: 4 }}>meals served</div>
                </div>
                <div style={{ width: 1, alignSelf: "stretch", background: T.divider }} />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.ink, lineHeight: 1 }}>$80</div>
                  <div className="stat-sub" style={{ marginTop: 4 }}>incoming · 6h</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disbursements */}
        <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
          <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.divider}` }}>
            <div>
              <div className="eyebrow">Recent Disbursements</div>
              <div style={{ fontSize: 13, color: T.slate, marginTop: 2 }}>Settled daily at 14:00 local · USDC on Base Sepolia</div>
            </div>
            <Pill tone="success" dot>Auto-settle on</Pill>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>When</th><th>Meals</th><th>Amount</th><th>Status</th><th>Transaction</th></tr>
            </thead>
            <tbody>
              {DISBURSEMENTS.map((d, i) => (
                <tr key={i}>
                  <td>{d.date}</td>
                  <td>{d.meals}</td>
                  <td style={{ fontWeight: 600, color: T.ink }}>{d.usdc.toFixed(2)} USDC</td>
                  <td><Pill tone="success">Settled</Pill></td>
                  <td>
                    <span className="addr">{d.tx}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: T.blueberry }}>Basescan ↗</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activation info */}
        <div className="card card-pad" style={{ display: "flex", gap: 18, alignItems: "flex-start", background: T.seafoam, borderColor: "transparent" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: T.blueberry, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, flex: "0 0 auto" }}>!</div>
          <div>
            <div style={{ fontWeight: 600, color: T.ink, fontSize: 15 }}>You're an active partner in <strong>Caribbean Hurricane 2026</strong>.</div>
            <div style={{ fontSize: 14, color: T.graphite, marginTop: 4, lineHeight: 1.5 }}>
              Daily cap per recipient: 1 meal · 1 water · 1 snack. WCK is reimbursing $6.67 USDC per meal in this activation, settled daily.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
