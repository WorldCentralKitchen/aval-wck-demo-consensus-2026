---
phase: 1a
name: EAS schemas + attest helpers
date: 2026-05-06
status: complete
---

# Phase 1a — EAS schemas + attest helpers

## What landed

Two source files in `packages/sdk/src/` plus two new dependencies (`viem`,
`@coinbase/coinbase-sdk`) in `packages/sdk/package.json`.

| File | Exports |
|---|---|
| `packages/sdk/src/eas.ts` | `attest`, `verifyLatest`, `revoke`, `attestVendor`, `Attestation` |
| `packages/sdk/src/cdp.ts` | `createVendorWallet`, `disburseToVendor`, `getWalletBalance` |

All four Phase 1 Lambda entry points can now `import { eas, cdp } from "@aval/sdk"` and
call these helpers without any further contract or EAS-SDK setup.

## API summary

### `eas.attest(params)`

Generic EAS attestation. Reads `ISSUER_PRIVATE_KEY` (and optionally
`BASE_SEPOLIA_RPC_URL`) from `process.env`. Returns the attestation UID
(`bytes32` as `0x${string}`) extracted from the `Attested` event in the
transaction receipt.

### `eas.verifyLatest(params)`

Queries `Attested` event logs on the EAS contract filtered by both
`recipient` (holder) and `schema` (schemaUid). Takes the most recent log,
calls `getAttestation(uid)`, and returns null if revoked
(`revocationTime !== 0n`). Searches the last 2 million Base Sepolia blocks
(≈ 46 days), which covers any plausible hackathon window.

### `eas.revoke(params)`

Calls `EAS.revoke()` with the issuer key. Used by the KYC Console's
"Revoke vendor" button (Phase 2e).

### `eas.attestVendor(vendorAddress, payload)`

Typed wrapper over `attest`. Encodes the five `WCK-Vendor` schema fields
with `encodeAbiParameters` and calls `requireSchemaUid("WCK-Vendor")` to
fail loudly if schemas were never registered.

### `cdp.createVendorWallet()`

Calls `Wallet.create({ networkId: "base-sepolia" })` via the Coinbase CDP
SDK. Reads `CDP_API_KEY_NAME` and `CDP_API_KEY_PRIVATE_KEY` from env. Returns
`{ walletId, address }` — callers persist `walletId` to DynamoDB so the
wallet can be loaded later for on-chain interaction.

### `cdp.disburseToVendor(vendorAddress, usdcAmount)`

ERC-20 `transfer()` from the treasury EOA to a vendor address. Reads
`TREASURY_PRIVATE_KEY` from env. `usdcAmount` is in USDC atomic units (6
decimals; 1 USDC = `1_000_000n`). Returns the tx hash after waiting for
receipt.

### `cdp.getWalletBalance(address)`

Read-only: returns `{ eth: bigint, usdc: bigint }` for any Base Sepolia
address. No private key required.

## Decisions locked

| Choice | Decision | Rationale |
|---|---|---|
| No EAS SDK | Direct viem contract calls (consistent with Phase 0b) | Avoids ethers transitive pin; minimal dep surface for Lambda cold starts |
| UID extraction from receipt logs | `decodeEventLog` loop over receipt, not `simulateContract` | EAS UID includes `block.timestamp`, so simulation before tx has a race condition |
| `verifyLatest` uses getLogs | Filter by both `recipient` and `schema` indexed topics | Fastest path that doesn't require a separate indexer; sufficient for demo scale |
| Schema data encoding | `encodeAbiParameters` with `as const` literal tuple | Fully typed for `WCK-Vendor`; no dynamic parser needed for the two schemas the demo uses |
| CDP for vendor wallets; viem for treasury disbursement | Two different signers | Vendor wallets are CDP-managed MPC (no seed phrase UX); treasury is a raw EOA for speed |
| `disburseToVendor` amount in atomic units | Caller converts; no formatting inside the helper | Keeps the helper composable with downstream precision requirements |

## What this phase deliberately did NOT do

- Did **not** implement typed schema encoders for `WCK-Activation-Recipient`,
  `WCK-Skill`, or `WCK-Supplier`. The generic `attest(data: Hex)` is the
  entry point for all other schemas; typed wrappers can be added as needed.
- Did **not** wire env vars into the Lambda CDK definitions. That happens in
  Phase 1b when the Lambda functions are defined.
- Did **not** add retry / backoff logic. For the hackathon demo, a single
  attempt is sufficient; production hardening is Phase 3.
- Did **not** implement CDP wallet loading from a persisted `walletId`. Phase
  2d's settlement Lambda will need `Wallet.fetch(walletId)` — that goes in
  when the settlement Lambda is written.

## What surprised us

- `@coinbase/coinbase-sdk` v0.25.0 brings in `secp256k1` with a native build
  step (`node-gyp-build`), so `pnpm add` triggers a compile. CI needs
  `build-essential` / `xcode-select --install` in the container. Not an issue
  for Amplify (Node + native deps are supported) but worth noting for a
  stripped Lambda base image.
- `encodeAbiParameters` with an inline `as const` tuple is fully type-safe
  and requires no cast, unlike the dynamic schema-string approach considered
  earlier. For the two or three schemas we're actively encoding, the typed
  approach is cleaner and catches field-order bugs at compile time.
- viem's `getLogs` with two indexed filters (`recipient` and `schema`) works
  without a dedicated indexer for the hackathon scale, but the public Base
  Sepolia RPC may rate-limit `eth_getLogs` over a 2 M block range in
  production. If this hits, scope `fromBlock` to the activation date.

## Verification commands

```bash
pnpm -r typecheck   # all 10 workspaces green (packages/ui now also passes)

# Runtime smoke tests (require funded .env):
pnpm --filter @aval/scripts run fund-status     # confirms issuer + treasury funded
pnpm --filter @aval/scripts run register-schemas # if schemas not yet registered
```

## What's next (Phase 1b)

Backend Lambdas behind API Gateway:
- `/enroll` — Rekognition `IndexFaces` + DynamoDB write
- `/redeem` — Rekognition `SearchFacesByImage` + redemption log
- `/attest/issue` — calls `eas.attestVendor()` (this phase's keystone output)
- `/attest/verify` — calls `eas.verifyLatest()`

All four deployed behind API Gateway with API key auth (Cognito in Phase 2c).
