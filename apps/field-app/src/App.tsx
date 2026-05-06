import { AppShell, StatusPill } from "@aval/ui";

export function App() {
  return (
    <AppShell appName="Field App" role="WCK Field Staff">
      <div className="aval-card">
        <h1 className="text-2xl">Enroll a recipient</h1>
        <p className="mt-2 text-wck-ink/70">
          Phase 1c lights this up: webcam capture, Rekognition <code>IndexFaces</code>{" "}
          server-side, anonymous activation-scoped recipient ID written to
          DynamoDB. No name, no DOB, no PII — recipient privacy is the design,
          not a feature.
        </p>
        <div className="mt-6 flex gap-3">
          <StatusPill tone="info">Phase 0a — scaffold</StatusPill>
          <StatusPill tone="warn">Awaiting enroll endpoint</StatusPill>
        </div>
      </div>
    </AppShell>
  );
}
