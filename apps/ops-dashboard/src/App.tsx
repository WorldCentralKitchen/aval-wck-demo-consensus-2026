import { AppBar, Pill, ActivationBar } from "@aval/ui";

const T = {
  blueberry: "#1565ad",
  saffron: "#e86027",
  pea: "#8cc540",
  fig: "#9e2064",
  sky: "#26a9e1",
  ink: "#131313",
  graphite: "#3a3a3a",
  slate: "#5f6469",
  pebble: "#8a8f93",
  paper: "#f4f2ee",
  divider: "rgba(19,19,19,0.08)",
};

function StatTile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="card card-pad" style={{ borderTop: `3px solid ${tone ?? T.blueberry}` }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ marginTop: 4 }}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function Stat2({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" as const, color: T.slate }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, marginTop: 3 }}>{value}</div>
    </div>
  );
}

type PillTone = "success" | "warn" | "danger" | "info" | "neutral" | "primary" | "saffron";

const VENDORS: { n: string; r: string; t: number; s: PillTone; sl: string; w: string }[] = [
  { n: "Cocina La Borinqueña", r: "PR · Ponce",         t: 12, s: "success", sl: "Verified",        w: "0x9f2A…D4c1" },
  { n: "Café del Pueblo",      r: "PR · San Juan",       t: 18, s: "success", sl: "Verified",        w: "0x4d11…77a3" },
  { n: "Aqua Dominicana SRL",  r: "DR · Santo Domingo",  t: 42, s: "success", sl: "Verified",        w: "0x71ee…3c0a" },
  { n: "Khoury Catering",      r: "PR · Bayamón",        t: 0,  s: "info",    sl: "Agent reviewing", w: "pending" },
  { n: "Marché Joseph",        r: "HT · Cap-Haïtien",    t: 0,  s: "warn",    sl: "Escalated",       w: "pending" },
  { n: "Panadería Soto",       r: "PR · Mayagüez",       t: 0,  s: "danger",  sl: "Rejected",        w: "—" },
];

const FEED: { t: string; recip: string; vendor: string; kind: string; tone: PillTone; denied: boolean }[] = [
  { t: "14:47", recip: "#4287", vendor: "Cocina La Borinqueña", kind: "meal",  tone: "success", denied: false },
  { t: "14:46", recip: "#4112", vendor: "Aqua Dominicana",      kind: "water", tone: "info",    denied: false },
  { t: "14:45", recip: "#4287", vendor: "Aqua Dominicana",      kind: "water", tone: "info",    denied: false },
  { t: "14:45", recip: "#3998", vendor: "Café del Pueblo",      kind: "meal",  tone: "success", denied: false },
  { t: "14:44", recip: "#4287", vendor: "Cocina La Borinqueña", kind: "meal",  tone: "danger",  denied: true  },
  { t: "14:43", recip: "#4203", vendor: "Cocina La Borinqueña", kind: "meal",  tone: "success", denied: false },
  { t: "14:42", recip: "#3845", vendor: "Café del Pueblo",      kind: "snack", tone: "warn",    denied: false },
  { t: "14:41", recip: "#4087", vendor: "Aqua Dominicana",      kind: "water", tone: "info",    denied: false },
];

const SETTLEMENTS = [
  { d: "Today",  v: 3, m: 12, u: "80.04",  tx: "0x4a1c…f88e" },
  { d: "Apr 12", v: 5, m: 74, u: "493.58", tx: "0x9b3d…a201" },
  { d: "Apr 11", v: 5, m: 62, u: "413.54", tx: "0x71ee…3c0a" },
  { d: "Apr 10", v: 4, m: 48, u: "320.16", tx: "0x223a…ee71" },
];

export function App() {
  return (
    <div className="aval-app">
      <AppBar appName="Ops Dashboard" appRole="Activation overview" user="Daniel Ortiz" role="WCK Ops Lead" badge={<Pill tone="success" dot>Auto-refresh 2s</Pill>} />
      <ActivationBar />
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
          <StatTile label="Meals served · today"  value="1,284"   sub="↑ 18% vs. yesterday"      tone={T.pea} />
          <StatTile label="Active vendors"         value="47"      sub="3 onboarding · 0 revoked" />
          <StatTile label="Recipients enrolled"    value="2,716"   sub="day 4 of activation" />
          <StatTile label="USDC disbursed · 7d"   value="$12,486" sub="treasury 24,318 USDC" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.divider}` }}>
              <div className="eyebrow">Verified Vendors</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }}>Export</button>
                <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 10px" }}>+ New vendor</button>
              </div>
            </div>
            <table className="tbl">
              <thead><tr><th>Vendor</th><th>Region</th><th>Today</th><th>Status</th><th>Wallet</th></tr></thead>
              <tbody>
                {VENDORS.map((v, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: T.ink }}>{v.n}</td>
                    <td>{v.r}</td>
                    <td style={{ color: T.ink, fontWeight: 600 }}>{v.t}</td>
                    <td><Pill tone={v.s}>{v.sl}</Pill></td>
                    <td><span className="addr">{v.w}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="eyebrow">Live Redemption Feed</div>
              <Pill tone="info" dot>Streaming</Pill>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              {FEED.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "52px 1fr auto", gap: 10, padding: "10px 18px", borderBottom: `1px solid ${T.divider}`, alignItems: "center", background: r.denied ? "rgba(158,32,100,.04)" : "transparent" }}>
                  <span className="mono" style={{ color: T.pebble }}>{r.t}</span>
                  <div>
                    <div style={{ fontSize: 13, color: T.ink }}><strong>Recip {r.recip}</strong> · {r.vendor}</div>
                    <div style={{ fontSize: 12, color: T.slate }}>{r.kind}{r.denied ? " · denied: Daily cap" : ""}</div>
                  </div>
                  <Pill tone={r.tone}>{r.denied ? "Denied" : r.kind}</Pill>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.divider}` }}>
              <div>
                <div className="eyebrow">Settlement History</div>
                <div style={{ fontSize: 13, color: T.slate, marginTop: 2 }}>Daily 14:00 local · CDP signs USDC on Base Sepolia</div>
              </div>
              <button className="btn btn-accent" style={{ fontSize: 13, padding: "8px 14px" }}>Run settlement now</button>
            </div>
            <table className="tbl">
              <thead><tr><th>Date</th><th>Vendors</th><th>Meals</th><th>USDC</th><th>Tx batch</th></tr></thead>
              <tbody>
                {SETTLEMENTS.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: T.ink }}>{s.d}</td>
                    <td>{s.v}</td>
                    <td>{s.m}</td>
                    <td style={{ fontWeight: 600, color: T.ink }}>{s.u} USDC</td>
                    <td><span className="addr">{s.tx}</span><span style={{ marginLeft: 6, fontSize: 12, color: T.blueberry }}>↗</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card card-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div className="eyebrow">External Verification · x402</div>
                <h3 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 600, color: T.ink }}>/credential/verify</h3>
                <div style={{ fontSize: 13, color: T.slate, marginTop: 2 }}>$0.01 USDC per request · Coinbase Facilitator · Base Sepolia</div>
              </div>
              <Pill tone="primary" dot>Live</Pill>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
              <Stat2 label="Calls · 7d" value="312" />
              <Stat2 label="Revenue · 7d" value="$3.12" />
              <Stat2 label="Unique agents" value="11" />
            </div>
            <div style={{ padding: "10px 12px", background: T.paper, borderRadius: 6, fontSize: 12, color: T.slate }}>
              Top callers: <strong style={{ color: T.ink }}>donor-agent.bunyan.eth</strong>{" · "}
              <strong style={{ color: T.ink }}>verifier.redcross.demo</strong>{" · "}
              <strong style={{ color: T.ink }}>audit.gv.foundation</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
