import type { APIGatewayProxyHandler } from "aws-lambda";
import { applicationKey, updateItem } from "../lib/db.js";

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}") as {
      vendorId?: string;
      status?: string;
      attestationUid?: string;
      easScanUrl?: string;
    };

    if (!body.vendorId || !body.status) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "vendorId and status required" }) };
    }

    const { PK, SK } = applicationKey(body.vendorId);

    const hasAttestation = Boolean(body.attestationUid);
    const expr = `SET #s = :status, updatedAt = :now${hasAttestation ? ", attestationUid = :uid, easScanUrl = :url" : ""}`;
    const attrValues: Record<string, unknown> = {
      ":status": body.status,
      ":now":    new Date().toISOString(),
    };
    if (hasAttestation) {
      attrValues[":uid"] = body.attestationUid;
      attrValues[":url"] = body.easScanUrl ?? "";
    }

    await updateItem(PK, SK, expr, { "#s": "status" }, attrValues);

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error("vendors-update error", e);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Internal error" }) };
  }
};
