import type { VendorAttestationPayload } from "@aval/schemas";
import { attestVendor } from "@aval/sdk/eas";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { putItem, vendorKey } from "../lib/db.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}") as {
      vendorAddress?: string;
      region?: string;
      category?: VendorAttestationPayload["category"];
      validUntil?: number;
      issuerNote?: string;
    };

    if (!body.vendorAddress || !body.region || !body.category || !body.validUntil) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({
          error: "vendorAddress, region, category, and validUntil are required",
        }),
      };
    }

    const payload: VendorAttestationPayload = {
      status: "approved",
      region: body.region,
      category: body.category,
      validUntil: body.validUntil,
      issuerNote: body.issuerNote ?? "",
    };

    const uid = await attestVendor(
      body.vendorAddress as `0x${string}`,
      payload,
    );

    const easScanUrl = `https://base-sepolia.easscan.org/attestation/view/${uid}`;

    await putItem({
      ...vendorKey(body.vendorAddress),
      vendorAddress: body.vendorAddress,
      uid,
      easScanUrl,
      createdAt: Date.now(),
    });

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ uid, easScanUrl }),
    };
  } catch (e) {
    console.error("attest-issue error", e);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Internal error" }) };
  }
};
