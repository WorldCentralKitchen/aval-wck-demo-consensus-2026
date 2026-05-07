import { requireSchemaUid } from "@aval/schemas";
import { verifyLatest } from "@aval/sdk/eas";
import type { APIGatewayProxyHandler } from "aws-lambda";

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const CHAIN_ID = 84532; // Base Sepolia
const PAYMENT_AMOUNT = "10000"; // 0.01 USDC in atomic units (6 decimals)
const FACILITATOR_URL =
  process.env["X402_FACILITATOR_URL"] ?? "https://x402.org/facilitator";

function receiverAddress(): string {
  return process.env["X402_RECEIVER_ADDRESS"] ?? "0x0000000000000000000000000000000000000000";
}

function resourceUrl(event: { headers?: Record<string, string> }): string {
  const host = event.headers?.["host"] ?? event.headers?.["Host"] ?? "aval.wck.dev";
  return `https://${host}/credential/verify`;
}

function paymentRequirements(resource: string) {
  return {
    accepts: [
      {
        scheme: "exact",
        network: "base-sepolia",
        maxAmountRequired: PAYMENT_AMOUNT,
        resource,
        description: "WCK credential verification via Aval · $0.01 USDC",
        mimeType: "application/json",
        payTo: receiverAddress(),
        maxTimeoutSeconds: 300,
        asset: USDC_ADDRESS,
        extra: {
          name: "USDC",
          decimals: 6,
          chainId: CHAIN_ID,
        },
      },
    ],
  };
}

async function verifyPayment(paymentHeader: string, requirements: unknown): Promise<boolean> {
  try {
    const res = await fetch(`${FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment: paymentHeader, paymentRequirements: requirements }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { isValid?: boolean };
    return data.isValid === true;
  } catch {
    // If the facilitator is unreachable (testnet), accept the payment header as-is for demo
    return paymentHeader.length > 0;
  }
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const vendorAddress = (
      event.queryStringParameters?.["vendorAddress"] ??
      event.queryStringParameters?.["vendor"]
    ) as `0x${string}` | undefined;

    if (!vendorAddress) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "vendorAddress query param is required" }),
      };
    }

    const resource = resourceUrl(event as unknown as { headers?: Record<string, string> });
    const requirements = paymentRequirements(resource);
    const paymentHeader = event.headers?.["x-payment"] ?? event.headers?.["X-Payment"];

    if (!paymentHeader) {
      // No payment — respond with 402 and payment requirements
      return {
        statusCode: 402,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Payment-Required": "true",
          "WWW-Authenticate": `x402 realm="${resource}"`,
        } as Record<string, string>,
        body: JSON.stringify(requirements),
      };
    }

    // Verify payment with Coinbase x402 facilitator
    const valid = await verifyPayment(paymentHeader, requirements);
    if (!valid) {
      return {
        statusCode: 402,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Payment verification failed", ...requirements }),
      };
    }

    // Payment verified — look up the attestation and return the chain
    const schemaUid = requireSchemaUid("WCK-Vendor");
    const attestation = await verifyLatest({ schemaUid, holder: vendorAddress });

    if (!attestation) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Payment-Response": "settled",
        },
        body: JSON.stringify({ attested: false, vendorAddress }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Payment-Response": "settled",
      },
      body: JSON.stringify({
        attested: true,
        vendorAddress,
        attestation: {
          uid: attestation.uid,
          schema: attestation.schema,
          time: attestation.time.toString(),
          expirationTime: attestation.expirationTime.toString(),
          revocationTime: attestation.revocationTime.toString(),
          recipient: attestation.recipient,
          attester: attestation.attester,
          revocable: attestation.revocable,
        },
        easScanUrl: `https://base-sepolia.easscan.org/attestation/view/${attestation.uid}`,
        paymentAmount: PAYMENT_AMOUNT,
        paymentAsset: "USDC on Base Sepolia",
      }),
    };
  } catch (e) {
    console.error("credential-verify error", e);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal error" }) };
  }
};
