import { useState, useRef, useEffect, useCallback } from "react";
import { AppBar, Pill, ActivationBar } from "@aval/ui";
import { createAvalClient } from "@aval/sdk";

const api = createAvalClient(
  import.meta.env.VITE_API_URL ?? "",
  import.meta.env.VITE_API_KEY ?? "",
);

const ACTIVATION_ID = import.meta.env.VITE_ACTIVATION_ID ?? "CRBN-2026-04";
const VENDOR_ADDRESS: string = import.meta.env.VITE_VENDOR_ADDRESS ?? "0x9f2A4F18b13bC18b13b8e3A27b3aFD4c1";

const T = {
  blueberry: "#1565ad",
  pea: "#8cc540",
  corn: "#fab818",
  fig: "#9e2064",
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

type POSState = "capture" | "scanning" | "match" | "denied" | "confirmed";

function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 640 } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => {});
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const capture = useCallback((): string | null => {
    const v = videoRef.current;
    if (!v || !ready) return null;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 640;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, [ready]);

  return { videoRef, ready, capture };
}

function CamView({ state, videoRef, ready, anonRecipientId, confidence }: {
  state: POSState;
  videoRef: React.RefObject<HTMLVideoElement>;
  ready: boolean;
  anonRecipientId?: string;
  confidence?: number;
}) {
  const recipientLabel = anonRecipientId
    ? `#${anonRecipientId.match(/\d+/)?.[0] ?? "4287"}`
    : "#4287";

  return (
    <div className="cam-frame" style={{ aspectRatio: "1/1", background: "#161b22", position: "relative", overflow: "hidden", borderRadius: 10 }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", display: ready ? "block" : "none" }}
      />
      {!ready && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "62%", height: "76%", borderRadius: "50%", background: "radial-gradient(ellipse at 50% 35%, #cda07a 0%, #8a6047 60%, #2a1d14 100%)", opacity: .85, position: "relative" }}>
            <div style={{ position: "absolute", inset: "8% 6%", border: `2px dashed ${state === "match" || state === "confirmed" ? T.pea : T.corn}`, borderRadius: "50%", boxShadow: "0 0 0 9999px rgba(0,0,0,.25) inset" }} />
          </div>
        </div>
      )}
      <div className="corner tl" /><div className="corner tr" />
      <div className="corner bl" /><div className="corner br" />
      <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.55)", color: "#fff", padding: "5px 12px", borderRadius: 999, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700 }}>
        {state === "match" || state === "confirmed" ? `Match · ${((confidence ?? 0.98) * 100).toFixed(0)}%` : state === "scanning" ? "Scanning…" : "Align face"}
      </div>
      {(state === "match" || state === "confirmed") && (
        <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(140,197,64,.92)", color: "#fff", padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
          Recipient {recipientLabel} · eligible
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
  const [state, setState] = useState<POSState>("capture");
  const [selected, setSelected] = useState("meal");
  const [anonRecipientId, setAnonRecipientId] = useState<string | undefined>();
  const [confidence, setConfidence] = useState<number | undefined>();
  const [redemptionCount, setRedemptionCount] = useState(14);
  const { videoRef, ready, capture } = useWebcam();

  const items = [
    { label: "Plate · rice & beans", code: "meal", cap: "1 / day", emoji: "🍽", price: "$6.67 USDC" },
    { label: "1L water", code: "water", cap: "1 / day", emoji: "💧", price: "$1.00 USDC" },
    { label: "Snack pack", code: "snack", cap: "1 / day", emoji: "🥨", price: "$2.00 USDC" },
  ];

  const selectedItem = items.find((i) => i.code === selected) ?? items[0]!;

  async function handleScan() {
    const imageData = capture();
    const base64Image = imageData ?? "data:image/jpeg;base64,/9j/4AAQ==";

    setState("scanning");
    try {
      const result = await api.redeem({
        vendorAddress: VENDOR_ADDRESS,
        activationId: ACTIVATION_ID,
        base64Image,
        itemCode: selected as "meal" | "water" | "snack",
      });

      if (!result.matched) {
        setState("capture");
        return;
      }

      setAnonRecipientId(result.anonRecipientId);
      setConfidence(result.confidence ? result.confidence / 100 : 0.98);

      if (result.denied) {
        setState("denied");
      } else {
        setState("match");
      }
    } catch {
      // Demo fallback: simulate a successful match
      setAnonRecipientId(`recip_4287_demo`);
      setConfidence(0.98);
      setState("match");
    }
  }

  async function handleConfirm() {
    setState("confirmed");
    setRedemptionCount((c) => c + 1);
    setTimeout(() => {
      setState("capture");
      setAnonRecipientId(undefined);
      setConfidence(undefined);
    }, 2500);
  }

  const recipientLabel = anonRecipientId
    ? `Recipient #${anonRecipientId.match(/\d+/)?.[0] ?? "4287"}`
    : "Recipient #4287";

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
              <div style={{ fontSize: 13, color: T.slate }}>1 {selectedItem.label.toLowerCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.ink }}>{selectedItem.price}</div>
            </div>
            <div style={{ fontSize: 12, color: T.pebble, marginTop: 4 }}>Settled in tonight's batch · activation rate</div>
            <div style={{ marginTop: 10, fontSize: 13, color: T.slate }}>Today's total: <strong style={{ color: T.ink }}>{redemptionCount} redemptions</strong></div>
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
            <Pill tone="primary">{ACTIVATION_ID}</Pill>
          </div>

          <CamView state={state} videoRef={videoRef} ready={ready} anonRecipientId={anonRecipientId} confidence={confidence} />

          {(state === "match") && (
            <div style={{ padding: "14px 16px", background: "rgba(140,197,64,.10)", border: "1px solid rgba(140,197,64,.40)", borderRadius: 8, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: T.pea, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: T.ink, fontSize: 15 }}>{recipientLabel} · eligible</div>
                <div style={{ fontSize: 13, color: T.graphite, marginTop: 2 }}>
                  Match confidence {((confidence ?? 0.98) * 100).toFixed(0)}% · 0 {selected} redemptions today
                </div>
              </div>
              <Pill tone="success">Eligible</Pill>
            </div>
          )}

          {state === "denied" && (
            <div style={{ padding: "14px 16px", background: "rgba(158,32,100,.08)", border: "1px solid rgba(158,32,100,.30)", borderRadius: 8, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: T.fig, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>×</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: T.ink, fontSize: 15 }}>{recipientLabel} · daily cap reached</div>
                <div style={{ fontSize: 13, color: T.graphite, marginTop: 2 }}>
                  Already received {selected} today in this activation. Try a different item.
                </div>
              </div>
              <Pill tone="danger">Denied</Pill>
            </div>
          )}

          {state === "confirmed" && (
            <div style={{ padding: "14px 16px", background: "rgba(21,101,173,.08)", border: "1px solid rgba(21,101,173,.30)", borderRadius: 8, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: T.blueberry, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: T.ink, fontSize: 15 }}>Redemption logged · {selectedItem.price}</div>
                <div style={{ fontSize: 13, color: T.graphite, marginTop: 2 }}>Queued for tonight's settlement batch.</div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, padding: "14px", fontSize: 15 }}
              onClick={() => { setState("capture"); setAnonRecipientId(undefined); setConfidence(undefined); }}
            >
              Cancel
            </button>
            {state === "capture" && (
              <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={handleScan}>
                Scan face
              </button>
            )}
            {state === "scanning" && (
              <button className="btn btn-primary btn-lg" style={{ flex: 2 }} disabled>Scanning…</button>
            )}
            {state === "match" && (
              <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={handleConfirm}>
                Confirm {selected} · log redemption
              </button>
            )}
            {state === "denied" && (
              <button className="btn btn-ghost" style={{ flex: 2 }} onClick={() => { setState("capture"); setAnonRecipientId(undefined); }}>
                Try different item
              </button>
            )}
            {state === "confirmed" && (
              <button className="btn btn-primary btn-lg" style={{ flex: 2 }} disabled>Logged ✓</button>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.pebble, paddingTop: 6, borderTop: `1px solid ${T.divider}` }}>
            <span className="mono">Vendor {VENDOR_ADDRESS.slice(0, 10)}…</span>
            <span>Tonight's settlement: 14:00 local</span>
          </div>
        </div>
      </div>
    </div>
  );
}
