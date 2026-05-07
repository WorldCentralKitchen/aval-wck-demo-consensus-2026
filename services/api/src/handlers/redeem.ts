import {
  RekognitionClient,
  SearchFacesByImageCommand,
} from "@aws-sdk/client-rekognition";
import type { APIGatewayProxyHandler } from "aws-lambda";
import {
  dailyCapKey,
  faceKey,
  getItem,
  putItem,
  putItemIfAbsent,
  redemptionKey,
} from "../lib/db.js";

const rek = new RekognitionClient({});
const COLLECTION = process.env["REKOG_COLLECTION_NAME"] ?? "aval-recipients-demo";
const CONFIDENCE_THRESHOLD = 90;

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}") as {
      vendorAddress?: string;
      activationId?: string;
      base64Image?: string;
      itemCode?: string;
    };

    if (!body.vendorAddress || !body.activationId || !body.base64Image) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({
          error: "vendorAddress, activationId, and base64Image are required",
        }),
      };
    }

    const itemCode = body.itemCode ?? "meal";
    const imageBytes = Buffer.from(
      body.base64Image.replace(/^data:[^;]+;base64,/, ""),
      "base64",
    );

    const res = await rek.send(
      new SearchFacesByImageCommand({
        CollectionId: COLLECTION,
        Image: { Bytes: imageBytes },
        MaxFaces: 1,
        FaceMatchThreshold: CONFIDENCE_THRESHOLD,
      }),
    );

    const topMatch = res.FaceMatches?.[0];
    const confidence = topMatch?.Similarity ?? 0;
    const faceId = topMatch?.Face?.FaceId;

    if (!faceId || confidence < CONFIDENCE_THRESHOLD) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ matched: false }) };
    }

    const { PK, SK } = faceKey(faceId);
    const faceRecord = await getItem(PK, SK);
    if (!faceRecord) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ matched: false }) };
    }

    const anonRecipientId = faceRecord["anonRecipientId"] as string;
    const today = todayUtc();

    // Enforce daily cap: one redemption per item type per recipient per day
    const capKey = dailyCapKey(body.activationId, today, anonRecipientId, itemCode);
    const allowed = await putItemIfAbsent({
      ...capKey,
      activationId: body.activationId,
      anonRecipientId,
      itemCode,
      date: today,
      claimedAt: Date.now(),
    });

    if (!allowed) {
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          matched: true,
          denied: true,
          reason: "daily_cap",
          anonRecipientId,
          confidence,
        }),
      };
    }

    const now = Date.now();
    await putItem({
      ...redemptionKey(body.activationId, now, anonRecipientId),
      activationId: body.activationId,
      anonRecipientId,
      vendorAddress: body.vendorAddress,
      itemCode,
      confidence,
      redeemedAt: now,
    });

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        matched: true,
        denied: false,
        anonRecipientId,
        confidence,
        itemCode,
      }),
    };
  } catch (e) {
    console.error("redeem error", e);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Internal error" }) };
  }
};
