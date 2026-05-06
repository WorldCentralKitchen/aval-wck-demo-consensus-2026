import { requireSchemaUid } from "@aval/schemas";
import { verifyLatest } from "@aval/sdk/eas";
import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const vendorAddress = event.queryStringParameters?.["vendorAddress"] as
      | `0x${string}`
      | undefined;

    if (!vendorAddress) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "vendorAddress query param is required" }),
      };
    }

    const schemaUid = requireSchemaUid("WCK-Vendor");
    const attestation = await verifyLatest({ schemaUid, holder: vendorAddress });

    if (!attestation) {
      return { statusCode: 200, body: JSON.stringify({ attested: false }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        attested: true,
        attestation: {
          uid: attestation.uid,
          time: attestation.time.toString(),
          expirationTime: attestation.expirationTime.toString(),
          revocationTime: attestation.revocationTime.toString(),
          recipient: attestation.recipient,
          attester: attestation.attester,
        },
      }),
    };
  } catch (e) {
    console.error("attest-verify error", e);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal error" }) };
  }
};
