/**
 * Minimal ABI + helpers for the EAS SchemaRegistry on Base Sepolia.
 *
 * UID derivation matches the on-chain SchemaRegistry contract:
 *   bytes32 uid = keccak256(abi.encodePacked(schema, resolver, revocable))
 *
 * That determinism is what makes register-schemas.ts idempotent: we compute the
 * UID locally, query getSchema(uid), and only send a tx if the registry returns
 * the zero record.
 *
 * Canonical addresses per https://docs.attest.org/docs/quick--start/contracts.
 */

import { encodePacked, keccak256, zeroAddress, type Hex } from "viem";

export const BASE_SEPOLIA_SCHEMA_REGISTRY: `0x${string}` =
  "0x4200000000000000000000000000000000000020";

export const BASE_SEPOLIA_EAS: `0x${string}` =
  "0x4200000000000000000000000000000000000021";

export const SCHEMA_REGISTRY_ABI = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [
      { name: "schema", type: "string" },
      { name: "resolver", type: "address" },
      { name: "revocable", type: "bool" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "getSchema",
    stateMutability: "view",
    inputs: [{ name: "uid", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "uid", type: "bytes32" },
          { name: "resolver", type: "address" },
          { name: "revocable", type: "bool" },
          { name: "schema", type: "string" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "Registered",
    inputs: [
      { name: "uid", type: "bytes32", indexed: true },
      { name: "registerer", type: "address", indexed: true },
      {
        name: "schema",
        type: "tuple",
        indexed: false,
        components: [
          { name: "uid", type: "bytes32" },
          { name: "resolver", type: "address" },
          { name: "revocable", type: "bool" },
          { name: "schema", type: "string" },
        ],
      },
    ],
    anonymous: false,
  },
] as const;

export function deriveSchemaUid(
  schema: string,
  resolver: `0x${string}` | null,
  revocable: boolean,
): Hex {
  return keccak256(
    encodePacked(
      ["string", "address", "bool"],
      [schema, resolver ?? zeroAddress, revocable],
    ),
  );
}

export const ZERO_BYTES32: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
