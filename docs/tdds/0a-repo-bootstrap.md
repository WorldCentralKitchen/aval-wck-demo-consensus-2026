---
phase: 0a
name: Repo bootstrap (pnpm monorepo + CDK + Vite scaffold)
date: 2026-05-06
status: complete
---

# Phase 0a — Repo bootstrap

## What landed

Empty monorepo that compiles. Nothing in it talks to AWS, Base, or Coinbase
yet — that wiring lands in the phases that own each surface. This phase only
has to satisfy two tests:

1. `pnpm install` resolves cleanly across all workspace packages.
2. `pnpm -r typecheck` passes on every package (including all five apps).

Both pass. 162 packages installed, 10/10 workspaces typecheck.

## Layout

```
aval-wck-demo-consensus-2026/
├── package.json                # workspace root, pnpm@9.15.0 pinned via Corepack
├── pnpm-workspace.yaml         # apps/*, packages/*, services/*, infra, scripts
├── tsconfig.base.json          # strict, ES2022, Bundler module resolution
├── .nvmrc                      # 20
├── .env / .env.example         # AWS now; CDP/EAS/x402 vars sketched for Phase 0c
│
├── apps/
│   ├── kyc-console/    (port 5173 — WCK KYC officer)
│   ├── vendor-portal/  (port 5174 — vendor self-service)
│   ├── vendor-pos/     (port 5175 — vendor POS / redemption capture)
│   ├── field-app/      (port 5176 — WCK field staff / recipient enrollment)
│   └── trainer-app/    (port 5177 — stretch, WCK trainer / skill issuance)
│
├── packages/
│   ├── schemas/        # EAS schema definitions + UID slot file
│   ├── sdk/            # eas / cdp / api sub-modules (placeholders)
│   └── ui/             # WCK Tailwind preset + shared React primitives
│
├── services/           # Lambda handlers, populated in Phase 1b
│
├── infra/              # CDK app — empty stack for Phase 0a
│   ├── bin/aval.ts
│   ├── lib/aval-stack.ts
│   └── cdk.json
│
├── scripts/            # operational scripts, populated in Phase 0b
│
└── docs/
    ├── adr/            # ADR-0001 (existing)
    ├── design/         # v3 design doc (existing)
    └── tdds/           # this file (NEW)
```

## Decisions locked

| Choice | Decision | Rationale |
|---|---|---|
| Package manager | pnpm 9.15.0 via Corepack | One toolchain hash, fast workspace installs, native filtering |
| IaC | AWS CDK v2 (TypeScript) | Same TS toolchain as services + frontend; easier shared types than SAM |
| Frontend | Vite 5 + React 18 + Tailwind 3 | Fastest DX for tablet-style demos; no SSR needed |
| Tailwind preset | `@aval/ui/tailwind-preset` | Brand tokens (Wild Blueberry, Spanish Saffron, Sea Foam) consumed by all 5 apps |
| Module style | ESM throughout, `type: "module"` everywhere | One module system, no .cjs/.mjs gymnastics outside Tailwind/PostCSS configs that need CJS |
| TS module resolution | `Bundler` for libs/apps, `NodeNext` for CDK + scripts | Bundler is the modern shared-source mode; NodeNext is what `tsx`/CDK runtime expect |

## What this phase deliberately did NOT do

- Did **not** install CDK constructs for any AWS service yet. `AvalStack` is
  an empty `Stack` subclass. Phase 1b adds DynamoDB / Rekognition / KMS /
  API Gateway; Phase 2 adds Bedrock / S3 / Cognito / EventBridge; Phase 3
  adds the x402 paywall.
- Did **not** install ethers / viem / EAS SDK / CDP SDK. Those are Phase 1a
  dependencies of `@aval/sdk` — adding them now would resolve a lot of
  packages we'll never use until then and bloat the lockfile prematurely.
- Did **not** install Lambda runtime libs (`@aws-sdk/client-*`). Those land
  per-Lambda in Phase 1b under `services/`.
- Did **not** scaffold the demo donor-agent script. That's a Phase 3b deliverable.

## What surprised us

- `tsc --noEmit` on a TypeScript package with no `.ts` files in `src/`
  fails with `TS18003: No inputs were found`. Adding a placeholder
  `src/index.ts` with `export {};` is enough to make the typecheck pass
  while leaving the package empty. We did this for `scripts/`.
- `import { x } from "./y.js"` inside a `.ts` file works under both
  `Bundler` and `NodeNext` module resolution. Keeping `.js` in the import
  string lets the same source compile under both modes without rewrites.

## Verification commands (rerun anytime)

```bash
pnpm install                 # resolves all 11 workspaces
pnpm -r typecheck            # 10 of 11 (root has no typecheck script)
pnpm --filter @aval/kyc-console build       # smoke test one Vite build
pnpm --filter @aval/infra synth             # smoke test CDK (needs AWS_ACCOUNT_ID in env)
```

## What's next (Phase 0b)

`scripts/src/` gets three operational scripts:

1. `create-wallets.ts` — generates Base Sepolia keypairs for issuer,
   treasury, x402 receiver, and demo donor. Writes addresses to stdout
   and a `.runs/` JSON file (gitignored); private keys must go into `.env`
   manually so they're never on disk under git.
2. `register-schemas.ts` — connects to the EAS Schema Registry on Base
   Sepolia using the issuer key, registers all four schemas defined in
   `packages/schemas`, and rewrites `packages/schemas/src/uids.ts` with
   the resulting UIDs. Idempotent (skips already-registered schemas by
   re-deriving the UID).
3. `fund-status.ts` — reads each wallet's Base Sepolia ETH and USDC
   balance and tells the operator which faucets to hit before Phase 1a.

Phase 0b unblocks Phase 0c (Carlo's external-account work) and Phase 1a
(actual on-chain attestations).
