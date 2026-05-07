/**
 * Phase 3 demo script — x402 credential verification.
 *
 * 1. Hits /credential/verify → gets 402 + payment requirements
 * 2. Signs an ERC-3009 transferWithAuthorization from the DEMO_DONOR wallet
 * 3. Retries with X-Payment header → gets the full WCK-Vendor attestation chain
 *
 * Run: pnpm --filter @aval/scripts verify-agent
 */

import { requireEnv, requirePrivateKey, requireAddress } from "./lib/env.js";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  encodeFunctionData,
  keccak256,
  toBytes,
  encodeAbiParameters,
  parseAbiParameters,
  hexToBytes,
  bytesToHex,
} from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const API_URL = requireEnv("VITE_API_URL").replace(/\/$/, "");
const VENDOR_ADDRESS = "0xFa7C7B4a7D1a95c1D4CeF94e8B6774aFE74a7A58"; // EAS issuer = demo vendor
const USDC_ADDRESS = requireEnv("USDC_BASE_SEPOLIA_ADDRESS") as `0x${string}`;
const DONOR_KEY = requirePrivateKey("DEMO_DONOR_PRIVATE_KEY");
const RECEIVER_ADDRESS = requireAddress("X402_RECEIVER_ADDRESS");
const RPC_URL = requireEnv("BASE_SEPOLIA_RPC_URL");

const PAYMENT_AMOUNT = 10_000n; // 0.01 USDC in atomic units (6 decimals)

// ERC-3009 transferWithAuthorization ABI (used by Circle USDC on Base)
const TRANSFER_WITH_AUTH_ABI = [
  {
    type: "function",
    name: "transferWithAuthorization",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// ERC-20 name() for domain separator
const NAME_ABI = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "version", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "DOMAIN_SEPARATOR", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
] as const;

function log(step: string, msg: string) {
  const label = `\x1b[36m[${step}]\x1b[0m`;
  console.log(`${label} ${msg}`);
}

function ok(msg: string) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}

function err(msg: string) {
  console.error(`\x1b[31m✗\x1b[0m ${msg}`);
}

async function buildX402Payment(requirements: {
  accepts: Array<{
    scheme: string;
    network: string;
    maxAmountRequired: string;
    resource: string;
    payTo: string;
    asset: string;
    maxTimeoutSeconds: number;
    extra?: { chainId?: number; decimals?: number; name?: string };
  }>;
}): Promise<string> {
  const accept = requirements.accepts[0];
  if (!accept) throw new Error("No payment requirement found");

  const account = privateKeyToAccount(DONOR_KEY);
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) });

  // Read the USDC domain separator to sign EIP-712
  const domainSeparator = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: NAME_ABI,
    functionName: "DOMAIN_SEPARATOR",
  });

  const nonce = bytesToHex(crypto.getRandomValues(new Uint8Array(32))) as `0x${string}`;
  const validAfter = 0n;
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + (accept.maxTimeoutSeconds ?? 300));
  const amount = BigInt(accept.maxAmountRequired);

  // EIP-712 transferWithAuthorization type hash
  const TYPE_HASH = keccak256(
    toBytes(
      "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)",
    ),
  );

  const structHash = keccak256(
    encodeAbiParameters(
      parseAbiParameters("bytes32,address,address,uint256,uint256,uint256,bytes32"),
      [TYPE_HASH, account.address, RECEIVER_ADDRESS, amount, validAfter, validBefore, nonce],
    ),
  );

  const digest = keccak256(
    new Uint8Array([
      0x19,
      0x01,
      ...hexToBytes(domainSeparator),
      ...hexToBytes(structHash),
    ]),
  );

  const sig = await account.sign({ hash: digest });
  // sig is 0x + r(64) + s(64) + v(2) hex chars
  const v = Number(`0x${sig.slice(-2)}`); // 27 or 28
  const r = sig.slice(0, 66) as `0x${string}`;
  const s = `0x${sig.slice(66, 130)}` as `0x${string}`;

  const payload = {
    scheme: "exact",
    network: accept.network,
    payload: {
      from: account.address,
      to: RECEIVER_ADDRESS,
      value: amount.toString(),
      validAfter: validAfter.toString(),
      validBefore: validBefore.toString(),
      nonce,
      version: "1",
      r,
      s,
      v,
    },
  };

  return btoa(JSON.stringify(payload));
}

async function main() {
  console.log("\n\x1b[1mPhase 3 Demo — x402 Credential Verification\x1b[0m");
  console.log("=".repeat(55));

  const url = `${API_URL}/credential/verify?vendorAddress=${VENDOR_ADDRESS}`;
  log("1", `GET ${url}`);

  // Step 1: hit the endpoint without payment → expect 402
  const firstRes = await fetch(url);
  if (firstRes.status !== 402) {
    err(`Expected 402, got ${firstRes.status}`);
    process.exit(1);
  }
  const requirements = await firstRes.json() as { accepts: Parameters<typeof buildX402Payment>[0]["accepts"] };
  ok(`Got 402 — payment required: ${requirements.accepts?.[0]?.maxAmountRequired ?? "?"} μUSDC`);
  log("2", `Building ERC-3009 transferWithAuthorization signature…`);

  let paymentHeader: string;
  try {
    paymentHeader = await buildX402Payment(requirements);
    ok(`Signed. Header length: ${paymentHeader.length} chars`);
  } catch (e) {
    err(`Failed to build payment: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }

  log("3", `Retrying with X-Payment header…`);
  const secondRes = await fetch(url, {
    headers: { "X-Payment": paymentHeader },
  });

  const body = await secondRes.json() as {
    attested?: boolean;
    vendorAddress?: string;
    attestation?: {
      uid: string;
      schema: string;
      time: string;
      recipient: string;
      attester: string;
    };
    easScanUrl?: string;
    error?: string;
  };

  if (secondRes.status !== 200 || body.error) {
    err(`Verification failed (${secondRes.status}): ${body.error ?? JSON.stringify(body)}`);
    process.exit(1);
  }

  console.log("\n\x1b[1mResult\x1b[0m");
  console.log("-".repeat(55));
  if (body.attested) {
    ok(`\x1b[32mVendor ATTESTED by WCK\x1b[0m`);
    console.log(`  Vendor:   ${body.vendorAddress}`);
    console.log(`  UID:      ${body.attestation?.uid}`);
    console.log(`  Schema:   ${body.attestation?.schema}`);
    console.log(`  Issued:   ${new Date(Number(body.attestation?.time) * 1000).toISOString()}`);
    console.log(`  Attester: ${body.attestation?.attester}`);
    console.log(`  EAS:      ${body.easScanUrl}`);
  } else {
    console.log(`  Vendor ${body.vendorAddress} has no WCK attestation yet.`);
  }
  console.log();
}

main().catch((e) => {
  err(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
