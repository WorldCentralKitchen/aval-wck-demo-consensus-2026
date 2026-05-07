import { useState } from "react";
import { AppBar, Pill, ActivationBar } from "@aval/ui";

const T = {
  blueberry: "#1565ad",
  pea: "#8cc540",
  corn: "#fab818",
  saffron: "#e86027",
  ink: "#131313",
  graphite: "#3a3a3a",
  slate: "#5f6469",
  pebble: "#8a8f93",
  cloud: "#d7dadd",
  paper: "#f4f2ee",
  divider: "rgba(19,19,19,0.08)",
  border: "rgba(19,19,19,0.14)",
};

type POSState = "capture" | "matching" | "match" | "denied";

function CamView({ state }: { state: POSState }) {
  return (
    <div className="cam-frame" style={{ aspectRatio: "1/1", background: "#161b22" }}>
      <div style={{ width: "62%", height: "76%", borderRadius: "50%", background: "radial-gradient(ellipse at 50% 35%, #cda07a 0%, #8a6047 60%, #2a1d14 100%)", opacity: .85, position: "relative" }}>
        <div style={{ position: "absolute", inset: "8% 6%", border: `2px dashed ${state === "match" ? T.pea : T.corn}`, borderRadius: "50%", boxShadow: "0 0 0 9999px rgba(0,0,0,.25) inset" }} />
      </div>
      <div className="corner tl" /><div className="corner tr" />
      <div className="corner bl" /><div className="corner br" />
      <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.55)", color: "#fff", padding: "5px 12px", borderRadius: 999, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700 }}>
        {state === "match" ? "Match · 0.98" : state === "matching" ? "Scanning…" : "Align face"}
      </div>
      {state === "match" && (
        <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(140,197,64,.92)", color: "#fff", padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
          Recipient #4287 · eligible
        </div>
      )}
      {state === "denied" && (
        <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(158,32,100,.92)", color: "#fff", padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
          Daily cap reached
        </div>
      )}
    </div>
  );
}

export function App() {
  const [state, setState] = useState<POSState>("match");
  const [selected, setSelected] = useState("meal");

  const items = [
    { label: "Plate · rice & beans", code: "meal", cap: "1 / day", emoji: "🍽" },
    { label: "1L water", code: "water", cap: "1 / day", emoji: "💧" },
    { label: "Snack pack", code: "snack", cap: "1 / day", emoji: "🥨" },
  ];

  return (
    <div className="aval-app">
      <AppBar appName="Vendor POS" appRole="Cocina La Borinqueña" user="Carlos M." role="Counter · Tablet 1" badge={<Pill tone="success" dot>Online</Pill>} />
      <ActivationBar />
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Left — items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Add to redemption</div>
            <div style={{ display: "grid", gap: 10 }}>
              {items.map((it) => (
                <button key={it.code} onClick={() => setSelected(it.code)} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 16px", border: `2px solid ${selected === it.code ? T.blueberry : T.divider}`, background: selected === it.code ? "rgba(21,101,173,.05)" : "#fff", borderRadius: 8, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: T.paper, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{it.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>{it.label}</div>
                    <div style={{ fontSize: 13, color: T.slate, marginTop: 2 }}>Cap: {it.cap} · per recipient</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${selected === it.code ? T.blueberry : T.cloud}`, background: selected === it.code ? T.blueberry : "transparent" }} />
                </button>
              ))}
            </div>
          </div>

          <div className="card card-pad" style={{ background: T.paper, borderColor: "transparent" }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Reimbursement preview</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 13, color: T.slate }}>1 plate · meal credit</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.ink }}>$6.67 USDC</div>
            </div>
            <div style={{ fontSize: 12, color: T.pebble, marginTop: 4 }}>Settled in tonight's batch · activation rate</div>
          </div>

          <div style={{ display: "flex", gap: 10, padding: "14px 16px", background: "#fff", borderRadius: 8, border: `1px solid ${T.divider}` }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(140,197,64,.20)", color: "#3f7a13", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flex: "0 0 auto" }}>i</div>
            <div style={{ fontSize: 13, color: T.graphite, lineHeight: 1.5 }}>
              No personal data is stored. The recipient's face is matched against this activation's anonymous template — name, age, and ID never appear.
            </div>
          </div>
        </div>

        {/* Right — capture */}
        <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="eyebrow">Recipient · capture & match</div>
            <Pill tone="primary">CRBN-2026-04</Pill>
          </div>

          <CamView state={state} />

          {state === "match" && (
            <div style={{ padding: "14px 16px", background: "rgba(140,197,64,.10)", border: "1px solid rgba(140,197,64,.40)", borderRadius: 8, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: T.pea, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: T.ink, fontSize: 15 }}>Recipient #4287 · enrolled Day 2</div>
                <div style={{ fontSize: 13, color: T.graphite, marginTop: 2 }}>Match confidence 0.98 · 0 redemptions today at this vendor</div>
              </div>
              <Pill tone="success">Eligible</Pill>
            </div>
          )}

          {/* Demo state toggler */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["capture", "matching", "match", "denied"] as POSState[]).map((s) => (
              <button key={s} onClick={() => setState(s)} className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 10px", background: state === s ? T.blueberry : undefined, color: state === s ? "#fff" : undefined, border: state === s ? "none" : undefined }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
            <button className="btn btn-ghost" style={{ flex: 1, padding: "14px", fontSize: 15 }}>Cancel</button>
            <button className="btn btn-primary btn-lg" style={{ flex: 2 }}>Confirm meal · log redemption</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.pebble, paddingTop: 6, borderTop: `1px solid ${T.divider}` }}>
            <span>Vendor 0x9f2A…D4c1</span>
            <span>Tonight's settlement: 14:00 local</span>
          </div>
        </div>
      </div>
    </div>
  );
}
