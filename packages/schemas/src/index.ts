/**
 * Aval EAS schema definitions for Base Sepolia.
 *
 * Authoritative source per ADR-0001: four schemas registered at H+0, even though
 * only WCK-Vendor and WCK-Activation-Recipient are actively issued during the
 * hackathon demo. Registering all four upfront lets Phases B–D be a Lambda + a
 * frontend page, not a re-architecture (see design doc §5).
 *
 * Schema strings follow EAS SchemaEncoder syntax:
 *   "<solidity-type> <field-name>, <solidity-type> <field-name>, ..."
 */

export type SchemaName =
  | "WCK-Vendor"
  | "WCK-Activation-Recipient"
  | "WCK-Skill"
  | "WCK-Supplier";

export interface SchemaDefinition {
  name: SchemaName;
  schema: string;
  resolver: `0x${string}` | null;
  revocable: boolean;
  description: string;
}

export const SCHEMAS: Record<SchemaName, SchemaDefinition> = {
  "WCK-Vendor": {
    name: "WCK-Vendor",
    schema:
      "string status, string region, string category, uint64 validUntil, string issuerNote",
    resolver: null,
    revocable: true,
    description:
      "Proves a vendor is a verified WCK partner. Holder is the vendor's CDP-managed wallet.",
  },
  "WCK-Activation-Recipient": {
    name: "WCK-Activation-Recipient",
    schema: "string activationId, string anonRecipientId, uint64 enrolledAt",
    resolver: null,
    revocable: true,
    description:
      "Optional on-chain commitment for recipient enrollment. Default is off-chain DynamoDB; on-chain is opt-in for activations that need cross-org provability. NO biometric data on-chain.",
  },
  "WCK-Skill": {
    name: "WCK-Skill",
    schema:
      "string credentialType, string competencyArea, uint64 issuedAt, uint64 expiresAt, string issuerOrg, string vcPayloadCid",
    resolver: null,
    revocable: true,
    description:
      "Portable community responder skill credential. The vcPayloadCid points to a W3C VC / Open Badges 3.0 JSON-LD payload pinned to IPFS, making the credential verifiable by any 1EdTech-compliant verifier without Aval integration.",
  },
  "WCK-Supplier": {
    name: "WCK-Supplier",
    schema:
      "string supplierType, string region, uint64 validUntil, string complianceFlags",
    resolver: null,
    revocable: true,
    description:
      "Upstream supply chain partner attestation. Registered for forward compatibility; not actively issued in the hackathon demo. complianceFlags is a comma-separated string for on-chain efficiency.",
  },
};

export const SCHEMA_NAMES: SchemaName[] = Object.keys(SCHEMAS) as SchemaName[];

export type VendorAttestationPayload = {
  status: "approved" | "escalated" | "revoked";
  region: string;
  category: "restaurant" | "food_shop" | "water" | "supplies" | "other";
  validUntil: number;
  issuerNote: string;
};

export type ActivationRecipientPayload = {
  activationId: string;
  anonRecipientId: string;
  enrolledAt: number;
};

export type SkillAttestationPayload = {
  credentialType: string;
  competencyArea: string;
  issuedAt: number;
  expiresAt: number;
  issuerOrg: string;
  vcPayloadCid: string;
};

export type SupplierAttestationPayload = {
  supplierType: string;
  region: string;
  validUntil: number;
  complianceFlags: string;
};

export * from "./uids.js";
