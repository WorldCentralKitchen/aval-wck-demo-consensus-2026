---
phase: 0b
name: Pre-provisioning scripts (wallets, schema registration, fund status)
date: 2026-05-06
status: complete
---

# Phase 0b — Pre-provisioning scripts

## What landed

Three operational scripts under `scripts/src/` plus a small viem-based `lib/`
that they share. None of them need to be re-run during normal development;
they are the one-time bridge between an empty `.env` and the on-chain state
Phase 1a expects.

| Script | Purpose | Network I/O |
|---|---|---|
| `create-wallets` | Generates 4 Base Sepolia keypairs, writes them to `.runs/wallets-<iso>.json` (gitignored), and prints an `.env` block for the operator to paste | None — pure local entropy |
| `register-schemas` | Registers all 4 EAS schemas at the canonical Base Sepolia SchemaRegistry, idempotently, and rewrites `packages/schemas/src/uids.ts` | Reads + writes Base Sepolia |
| `fund-status` | Prints ETH + USDC balances for the 4 wallets and tells the operator which faucets to hit | Reads Base Sepolia |

Run them in that order. After Phase 0b you have keys in `.env`, schema UIDs
committed to the repo, and a confirmation table that every wallet is
funded above the threshold the next phase will need.

## Layout added

```
scripts/
├── package.json                   # +viem, +dotenv
└── src/
    ├── create-wallets.ts
    ├── register-schemas.ts
    ├── fund-status.ts
    └── lib/
        ├── env.ts                 # repo-root .env loader + typed accessors
        ├── chain.ts               # viem public/wallet clients for Base Sepolia
        ├── schema-registry.ts     # SchemaRegistry ABI + UID derivation
        └── erc20.ts               # minimal ERC-20 read ABI
```

The placeholder `scripts/src/index.ts` from Phase 0a was deleted — the
typecheck no longer needs it now that real source files exist.

## Decisions locked

| Choice | Decision | Rationale |
|---|---|---|
| Chain library | viem (no ethers, no EAS SDK) | One small dep covers keypair generation, contract reads, and contract writes. Avoids dragging in ethers + the EAS SDK's transitive ethers pin for what is fundamentally three contract calls. |
| Schema registration idempotency | Compute UID locally with `keccak256(encodePacked(schema, resolver, revocable))`, then `getSchema(uid)` to detect prior registration before sending a tx | Mirrors the on-chain SchemaRegistry's UID derivation exactly, so the script is safe to re-run after a partial failure. No state file needed. |
| Where keys are stored | Generated keys land in `.runs/wallets-<iso>.json` (mode 0600, gitignored) and are also printed to stdout for paste-into-`.env` | The operator chooses which file becomes the source of truth (`.env`), but we always have a backup until they delete `.runs/`. |
| `uids.ts` is generated, not edited | `register-schemas` rewrites the whole file from a template | The previous hand-written `uids.ts` had empty-string sentinels; once schemas are real, the file should be a deterministic build artifact, but committed (so downstream packages can `import { SCHEMA_UIDS }` synchronously). |
| Script tsconfig stays NodeNext | Inherited from Phase 0a; relative imports use `.js` even from `.ts` source | Matches what `tsx` and Node's ESM loader expect, and keeps script behavior identical between `tsx` and a future compiled `dist/`. |

## What this phase deliberately did NOT do

- Did **not** call any of these scripts during the build. They write `.env`
  values that Carlo (the operator) needs to paste manually — running
  `create-wallets` and committing the output would land private keys in
  the conversation log. The CI gate is `pnpm -r typecheck`, not "scripts
  produce real on-chain state."
- Did **not** add a CDP SDK wrapper. The hackathon demo uses raw private
  keys against Base Sepolia for both the issuer and the treasury; CDP-managed
  vendor wallets land in Phase 1a (`packages/sdk/src/cdp.ts`). Phase 0b
  is about getting deterministic, faucet-fundable EOAs in place.
- Did **not** wire in a `.env` for the test environment. Tests don't run
  against a real chain in this repo — they will mock viem in the relevant
  Lambda phases.

## What surprised us

- `noUncheckedIndexedAccess` flags `headers[0]` as possibly undefined even
  inside a literal-typed array, which is the strict-mode default behavior.
  Inlining the column labels (`"Role".padEnd(16)`) is cleaner than adding
  non-null assertions.
- viem's chain-aware client types are *not* assignable to the generic
  `PublicClient` / `WalletClient` exported by `viem` when the chain is an
  OP Stack chain like `baseSepolia` — Base Sepolia adds a `"deposit"`
  transaction variant the generic types don't know about. The fix is to
  let viem infer the return type rather than annotating it. This is a
  documented friction point in viem 2.x and worth knowing before Phase 1a
  introduces more chain-specific code paths.

## Verification commands (rerun anytime)

```bash
pnpm install                                          # picks up viem + dotenv
pnpm -r typecheck                                     # 10/10 workspaces pass

# These three are the operator's runbook (NOT run in CI):
pnpm --filter @aval/scripts run create-wallets        # → paste env block, then delete .runs/
pnpm --filter @aval/scripts run fund-status           # → confirms faucets ran
pnpm --filter @aval/scripts run register-schemas      # → updates packages/schemas/src/uids.ts
```

`fund-status` is safe to run with an empty `.env` — it prints "(not set)"
rows and tells the operator to run `create-wallets` first.

`register-schemas` is safe to re-run — already-registered schemas are
detected via `getSchema(deriveSchemaUid(...))` and skipped.

## What's next (Phase 0c)

Operator (Carlo) work, not code. From the design doc §5:

1. Sign up for Coinbase Developer Platform, create an API key, paste the
   key name + private key into `.env` (`CDP_API_KEY_NAME`,
   `CDP_API_KEY_PRIVATE_KEY`).
2. Request Bedrock model access for `anthropic.claude-sonnet-4-20250514-v1:0`
   in `us-east-1`. (24h SLA in the worst case — start it early.)
3. Run `create-wallets`, paste the block into `.env`, hit faucets, run
   `fund-status` until every wallet shows green.
4. Run `register-schemas`, commit the resulting `packages/schemas/src/uids.ts`.

Phase 1a opens the moment `requireSchemaUid("WCK-Vendor")` returns a
non-empty UID and `fund-status` shows the issuer holding ≥0.001 ETH.
