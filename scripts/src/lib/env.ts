/**
 * Loads the repo-root .env regardless of where tsx is invoked from, and exposes
 * a typed accessor that throws a useful error when a required key is missing.
 */

import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(here, "..", "..", "..");
export const ENV_PATH = resolve(REPO_ROOT, ".env");

loadDotenv({ path: ENV_PATH });

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required env var ${key}. Set it in ${ENV_PATH} (see .env.example).`,
    );
  }
  return value.trim();
}

export function optionalEnv(key: string): string | undefined {
  const value = process.env[key];
  if (!value || value.trim() === "") return undefined;
  return value.trim();
}

export function requirePrivateKey(key: string): `0x${string}` {
  const raw = requireEnv(key);
  const normalized = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error(
      `${key} is not a 32-byte hex private key. Got ${raw.length} chars.`,
    );
  }
  return normalized as `0x${string}`;
}

export function requireAddress(key: string): `0x${string}` {
  const raw = requireEnv(key);
  if (!/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    throw new Error(`${key} is not a 20-byte hex address.`);
  }
  return raw as `0x${string}`;
}
