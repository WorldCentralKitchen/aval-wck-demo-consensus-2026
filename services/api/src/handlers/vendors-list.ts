import type { APIGatewayProxyHandler } from "aws-lambda";
import { queryPrefix } from "../lib/db.js";

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const items = await queryPrefix("VENDOR_QUEUE", "APPLICATION#");
    const vendors = items.map((item) => ({
      vendorId:       item["vendorId"],
      name:           item["name"],
      biz:            item["biz"],
      region:         item["region"],
      category:       item["category"],
      walletAddress:  item["walletAddress"],
      status:         item["status"],
      submittedAt:    item["submittedAt"],
      docs:           item["docs"],
      flags:          item["flags"],
      conf:           item["conf"],
      rec:            item["rec"],
      attestationUid: item["attestationUid"] ?? null,
      easScanUrl:     item["easScanUrl"] ?? null,
    }));
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ vendors }) };
  } catch (e) {
    console.error("vendors-list error", e);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Internal error" }) };
  }
};
