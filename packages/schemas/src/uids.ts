/**
 * EAS schema UIDs for Base Sepolia.
 *
 * Populated by `pnpm --filter scripts run register-schemas` (Phase 1a). Until
 * registration runs, all UIDs are empty strings — code that consumes a UID
 * should fail loudly with a clear "schemas not registered yet" error rather
 * than send a transaction with a zero UID.
 */

import type { SchemaName } from "./index.js";

export type SchemaUidMap = Record<SchemaName, `0x${string}` | "">;

export const SCHEMA_UIDS: SchemaUidMap = {
  "WCK-Vendor": "",
  "WCK-Activation-Recipient": "",
  "WCK-Skill": "",
  "WCK-Supplier": "",
};

export function requireSchemaUid(name: SchemaName): `0x${string}` {
  const uid = SCHEMA_UIDS[name];
  if (!uid) {
    throw new Error(
      `EAS schema UID for "${name}" is not set. Run \`pnpm --filter scripts run register-schemas\` and commit packages/schemas/src/uids.ts.`,
    );
  }
  return uid;
}
