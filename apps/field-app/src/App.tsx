import { useState } from "react";
import { AppBar, Pill, ActivationBar } from "@aval/ui";

const T = {
  blueberry: "#1565ad",
  pea: "#8cc540",
  corn: "#fab818",
  fig: "#9e2064",
  ink: "#131313",
  graphite: "#3a3a3a",
  slate: "#5f6469",
  pebble: "#8a8f93",
  cloud: "#d7dadd",
  paper: "#f4f2ee",
  divider: "rgba(19,19,19,0.08)",
  border: "rgba(19,19,19,0.14)",
};

function CamFaceFrame() {
  return (
    <div className="cam-frame" style={{ aspectRatio: "1/1", background: "#161b22" }}>
      <div style={{ width: "58%", height: "74%", borderRadius: "50%", background: "radial-gradient(ellipse at 50% 35%, #d2b48a 0%, #91674a 60%, #2a1d14 100%)", opacity: .85, position: "relative" }}>
        <div style={{ position: "absolute", inset: "-8% -6%", border: `3px solid ${T.corn}`, borderRadius: "50%", boxShadow: "0 0 0 9999px rgba(0,0,0,.30) inset" }} />
      </div>
      <div className="corner tl" /><div className="corner tr" />
      <div className="corner bl" /><div className="corner br" />
      <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,.55)", color: "#fff", padding: "5px 10px", borderRadius: 999, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700 }}>
        Live · 1080p · local-only
      </div>
      <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(250,184,24,.95)", color: "#5a4308", padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
        Hold still · auto-capture in 2s
      </div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".10em", textTransform: "uppercase", color: T.slate }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, marginTop: 4, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

export function App() {
  const [stage, setStage] = useState<"capture" | "enrolled">("capture");

  return (
    <div className="aval-app">
      <AppBar appName="Field App" appRole="Recipient enrollment" user="Sofía Reyes" role="WCK Field · Ponce" badge={<Pill tone="primary">Tent 3 · Plaza Las Delicias</Pill>} />
      <ActivationBar />
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Left — capture */}
        <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="eyebrow">Step 1 · capture</div>
              <h3 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 600, color: T.ink }}>Center the recipient's face</h3>
            </div>
            <Pill tone="info">Camera · ready</Pill>
          </div>
          <CamFaceFrame />
          <div style={{ padding: "12px 14px", background: T.paper, borderRadius: 8, fontSize: 13, color: T.graphite, lineHeight: 1.55 }}>
            <div style={{ fontWeight: 600, color: T.ink, marginBottom: 4 }}>Read aloud before capturing:</div>
            "We don't need your name, age, or ID. This camera makes a code only this week's WCK kitchens can match — so meals reach everyone fairly. You can choose a paper card instead."
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1, padding: "14px", fontSize: 15 }}>Use paper QR card instead</button>
            <button className="btn btn-primary btn-lg" style={{ flex: 1.4 }} onClick={() => setStage("enrolled")}>
              Capture & enroll
            </button>
          </div>
          {stage === "enrolled" && (
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setStage("capture")}>
              ← New enrollment
            </button>
          )}
        </div>

        {/* Right — confirmation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {stage === "enrolled" ? (
            <div className="card card-pad" style={{ background: `linear-gradient(135deg, ${T.pea} 0%, #6da12f 100%)`, color: "#fff", borderColor: "transparent" }}>
              <div style={{ fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase", color: "rgba(255,255,255,.85)", fontWeight: 700, marginBottom: 8 }}>Enrolled · activation only</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-.01em", lineHeight: 1 }}>Recipient&nbsp;#4288</div>
              <div style={{ fontSize: 14, marginTop: 8, color: "rgba(255,255,255,.92)", lineHeight: 1.5 }}>
                Anonymous. No name. No DOB. No ID number. Deletable in one click at activation close.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", padding: "12px 14px", background: "rgba(255,255,255,.14)", borderRadius: 6, fontSize: 13, marginTop: 14 }}>
                <span style={{ opacity: .8 }}>Activation</span> <span className="mono">CRBN-2026-04</span>
                <span style={{ opacity: .8 }}>Anon ID</span> <span className="mono">recip_4288_4f3a9c</span>
                <span style={{ opacity: .8 }}>Face template</span> <span>Rekognition · stored encrypted</span>
                <span style={{ opacity: .8 }}>Caps</span> <span>1 meal · 1 water · 1 snack / day</span>
              </div>
            </div>
          ) : (
            <div className="card card-pad" style={{ background: T.paper, borderColor: "transparent" }}>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-.01em", lineHeight: 1, color: T.cloud }}>—</div>
              <div style={{ fontSize: 14, color: T.pebble, marginTop: 8 }}>Capture a face to see the enrollment confirmation.</div>
            </div>
          )}

          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 10 }}>What we did NOT collect</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
              {["Name", "Date of birth", "Address", "Phone", "National ID", "Family size", "Religion", "Photo (kept)"].map((x) => (
                <div key={x} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.graphite }}>
                  <span style={{ width: 14, height: 14, borderRadius: 3, background: "rgba(158,32,100,.10)", color: T.fig, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>×</span>
                  {x}
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Today · this tent</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <StatMini label="Enrolled" value="34" />
              <StatMini label="Re-encounters" value="91" />
              <StatMini label="Paper QR fallback" value="3" />
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 14, width: "100%", padding: "12px", fontSize: 14 }}>
              Hand off to next field worker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
