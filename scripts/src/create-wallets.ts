/**
 * Generates the four Base Sepolia keypairs the demo needs:
 *
 *   - EAS issuer       (signs every WCK attestation)
 *   - WCK treasury     (sends USDC to vendors)
 *   - x402 receiver    (collects $0.01 paywall payments)
 *   - demo donor       (pays the paywall during the live pitch)
 *
 * Writes the keys to `scripts/.runs/wallets-<iso>.json` (gitignored) so we
 * never lose them, and prints an .env-shaped block the operator pastes into
 * the repo-root `.env`. Re-running is safe: every invocation creates a new
 * timestamped file.
 *
 * Private keys are real secrets even on testnet — anyone with one can drain
 * faucet ETH or USDC. Treat the .runs/ directory accordingly.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { ENV_PATH, REPO_ROOT, optionalEnv } from "./lib/env.js";

type WalletRole = {
  envPrivateKey: string;
  envAddress: string;
  label: string;
};

const ROLES: WalletRole[] = [
  {
    envPrivateKey: "EAS_ISSUER_PRIVATE_KEY",
    envAddress: "EAS_ISSUER_ADDRESS",
    label: "EAS issuer (signs WCK attestations)",
  },
  {
    envPrivateKey: "TREASURY_PRIVATE_KEY",
    envAddress: "TREASURY_ADDRESS",
    label: "WCK treasury (USDC disbursement)",
  },
  {
    envPrivateKey: "X402_RECEIVER_PRIVATE_KEY",
    envAddress: "X402_RECEIVER_ADDRESS",
    label: "x402 receiver (paywall income)",
  },
  {
    envPrivateKey: "DEMO_DONOR_PRIVATE_KEY",
    envAddress: "DEMO_DONOR_ADDRESS",
    label: "Demo donor (pays the paywall)",
  },
];

type GeneratedWallet = {
  role: string;
  envPrivateKey: string;
  envAddress: string;
  privateKey: `0x${string}`;
  address: `0x${string}`;
};

function generate(): GeneratedWallet[] {
  return ROLES.map((role) => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    return {
      role: role.label,
      envPrivateKey: role.envPrivateKey,
      envAddress: role.envAddress,
      privateKey,
      address: account.address,
    };
  });
}

function warnIfAlreadyPopulated(): void {
  const populated = ROLES.filter((r) => optionalEnv(r.envPrivateKey));
  if (populated.length === 0) return;
  console.warn(
    `\n⚠  ${populated.length} wallet(s) already populated in ${ENV_PATH}:`,
  );
  for (const r of populated) console.warn(`   - ${r.envPrivateKey}`);
  console.warn(
    "   Generating new keys anyway. Don't paste the new block over working keys",
  );
  console.warn(
    "   unless you've already moved the old USDC/ETH balances or are starting fresh.\n",
  );
}

function writeRunArtifact(wallets: GeneratedWallet[]): string {
  const runsDir = resolve(REPO_ROOT, "scripts", ".runs");
  mkdirSync(runsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = resolve(runsDir, `wallets-${stamp}.json`);
  writeFileSync(
    path,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        chain: "base-sepolia",
        wallets: wallets.map((w) => ({
          role: w.role,
          envPrivateKey: w.envPrivateKey,
          envAddress: w.envAddress,
          address: w.address,
          privateKey: w.privateKey,
        })),
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  );
  return path;
}

function printEnvBlock(wallets: GeneratedWallet[]): void {
  console.log("\n# ── Paste into .env ──────────────────────────────────────");
  for (const w of wallets) {
    console.log(`# ${w.role}`);
    console.log(`${w.envPrivateKey}=${w.privateKey}`);
    console.log(`${w.envAddress}=${w.address}`);
    console.log("");
  }
  console.log("# ─────────────────────────────────────────────────────────\n");
}

function printSummary(wallets: GeneratedWallet[], artifactPath: string): void {
  console.log("Generated wallets (addresses only):");
  for (const w of wallets) console.log(`  ${w.address}  ${w.role}`);
  console.log(`\nFull keypairs written to: ${artifactPath}`);
  console.log("This file is gitignored. Delete it once keys are in .env.\n");
  console.log("Next steps:");
  console.log("  1. Paste the env block above into .env");
  console.log("  2. Fund EAS issuer + treasury + demo donor with Base Sepolia ETH");
  console.log("     https://www.alchemy.com/faucets/base-sepolia");
  console.log("  3. Fund treasury + demo donor with Base Sepolia USDC");
  console.log("     https://faucet.circle.com/  (select Base Sepolia, USDC)");
  console.log("  4. Run `pnpm --filter @aval/scripts run fund-status` to verify");
}

function main(): void {
  warnIfAlreadyPopulated();
  const wallets = generate();
  const artifactPath = writeRunArtifact(wallets);
  printEnvBlock(wallets);
  printSummary(wallets, artifactPath);
}

main();
