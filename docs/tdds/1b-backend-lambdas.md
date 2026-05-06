---
phase: 1b
name: Backend Lambdas
date: 2026-05-06
status: complete
---

# Phase 1b — Backend Lambdas

## What landed

A new workspace package (`@aval/lambda-handlers` at `services/api/`) containing
four Lambda handlers and one shared DynamoDB utility, plus a fully populated
CDK stack in `infra/lib/aval-stack.ts`.

| File | Purpose |
|---|---|
| `services/api/src/lib/db.ts` | DynamoDB DocumentClient singleton + typed key helpers + `putItem`/`getItem` |
| `services/api/src/handlers/enroll.ts` | `POST /enroll` — Rekognition + DynamoDB |
| `services/api/src/handlers/redeem.ts` | `POST /redeem` — Rekognition + DynamoDB |
| `services/api/src/handlers/attest-issue.ts` | `POST /attest/issue` — EAS attestation + DynamoDB |
| `services/api/src/handlers/attest-verify.ts` | `GET /attest/verify` — EAS read |
| `infra/lib/aval-stack.ts` | DynamoDB, API Gateway, 4 × NodejsFunction, IAM |

## DynamoDB record patterns

| PK | SK | Contents |
|---|---|---|
| `VENDOR#<addr>` | `VENDOR#<addr>` | uid, easScanUrl, createdAt |
| `ACTIVATION#<id>` | `RECIPIENT#<anonId>` | faceId, enrolledAt |
| `FACE#<faceId>` | `FACE#<faceId>` | activationId, anonRecipientId |
| `ACTIVATION#<id>` | `REDEMPTION#<ms>#<anonId>` | vendorAddress, confidence, redeemedAt |

The FACE lookup record is the key design decision: it provides O(1) faceId → anonRecipientId resolution on redeem without a GSI.

## API routes

All routes require `x-api-key` header (issued by CloudFormation via the `AvalApiKey` resource).

```
POST /enroll
  Body: { activationId: string, base64Image: string }
  Returns: { anonRecipientId: string, enrolledAt: number }

POST /redeem
  Body: { vendorAddress: string, activationId: string, base64Image: string }
  Returns: { matched: boolean, anonRecipientId?: string, confidence?: number }

POST /attest/issue
  Body: { vendorAddress: string, region: string, category: string, validUntil: number, issuerNote?: string }
  Returns: { uid: string, easScanUrl: string }

GET /attest/verify?vendorAddress=0x...
  Returns: { attested: boolean, attestation?: { uid, time, expirationTime, revocationTime, recipient, attester } }
```

## Decisions locked

| Choice | Decision | Rationale |
|---|---|---|
| Lambda bundler | `NodejsFunction` (esbuild local) | No Docker dependency; esbuild follows pnpm symlinks to bundle workspace packages inline |
| Module format | CJS (esbuild default) | No `.mjs` rename needed; simpler Lambda runtime integration; avoids ESM dynamic import edge cases in bundled viem |
| `@aval/sdk/eas` subpath import | Handlers import `from "@aval/sdk/eas"`, not the barrel | Guarantees `cdp.ts` (which imports native secp256k1 via `@coinbase/coinbase-sdk`) is never reachable by esbuild |
| `@coinbase/coinbase-sdk` external | Listed in `bundling.externalModules` | Belt-and-suspenders guarantee even if the import graph ever changes |
| Rekognition collection | Created lazily on first `/enroll` call (idempotent `CreateCollection`) | Self-healing if collection is deleted; no CDK CfnCollection dependency |
| Face-to-recipient mapping | FACE# lookup record instead of GSI | O(1) DynamoDB GetItem on redeem; avoids GSI provisioning; simpler for demo scale |
| Face confidence threshold | 90% (`FaceMatchThreshold: 90`) | Tunable via the constant; conservative enough to prevent false positives at demo |
| EAS private key delivery | Passed as Lambda env var from operator's `.env` at `cdk deploy` time | Simplest path for the demo; production would use Secrets Manager |
| `BigInt` serialization | `.toString()` on all bigint fields before `JSON.stringify` | `JSON.stringify` throws on raw bigint; time fields from viem's `getAttestation` are bigint |
| `RemovalPolicy.RETAIN` on DynamoDB | Table survives `cdk destroy` | Demo data (enrollments, redemptions) must not be lost on stack teardown |
| attest-issue timeout | 60s (vs 30s for others) | Waits for on-chain tx receipt; Base Sepolia block time is ~2s but network congestion can delay confirmation |

## What this phase deliberately did NOT do

- Did **not** add Cognito JWT auth. API key auth is sufficient for Phase 1b;
  Cognito + RBAC land in Phase 2c.
- Did **not** add a per-redemption daily-limit check. That policy guard is Phase 2d.
- Did **not** add retry/timeout logic in the handlers. Phase 3 defensive coding adds
  idempotency keys and exponential backoff.
- Did **not** create a Rekognition collection via CDK. The CDK L1 `CfnCollection` resource
  exists in CDK 2.165 but lazy Lambda creation is more operationally resilient.
- Did **not** wire the API key value into the frontend apps. Phase 1c (frontend scaffold)
  handles that — the key ARN is a CloudFormation output for the operator to retrieve.

## What surprised us

- `NodejsFunction` with `projectRoot: repoRoot` resolves pnpm workspace symlinks
  correctly without any alias or custom resolver. esbuild follows the symlink from
  `services/api/node_modules/@aval/sdk` → `packages/sdk/src/eas.ts` and bundles it
  inline. The `exports` field (subpath `"./eas"`) is also resolved natively by esbuild 0.21+.
- `rekognition:CreateCollection` cannot be scoped to a collection ARN at policy
  creation time (the collection doesn't exist yet). Split into two separate PolicyStatements:
  `CreateCollection` on `"*"` and `IndexFaces` on the specific collection ARN.
- DynamoDB DocumentClient `GetCommand` result `.Item` is typed as
  `Record<string, NativeAttributeValue> | undefined`. Casting to a typed record shape
  (`as { anonRecipientId: string }`) is the idiomatic TypeScript approach — no typed
  getter exists on the L2 Document client.
- `import.meta.url` in the CDK stack (an ESM module via `"type": "module"`) works
  naturally with `tsx` 4.19.2 — no workaround needed.

## Verification

```bash
pnpm -r typecheck   # all 11 workspaces green

# After sourcing .env and bootstrapping CDK:
set -a; source .env; set +a
pnpm --filter @aval/infra synth   # CloudFormation template produced, no errors

# Deploy (creates API GW, DynamoDB, Lambdas in ~3 min):
pnpm --filter @aval/infra deploy

# Get the API key value from AWS console or CLI:
aws apigateway get-api-keys --include-values --query 'items[?name==`aval-demo-key`].value' --output text
```

## What's next (Phase 1c)

Frontend scaffold: shared component library (`@aval/ui`), and the four app
skeletons wired to the API Gateway base URL. Vendor Portal shows attestation
status (calls `GET /attest/verify`). Vendor POS has the webcam capture flow
feeding `POST /redeem`. Field App has the enrollment form feeding `POST /enroll`.
