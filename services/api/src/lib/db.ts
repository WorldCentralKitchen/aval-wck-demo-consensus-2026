import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const raw = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(raw);
export const TABLE = process.env["DDB_TABLE_NAME"] ?? "aval-records";

export function vendorKey(addr: string) {
  return { PK: `VENDOR#${addr}`, SK: `VENDOR#${addr}` };
}

export function recipientKey(activationId: string, anonId: string) {
  return { PK: `ACTIVATION#${activationId}`, SK: `RECIPIENT#${anonId}` };
}

export function faceKey(faceId: string) {
  return { PK: `FACE#${faceId}`, SK: `FACE#${faceId}` };
}

export function redemptionKey(activationId: string, ms: number, anonId: string) {
  return { PK: `ACTIVATION#${activationId}`, SK: `REDEMPTION#${ms}#${anonId}` };
}

export async function putItem(item: Record<string, unknown>): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
}

export async function getItem(
  pk: string,
  sk: string,
): Promise<Record<string, unknown> | undefined> {
  const res = await ddb.send(
    new GetCommand({ TableName: TABLE, Key: { PK: pk, SK: sk } }),
  );
  return res.Item as Record<string, unknown> | undefined;
}
