/**
 * Coinbase Developer Platform + USDC helpers.
 *
 * createVendorWallet — CDP MPC wallet creation for new vendor onboarding.
 * disburseToVendor  — ERC-20 USDC transfer from the treasury EOA to a vendor.
 * getWalletBalance  — ETH + USDC balance read for any address.
 *
 * Env vars required:
 *   CDP_API_KEY_NAME          — for createVendorWallet
 *   CDP_API_KEY_PRIVATE_KEY   — for createVendorWallet (PEM, \n-escaped)
 *   TREASURY_PRIVATE_KEY      — for disburseToVendor
 *   BASE_SEPOLIA_RPC_URL      — optional, defaults to public endpoint
 *   USDC_BASE_SEPOLIA_ADDRESS — optional, defaults to known Base Sepolia address
 */

import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const DEFAULT_RPC = "https://sepolia.base.org";
// Circle's USDC on Base Sepolia
const DEFAULT_USDC: `0x${string}` = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const USDC_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function rpcUrl(): string {
  return process.env["BASE_SEPOLIA_RPC_URL"] ?? DEFAULT_RPC;
}

function usdcAddress(): `0x${string}` {
  return (process.env["USDC_BASE_SEPOLIA_ADDRESS"] as `0x${string}` | undefined) ?? DEFAULT_USDC;
}

function initCdp(): void {
  const keyName = process.env["CDP_API_KEY_NAME"];
  const privateKey = process.env["CDP_API_KEY_PRIVATE_KEY"];
  if (!keyName || !privateKey) {
    throw new Error("CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be set");
  }
  Coinbase.configure({
    apiKeyName: keyName,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  });
}

/**
 * Creates a new CDP-managed MPC wallet on Base Sepolia for a new vendor.
 * Returns the wallet ID (persist in DynamoDB) and the default wallet address.
 */
export async function createVendorWallet(): Promise<{
  walletId: string;
  address: string;
}> {
  initCdp();
  const wallet = await Wallet.create({ networkId: "base-sepolia" });
  const defaultAddress = await wallet.getDefaultAddress();
  return {
    walletId: wallet.getId()!,
    address: defaultAddress.getId(),
  };
}

/**
 * Transfers USDC from the treasury EOA to a vendor wallet.
 * @param vendorAddress  Recipient wallet address.
 * @param usdcAmount     Amount in USDC atomic units (6 decimals; 1 USDC = 1_000_000n).
 * @returns              Transaction hash.
 */
export async function disburseToVendor(
  vendorAddress: `0x${string}`,
  usdcAmount: bigint,
): Promise<Hex> {
  const raw = process.env["TREASURY_PRIVATE_KEY"];
  if (!raw) throw new Error("TREASURY_PRIVATE_KEY is not set");
  const key = (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;
  const account = privateKeyToAccount(key);
  const transport = http(rpcUrl());

  const pub = createPublicClient({ chain: baseSepolia, transport });
  const wal = createWalletClient({ account, chain: baseSepolia, transport });

  const txHash = await wal.writeContract({
    address: usdcAddress(),
    abi: USDC_ABI,
    functionName: "transfer",
    account,
    args: [vendorAddress, usdcAmount],
  });

  await pub.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Reads ETH and USDC balances for any Base Sepolia address.
 * @returns eth  Native ETH balance in wei.
 * @returns usdc USDC balance in atomic units (6 decimals).
 */
export async function getWalletBalance(address: `0x${string}`): Promise<{
  eth: bigint;
  usdc: bigint;
}> {
  const pub = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl()),
  });

  const [eth, usdc] = await Promise.all([
    pub.getBalance({ address }),
    pub.readContract({
      address: usdcAddress(),
      abi: USDC_ABI,
      functionName: "balanceOf",
      args: [address],
    }),
  ]);

  return { eth, usdc };
}
