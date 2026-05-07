import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { queryPrefix, putItem, TABLE } from "../lib/db.js";

const DEFAULT_RPC = "https://sepolia.base.org";
const USDC_ADDRESS: `0x${string}` = (
  process.env["USDC_BASE_SEPOLIA_ADDRESS"] ?? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
) as `0x${string}`;

const USDC_TRANSFER_ABI = [
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
] as const;

// USDC amounts per item in atomic units (6 decimals)
const ITEM_USDC: Record<string, bigint> = {
  meal: 6_670_000n,   // $6.67
  water: 1_000_000n,  // $1.00
  snack: 2_000_000n,  // $2.00
};

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

async function disburse(
  to: `0x${string}`,
  amount: bigint,
): Promise<Hex> {
  const raw = process.env["TREASURY_PRIVATE_KEY"];
  if (!raw) throw new Error("TREASURY_PRIVATE_KEY not set");
  const key = (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;
  const account = privateKeyToAccount(key);
  const rpcUrl = process.env["BASE_SEPOLIA_RPC_URL"] ?? DEFAULT_RPC;
  const transport = http(rpcUrl);
  const pub = createPublicClient({ chain: baseSepolia, transport });
  const wal = createWalletClient({ account, chain: baseSepolia, transport });

  const txHash = await wal.writeContract({
    address: USDC_ADDRESS,
    abi: USDC_TRANSFER_ABI,
    functionName: "transfer",
    account,
    args: [to, amount],
  });

  await pub.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}") as {
      activationId?: string;
    };

    if (!body.activationId) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "activationId is required" }),
      };
    }

    const redemptions = await queryPrefix(
      `ACTIVATION#${body.activationId}`,
      "REDEMPTION#",
    );

    // Filter to today (UTC day)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 86_400_000);

    const todays = redemptions.filter((r) => {
      const ts = r["redeemedAt"] as number | undefined;
      return ts !== undefined && ts >= todayStart.getTime() && ts < todayEnd.getTime();
    });

    // Group by vendorAddress
    const byVendor: Record<string, { count: number; amount: bigint }> = {};
    for (const r of todays) {
      const vendor = r["vendorAddress"] as string | undefined;
      if (!vendor || vendor === "pending") continue;
      const itemCode = (r["itemCode"] as string | undefined) ?? "meal";
      const usdcAmt = ITEM_USDC[itemCode] ?? ITEM_USDC["meal"]!;
      if (!byVendor[vendor]) byVendor[vendor] = { count: 0, amount: 0n };
      byVendor[vendor]!.count++;
      byVendor[vendor]!.amount += usdcAmt;
    }

    const settlements: { vendorAddress: string; count: number; usdcAmount: number; txHash: string }[] = [];

    for (const [vendorAddress, { count, amount }] of Object.entries(byVendor)) {
      if (amount === 0n) continue;
      const txHash = await disburse(vendorAddress as `0x${string}`, amount);
      const usdcAmount = Number(amount) / 1_000_000;
      settlements.push({ vendorAddress, count, usdcAmount, txHash });

      await putItem({
        PK: `SETTLEMENT#${body.activationId}`,
        SK: `VENDOR#${vendorAddress}#${Date.now()}`,
        activationId: body.activationId,
        vendorAddress,
        count,
        usdcAmount,
        txHash,
        settledAt: Date.now(),
      });
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        activationId: body.activationId,
        settlements,
        totalVendors: settlements.length,
        totalRedemptions: todays.length,
        settledAt: Date.now(),
      }),
    };
  } catch (e) {
    console.error("settle error", e);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Internal error" }) };
  }
};
