# Aval

**Identity, credential, and agent-native infrastructure for community-led humanitarian response.**

Built for [EasyA × Consensus Miami 2026](https://easya.io) — Coinbase + AWS track.

---

## The Problem

World Central Kitchen pays local vendors — restaurants, food shops, water suppliers — in disaster zones for meals served to affected communities. Three friction points block every activation:

- **Vendors** are unbanked in the crypto sense. Onboarding requires a heavy internal workflow that captures business licenses, tax IDs, food safety certs, and banking details — creating an enormous PII custody burden and a multi-day human review bottleneck.
- **Recipients** need authentication only enough to ensure fair distribution — one person, one meal — without WCK ever needing to know their name.
- **Community responders** earn certifications that live as PDFs in inboxes, invisible to peer NGOs when the next disaster hits.

## What Aval Ships in 36 Hours

| Feature | What it does |
|---------|-------------|
| **Agentic vendor onboarding** | Amazon Bedrock + Textract reads submitted documents, cross-checks fields, and surfaces a structured review packet. KYC officer reads one screen, clicks Approve. |
| **On-chain vendor attestations** | EAS revocable attestation issued to the vendor's CDP-managed wallet on Base Sepolia. WCK keeps a pointer — not the documents. |
| **Privacy-preserving recipient uniqueness** | Face captured once, converted to an anonymous template in AWS Rekognition. No name, no DOB. One-button deletion at activation close. |
| **USDC settlement** | Verified redemptions mapped to verified vendors; disbursed in USDC on Base via CDP SDK on a schedule. |
| **x402-gated credential verification** | Any external agent hits `/credential/verify`, gets `402 Payment Required`, signs a $0.01 USDC micropayment via the Coinbase x402 Facilitator, and receives the full signed attestation chain. No API key. No subscription. |

**Stretch:** Live `WCK-Skill` credential issued to a community responder as a W3C Verifiable Credential / Open Badges 3.0 compatible payload — verifiable by any peer NGO with no Aval integration.

## Architecture

```
                ┌─────────────────────────────────────┐
                │  External Agents (donor, NGO, audit) │
                │  x402: 402 → pay $0.01 USDC → retry  │
                └──────────────┬──────────────────────┘
                               │
┌────────────┐  ┌────────────┐ ▼ ┌────────────┐  ┌────────────┐
│ KYC Console│  │Vendor Portal│  │ Vendor POS │  │ Field App  │
│ (review +  │  │(verify +   │  │(recipient  │  │(enroll     │
│  approve)  │  │ receive)   │  │ redeem)    │  │ recipient) │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      └────────────────┴───────────────┴────────────────┘
                               │
              ┌────────────────▼────────────────────────┐
              │  AWS API Gateway                         │
              │  Cognito JWT (internal) · x402 (external)│
              └──┬──────────┬──────────┬───────────┬────┘
                 │          │          │           │
        ┌────────▼──┐  ┌────▼────┐  ┌─▼──────┐  ┌▼──────────────────┐
        │/onboarding│  │/attest/*│  │/enroll │  │/credential/verify  │
        │  Bedrock  │  │EAS SDK  │  │/redeem │  │← x402 paywalled    │
        │  Agent +  │  │+ CDP    │  │Rekogni-│  │  returns signed    │
        │  Textract │  │ wallet  │  │  tion  │  │  attestation chain │
        └─────┬─────┘  └────┬────┘  └───┬────┘  └────────────────────┘
              │             │           │
           S3 bucket    EAS on Base  DynamoDB
           KMS-enc.     Sepolia      anon recipients
           24hr TTL     4 schemas    + redemption log
```

## Stack

| Layer | Technology |
|-------|-----------|
| On-chain attestations | [Ethereum Attestation Service](https://attest.org) on Base Sepolia |
| Vendor wallets | [Coinbase Developer Platform (CDP)](https://docs.cdp.coinbase.com) |
| USDC settlement | CDP SDK — Base Sepolia |
| External agent payments | [Coinbase x402 protocol](https://x402.org) (`x402-express` / `x402-fetch`) |
| Agentic document review | Amazon Bedrock Agents (Claude Sonnet 4) + AWS Textract |
| Document staging | S3 + KMS encryption + 24hr lifecycle |
| Recipient face matching | AWS Rekognition Collections |
| Redemption ledger | DynamoDB |
| Auth | Amazon Cognito (5 role groups) |
| Frontend | React + Tailwind, hosted on AWS Amplify |

## EAS Schemas (registered at H+0 on Base Sepolia)

| Schema | Status | Purpose |
|--------|--------|---------|
| `WCK-Vendor` | Active (demo) | Verified WCK partner vendor |
| `WCK-Activation-Recipient` | Registered | Optional on-chain commitment for recipient enrollment |
| `WCK-Skill` | Stretch | Portable community responder credential — W3C VC / Open Badges 3.0 |
| `WCK-Supplier` | Future | Upstream supply chain partners |

## The Agent Boundary

Aval puts agents on the **read side** and **document-review side** only.

- The Bedrock onboarding agent **recommends** approval — it cannot issue an attestation.
- The USDC settlement Lambda is deterministic, not an agent — it has no judgment to exercise.
- Recipient eligibility is field-staff judgment, not algorithmic.

Every disbursement decision has a named human accountable to it. This is the design, not a limitation. See [ADR-0001](docs/adr/0001-aval-credential-arch-eas-bedrock-hitl-x402.md) for the full architectural rationale.

## Docs

- [Design Document v3](docs/design/Avak%20Design%20V3.md) — build plan, demo script, risk register, roadmap
- [ADR-0001: Multi-Layer Credential Architecture](docs/adr/0001-aval-credential-arch-eas-bedrock-hitl-x402.md)
- [ADR Index](docs/adr/README.md)

## Roadmap

| Phase | Timeline | Milestone |
|-------|----------|-----------|
| **A — Hackathon** | Now | Vendor attestations, recipient uniqueness, USDC settlement, agentic onboarding, x402 verification on Base Sepolia |
| **B — Production hardening** | Months 1–6 | Base mainnet, pilot region, first real `WCK-Skill` credentials, telemetry agent (recommendation-only) |
| **C — KMS integration** | Months 6–18 | LMS training → automatic credential issuance, WCK Credential Catalog, peer NGO MoUs |
| **D — Federated ecosystem** | Months 18+ | Sector-wide credential standard, community-led trust layer, multi-agent humanitarian coordination |

---

*Built with care by the Aval team at World Central Kitchen.*
