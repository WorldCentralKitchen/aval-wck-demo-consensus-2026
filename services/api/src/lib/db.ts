import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

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

export async function queryPrefix(
  pk: string,
  skPrefix: string,
): Promise<Record<string, unknown>[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": pk, ":prefix": skPrefix },
    }),
  );
  return (res.Items ?? []) as Record<string, unknown>[];
}

export function applicationKey(vendorId: string) {
  return { PK: "VENDOR_QUEUE", SK: `APPLICATION#${vendorId}` };
}

export async function updateItem(
  pk: string,
  sk: string,
  expr: string,
  attrNames: Record<string, string>,
  attrValues: Record<string, unknown>,
): Promise<void> {
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: pk, SK: sk },
    UpdateExpression: expr,
    ExpressionAttributeNames: attrNames,
    ExpressionAttributeValues: attrValues,
  }));
}

export function dailyCapKey(
  activationId: string,
  date: string,
  anonId: string,
  itemCode: string,
) {
  return {
    PK: `DAILY_CAP#${activationId}#${date}`,
    SK: `${anonId}#${itemCode}`,
  };
}

export async function putItemIfAbsent(
  item: Record<string, unknown>,
): Promise<boolean> {
  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)",
      }),
    );
    return true;
  } catch (e) {
    if ((e as { name?: string }).name === "ConditionalCheckFailedException") {
      return false;
    }
    throw e;
  }
}
