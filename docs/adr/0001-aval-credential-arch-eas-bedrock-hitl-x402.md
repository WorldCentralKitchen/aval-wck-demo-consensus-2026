---
status: proposed
date: 2026-05-06
decision-makers: Carlo Burgos
consulted: Aval hackathon team (Lead/PM, Frontend Engineer, Backend/Cloud Engineer, Blockchain Engineer)
informed: EasyA × Consensus Miami 2026 judges, World Central Kitchen operations
related: []
---

# Aval Multi-Layer Credential Architecture: EAS On-Chain Anchoring, Bedrock Agentic Onboarding with Human-in-the-Loop, and x402 Agent-Native Verification

## Context and Problem Statement

World Central Kitchen pays local vendors (restaurants, food shops, water suppliers) in disaster
zones for meals served to affected communities. The current onboarding workflow requires WCK staff
to custody submitted documents — business licenses, tax IDs, food safety certs, banking details —
indefinitely, creating a material PII safeguarding burden and a multi-day human review bottleneck.
External donors, peer NGOs, and auditors who want to verify that a vendor was paid have no
programmatic access path short of an email to WCK staff.

How should Aval structure its credential issuance, document-review automation, and external
verification layers so that: (a) WCK holds a pointer to vendor trust, not the documents; (b) the
document review bottleneck is compressed without removing human judgment from the approval
decision; and (c) the credential rail is queryable by the emerging agent economy without
procurement contracts or API keys?

## Decision Drivers

* **PII minimization:** WCK must not custody sensitive partner documents beyond the moment a trust
  signal can be extracted from them.
* **Human accountability on disbursement:** Humanitarian payments touch people on their worst day.
  Every decision about who gets paid must have a named human accountable to it. Agents must not
  hold disbursement keys.
* **Holder-owned credentials:** Vendors and community responders should carry their own credentials
  — WCK revokes, but cannot rewrite history or lock the credential inside WCK's systems.
* **Agent-economy interoperability:** Donor agents, peer-NGO verifiers, and audit agents need a
  zero-procurement integration path to query the credential rail.
* **Sector-wide credential portability:** Community responder skill credentials must be verifiable
  by organizations (IFRC, Red Cross, Direct Relief) that have no Aval integration.
* **36-hour buildability:** All architectural choices must have working SDKs, free testnet access,
  and demonstrable end-to-end flows within hackathon constraints.

## Considered Options

* **Option A — Centralized REST API with document storage database:** Extend WCK's existing
  internal tooling with a traditional API. Documents stored in a managed DB or S3 indefinitely.
  External verifiers given API keys via a sales/procurement process.
* **Option B — WFP Building Blocks (existing humanitarian blockchain system):** Adopt the UN
  World Food Programme's closed inter-agency CBDC distribution platform.
* **Option C — Fully autonomous agent pipeline:** Bedrock agent reads documents, approves vendor,
  issues attestation, and triggers USDC disbursement end-to-end without human intervention.
* **Option D — Multi-layer: EAS on-chain anchoring + Bedrock agentic document review with
  mandatory human approval gate + Coinbase x402 micropayment verification:** Chosen option.

## Decision Outcome

Chosen option: **Option D — Multi-layer EAS + Bedrock HITL + x402**, because it is the only
option that simultaneously satisfies PII minimization (documents expire in S3 within 24 hours
after the attestation issues; only the trust signal persists on-chain), human accountability
(the agent recommends, a named KYC officer approves, the on-chain attestation carries the
human's action), and agent-economy openness (any agent can pay $0.01 USDC and receive the
credential chain with no prior relationship with WCK).

The agent boundary — **agents on the read side and document-review side only, never on the
disbursement side** — is a first-class architectural principle, not a safety hedge. It is the
design choice that makes Aval trustworthy to humanitarian partners and fundable by impact donors
who need auditability.

### Consequences

* Good, because WCK holds a pointer (schema UID + holder address) rather than a document corpus,
  eliminating the ongoing PII custody and safeguarding liability.
* Good, because the Bedrock agent compresses a multi-day human review cycle to a one-minute KYC
  officer review of a structured packet — without removing the human from the approval decision.
* Good, because EAS revocable attestations on Base are public, cheap, and auditable: any
  third party can verify the attestation chain without querying WCK's internal systems.
* Good, because x402 turns the verification endpoint into infrastructure the agent economy can
  call per-request — no API key, no subscription, no procurement cycle. The integration cost
  drops from weeks to one HTTP call.
* Good, because the `WCK-Skill` schema carries a W3C Verifiable Credential / Open Badges 3.0
  compatible payload, making community responder credentials verifiable by any 1EdTech-compliant
  verifier without Aval integration.
* Good, because registering all four EAS schemas at H+0 (WCK-Vendor, WCK-Activation-Recipient,
  WCK-Skill, WCK-Supplier) under one contract means Phases B–D of the roadmap require a Lambda
  and a frontend page, not a re-architecture.
* Bad, because Base Sepolia testnet dependency means demo reliability is subject to public
  testnet congestion; mitigated by pre-minting standby attestations.
* Bad, because x402 is an emerging protocol (Coinbase-backed, free tier up to 1,000 tx/month);
  production adoption requires monitoring facilitator uptime and rate limits.
* Bad, because Bedrock Agent provisioning requires model access approval that can take up to 24
  hours — must be requested before H+0 and cannot be unblocked during the hackathon.
* Bad, because the Bedrock agent's reasoning trace never quotes PII, but the trace itself must
  be stored for auditability — trace retention policy must be defined explicitly in production.

### Confirmation

* **Agent boundary enforcement:** Code review gate — the `/attest/issue` Lambda must not be
  reachable from any Bedrock agent action group. The agent's `finalizeReviewPacket` tool writes
  only to DynamoDB; the KYC Console frontend calls `/attest/issue` after explicit officer
  approval. Reviewers verify no direct agent → issuance call path exists in the action group
  definition.
* **Document TTL:** AWS S3 lifecycle policy on `aval-onboarding-staging` must enforce a 24-hour
  expiry. Verified via `aws s3api get-bucket-lifecycle-configuration` in CI or post-deploy check.
* **x402 paywall coverage:** Integration test confirms that unauthenticated GET to
  `/credential/verify` returns HTTP 402 before any attestation data is returned.
* **On-chain schema registration:** All four schema UIDs committed to `schemas.ts` and confirmed
  live on EAS Scan before H+2.

## Pros and Cons of the Options

### Option A — Centralized REST API with document storage

Traditional approach: REST API, relational or document DB, API-key-gated external access.

* Good, because it maps directly to WCK's existing internal tooling patterns.
* Good, because no blockchain/crypto literacy required from engineering team.
* Bad, because documents are stored indefinitely, compounding PII safeguarding liability with
  every new vendor onboarded.
* Bad, because external verifiers (donors, auditors) require a procurement relationship with WCK,
  making programmatic verification inaccessible to the agent economy.
* Bad, because credentials are WCK-locked — there is no holder-owned, portable trust signal a
  vendor can carry to another humanitarian organization.

### Option B — WFP Building Blocks

The UN World Food Programme's existing inter-agency CBDC distribution blockchain.

* Good, because it is a production-proven humanitarian payments infrastructure.
* Bad, because Building Blocks is a closed system for inter-agency cash distribution within UN
  agencies — it does not handle vendor-side onboarding for organizations like WCK that pay small
  local businesses.
* Bad, because it does not issue holder-owned credentials back to vendors.
* Bad, because it has no agent-native query surface (no x402 or equivalent).
* Bad, because WCK is not a UN agency and integration would require formal inter-agency agreement.

### Option C — Fully autonomous agent pipeline

Bedrock agent reads documents, makes the approval decision, issues the attestation, and triggers
USDC disbursement without human review.

* Good, because it maximizes automation and minimizes human time per vendor.
* Bad, because it removes human accountability from disbursement decisions affecting disaster
  survivors — incompatible with WCK's mission and the humanitarian sector's dignity standards.
* Bad, because any agent reasoning error (hallucinated cross-check, misread document) directly
  causes an incorrect payment with no human checkpoint.
* Bad, because on-chain attestations issued by an agent carry no named human accountable to the
  decision — audit trail is algorithmically generated, not human-signed.

### Option D — Multi-layer EAS + Bedrock HITL + x402 (chosen)

EAS revocable on-chain attestations anchor trust; Bedrock Agent + Textract compresses document
review; mandatory KYC officer approval gate before attestation issuance; x402 micropayment
middleware on `/credential/verify` for agent-native external access.

* Good, because all three humanitarian requirements are met: PII minimization, human
  accountability, and holder-owned portability.
* Good, because the x402 paywall makes Aval's credential rail a piece of infrastructure the
  agent economy can discover and call — turning a closed WCK tool into open humanitarian
  infrastructure.
* Good, because the W3C VC / Open Badges 3.0 compatibility layer on `WCK-Skill` satisfies
  sector-wide interoperability without abandoning EAS's on-chain anchoring and revocation.
* Neutral, because it requires four distinct technology integrations (EAS, Bedrock, CDP, x402)
  that the team must be familiar with before H+0.
* Bad, because it introduces Base Sepolia and Coinbase x402 Facilitator as external dependencies
  with their own reliability surfaces.

## More Information

* **Design document:** [Aval Design v3](../design/Avak%20Design%20V3.md) — full 36-hour build
  plan, demo script, risk register, and Project Dream roadmap.
* **EAS SDK:** `@ethereum-attestation-service/eas-sdk` on Base Sepolia (free attestations,
  public anchor, revocable).
* **Coinbase x402 protocol:** `x402-express` middleware (server) and `x402-fetch` (agent buyer);
  free tier: 1,000 tx/month.
* **Bedrock Agent action group tools:** `extractDocument(s3Uri)`, `crossCheck(fields)`,
  `finalizeReviewPacket(vendorId, summary, recommendation, flags)` — agent never calls
  `/attest/issue` directly.
* **Revisit trigger:** If Bedrock model access cannot be granted before H+2, fall back to v2
  scope (manual KYC review, no agentic onboarding). The EAS + x402 layers are independent and
  proceed regardless.
* **Phase B extension point:** A telemetry agent (recommendation-only) may be added post-hackathon
  to propose settlement batches for human approval. The agent boundary principle established here
  applies: the agent never moves money on its own.

## Approval Checklist

- [ ] Reviewed by: Aval hackathon team
- [ ] Approved by: Carlo Burgos
- [ ] Status updated to accepted
