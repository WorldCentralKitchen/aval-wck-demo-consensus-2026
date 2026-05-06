import { AppShell, StatusPill } from "@aval/ui";

export function App() {
  return (
    <AppShell appName="Vendor Portal" role="Vendor">
      <div className="aval-card">
        <h1 className="text-2xl">Your WCK partner attestation</h1>
        <p className="mt-2 text-wck-ink/70">
          Phase 1c lights this up: vendor sees their on-chain attestation
          status, wallet balance, and recent USDC disbursements with deep links
          to EAS Scan and Basescan.
        </p>
        <div className="mt-6 flex gap-3">
          <StatusPill tone="info">Phase 0a — scaffold</StatusPill>
          <StatusPill tone="warn">Awaiting attestation rail</StatusPill>
        </div>
      </div>
    </AppShell>
  );
}
