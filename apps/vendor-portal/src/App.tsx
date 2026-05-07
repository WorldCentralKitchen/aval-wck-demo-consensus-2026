import { AppBar, Pill } from "@aval/ui";

const T = {
  blueberry: "#1565ad",
  saffron: "#e86027",
  seafoam: "#d0ecf2",
  pea: "#8cc540",
  sky: "#26a9e1",
  ink: "#131313",
  graphite: "#3a3a3a",
  slate: "#5f6469",
  pebble: "#8a8f93",
  cloud: "#d7dadd",
  paper: "#f4f2ee",
  white: "#ffffff",
  divider: "rgba(19,19,19,0.08)",
};

const DISBURSEMENTS = [
  { date: "Today · 14:32", meals: 12, usdc: 80.00, tx: "0x4a1c…f88e" },
  { date: "Yesterday · 14:18", meals: 18, usdc: 120.00, tx: "0x9b3d…a201" },
  { date: "Apr 12 · 14:21", meals: 9, usdc: 60.00, tx: "0x71ee…3c0a" },
  { date: "Apr 11 · 14:05", meals: 14, usdc: 93.33, tx: "0x223a…ee71" },
];

export function App() {
  return (
    <div className="aval-app">
      <AppBar appName="Vendor Portal" user="Carlos Méndez" role="Cocina La Borinqueña" badge={<Pill tone="success" dot>Verified vendor</Pill>} />

      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
        {/* Hero */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, marginBottom: 18 }}>
          {/* Attestation card */}
          <div className="card" style={{ background: `linear-gradient(135deg, ${T.blueberry} 0%, #0f4f89 100%)`, color: "#fff", padding: "24px 26px", borderColor: "transparent", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase", color: "rgba(255,255,255,.75)", fontWeight: 700 }}>WCK-Vendor Attestation</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>You're verified.</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.85)", marginTop: 6, lineHeight: 1.5 }}>
                Approved by Lena P. on Apr 9, 2026. Your attestation is live on Base Sepolia and recognized by every WCK distribution point in this activation.
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", padding: "12px 14px", background: "rgba(255,255,255,.10)", borderRadius: 6, fontSize: 13 }}>
              <span style={{ color: "rgba(255,255,255,.7)" }}>Schema</span>   <span className="mono" style={{ color: "#fff" }}>WCK-Vendor</span>
              <span style={{ color: "rgba(255,255,255,.7)" }}>Holder</span>   <span className="mono" style={{ color: "#fff" }}>0x9f2A4F…D4c1</span>
              <span style={{ color: "rgba(255,255,255,.7)" }}>Valid until</span> <span style={{ color: "#fff" }}>Dec 31, 2027</span>
              <span style={{ color: "rgba(255,255,255,.7)" }}>Tx</span>       <span className="mono" style={{ color: "#fff" }}>0x83fc…e21d ↗</span>
            </div>
            <button className="btn" style={{ alignSelf: "flex-start", background: "rgba(255,255,255,.16)", color: "#fff", borderRadius: 6, padding: "10px 14px" }}>
              View on EAS Scan ↗
            </button>
          </div>

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
