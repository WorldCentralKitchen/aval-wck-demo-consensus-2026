# Aval — Identity, Credential & Agent-Native Infrastructure for Community-Led Humanitarian Response

**36-Hour Hackathon Build Plan + Project Dream Roadmap (v3 — Agentic AI)**

**Track:** Coinbase + AWS
**Event:** EasyA × Consensus Miami 2026
**Team size assumed:** 4 (adapt sections marked *role* if different)
**Name swap:** if you prefer "Pase," global-replace `Aval` → `Pase`

---

## 0. What Changed in v3

v2 made Aval a multi-schema credential rail (vendor + recipient + skill + supplier under one EAS contract). That stays.

v3 adds two agentic surfaces — both real, both demoable in 36 hours, both genuinely earn their place rather than being decorative:

1. **A vendor-onboarding agent** (Amazon Bedrock + Textract) that reads submitted documents, cross-checks them, and surfaces a structured packet to the WCK KYC officer with reasoning. The officer presses Approve. The attestation issues. **Replaces a multi-day human bottleneck with a one-minute review cycle, while keeping the human at the decision point.**
2. **An x402-gated credential endpoint** that lets external agents — donor agents, peer-NGO verifiers, audit agents — query Aval's attestations and pay per-request in USDC, settled on Base via the Coinbase x402 Facilitator. **Reframes Aval from "WCK-internal tool" to "credential infrastructure the agent economy can call."** This is the Coinbase-track-winning narrative.

What v3 does *not* do: hand agents the keys to disbursement decisions. Money still moves only when a human approves. The Project Dream roadmap (Section 11) sketches where multi-agent orchestration goes after the hackathon — but on stage, agents are document-reading and read-side helpers, not autonomous spenders. This is a feature of the design, not a limitation, and judges who care about humanitarian dignity will reward it.

This update modifies six sections from v2 and adds one new section:

1. **Section 1 (North Star):** add the agent-native framing.
2. **Section 2 (Demo):** the vendor-portal beat becomes a vendor-onboarding-agent beat; the closing beat becomes an x402 verification cameo.
3. **Section 3 (Architecture):** Bedrock Agent + Textract on the onboarding side; x402 middleware in front of `/credential/verify`.
4. **Section 6 (Team & Roles):** Backend owns the Bedrock agent; Blockchain owns the x402 middleware; PM owns the agentic-design narrative.
5. **NEW Section 6.5 (Agentic AI Design Principles):** where agents earn their place, where they don't, and the human-in-the-loop posture.
6. **Section 7 (36-Hour Plan):** Phase 2 folds in the Bedrock skeleton; Phase 3 adds the x402 paywall; gates re-tuned.
7. **Section 8 (Risk Register):** four new agent/x402 rows.
8. **Section 9 (Pre-Hackathon Setup):** Bedrock model access, x402 facilitator account, agent-buyer test wallet.
9. **Section 10 (Stretch):** field-worker copilot demoted to a stretch; donor-agent recipe added.
10. **Section 11 (Project Dream Roadmap):** Phase D adds the multi-agent humanitarian coordination layer.

Everything else from v2 stands. The 36-hour scope is unchanged in absolute work hours; we trade some Phase 2 dashboard polish for the agent skeleton, and Phase 3 picks up the x402 line.

---

## 1. The North Star

WCK's mission isn't to send people money. It's to feed communities by partnering with whoever is already there — the local mom-and-pop restaurants, the food shops, the water suppliers, the cooks who showed up after the last storm and will show up after the next one. The friction is in three places, and the same primitive solves all three:

- **Vendors** (payment recipients) are *unbanked in the crypto sense*: small operators in Haiti, Puerto Rico, Western North Carolina, Gaza, Ukraine. WCK currently onboards them through a heavy internal workflow that captures business license, tax ID, food safety cert, owner identity, banking details. Storing all of that creates an enormous custody and safeguarding burden. **The bottleneck is human review of submitted documents — that's where v3 puts an agent.**
- **Recipients** (the people fed) need to be authenticated only enough to ensure *fair distribution* — that one person doesn't redeem ten meals while a neighbor goes without — without WCK ever needing to know their name, age, or anything else.
- **Community responders** (the Project Dream future) are local people WCK trains in safe food distribution, kitchen leadership, supply chain coordination, and disaster response. Today their certifications live as PDFs in inboxes. Tomorrow, when a hurricane hits and the local IFRC chapter or another NGO needs to know who in the community is already trained, those credentials need to be **portable, verifiable, and recognized across the humanitarian sector** — not locked inside WCK's LMS.

Aval is **identity, credential, and agent-native infrastructure** for humanitarian operations. One rail. Multiple credential types. AI agents that compress human bottlenecks (document review) and enable new ones (donor agents querying impact in real time). Vendors and recipients ship in 36 hours; community responders are the v2 path; multi-agent humanitarian orchestration is Project Dream Phase D.

### What we ship in 36 hours (v3 core)

1. **Agentic vendor onboarding.** A Bedrock-powered agent ingests vendor-submitted documents (business license, food safety cert, ID, banking details), uses Textract to extract structured data, cross-checks fields across documents, and surfaces a single review packet to the WCK KYC officer. Officer presses Approve.
2. **Vendor attestations on-chain.** On approval, a revocable EAS attestation is issued to the vendor's CDP-managed wallet on Base. WCK keeps a pointer, not the documents. Onboard once, authenticate many.
3. **Privacy-preserving recipient uniqueness.** At a WCK distribution point, a recipient's face is captured once and converted to an anonymous template stored encrypted in AWS Rekognition, bound to a random activation-scoped ID. At any partner vendor, the recipient's face authenticates them as "unique person 4287 in this activation," the meal is logged, and the vendor accumulates redemptions toward reimbursement.
4. **Stablecoin settlement.** Vendors are paid in USDC on Base from a WCK treasury, automated by a small reconciliation Lambda (not an agent — see Section 6.5) that maps verified meals to verified vendors and disburses on a schedule.
5. **x402-gated credential verification endpoint.** Any external agent (donor, peer NGO, auditor) can query `/credential/verify` for any vendor, skill, or supplier attestation. The endpoint returns `402 Payment Required`, the agent signs a USDC micropayment via the Coinbase x402 Facilitator, retries, gets the verified attestation chain back. **This is the line that turns Aval from "tool" into "infrastructure."**

### What we'll demo as the v2 stretch (additive only)

6. **Community responder credentials.** A WCK trainer issues a "WCK Safe Food Distribution — Level 1" credential to a community member. The credential lives at the same EAS contract as the vendor attestations, on the same chain, under a different schema. It's structured as a W3C Verifiable Credential / Open Badges 3.0 compatible payload, so a Red Cross verifier or a peer NGO with no Aval integration can still verify it using off-the-shelf VC tooling. Holder presents it on demand. WCK can revoke it. The community member owns it.

### Explicitly out of scope (we say so on stage)

- Off-ramp from USDC to local fiat at the vendor (acknowledged; production partners named)
- Mainnet (Base Sepolia testnet only)
- Real fingerprint hardware for recipients
- Cross-activation recipient identity (per-activation only in v1)
- Mobile-native apps (web works on tablets and phones)
- Full WCK Knowledge Management System integration (the credential schema is built; the LMS issuance UI is Phase B)
- Federated revocation across multiple humanitarian issuers (Phase D)
- **Autonomous disbursement decisions by agents.** Money still moves on human approval. Always.

---

## 2. The Demo (work backwards from this — 5 minutes)

| Time | What judges see | What's actually happening |
|------|----------------|--------------------------|
| 0:00–0:30 | "Hurricane just hit Eastern Caribbean. WCK activates. Local restaurant owner Carlos cooked for WCK during Hurricane Maria years ago. To pay him in 2026 we used to need a week and a stack of paperwork. Watch how it works now." | Set the stakes |
| 0:30–1:45 | A WCK KYC officer pulls up the vendor onboarding queue. Carlos's row shows: **"Agent review complete — 5 documents read, 1 cross-check flag (DOB on banking form vs. license — explained: middle-name suffix variation), recommend approval, confidence 0.92."** Officer clicks the row, sees the agent's reasoning trace and the source document highlights. Clicks **Approve & Issue Attestation**. The CDP wallet is provisioned, the EAS attestation is minted live to Base Sepolia, EAS Scan opens in a new tab showing the on-chain record — no PII visible, just `{status: approved, region: PR, category: restaurant, validUntil: 2027-12-31}`. | Bedrock agent (`/onboarding/review`) has already run Textract on uploaded docs, called its cross-check tool, and produced a JSON packet. Frontend renders the packet. On Approve, `/attest/issue` mints via EAS SDK + CDP signing |
| 1:45–2:45 | A WCK staff member at a distribution tent enrolls "Maria" — webcam captures her face, no other fields. Screen shows: "Recipient #4287 enrolled. Activation: Caribbean-2026-04. No personal data stored." | `/enroll` Lambda calls Rekognition `IndexFaces`, writes only `{anonId, activationId, faceId}` to DynamoDB. No name, no DOB |
| 2:45–3:30 | Maria walks to Carlos's restaurant. Carlos enters "Plate of rice and beans — meal credit." Webcam captures. Green check. Maria walks to a water seller. Same face, water credit logged. Maria tries Carlos's place a second time — system blocks: "Daily limit reached." | `/redeem` Lambda: Rekognition match → policy check → log redemption. Second attempt fails on daily-cap |
| 3:30–4:15 | Settlement runs. Dashboard shows: "12 redemptions today across 3 vendors. Disbursing 240 USDC." Three Basescan transactions appear in real-time. Carlos's wallet balance updates from $0 → $80. | Settlement Lambda queries DynamoDB, batches per vendor, signs USDC transfers via CDP SDK on Base Sepolia |
| 4:15–5:00 | **The agentic close.** "Aval isn't just a tool for WCK. It's a credential rail an agent economy can call. Watch what happens when a donor's AI agent wants to verify their gift was used as promised." Switch to a terminal. Run `node verify-agent.js`. The agent hits `/credential/verify?vendor=carlos`, gets back `402 Payment Required`, signs a $0.01 USDC payment via the x402 facilitator, retries, gets back the full attestation chain — vendor verified on-chain, 12 meals served today, $80 settled, all signed and auditable. "Two seconds. No API key. No subscription. This is the Coinbase x402 protocol — and Aval speaks it natively." | x402 middleware (`x402-express`) on the `/credential/verify` route. Coinbase x402 Facilitator handles verification + settlement. Demo agent built with `x402-fetch` from a pre-funded test wallet |

The three non-negotiable wow moments: **(a)** the agent-reviewed onboarding (judges see real Bedrock reasoning + Textract output, attestation issued on-chain, no documents persisted); **(b)** the live multi-vendor settlement (three Basescan tabs, three USDC arrivals); **(c)** the x402 verification (HTTP 402 → micropayment → signed attestation back, all in two seconds). Rehearse all three ten times.

The fourth moment — the skill credential — is **stretch only**. If the team is behind at H+30, cut it. The story still lands without it. With it, the pitch goes from "useful tool" to "infrastructure play that judges across both Coinbase and AWS tracks can fund."

---

## 3. Architecture & Stack

```
                    ┌────────────────────────────────────────────┐
                    │  External Agents (donor, peer NGO, audit)  │
                    │  speak HTTP 402 / x402 protocol            │
                    └─────────────────┬──────────────────────────┘
                                      │ x402: 402 → pay → retry
                                      ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐
│ KYC Console  │  │ Vendor Portal│  │ Vendor POS   │  │ Field App    │  │ Trainer App (stretch)  │
│ (review +    │  │ (verify +    │  │ (recipient   │  │ (enroll      │  │ (issue skill           │
│  approve)    │  │  receive)    │  │  redeem)     │  │  recipient)  │  │  credential)           │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬─────────────────┘
       │                 │                 │                 │                 │
       └─────────────────┴────────┬────────┴─────────────────┴─────────────────┘
                                  │
                                  ▼
              ┌─────────────────────────────────────────────────────┐
              │  AWS API Gateway (REST, Cognito JWT for internal,   │
              │  x402 middleware on /credential/verify for external)│
              └────────────────┬────────────────────────────────────┘
                               │
   ┌──────────────────┬────────┼────────────┬──────────────┬───────────────────┐
   ▼                  ▼        ▼            ▼              ▼                   ▼
┌────────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐
│/onboarding/│  │/attest/* │ │ /enroll  │ │ /redeem  │ │ /settle  │ │ /credential/verify │
│ review     │  │(vendor)  │ │          │ │          │ │ (sched.) │ │ ← x402 paywalled   │
│            │  │          │ │          │ │          │ │          │ │                    │
│ Bedrock    │  │ EAS SDK  │ │Rekognit. │ │Rekognit. │ │ CDP SDK  │ │ Reads EAS, returns │
│ Agent +    │  │ + CDP    │ │ Index    │ │ Search   │ │ USDC tx  │ │ signed attestation │
│ Textract   │  │ wallet   │ │ Faces    │ │ Faces    │ │          │ │ chain              │
└─────┬──────┘  └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬──────────────┘
      │               │            │            │            │            │
      ▼               ▼            ▼            ▼            ▼            ▼
   S3 bucket     EAS contract   DynamoDB   DynamoDB   Base Sepolia  Coinbase x402
   (vendor docs, on Base       (anon       (redempt.) USDC          Facilitator
   KMS-encrypted, Sepolia      recipient   log         transfers     (verify + settle
   24hr TTL)     — 4 schemas)  templates)              from treasury micropayments
```

### Service-by-service responsibility table

| Component | Service | Why this one |
|-----------|---------|--------------|
| Vendor onboarding agent | **Amazon Bedrock Agents** with Claude Sonnet 4 + custom action group | Production-grade agent runtime; native AWS IAM; trace logs visible to judges; Textract is a one-call action |
| Document OCR | **AWS Textract** (`AnalyzeDocument` with FORMS + TABLES) | Specifically designed for forms/IDs; far better than generic OCR for license/cert documents |
| Document staging | **S3** with KMS encryption + 24-hour lifecycle policy | Documents never persist past the onboarding decision |
| Vendor attestations | **EAS on Base** (`@ethereum-attestation-service/eas-sdk`) | Free attestations, public anchor, revocable |
| Vendor wallets | **Coinbase Developer Platform (CDP)** | Custodial wallets without seed-phrase UX for vendors |
| Recipient face matching | **AWS Rekognition Collections** | Server-side template storage, no PII, deletion via `DeleteFaces` |
| Redemption ledger | **DynamoDB** | On-demand billing; PK/SK design for activation queries |
| Settlement | **AWS Lambda + EventBridge** scheduling + **CDP SDK** for USDC transfers on Base | Lambda is *not* an agent here — it's a deterministic batcher. See Section 6.5 |
| External agent payments | **Coinbase x402 Facilitator** (`x402-express` middleware on the verify route) | Free tier: 1,000 tx/month, $0.001 each thereafter. Single-line middleware integration |
| Demo donor agent (buyer side) | **`x402-fetch`** from a pre-funded Base Sepolia wallet | Smallest possible agent — a Node script with USDC, demonstrating the protocol works |
| Auth (internal) | **Amazon Cognito** with five groups | `wck_kyc_officer`, `wck_field`, `vendor`, `wck_ops`, `wck_trainer` |
| Frontend | **React + Tailwind**, hosted on **Amplify** | Single repo, branch-based deploys |

### Agent action group (Bedrock)

The vendor-onboarding agent has one action group with three tools:

1. **`extractDocument(s3Uri)`** — calls Textract `AnalyzeDocument`, returns structured fields
2. **`crossCheck(fields)`** — pure function: validates name consistency, date overlaps, expiration, jurisdiction — returns `{passed: bool, flags: string[]}`
3. **`finalizeReviewPacket(vendorId, summary, recommendation, flags)`** — writes the agent's structured output to DynamoDB for the KYC officer to review

The agent's system prompt: identify the document types, run extract on each, cross-check, produce a single recommendation (`approve` / `escalate` / `reject`) with one-paragraph reasoning. **Never call `/attest/issue` directly.** Issuing the attestation is a separate Lambda the KYC officer triggers from the console after reviewing the packet. The agent recommends; the human decides.

---

## 4. Privacy, Sovereignty & the Agent Boundary

Aval inherits its privacy posture from v2:

- **Vendors hold their own credential.** The on-chain attestation lives on the vendor's CDP wallet. WCK keeps a pointer (the schema UID + holder address), not the documents.
- **Recipients are stored as the smallest possible signal.** A face template hashed by AWS Rekognition, bound to an activation-scoped anonymous ID, with no name, no DOB, no PII, and one-button deletion at activation close.
- **Documents submitted during onboarding are temporary.** S3 with KMS encryption and a 24-hour lifecycle policy. Once the attestation issues, the documents are deleted. The agent's reasoning trace persists (we want the audit trail) but it never quotes PII back.
- **Community responders own their credential.** It follows the person, not the institution. WCK can revoke; we cannot un-issue or rewrite history.

v3 adds one new commitment: **the agent boundary**.

Aval has agents on the read side and on the document-review side. We deliberately do not put agents on the disbursement side. A donor's agent can query whether Carlos was paid — they cannot decide that Carlos should be paid. A WCK onboarding agent can recommend approval — it cannot approve. A future telemetry agent (Phase B) can recommend a settlement batch — it cannot trigger one.

This is not a hedge. This is the design. Humanitarian payments touch people on their worst day; the question of *who gets paid for serving meals to disaster survivors* is the kind of decision that needs a human face accountable to it. The dignity argument and the auditability argument point the same way: keep the human in the loop, name them by role in every decision, log their approvals on-chain.

The 30-second elevator answer:

*"WCK's current vendor onboarding workflow forces them to custody sensitive partner documents indefinitely and makes a human read every cert. Aval's agentic onboarding compresses that to a one-minute officer review with full reasoning visible — and then moves the trust signal on-chain as a revocable attestation, so WCK keeps a pointer, not the paperwork. Recipient identity stays entirely off-chain and is reduced to uniqueness within an activation, with no name, no PII, and one-button deletion. And because we exposed verification through Coinbase's x402 protocol, donor agents and peer NGOs can query our credential rail per-request in USDC — Aval becomes the credential infrastructure the agent economy can call, not a closed WCK system. The architectural choice we made on day one — multiple schemas, holder-owned credentials, agents on the read side only — is what unlocks Project Dream: communities trained, credentialed, and trusted to respond themselves."*

---

## 5. Schema Design — Built for Tomorrow

(*Unchanged from v2 — the schema design was right.*)

This is the section that turns the v2 vision from "nice slide" into "trivial to ship." We register multiple EAS schemas at H+0, even though we only actively issue against the first two during the hackathon. The cost is 5 minutes of upfront schema registration. The payoff is that "scaling to interoperable learning records" becomes a Lambda + a frontend page, not a re-architecture.

### Schemas to register at H+0 on Base Sepolia

| Schema name | When issued | Schema fields | Holder | Purpose |
|-------------|------------|---------------|--------|---------|
| **WCK-Vendor** | v1 — actively issued in the demo | `status` (string), `region` (string), `category` (string), `validUntil` (uint64), `issuerNote` (string) | Vendor's CDP-managed wallet | Proves a vendor is a verified WCK partner |
| **WCK-Activation-Recipient** | v1 — registered, off-chain by default | `activationId`, `anonRecipientId`, `enrolledAt` — *no biometric data on-chain* | (off-chain only) | Optional on-chain commitment; default is off-chain DynamoDB |
| **WCK-Skill** *(stretch)* | Closing 45 seconds | `credentialType`, `competencyArea`, `issuedAt`, `expiresAt`, `issuerOrg`, `vcPayloadCid` | Community responder's wallet | Portable skill credential, W3C VC compatible |
| **WCK-Supplier** *(future)* | Not in demo — registered for forward compatibility | `supplierType`, `region`, `validUntil`, `complianceFlags[]` | Supplier's wallet | Upstream supply chain partners |

### W3C Verifiable Credentials & Open Badges 3.0 compatibility

For the `WCK-Skill` schema, the on-chain attestation carries a small fixed payload plus a `vcPayloadCid` pointing at the full W3C Verifiable Credential JSON-LD document stored off-chain (IPFS for the demo, S3 fallback). The full VC payload uses the Open Badges 3.0 context so it's interoperable with any 1EdTech-compliant verifier.

### Why this matters for the pitch

When a judge asks *"why a custom protocol instead of standard verifiable credentials?"* — we ship both. EAS gives us the cheap, fast, public, revocable on-chain anchor. The Open Badges 3.0 / W3C VC payload gives us the sector-wide interoperability. **And x402 makes the verification endpoint itself agent-native** — no other humanitarian credential system has all three layers.

---

## 6. Team & Roles

| Role | Owns | Stays out of |
|------|------|--------------|
| **Lead / PM / Pitch** | Demo script, slides, integration testing, judge Q&A prep, rehearsals, final pitch delivery, the agentic-design + privacy narrative, the human-in-the-loop story | Writing production code (will pair-program for glue tasks only) |
| **Frontend Engineer** | All React apps (4 in v3 core: KYC Console, Vendor Portal, Vendor POS, Field App, + Trainer App stretch); webcam capture; KYC review packet UI with reasoning trace; dashboard polling | AWS infra, smart contracts |
| **Backend / Cloud Engineer** | Lambdas; API Gateway; Cognito; DynamoDB; Rekognition; KMS; EventBridge; **Bedrock Agent definition + action group + Textract integration**; S3 staging + 24hr TTL; Amplify deploys | Frontend, on-chain |
| **Blockchain Engineer** | EAS schema registration (all four at H+0); generic `attest({schemaUid, ...})` helper; CDP wallet provisioning; USDC funding; Base Sepolia setup; Basescan + EAS Scan integration; **x402 middleware on `/credential/verify`**; **demo donor-agent script with `x402-fetch`**; *(stretch)* W3C VC payload + IPFS pinning | Frontend, AWS |

PM owns cross-component integration testing every 2 hours starting H+12. Everyone owns testing their own happy path before handing off.

---

## 6.5. Agentic AI Design Principles

This section is for the Q&A. Memorize the framing.

**Where agents earn their place in Aval:**

- **Document review (vendor onboarding).** A KYC officer at WCK currently reads stacks of cert PDFs and tax IDs in three languages. Bedrock + Textract reads them in parallel, runs cross-checks no human would catch consistently (banking-form name vs. license name with middle-initial variations), and surfaces a structured packet. The officer reads one screen instead of fifty pages. This is compression of a human bottleneck, not replacement of human judgment.
- **External read access (x402).** A donor's agent doesn't need a WCK API key, a quarterly invoice, or a sales call to verify "did Carlos get paid for the meals he served?" — it pays $0.01 in USDC, gets the answer in two seconds, moves on. This unlocks new categories of donors and auditors that today don't engage because the integration cost is too high.

**Where agents do not belong in Aval:**

- **Disbursement decisions.** The Lambda that batches today's verified redemptions and signs USDC transfers is deterministic, not an agent. It has no judgment to exercise. The rules ("paid only for verified redemptions, only to attested vendors, only within daily caps") are policy, not reasoning.
- **Recipient eligibility.** An agent does not get to decide who eats. Recipient enrollment is performed by trained WCK field staff using consistent rules, with a paper QR fallback for anyone who declines the face capture.
- **Onboarding approval.** The agent recommends. The human approves. The on-chain attestation carries the human's signature, not the agent's.

**The Phase B telemetry agent (post-hackathon).** When activation telemetry — meals served, weather, road closures, vendor capacity — is rich enough to warrant pattern recognition, an ops agent will *recommend* batch settlements ahead of schedule. A WCK ops officer will approve. The agent never moves money on its own. We will say this on stage and we will say it again to the journalist who asks.

---

## 7. The 36-Hour Plan

Hours are relative to kickoff (`H+0`). Sleep is non-negotiable.

### Phase 0 — Kickoff & Setup (H+0 to H+2)

**All four together for the first hour, then split.**

- Whiteboard the architecture (everyone agrees on Section 3)
- Walk through the demo script line by line — every team member can recite the 5-minute demo (and the 45-second stretch beat)
- Confirm everyone has all access from the **Pre-Hackathon Setup Checklist** (Section 9) — fix any gaps now
- **Register all four EAS schemas now, not later.** Save schema UIDs to env config
- **Confirm Bedrock model access** — Claude Sonnet 4 must show "Access granted" in the Bedrock Model Access console for the chosen region. If not, request access *immediately* — approval can take an hour
- **Confirm x402 facilitator wallet is funded** — the test wallet for the demo donor agent needs ~10 test USDC on Base Sepolia
- Decide SAM vs CDK in 5 minutes; lock the choice
- Create the GitHub repo, set up branch protection on `main` (PRs only, auto-merge on green)
- PM creates a single shared board with the cards from this plan

### Phase 1 — Vertical Slice: One Vendor, One Recipient, End-to-End (H+2 to H+10)

By H+10 a single human must be able to: (a) issue an EAS attestation to a test vendor (no agent yet — manual call), (b) verify it from the Vendor Portal, (c) enroll a recipient with face capture, (d) authenticate that recipient at the vendor and log a redemption. **Agentic features are not in this phase. Get the spine working first.**

| Engineer | Hours 2–10 |
|----------|-----------|
| Backend | (a) DynamoDB table provisioned. (b) `/enroll` Lambda: accepts JSON + base64 image, creates Rekognition collection, calls `IndexFaces`, writes anon recipient record. (c) `/redeem` Lambda: accepts vendor ID + image, calls `SearchFacesByImage`, returns match + writes redemption. (d) `/attest/issue` and `/attest/verify` Lambdas (manual params for now). (e) All deployed behind API Gateway with API key auth (Cognito in Phase 2) |
| Blockchain | (a) **All four EAS schemas registered on Base Sepolia, schema UIDs committed to `schemas.ts`.** Confirm registration on EAS Scan. (b) Generic `attest({schemaUid, recipient, payload})` helper — the keystone abstraction. (c) Generic `verifyLatest({schemaUid, holder})` helper. (d) Vendor wrapper: `attestVendor(walletAddress, region, category)`. (e) Treasury wallet on Base Sepolia funded with 1,000 test USDC + 0.1 test ETH. (f) `disburseToVendor(walletAddress, amount)` USDC transfer helper |
| Frontend | (a) Project scaffold for all apps, shared component lib, Tailwind. (b) Vendor Portal: shows attestation status (calls `/attest/verify`), shows wallet balance. (c) Vendor POS: amount input + webcam capture + submit to `/redeem`. (d) Field App: form + webcam capture + submit to `/enroll`. (e) Dashboard skeleton (table view) |
| PM | (a) Manually test integration as soon as any two pieces are ready. (b) File issues for every bug. (c) Draft slide deck outline. (d) Order food. (e) Make sure people drink water |

**Gate at H+10:** Live end-to-end demo of `Issue attestation to Carlos (manual) → Verify Carlos's attestation in the portal → Enroll Maria via field app → Maria redeems at Carlos's POS → see redemption record`. If we miss this gate by more than 2 hours, **cut both the agentic onboarding and the x402 endpoint** and revert to v2 scope. Sleep on it before deciding.

### Sleep — H+10 to H+16 (6 hours)

Stagger if needed (two sleep, two stay on small bug fixes), but everyone gets at least 4 consecutive hours.

### Phase 2 — Agentic Onboarding + Core Features (H+16 to H+24)

| Engineer | Hours 16–24 |
|----------|-----------|
| Backend | (a) **Bedrock Agent skeleton.** Define the agent in the Bedrock console with Claude Sonnet 4 as the foundation model. Action group with three Lambda-backed tools: `extractDocument`, `crossCheck`, `finalizeReviewPacket`. System prompt drafted, tested in the Bedrock playground with two sample doc sets. (b) **`/onboarding/review` Lambda** that invokes the agent for a given vendor application. (c) **S3 staging bucket** with KMS encryption + 24hr lifecycle. (d) Add policy engine to `/redeem` (daily limit per recipient per vendor). (e) Implement `/settle` Lambda with EventBridge schedule (or a manual "Run settlement" button). (f) Stand up Cognito user pool with five groups; wire JWT into API Gateway. (g) Dashboard read endpoints |
| Blockchain | (a) Wrap helpers as proper SDK calls inside Lambdas. (b) Error handling + transaction receipt parsing. (c) `getEasScanUrl(uid)` and `getBasescanUrl(txHash)` helpers. (d) Smoke-test 20 sequential disbursements; confirm no CDP rate-limiting. (e) Attestation revocation flow + "Revoke vendor" button in the WCK ops view |
| Frontend | (a) **KYC Console** — the new app. Shows the onboarding queue with agent-reviewed packets; click a row to see the agent's reasoning trace, source document highlights from Textract, cross-check flags, and recommendation. Big "Approve & Issue Attestation" button. Equally big "Escalate" and "Reject" buttons. (b) Polish vendor portal — large status badge, click-through to EAS Scan, wallet balance, recent disbursements. (c) Polish vendor POS — big-text confirmations, distinct error states. (d) Polish WCK Ops dashboard: vendor list with attestation status, today's redemption feed, settlement history with Basescan links, total stats. (e) Cognito login screens for each role |
| PM | (a) Manual integration test cycle every 2 hours — log every defect. (b) Draft demo script's exact words and time them. (c) Build slide deck (≤8 slides). (d) Set up demo environment: 2 tablets (vendor portal + vendor POS), 1 tablet (field app), 1 laptop (KYC Console), 1 large screen (dashboard) |

**Gate at H+24:** Full demo runs end-to-end on the real demo devices, including the agentic onboarding (real Bedrock invocation, not a mock), the multi-vendor settlement, and the daily-cap guard. Backup video gets recorded *now*.

### Phase 3 — x402 Endpoint + Polish & Resilience (H+24 to H+30)

| Engineer | Hours 24–30 |
|----------|-----------|
| Backend | Defensive coding: timeouts, retries, idempotency keys on `/redeem` and `/settle`. Pre-create a "demo recipient" record that can be wiped and re-enrolled instantly. **Pre-stage two onboarding packets** (one clean approve, one with cross-check flags) so the demo can show the agent without depending on a live Bedrock call if it lags |
| Blockchain | (a) **Pre-mint 3 standby vendor attestations** in case live attestation issuance hangs. (b) **Pre-fund all standby vendor wallets** with the right test ETH. (c) **Pre-execute one settlement** against a separate set of standbys so we have real Basescan tabs queued as backups. (d) **Wire `x402-express` middleware** onto the `/credential/verify` route. Configure facilitator URL (Coinbase hosted, free tier), price ($0.01 USDC on Base Sepolia), recipient address (a small revenue wallet, not the treasury). Test the 402 → pay → retry flow end-to-end with `x402-fetch`. (e) **Build the `verify-agent.js` demo script** that the team will run on stage. Make it pretty in the terminal — colored output, clear payment receipt, clear final attestation chain. (f) *(Stretch)* W3C VC payload helper + IPFS pinning |
| Frontend | Visual polish — clean palette using WCK brand tokens (Wild Blueberry `#1565ad`, Spanish Saffron `#e86027`, Sea Foam `#d0ecf2` for backgrounds). Loading states, micro-animations on success, full-screen mode. Dashboard auto-refresh every 2 seconds. EAS Scan and Basescan deep-links open in new tabs and are *visible to the audience from the projector*. The KYC Console reasoning-trace view: make the agent's output legible and authoritative — colored highlight boxes on Textract field extractions, clear flag badges |
| PM | Final pitch deck. Two full demo dry-runs with the team. Time them. **Cut anything that pushes past 5 minutes** (excluding the credential stretch beat). Specifically rehearse the closing 45 seconds where the x402 agent runs in the terminal — that's the line that wins the Coinbase track |

### Sleep — H+30 to H+34 (4 hours)

### Phase 4 — Stretch + Final Polish + Pitch (H+34 to H+36)

**Decision point at H+34:** if v3 core demo is rock solid (Bedrock onboarding works, multi-vendor settlement works, x402 verify works) and at least 90 minutes remain, attempt the credential stretch. If anything is shaky, skip stretch and use the time for dry-runs.

**If attempting the stretch (45 minutes max):**

- Blockchain: stand up `attestSkill(walletAddress, credentialType, competencyArea)` calling the generic `attest` helper with the `WCK-Skill` schema UID. Pin a sample W3C VC JSON-LD payload to IPFS (web3.storage or pinata; CID hardcoded as fallback). Add the `vcPayloadCid` field. Verify it on EAS Scan once
- Frontend: 30-minute Trainer App — minimal form (responder wallet address, credential type dropdown, Issue button). Add a "Community Responders" tab to the ops dashboard. *No polish*
- PM: rehearse the closing 45 seconds three times

**If skipping the stretch:** PM uses the time for two more full dry-runs.

**Final 30 minutes regardless:**

- One final dry-run on stage equipment if a test slot is available
- PM owns the pitch; one engineer drives the demo; the other two stand by laptops with the *same* flow loaded as live failover
- Backup video queued in a tab, ready to play if anything dies mid-demo
- Eat. Hydrate. Show up

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| EAS attestation issuance hangs / Base Sepolia congestion | Medium | Demo death | Pre-mint 3 standby vendor attestations + 1 standby skill attestation in Phase 3; switch to "verify existing" path |
| **Bedrock model access not granted in time** | **Medium** | **Demo death (agentic beat)** | **Request Claude Sonnet 4 access during pre-hackathon setup. Have a backup region with already-granted access. Worst case: pre-record the agent's output and replay it from a static JSON in the KYC Console** |
| **Bedrock agent latency > 15s on stage** | **Medium** | **Pitch quality** | **Pre-stage 2 review packets in DynamoDB so the KYC Console can show a "completed" review even if live invocation is slow. The agent runs on the second packet visibly during the demo if confident; otherwise the pre-staged one is "what the agent produced 2 minutes ago"** |
| **x402 facilitator unreachable / settlement slow** | **Low** | **Pitch quality** | **Run `verify-agent.js` once in Phase 3 with a known-good response; cache that response and replay if live call fails. Bring backup mainnet account with funded USDC just in case Sepolia faucet runs dry** |
| **Textract returns garbled data on stage** | **Medium** | **Pitch quality** | **Use a clean, well-photographed sample document set. Pre-tested extraction confirmed in Phase 2. Backup: hardcoded extraction result behind the same Lambda interface** |
| Rekognition false negative on stage | Medium | Demo death | Pre-enroll the demo "Maria" 3 times with 3 reference photos; record backup video; bring a softbox or ring light |
| Conference WiFi unusable | High | Demo death | Two phones with 5G hotspots, primary + backup; pre-test bandwidth at the venue |
| CDP rate-limits during multi-vendor settlement | Low | Pitch quality | Pre-execute one settlement against a parallel vendor set; have those Basescan tabs queued |
| Lambda cold start makes demo feel slow | Medium | Pitch quality | CloudWatch event pings every endpoint every 4 minutes during demo day |
| Webcam permission prompts confuse live demo | Medium | Pitch quality | Open all browser tabs and grant permissions BEFORE going on stage; never close the tab |
| Integration breaks at H+24 from incompatible interfaces | Medium | Major time loss | PM runs cross-team integration test every 2 hours starting H+12 |
| Stretch credential demo eats time and breaks v3 | Medium | Demo death | Hard rule: stretch is decided at H+34, never earlier. If it costs >45 min, abandon it on the spot |
| **"Why are you using AI to decide aid?"** | **High** | **Easy points if prepared, fatal if not** | **Section 6.5 elevator answer rehearsed by everyone. Lead with the boundary: agents on the read side and document review only; humans on every disbursement decision; recipient eligibility is field-staff judgment, not algorithmic.** |
| "Why custodial wallets and not user-controlled?" | High | Easy points if prepared | "The vendors we serve are mom-and-pop shops with no crypto literacy. Asking them to manage seed phrases would be the *opposite* of empathy. Custodial via CDP gets them paid in stablecoins today; their funds are theirs to off-ramp via a partner network. Migrating to user-controlled smart wallets is on the v2 roadmap once vendors have built familiarity." |
| "What about off-ramp?" | High | Punted in scope | "Existing partners — Yellow Card, Bitso, Mercado Bitcoin, plus ACH/wire for North American vendors — already solve this in our target regions." |
| "Why not just use Building Blocks (WFP's existing blockchain system)?" | Medium | Pitch quality | "Building Blocks is a closed system for inter-agency cash distribution within UN agencies. Aval is the *vendor-side* infrastructure for an organization like WCK that pays small businesses, that hands a credential back to the vendor, and that exposes verification to external agents through x402 — none of which Building Blocks does." |
| **"What about Open Badges? Don't they already solve this?"** | **Medium (with stretch)** | **Easy points if prepared** | **"They do, and we use them. Our credential payload is a W3C Verifiable Credential conformant with Open Badges 3.0 — that's the layer that makes us interoperable. EAS on Base is our anchoring + revocation layer. x402 is our agent-native query layer. Three complementary standards, not a custom protocol."** |
| **"Why x402 and not just an API key?"** | **High (Coinbase track)** | **Easy points if prepared** | **"API keys assume a billing relationship — sales calls, contracts, monthly invoices. Donor agents and peer-NGO verifiers don't have that. With x402, an agent that finds out about us at noon can verify a credential at 12:01 and pay $0.01 in USDC. The integration cost goes from 'six weeks of procurement' to 'one HTTP call.' That's the unlock for the agent economy reaching humanitarian infrastructure."** |

---

## 9. Pre-Hackathon Setup Checklist

**Do all of this BEFORE H+0.**

### Accounts and credits
- [ ] AWS account with hackathon credits applied
- [ ] **Bedrock Model Access enabled for Claude Sonnet 4 in the chosen region** (request now — approval can take an hour to a day)
- [ ] Coinbase Developer Platform account, API key generated, secret saved to a shared password manager
- [ ] **Coinbase x402 Facilitator account configured** (free tier — no separate signup; just a wallet address that will receive verification micropayments)
- [ ] GitHub org and repo created, all four members added with write access
- [ ] EAS issuer wallet created (signs all WCK attestations across all schemas) — funded with 0.2 Base Sepolia ETH
- [ ] **Demo donor-agent test wallet** — separate Base Sepolia wallet pre-funded with 10 test USDC for paying the x402 paywall during the demo
- [ ] *(Stretch)* Pinata or web3.storage account for IPFS pinning of VC payloads

### Toolchain installed on every laptop
- [ ] Node.js 20.x and pnpm
- [ ] AWS CLI v2 with named profile `aval`
- [ ] AWS SAM CLI or CDK (whichever the team picked)
- [ ] Docker Desktop
- [ ] `git` and the GitHub CLI
- [ ] **`x402-fetch`, `x402-express`, and `@coinbase/x402` packages tested locally with the playground at https://x402.org**

### Pre-provisioned cloud resources
- [ ] One Rekognition collection — name: `aval-recipients-demo`
- [ ] One DynamoDB table — name: `aval-records`, PK `pk`, SK `sk`, on-demand billing
- [ ] One KMS key — alias `alias/aval-pii`
- [ ] **One S3 bucket — `aval-onboarding-staging` with KMS encryption + 24hr lifecycle policy**
- [ ] One Cognito user pool with five groups (`wck_kyc_officer`, `wck_field`, `vendor`, `wck_ops`, `wck_trainer`); pre-create demo users for each
- [ ] One Amplify Hosting app stub, connected to the GitHub repo
- [ ] One EventBridge schedule (disabled by default, enable for demo) targeting the `/settle` Lambda
- [ ] **Bedrock Agent created in the console (empty action group OK at this stage) — the ARN committed to env config**

### On-chain prep
- [ ] Treasury wallet created via CDP, funded with 1,000 test USDC (https://faucet.circle.com/) and 0.1 Base Sepolia ETH
- [ ] **All four EAS schemas registered on Base Sepolia, schema UIDs committed to `schemas.ts`:**
  - [ ] `WCK-Vendor` schema UID
  - [ ] `WCK-Activation-Recipient` schema UID
  - [ ] `WCK-Skill` schema UID
  - [ ] `WCK-Supplier` schema UID
- [ ] *(Stretch)* One sample W3C VC JSON-LD payload pre-pinned to IPFS; CID committed as fallback

### Demo content prep
- [ ] **Sample vendor onboarding document set** — a clean, photogenic business license, food safety cert, and ID for the demo "Carlos" — staged in the S3 bucket and tested through Textract once before H+0
- [ ] Three reference photos of the demo "Maria" volunteer for Rekognition pre-enrollment

---

## 10. Stretch Goals (additive only — never block the core demo)

In priority order. Do not start any stretch goal that touches code paths used in the core demo.

1. **Live skill credential issuance + verification** (the headline stretch — see Phase 4). The v2 vision made tangible.
2. **Donor view dashboard** — same data, cleaned up for an external audience. "$1 in → $0.94 to a verified vendor → meal logged → recipient confirmed."
3. **Field-worker copilot teaser** — a single Bedrock-backed query box on the Field App: "Show me vendors within 5 miles attested in the last year." One pre-tested query, no chatbot UI. Sets up the multi-agent narrative.
4. **WhatsApp bot for the field worker** — enrollment via WhatsApp instead of a web form.
5. **Cross-org verifier mock** — a static page styled as "Red Cross Field Verifier" that takes a wallet address and verifies a `WCK-Skill` attestation through the x402 endpoint, paying the $0.01 micropayment live. Drives home the interoperability claim.
6. **A pre-staged supplier attestation** — issue one `WCK-Supplier` attestation during setup, show it on the dashboard alongside the vendor list.
7. **Merchant settlement preview** — even though we're punting on off-ramp, show a "ready for off-ramp via [Bitso / Yellow Card / Mercado Bitcoin]" indicator on the vendor portal.

---

## 11. Project Dream Roadmap (post-hackathon)

This section exists so the team and judges both know where the rail goes after the demo. **Do not pitch this in detail on stage** — one slide, the headline, then move on.

### Phase A — Hackathon ship (now through demo)
v3 as built in 36 hours. Vendor attestations, recipient uniqueness, USDC settlement, agentic onboarding, x402-gated verification on Base Sepolia. Stretch: one live skill credential.

### Phase B — Months 1 to 6 — Production hardening + first real credentials
- Move from Base Sepolia to Base mainnet
- Pilot deployment in one active WCK region
- Issue first real `WCK-Skill` credentials to existing WCK field staff (backfill, not new training) to build the credential corpus
- Real consumer wallet integration (Rainbow, MetaMask Snap, or a custom WCK wrapper) so credential holders can carry their credentials
- Replace IPFS with a pinned + S3-backed VC storage layer with proper SLA
- **Telemetry agent (recommendation-only):** watches activation data and proposes settlement batches for human approval. Agent never moves money

### Phase C — Months 6 to 18 — Knowledge Management System integration
- Integrate Aval's `/credential/issue` endpoint with WCK's KMS. Training completion in the LMS automatically triggers credential issuance — the **Project Dream feedback loop**: communities take training → get credentialed → are recognized as responders → respond
- Roll out training paths for community responders in 3 priority regions
- Establish the **WCK Credential Catalog** — public, versioned list of all skill credential types, with competency rubrics, published as JSON-LD context
- Bilateral MoUs with peer humanitarian orgs (IFRC, GlobalGiving, Direct Relief) on mutual credential recognition
- **Donor-facing agent storefront:** make x402-gated impact endpoints discoverable through the x402 Bazaar so any donor agent can find and verify WCK credentials per-request

### Phase D — Months 18+ — Federated humanitarian credential ecosystem & multi-agent coordination
- Co-author a humanitarian sector credential schema standard with peer orgs, building on Open Badges 3.0
- Open the issuer role to vetted partner organizations
- **Community-led trust layer:** trained responders who have led N successful activations can co-sign credentials for new responders in their network
- The supply-chain side matures: `WCK-Supplier` attestations enable a verified procurement marketplace
- **Multi-agent humanitarian coordination layer:** field-ops agents, supply-chain agents, donor agents, and verifier agents transact across humanitarian orgs through the x402 protocol. Aval's credential rail becomes the shared trust substrate. Money still moves on human approval — every disbursement still has a name attached to it

The infrastructure choices we make at H+0 of this hackathon — multiple schemas under one EAS contract, W3C VC compatibility, holder-owned credentials, agents on the read side only, x402 from day one — are what makes Phases C and D possible without re-platforming. That's the architectural bet.

---

## 12. What We Submit

- Live URL for the dashboard (Amplify-hosted)
- Live URL for the x402-gated credential endpoint with a one-page documentation (so judges can run their own `verify-agent.js` if they want)
- GitHub repo with public README, architecture diagram, schema UIDs, agent prompt, x402 middleware config, and a one-command deploy script
- Backup demo video (5:00 core, 5:45 with stretch — submit both)
- 8-slide deck PDF
- One-page write-up: problem, solution, what's built, what's next (mainnet, KMS integration, Phase B telemetry agent, sector-wide credential federation)
