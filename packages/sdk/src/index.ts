/**
 * @aval/sdk — typed client for the Aval credential rail.
 *
 * Three sub-modules:
 *   - eas:  EAS attestation issuance + verification helpers (Phase 1a)
 *   - cdp:  Coinbase Developer Platform wallet + USDC helpers (Phase 1a)
 *   - api:  Typed REST client for the API Gateway endpoints (Phase 1b)
 *
 * Sub-modules are deliberately empty in Phase 0a; each fills in during its
 * paired implementation phase.
 */

export * from "@aval/schemas";
export * as eas from "./eas.js";
export * as cdp from "./cdp.js";
export * as api from "./api.js";
// Direct exports for browser apps
export { createAvalClient } from "./api.js";
export type {
  AvalApiClient,
  EnrollParams,
  EnrollResult,
  RedeemParams,
  RedeemResult,
  AttestIssueParams,
  AttestIssueResult,
  AttestVerifyResult,
  SettleParams,
  SettleResult,
  OnboardingReviewParams,
  OnboardingReviewResult,
} from "./api.js";
