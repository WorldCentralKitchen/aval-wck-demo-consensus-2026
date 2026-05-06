import { fileURLToPath } from "node:url";
import * as path from "node:path";
import { Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import {
  ApiKey,
  LambdaIntegration,
  RestApi,
  UsagePlan,
} from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

// ESM equivalent of __dirname: import.meta.url → infra/lib/aval-stack.ts,
// new URL(".") → infra/lib/, resolve("..","..") → repo root.
const libDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = path.resolve(libDir, "..", "..");

const COLLECTION_ID =
  process.env["REKOG_COLLECTION_NAME"] ?? "aval-recipients-demo";

/**
 * Aval demo stack.
 *
 * Phase 1b: DynamoDB (aval-records), API Gateway (aval-api), four Lambdas:
 *   POST /enroll         — Rekognition IndexFaces + DynamoDB
 *   POST /redeem         — Rekognition SearchFacesByImage + DynamoDB
 *   POST /attest/issue   — EAS attestation (@aval/sdk/eas) + DynamoDB
 *   GET  /attest/verify  — EAS verifyLatest (@aval/sdk/eas)
 *
 * Phase 2: S3 staging bucket, Bedrock Agent, /onboarding/review, Cognito,
 *          settlement Lambda + EventBridge.
 * Phase 3: x402 middleware on /credential/verify.
 *
 * EAS_ISSUER_PRIVATE_KEY must be set when running `cdk deploy`.
 * Source .env first: `set -a; source .env; set +a`
 */
export class AvalStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ── DynamoDB ──────────────────────────────────────────────────────────────
    const table = new Table(this, "AvalRecords", {
      tableName: "aval-records",
      partitionKey: { name: "PK", type: AttributeType.STRING },
      sortKey: { name: "SK", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // ── Lambda helpers ────────────────────────────────────────────────────────
    const rekCollectionArn = `arn:aws:rekognition:${this.region}:${this.account}:collection/${COLLECTION_ID}`;

    const sharedEnv: Record<string, string> = {
      DDB_TABLE_NAME: table.tableName,
      REKOG_COLLECTION_NAME: COLLECTION_ID,
      EAS_ISSUER_PRIVATE_KEY: process.env["EAS_ISSUER_PRIVATE_KEY"] ?? "",
      BASE_SEPOLIA_RPC_URL:
        process.env["BASE_SEPOLIA_RPC_URL"] ?? "https://sepolia.base.org",
    };

    const handlersDir = path.join(
      repoRoot,
      "services",
      "api",
      "src",
      "handlers",
    );

    const makeFn = (id: string, entryFile: string, timeoutSecs = 30) =>
      new NodejsFunction(this, id, {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(handlersDir, entryFile),
        handler: "handler",
        projectRoot: repoRoot,
        depsLockFilePath: path.join(repoRoot, "pnpm-lock.yaml"),
        timeout: Duration.seconds(timeoutSecs),
        bundling: {
          // @aws-sdk/* provided by the Lambda Node 20 runtime — don't bundle.
          // @coinbase/coinbase-sdk has native secp256k1 — not used in Phase 1b
          // handlers but explicitly excluded to guarantee it's never bundled.
          externalModules: ["@aws-sdk/*", "@coinbase/coinbase-sdk"],
        },
        environment: sharedEnv,
      });

    // ── Lambda functions ──────────────────────────────────────────────────────
    const enrollFn = makeFn("EnrollFn", "enroll.ts");
    const redeemFn = makeFn("RedeemFn", "redeem.ts");
    // attest-issue waits for an on-chain tx receipt — 60s to be safe.
    const attestIssueFn = makeFn("AttestIssueFn", "attest-issue.ts", 60);
    const attestVerifyFn = makeFn("AttestVerifyFn", "attest-verify.ts");

    // ── IAM ───────────────────────────────────────────────────────────────────
    table.grantWriteData(enrollFn);
    table.grantReadWriteData(redeemFn); // GetItem (face lookup) + PutItem (redemption)
    table.grantWriteData(attestIssueFn);
    // attestVerifyFn reads from chain only — no AWS service calls.

    enrollFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        // CreateCollection requires * — the collection may not exist at the time
        // the policy is evaluated (first deployment). IndexFaces is scoped to ARN.
        actions: ["rekognition:CreateCollection"],
        resources: ["*"],
      }),
    );
    enrollFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["rekognition:IndexFaces"],
        resources: [rekCollectionArn],
      }),
    );

    redeemFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["rekognition:SearchFacesByImage"],
        resources: [rekCollectionArn],
      }),
    );

    // ── API Gateway ───────────────────────────────────────────────────────────
    const api = new RestApi(this, "AvalApi", {
      restApiName: "aval-api",
      description:
        "Aval credential rail — API key auth (Phase 1b); x402 on /credential/verify (Phase 3).",
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "x-api-key"],
      },
    });

    const apiKey = api.addApiKey("AvalApiKey", { apiKeyName: "aval-demo-key" });
    const plan = api.addUsagePlan("AvalUsagePlan", {
      name: "aval-demo-plan",
    });
    plan.addApiKey(apiKey);
    plan.addApiStage({ stage: api.deploymentStage });

    const AUTH = { apiKeyRequired: true };

    api.root.addResource("enroll").addMethod(
      "POST",
      new LambdaIntegration(enrollFn),
      AUTH,
    );
    api.root.addResource("redeem").addMethod(
      "POST",
      new LambdaIntegration(redeemFn),
      AUTH,
    );

    const attest = api.root.addResource("attest");
    attest
      .addResource("issue")
      .addMethod("POST", new LambdaIntegration(attestIssueFn), AUTH);
    attest
      .addResource("verify")
      .addMethod("GET", new LambdaIntegration(attestVerifyFn), AUTH);
  }
}
