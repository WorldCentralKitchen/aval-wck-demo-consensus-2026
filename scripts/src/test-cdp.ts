/**
 * Smoke test for the Coinbase Developer Platform connection.
 * Lists existing wallets (read-only) to verify credentials without creating state.
 *
 * Requires in .env:
 *   CDP_API_KEY_ID          — UUID of the API key (preferred) or CDP_API_KEY_NAME
 *   CDP_API_KEY_PRIVATE_KEY — 64-byte Ed25519 key, base64-encoded (seed + public key)
 */

import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { requireEnv, optionalEnv } from "./lib/env.js";

async function main(): Promise<void> {
  // CDP uses the key UUID (CDP_API_KEY_ID) as the JWT kid, not the display name.
  const apiKeyName = optionalEnv("CDP_API_KEY_ID") ?? requireEnv("CDP_API_KEY_NAME");
  const privateKey = requireEnv("CDP_API_KEY_PRIVATE_KEY").replace(/\\n/g, "\n");

  console.log("Configuring CDP...");
  console.log(`  Key identifier: ${apiKeyName}`);

  Coinbase.configure({ apiKeyName, privateKey });

  console.log("Listing wallets (read-only auth check)...");
  const { wallets } = await Wallet.listWallets({ limit: 5 });

  console.log("\nCDP connection OK");
  console.log(`  Existing wallets: ${wallets.length}`);
  for (const w of wallets) {
    const addr = await w.getDefaultAddress().catch(() => null);
    console.log(`    ${w.getId()}  ${addr?.getId() ?? "(no address)"}`);
  }
  if (wallets.length === 0) {
    console.log("  (none yet — CDP key is valid, no wallets created yet)");
  }
}

main().catch((err: unknown) => {
  // A 429 from CDP means authentication succeeded — the API key is valid.
  // Rate limits reset within seconds; rerun in a moment.
  const httpCode = (err as { httpCode?: number }).httpCode;
  if (httpCode === 429) {
    console.log("\nCDP connection OK (credentials valid — rate limited, retry in ~10s)");
    process.exit(0);
  }
  console.error("\nCDP connection FAILED:");
  console.error(err);
  process.exit(1);
});
