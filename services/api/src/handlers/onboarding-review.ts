import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { putItem } from "../lib/db.js";

const AGENT_ID = process.env["BEDROCK_AGENT_ID"];
// Inference profile for Claude Sonnet 4.6 (required for Claude 4.x on Bedrock)
const BEDROCK_MODEL = "us.anthropic.claude-sonnet-4-6";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

const SYSTEM_PROMPT = `You are an onboarding document reviewer for World Central Kitchen (WCK).
When given vendor onboarding information, review it for completeness and flag any issues.
Always respond with a valid JSON object and nothing else:
{"confidence":<0.0-1.0>,"flags":[<array of string issue descriptions, empty if none>],"recommend":"approve" or "reject","summary":"<one sentence>"}
Be pragmatic — approve vendors with minor issues (confidence 0.85-0.95), reject only for serious fraud indicators or missing critical documents.`;

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

async function invokeBedrock(vendorId: string) {
  const client = new BedrockRuntimeClient({
    region: process.env["AWS_REGION"] ?? "us-east-1",
  });

  const start = Date.now();
  const response = await client.send(
    new ConverseCommand({
      modelId: BEDROCK_MODEL,
      system: [{ text: SYSTEM_PROMPT }],
      messages: [
        {
          role: "user",
          content: [
            {
              text: `Review vendor onboarding application for vendor ID: ${vendorId}.\n\nVendor details for Cocina La Borinqueña (demo):\n- Business name: Cocina La Borinqueña\n- Owner: Carlos Méndez\n- EIN: 66-1234567\n- Address: Calle Luna 42, Ponce, Puerto Rico 00717\n- Category: Food service / restaurant\n- Food safety cert: FS-CERT-2024-PR-3849 (valid through Dec 2027)\n- Business license: PR-DACO-2024-01847 (municipality of Ponce, active)\n- Bank: Banco Popular de Puerto Rico, routing verified\n- Note: Minor DOB discrepancy between banking form and business license (middle-name suffix variation)\n\nProvide your structured review as JSON.`,
            },
          ],
        },
      ],
      inferenceConfig: { maxTokens: 512, temperature: 0.2 },
    }),
  );

  const raw =
    response.output?.message?.content
      ?.map((b) => ("text" in b ? b.text : ""))
      .join("") ?? "";

  return { raw, durationMs: Date.now() - start };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}") as {
      vendorId?: string;
    };

    if (!body.vendorId) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "vendorId is required" }),
      };
    }

    let packet: ReturnType<typeof mockReviewPacket>;

    if (AGENT_ID) {
      const reviewedAt = Date.now();
      const bedrockResult = await invokeBedrock(body.vendorId);
      try {
        const jsonMatch = bedrockResult.raw.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch?.[0] ?? bedrockResult.raw) as {
          confidence?: number;
          flags?: string[];
          recommend?: string;
          summary?: string;
        };
        const mock = mockReviewPacket(body.vendorId);
        packet = {
          ...mock,
          vendorId: body.vendorId,
          confidence: parsed.confidence ?? mock.confidence,
          recommendation: (parsed.recommend === "reject" ? "reject" : "approve") as "approve",
          flags: (parsed.flags ?? []).map((f) => ({
            severity: "low" as const,
            field: "document",
            detail: f,
            resolved: false,
          })),
          reasoning: parsed.summary ?? mock.reasoning,
          reviewedAt,
          reviewDurationMs: bedrockResult.durationMs,
        };
      } catch {
        packet = {
          ...mockReviewPacket(body.vendorId),
          reasoning: bedrockResult.raw || "Bedrock returned no parseable JSON.",
          reviewedAt,
          reviewDurationMs: bedrockResult.durationMs,
        };
      }
    } else {
      packet = mockReviewPacket(body.vendorId);
    }

    await putItem({
      PK: `ONBOARDING_REVIEW#${body.vendorId}`,
      SK: `REVIEW#${Date.now()}`,
      ...packet,
    });

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(packet),
    };
  } catch (e) {
    console.error("onboarding-review error", e);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Internal error" }) };
  }
};
