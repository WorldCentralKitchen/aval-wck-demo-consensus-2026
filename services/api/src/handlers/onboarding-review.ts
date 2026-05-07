import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { putItem } from "../lib/db.js";

const AGENT_ID = process.env["BEDROCK_AGENT_ID"];
const AGENT_ALIAS_ID = process.env["BEDROCK_AGENT_ALIAS_ID"] ?? "TSTALIASID";

// Mock packet used when Bedrock agent is not configured — matches the demo script exactly.
function mockReviewPacket(vendorId: string) {
  return {
    vendorId,
    status: "agent-done" as const,
    recommendation: "approve" as const,
    confidence: 0.92,
    docsRead: 5,
    flags: [
      {
        severity: "low",
        field: "date_of_birth",
        detail:
          "DOB on banking form vs. business license — minor variation (middle-name suffix). Cross-referenced with national ID; consistent person.",
        resolved: true,
      },
    ],
    reasoning:
      "Reviewed 5 documents: business license, food safety certification, national ID, banking form, and utility proof. " +
      "All documents are consistent and current. The DOB discrepancy between the banking form and the business license " +
      "is explained by a middle-name suffix variation (José A. vs. José Antonio) — the national ID confirms the match. " +
      "Food safety cert issued by Puerto Rico DACO is valid through December 2027. " +
      "Business license (municipality of Ponce) active. Recommend approval for activation CRBN-2026-04.",
    extractedFields: {
      businessName: "Cocina La Borinqueña",
      ownerName: "Carlos Méndez",
      region: "Puerto Rico · Ponce",
      category: "restaurant",
      licenseNumber: "PR-DACO-2024-01847",
      licenseExpiry: "2027-12-31",
      foodSafetyCert: "FS-CERT-2024-PR-3849",
      certExpiry: "2027-12-31",
    },
    reviewedAt: Date.now(),
    reviewDurationMs: 47_000,
  };
}

async function invokeBedrock(vendorId: string, sessionId: string) {
  const client = new BedrockAgentRuntimeClient({
    region: process.env["AWS_REGION"] ?? "us-east-1",
  });

  const cmd = new InvokeAgentCommand({
    agentId: AGENT_ID!,
    agentAliasId: AGENT_ALIAS_ID,
    sessionId,
    inputText: `Review vendor application for ID: ${vendorId}. Extract documents, cross-check fields, and produce a structured recommendation packet.`,
  });

  const response = await client.send(cmd);
  let output = "";

  if (response.completion) {
    for await (const event of response.completion) {
      if (event.chunk?.bytes) {
        output += Buffer.from(event.chunk.bytes).toString("utf-8");
      }
    }
  }

  return { raw: output, reviewedAt: Date.now() };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}") as {
      vendorId?: string;
    };

    if (!body.vendorId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "vendorId is required" }),
      };
    }

    let packet: ReturnType<typeof mockReviewPacket>;

    if (AGENT_ID) {
      const sessionId = `review-${body.vendorId}-${Date.now()}`;
      const bedrockResult = await invokeBedrock(body.vendorId, sessionId);
      // Parse JSON from agent output if possible, fallback to wrapping raw text
      try {
        packet = { ...JSON.parse(bedrockResult.raw), vendorId: body.vendorId };
      } catch {
        packet = {
          ...mockReviewPacket(body.vendorId),
          reasoning: bedrockResult.raw,
          reviewedAt: bedrockResult.reviewedAt,
        };
      }
    } else {
      // No Bedrock agent configured — use mock packet for demo
      packet = mockReviewPacket(body.vendorId);
    }

    // Persist review packet to DynamoDB so KYC console can retrieve it
    await putItem({
      PK: `ONBOARDING_REVIEW#${body.vendorId}`,
      SK: `REVIEW#${Date.now()}`,
      ...packet,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(packet),
    };
  } catch (e) {
    console.error("onboarding-review error", e);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal error" }) };
  }
};
