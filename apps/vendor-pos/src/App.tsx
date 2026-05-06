import { AppShell, StatusPill } from "@aval/ui";

export function App() {
  return (
    <AppShell appName="Vendor POS" role="Vendor (point of sale)">
      <div className="aval-card">
        <h1 className="text-2xl">Log a meal credit</h1>
        <p className="mt-2 text-wck-ink/70">
          Phase 1c lights this up: amount input, webcam capture of the
          recipient's face, server-side Rekognition match, redemption logged in
          DynamoDB. Daily caps enforced at the policy layer.
        </p>
        <div className="mt-6 flex gap-3">
          <StatusPill tone="info">Phase 0a — scaffold</StatusPill>
          <StatusPill tone="warn">Awaiting redeem endpoint</StatusPill>
        </div>
      </div>
    </AppShell>
  );
}
