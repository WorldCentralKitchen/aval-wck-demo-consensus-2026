import {
  RekognitionClient,
  SearchFacesByImageCommand,
} from "@aws-sdk/client-rekognition";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { faceKey, getItem, putItem, redemptionKey } from "../lib/db.js";

const rek = new RekognitionClient({});
const COLLECTION = process.env["REKOG_COLLECTION_NAME"] ?? "aval-recipients-demo";
const CONFIDENCE_THRESHOLD = 90;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}") as {
      vendorAddress?: string;
      activationId?: string;
      base64Image?: string;
    };

    if (!body.vendorAddress || !body.activationId || !body.base64Image) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "vendorAddress, activationId, and base64Image are required",
        }),
      };
    }

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
      return { statusCode: 200, body: JSON.stringify({ matched: false }) };
    }

    const { PK, SK } = faceKey(faceId);
    const faceRecord = await getItem(PK, SK);
    if (!faceRecord) {
      return { statusCode: 200, body: JSON.stringify({ matched: false }) };
    }

    const anonRecipientId = faceRecord["anonRecipientId"] as string;
    const now = Date.now();

    await putItem({
      ...redemptionKey(body.activationId, now, anonRecipientId),
      activationId: body.activationId,
      anonRecipientId,
      vendorAddress: body.vendorAddress,
      confidence,
      redeemedAt: now,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ matched: true, anonRecipientId, confidence }),
    };
  } catch (e) {
    console.error("redeem error", e);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal error" }) };
  }
};
