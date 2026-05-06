import { AppShell, StatusPill } from "@aval/ui";

export function App() {
  return (
    <AppShell appName="KYC Console" role="WCK KYC Officer">
      <div className="aval-card">
        <h1 className="text-2xl">Vendor onboarding queue</h1>
        <p className="mt-2 text-wck-ink/70">
          Phase 2 lights this up: each row is a Bedrock-reviewed packet. The
          officer reads the agent's reasoning trace and the source-document
          highlights, then approves the on-chain attestation.
        </p>
        <div className="mt-6 flex gap-3">
          <StatusPill tone="info">Phase 0a — scaffold</StatusPill>
          <StatusPill tone="warn">Awaiting backend</StatusPill>
        </div>
      </div>
    </AppShell>
  );
}
