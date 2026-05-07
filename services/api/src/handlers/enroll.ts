import {
  CreateCollectionCommand,
  IndexFacesCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { faceKey, putItem, recipientKey } from "../lib/db.js";

const rek = new RekognitionClient({});
const COLLECTION = process.env["REKOG_COLLECTION_NAME"] ?? "aval-recipients-demo";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

async function ensureCollection(): Promise<void> {
  try {
    await rek.send(new CreateCollectionCommand({ CollectionId: COLLECTION }));
  } catch (e) {
    if ((e as { name?: string }).name !== "ResourceAlreadyExistsException") throw e;
  }
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}") as {
      activationId?: string;
      base64Image?: string;
    };

    if (!body.activationId || !body.base64Image) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "activationId and base64Image are required" }),
      };
    }

    const imageBytes = Buffer.from(
      body.base64Image.replace(/^data:[^;]+;base64,/, ""),
      "base64",
    );

    await ensureCollection();

    const res = await rek.send(
      new IndexFacesCommand({
        CollectionId: COLLECTION,
        Image: { Bytes: imageBytes },
        MaxFaces: 1,
        DetectionAttributes: [],
        QualityFilter: "AUTO",
      }),
    );

    const faceId = res.FaceRecords?.[0]?.Face?.FaceId;
    if (!faceId) {
      return {
        statusCode: 422,
        headers: CORS,
        body: JSON.stringify({ error: "No face detected in image" }),
      };
    }

    const anonRecipientId = randomUUID();
    const now = Date.now();

    await Promise.all([
      putItem({
        ...recipientKey(body.activationId, anonRecipientId),
        activationId: body.activationId,
        anonRecipientId,
        rekognitionFaceId: faceId,
        enrolledAt: now,
      }),
      putItem({
        ...faceKey(faceId),
        faceId,
        activationId: body.activationId,
        anonRecipientId,
      }),
    ]);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ anonRecipientId, enrolledAt: now }),
    };
  } catch (e) {
    console.error("enroll error", e);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Internal error" }) };
  }
};
