/**
 * Base Sepolia clients shared by all Phase 0b scripts. Uses the RPC URL from
 * .env so the operator can swap in a private endpoint (Alchemy / QuickNode)
 * if the public Base Sepolia RPC is rate-limiting.
 */

import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { optionalEnv } from "./env.js";

const DEFAULT_RPC = "https://sepolia.base.org";

export const BASE_SEPOLIA_RPC =
  optionalEnv("BASE_SEPOLIA_RPC_URL") ?? DEFAULT_RPC;

export const USDC_ADDRESS: `0x${string}` =
  (optionalEnv("USDC_BASE_SEPOLIA_ADDRESS") as `0x${string}` | undefined) ??
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Return types intentionally inferred — viem's chain-aware client types are
// not assignable to the generic PublicClient/WalletClient when the chain is
// an OP Stack chain like baseSepolia (extra deposit-tx variants).
export function publicClient() {
  return createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC),
  });
}

export function walletClientFromPrivateKey(privateKey: Hex) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC),
  });
}
