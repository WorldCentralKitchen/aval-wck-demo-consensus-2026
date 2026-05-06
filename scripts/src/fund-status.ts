/**
 * Reads the four demo wallets out of .env and prints their Base Sepolia ETH
 * + USDC balances side-by-side, with faucet hints for any wallet that's below
 * the threshold the next phase will need.
 *
 * Thresholds (per role):
 *   - EAS issuer:    needs ETH for gas (registration + every attestation tx)
 *   - Treasury:      needs ETH for gas + USDC for vendor payouts
 *   - x402 receiver: receives USDC, doesn't need ETH unless we sweep
 *   - Demo donor:    needs ETH for gas + a small USDC float for paywall calls
 */

import { formatEther, formatUnits } from "viem";
import { publicClient, USDC_ADDRESS } from "./lib/chain.js";
import { ERC20_ABI } from "./lib/erc20.js";
import { optionalEnv } from "./lib/env.js";

type Role = {
  label: string;
  envAddress: string;
  needsEth: boolean;
  needsUsdc: boolean;
};

const ROLES: Role[] = [
  {
    label: "EAS issuer",
    envAddress: "EAS_ISSUER_ADDRESS",
    needsEth: true,
    needsUsdc: false,
  },
  {
    label: "WCK treasury",
    envAddress: "TREASURY_ADDRESS",
    needsEth: true,
    needsUsdc: true,
  },
  {
    label: "x402 receiver",
    envAddress: "X402_RECEIVER_ADDRESS",
    needsEth: false,
    needsUsdc: false,
  },
  {
    label: "Demo donor",
    envAddress: "DEMO_DONOR_ADDRESS",
    needsEth: true,
    needsUsdc: true,
  },
];

const MIN_ETH_WEI = 1_000_000_000_000_000n; // 0.001 ETH
const MIN_USDC_RAW = 1_000_000n; // 1 USDC (6 decimals)

type Row = {
  role: Role;
  address: `0x${string}` | null;
  ethWei: bigint;
  usdcRaw: bigint;
  usdcDecimals: number;
};

async function readBalances(): Promise<Row[]> {
  const client = publicClient();

  const usdcDecimalsPromise = client.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const rows: Row[] = await Promise.all(
    ROLES.map(async (role) => {
      const address = optionalEnv(role.envAddress) as
        | `0x${string}`
        | undefined;
      if (!address) {
        return {
          role,
          address: null,
          ethWei: 0n,
          usdcRaw: 0n,
          usdcDecimals: 6,
        };
      }
      const [ethWei, usdcRaw, usdcDecimals] = await Promise.all([
        client.getBalance({ address }),
        client.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        }),
        usdcDecimalsPromise,
      ]);
      return { role, address, ethWei, usdcRaw, usdcDecimals };
    }),
  );

  return rows;
}

function fmtEth(wei: bigint): string {
  return Number.parseFloat(formatEther(wei)).toFixed(6);
}

function fmtUsdc(raw: bigint, decimals: number): string {
  return Number.parseFloat(formatUnits(raw, decimals)).toFixed(2);
}

function printTable(rows: Row[]): void {
  console.log(
    `${"Role".padEnd(16)}  ${"Address".padEnd(42)}  ${"ETH (Sepolia)".padStart(14)}  ${"USDC".padStart(10)}`,
  );
  console.log("-".repeat(16 + 2 + 42 + 2 + 14 + 2 + 10));
  for (const row of rows) {
    const addr = row.address ?? "(not set in .env)";
    const eth = row.address ? fmtEth(row.ethWei) : "-";
    const usdc = row.address ? fmtUsdc(row.usdcRaw, row.usdcDecimals) : "-";
    console.log(
      `${row.role.label.padEnd(16)}  ${addr.padEnd(42)}  ${eth.padStart(14)}  ${usdc.padStart(10)}`,
    );
  }
}

function printActionItems(rows: Row[]): void {
  const lowEth = rows.filter(
    (r) => r.address && r.role.needsEth && r.ethWei < MIN_ETH_WEI,
  );
  const lowUsdc = rows.filter(
    (r) => r.address && r.role.needsUsdc && r.usdcRaw < MIN_USDC_RAW,
  );
  const missing = rows.filter((r) => !r.address);

  if (
    lowEth.length === 0 &&
    lowUsdc.length === 0 &&
    missing.length === 0
  ) {
    console.log("\nAll wallets funded above thresholds. Ready for Phase 1a.");
    return;
  }

  console.log("\nAction items:");
  if (missing.length > 0) {
    console.log("  Run create-wallets and paste the env block:");
    for (const r of missing) console.log(`    ${r.role.envAddress} not set`);
  }
  if (lowEth.length > 0) {
    console.log(
      "  Need Base Sepolia ETH (https://www.alchemy.com/faucets/base-sepolia):",
    );
    for (const r of lowEth) {
      console.log(`    ${r.role.label.padEnd(16)} ${r.address}`);
    }
  }
  if (lowUsdc.length > 0) {
    console.log(
      "  Need Base Sepolia USDC (https://faucet.circle.com/, select Base Sepolia):",
    );
    for (const r of lowUsdc) {
      console.log(`    ${r.role.label.padEnd(16)} ${r.address}`);
    }
  }
}

async function main(): Promise<void> {
  console.log("Base Sepolia wallet status\n");
  const rows = await readBalances();
  printTable(rows);
  printActionItems(rows);
}

main().catch((err) => {
  console.error("\nfund-status failed:");
  console.error(err);
  process.exit(1);
});
