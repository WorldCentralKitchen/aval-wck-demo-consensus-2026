/**
 * EAS attestation helpers for Base Sepolia.
 *
 * All write functions read EAS_ISSUER_PRIVATE_KEY from process.env.
 * All functions use BASE_SEPOLIA_RPC_URL if set, otherwise the public endpoint.
 *
 * No EAS SDK dependency — viem handles the contract calls directly, consistent
 * with the Phase 0b decision to avoid the EAS SDK's transitive ethers pin.
 */

import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  encodeAbiParameters,
  http,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { requireSchemaUid, type VendorAttestationPayload } from "@aval/schemas";

const EAS_ADDRESS: `0x${string}` = "0x4200000000000000000000000000000000000021";
const ZERO_BYTES32: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const DEFAULT_RPC = "https://sepolia.base.org";

const EAS_ABI = [
  {
    type: "function",
    name: "attest",
    stateMutability: "payable",
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
          { name: "schema", type: "bytes32" },
          {
            name: "data",
            type: "tuple",
            components: [
              { name: "recipient", type: "address" },
              { name: "expirationTime", type: "uint64" },
              { name: "revocable", type: "bool" },
              { name: "refUID", type: "bytes32" },
              { name: "data", type: "bytes" },
              { name: "value", type: "uint256" },
            ],
          },
        ],
      },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "getAttestation",
    stateMutability: "view",
    inputs: [{ name: "uid", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "uid", type: "bytes32" },
          { name: "schema", type: "bytes32" },
          { name: "time", type: "uint64" },
          { name: "expirationTime", type: "uint64" },
          { name: "revocationTime", type: "uint64" },
          { name: "refUID", type: "bytes32" },
          { name: "recipient", type: "address" },
          { name: "attester", type: "address" },
          { name: "revocable", type: "bool" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "revoke",
    stateMutability: "payable",
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
          { name: "schema", type: "bytes32" },
          {
            name: "data",
            type: "tuple",
            components: [
              { name: "uid", type: "bytes32" },
              { name: "value", type: "uint256" },
            ],
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "Attested",
    anonymous: false,
    inputs: [
      { name: "recipient", type: "address", indexed: true },
      { name: "attester", type: "address", indexed: true },
      { name: "uid", type: "bytes32", indexed: false },
      { name: "schema", type: "bytes32", indexed: true },
    ],
  },
] as const;

// Matches the on-chain Attestation struct returned by getAttestation().
export interface Attestation {
  uid: Hex;
  schema: Hex;
  time: bigint;
  expirationTime: bigint;
  revocationTime: bigint;
  refUID: Hex;
  recipient: `0x${string}`;
  attester: `0x${string}`;
  revocable: boolean;
  data: Hex;
}

function rpcUrl(): string {
  return process.env["BASE_SEPOLIA_RPC_URL"] ?? DEFAULT_RPC;
}

function makePublicClient() {
  return createPublicClient({ chain: baseSepolia, transport: http(rpcUrl()) });
}

function makeIssuerClients() {
  const raw = process.env["EAS_ISSUER_PRIVATE_KEY"];
  if (!raw) throw new Error("EAS_ISSUER_PRIVATE_KEY is not set");
  const key = (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;
  const account = privateKeyToAccount(key);
  const transport = http(rpcUrl());
  return {
    pub: createPublicClient({ chain: baseSepolia, transport }),
    wal: createWalletClient({ account, chain: baseSepolia, transport }),
    account,
  };
}

/**
 * Issues an EAS attestation. Returns the attestation UID (bytes32).
 * Requires EAS_ISSUER_PRIVATE_KEY in process.env.
 */
export async function attest(params: {
  schemaUid: Hex;
  recipient: `0x${string}`;
  /** ABI-encoded schema field data — use encodeVendorData() or schema-specific helpers. */
  data: Hex;
  revocable?: boolean;
  expirationTime?: bigint;
}): Promise<Hex> {
  const { pub, wal, account } = makeIssuerClients();

  const txHash = await wal.writeContract({
    address: EAS_ADDRESS,
    abi: EAS_ABI,
    functionName: "attest",
    account,
    args: [
      {
        schema: params.schemaUid,
        data: {
          recipient: params.recipient,
          expirationTime: params.expirationTime ?? 0n,
          revocable: params.revocable ?? true,
          refUID: ZERO_BYTES32,
          data: params.data,
          value: 0n,
        },
      },
    ],
  });

  const receipt = await pub.waitForTransactionReceipt({ hash: txHash });

  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: EAS_ABI,
        eventName: "Attested",
        topics: log.topics,
        data: log.data,
      });
      return decoded.args.uid;
    } catch {
      // Not an Attested log — try next.
    }
  }

  throw new Error(`Attested event not found in tx ${txHash}`);
}

/**
 * Returns the most recent non-revoked attestation for a schema+holder pair,
 * or null if no valid attestation exists.
 *
 * Searches the last ~2 million Base Sepolia blocks (~46 days).
 */
export async function verifyLatest(params: {
  schemaUid: Hex;
  holder: `0x${string}`;
}): Promise<Attestation | null> {
  const pub = makePublicClient();

  const latest = await pub.getBlockNumber();
  const fromBlock = latest > 2_000_000n ? latest - 2_000_000n : 0n;

  const logs = await pub.getLogs({
    address: EAS_ADDRESS,
    event: {
      type: "event",
      name: "Attested",
      anonymous: false,
      inputs: [
        { name: "recipient", type: "address", indexed: true },
        { name: "attester", type: "address", indexed: true },
        { name: "uid", type: "bytes32", indexed: false },
        { name: "schema", type: "bytes32", indexed: true },
      ],
    } as const,
    args: {
      recipient: params.holder,
      schema: params.schemaUid,
    },
    fromBlock,
    toBlock: "latest",
  });

  if (logs.length === 0) return null;

  const uid = logs[logs.length - 1]!.args.uid as Hex;

  const raw = await pub.readContract({
    address: EAS_ADDRESS,
    abi: EAS_ABI,
    functionName: "getAttestation",
    args: [uid],
  });

  if (raw.revocationTime !== 0n) return null;

  return {
    uid: raw.uid as Hex,
    schema: raw.schema as Hex,
    time: raw.time,
    expirationTime: raw.expirationTime,
    revocationTime: raw.revocationTime,
    refUID: raw.refUID as Hex,
    recipient: raw.recipient,
    attester: raw.attester,
    revocable: raw.revocable,
    data: raw.data as Hex,
  };
}

/**
 * Revokes an attestation by UID. The caller (ISSUER_PRIVATE_KEY) must be the
 * original attester.
 */
export async function revoke(params: {
  schemaUid: Hex;
  uid: Hex;
}): Promise<void> {
  const { pub, wal, account } = makeIssuerClients();

  const txHash = await wal.writeContract({
    address: EAS_ADDRESS,
    abi: EAS_ABI,
    functionName: "revoke",
    account,
    args: [
      {
        schema: params.schemaUid,
        data: { uid: params.uid, value: 0n },
      },
    ],
  });

  await pub.waitForTransactionReceipt({ hash: txHash });
}

/**
 * Typed wrapper: encodes and issues a WCK-Vendor attestation.
 * Returns the attestation UID.
 */
export async function attestVendor(
  vendorAddress: `0x${string}`,
  payload: VendorAttestationPayload,
): Promise<Hex> {
  const schemaUid = requireSchemaUid("WCK-Vendor");

  const data = encodeAbiParameters(
    [
      { name: "status", type: "string" },
      { name: "region", type: "string" },
      { name: "category", type: "string" },
      { name: "validUntil", type: "uint64" },
      { name: "issuerNote", type: "string" },
    ] as const,
    [
      payload.status,
      payload.region,
      payload.category,
      BigInt(payload.validUntil),
      payload.issuerNote,
    ],
  );

  return attest({ schemaUid, recipient: vendorAddress, data });
}
