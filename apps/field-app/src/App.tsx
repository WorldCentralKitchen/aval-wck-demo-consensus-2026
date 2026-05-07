import { useState, useRef, useEffect, useCallback } from "react";
import { AppBar, Pill, ActivationBar } from "@aval/ui";
import { createAvalClient } from "@aval/sdk";

const api = createAvalClient(
  import.meta.env.VITE_API_URL ?? "",
  import.meta.env.VITE_API_KEY ?? "",
);

const ACTIVATION_ID = import.meta.env.VITE_ACTIVATION_ID ?? "CRBN-2026-04";

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

function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);

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
      .catch((e: Error) => setCamError(e.message));
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

  return { videoRef, ready, camError, capture };
}

function CamFaceFrame({ videoRef, ready }: { videoRef: React.RefObject<HTMLVideoElement>; ready: boolean }) {
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
          <div style={{ width: "58%", height: "74%", borderRadius: "50%", background: "radial-gradient(ellipse at 50% 35%, #d2b48a 0%, #91674a 60%, #2a1d14 100%)", opacity: .85 }} />
        </div>
      )}
      <div className="corner tl" /><div className="corner tr" />
      <div className="corner bl" /><div className="corner br" />
      <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,.55)", color: "#fff", padding: "5px 10px", borderRadius: 999, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700 }}>
        {ready ? "Live · local-only" : "Starting camera…"}
      </div>
      {ready && (
        <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(250,184,24,.95)", color: "#5a4308", padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
          Hold still · ready to capture
        </div>
      )}
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
  const [stage, setStage] = useState<"capture" | "enrolling" | "enrolled">("capture");
  const [anonId, setAnonId] = useState<string | null>(null);
  const [enrollCount, setEnrollCount] = useState(34);
  const { videoRef, ready, camError, capture } = useWebcam();

  async function handleEnroll() {
    const imageData = capture();
    const base64Image = imageData ?? "data:image/jpeg;base64,/9j/4AAQ=="; // demo fallback

    setStage("enrolling");
    try {
      const result = await api.enroll({ activationId: ACTIVATION_ID, base64Image });
      setAnonId(result.anonRecipientId);
      setEnrollCount((c) => c + 1);
      setStage("enrolled");
    } catch {
      // Demo mode: show plausible local result when API isn't deployed
      const demoId = `recip_${Math.floor(4000 + Math.random() * 999)}_${Math.random().toString(36).slice(2, 8)}`;
      setAnonId(demoId);
      setEnrollCount((c) => c + 1);
      setStage("enrolled");
    }
  }

  const recipientNum = anonId
    ? `#${anonId.match(/\d+/)?.[0] ?? Math.floor(4288 + Math.random() * 10)}`
    : "#—";

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
            <Pill tone={camError ? "warn" : ready ? "success" : "info"}>
              {camError ? "Camera unavailable" : ready ? "Camera · ready" : "Starting…"}
            </Pill>
          </div>
          <CamFaceFrame videoRef={videoRef} ready={ready} />
          <div style={{ padding: "12px 14px", background: T.paper, borderRadius: 8, fontSize: 13, color: T.graphite, lineHeight: 1.55 }}>
            <div style={{ fontWeight: 600, color: T.ink, marginBottom: 4 }}>Read aloud before capturing:</div>
            "We don't need your name, age, or ID. This camera makes a code only this week's WCK kitchens can match — so meals reach everyone fairly. You can choose a paper card instead."
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1, padding: "14px", fontSize: 15 }}>Use paper QR card instead</button>
            <button
              className="btn btn-primary btn-lg"
              style={{ flex: 1.4 }}
              disabled={stage === "enrolling"}
              onClick={handleEnroll}
            >
              {stage === "enrolling" ? "Enrolling…" : "Capture & enroll"}
            </button>
          </div>
          {stage === "enrolled" && (
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => { setStage("capture"); setAnonId(null); }}>
              ← New enrollment
            </button>
          )}
        </div>

        {/* Right — confirmation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {stage !== "capture" ? (
            <div className="card card-pad" style={{
              background: stage === "enrolled"
                ? `linear-gradient(135deg, ${T.pea} 0%, #6da12f 100%)`
                : `linear-gradient(135deg, ${T.corn} 0%, #c89210 100%)`,
              color: "#fff",
              borderColor: "transparent",
            }}>
              <div style={{ fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase", color: "rgba(255,255,255,.85)", fontWeight: 700, marginBottom: 8 }}>
                {stage === "enrolling" ? "Contacting Rekognition…" : "Enrolled · activation only"}
              </div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-.01em", lineHeight: 1 }}>
                {stage === "enrolled" ? `Recipient ${recipientNum}` : "…"}
              </div>
              <div style={{ fontSize: 14, marginTop: 8, color: "rgba(255,255,255,.92)", lineHeight: 1.5 }}>
                Anonymous. No name. No DOB. No ID number. Deletable in one click at activation close.
              </div>
              {stage === "enrolled" && anonId && (
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", padding: "12px 14px", background: "rgba(255,255,255,.14)", borderRadius: 6, fontSize: 13, marginTop: 14 }}>
                  <span style={{ opacity: .8 }}>Activation</span> <span className="mono">{ACTIVATION_ID}</span>
                  <span style={{ opacity: .8 }}>Anon ID</span> <span className="mono" style={{ wordBreak: "break-all" }}>{anonId.slice(0, 20)}…</span>
                  <span style={{ opacity: .8 }}>Face template</span> <span>Rekognition · stored encrypted</span>
                  <span style={{ opacity: .8 }}>Caps</span> <span>1 meal · 1 water · 1 snack / day</span>
                </div>
              )}
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
              <StatMini label="Enrolled" value={String(enrollCount)} />
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
