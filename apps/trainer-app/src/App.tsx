import { AppShell, StatusPill } from "@aval/ui";

export function App() {
  return (
    <AppShell appName="Trainer App" role="WCK Trainer">
      <div className="aval-card">
        <h1 className="text-2xl">Issue a community responder credential</h1>
        <p className="mt-2 text-wck-ink/70">
          Stretch (Phase 4): issue a <code>WCK-Skill</code> attestation under
          the same EAS contract. Payload links to a W3C VC / Open Badges 3.0
          JSON-LD document on IPFS, so peer NGOs can verify without Aval
          integration.
        </p>
        <div className="mt-6 flex gap-3">
          <StatusPill tone="info">Phase 0a — scaffold</StatusPill>
          <StatusPill tone="warn">Stretch — Phase 4</StatusPill>
        </div>
      </div>
    </AppShell>
  );
}
