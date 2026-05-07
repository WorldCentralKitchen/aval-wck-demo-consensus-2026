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
import { Bucket, BucketEncryption, LifecycleRule } from "aws-cdk-lib/aws-s3";
import { Rule, RuleTargetInput, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction as EventsLambdaTarget } from "aws-cdk-lib/aws-events-targets";
import type { Construct } from "constructs";

const libDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = path.resolve(libDir, "..", "..");

const COLLECTION_ID =
  process.env["REKOG_COLLECTION_NAME"] ?? "aval-recipients-demo";

/**
 * Aval demo stack.
 *
 * Phase 1b: DynamoDB, API Gateway, 4 Lambdas (enroll, redeem, attest/issue, attest/verify)
 * Phase 2:  S3 staging bucket, onboarding-review (Bedrock), settle (USDC batch), credential-verify (x402)
 * Phase 3:  x402 middleware wired to credential-verify Lambda
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

    // ── S3 — vendor document staging ─────────────────────────────────────────
    const onboardingBucket = new Bucket(this, "OnboardingBucket", {
      bucketName: process.env["S3_ONBOARDING_BUCKET"] ?? "aval-onboarding-staging",
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          expiration: Duration.hours(24),
          id: "expire-vendor-docs-24h",
        } as LifecycleRule,
      ],
    });

    // ── Lambda helpers ────────────────────────────────────────────────────────
    const rekCollectionArn = `arn:aws:rekognition:${this.region}:${this.account}:collection/${COLLECTION_ID}`;

    const sharedEnv: Record<string, string> = {
      DDB_TABLE_NAME: table.tableName,
      REKOG_COLLECTION_NAME: COLLECTION_ID,
      EAS_ISSUER_PRIVATE_KEY: process.env["EAS_ISSUER_PRIVATE_KEY"] ?? "",
      TREASURY_PRIVATE_KEY: process.env["TREASURY_PRIVATE_KEY"] ?? "",
      BASE_SEPOLIA_RPC_URL:
        process.env["BASE_SEPOLIA_RPC_URL"] ?? "https://sepolia.base.org",
      USDC_BASE_SEPOLIA_ADDRESS:
        process.env["USDC_BASE_SEPOLIA_ADDRESS"] ?? "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      X402_RECEIVER_ADDRESS: process.env["X402_RECEIVER_ADDRESS"] ?? "",
      X402_FACILITATOR_URL:
        process.env["X402_FACILITATOR_URL"] ?? "https://x402.org/facilitator",
      BEDROCK_AGENT_ID: process.env["BEDROCK_AGENT_ID"] ?? "",
      BEDROCK_AGENT_ALIAS_ID: process.env["BEDROCK_AGENT_ALIAS_ID"] ?? "TSTALIASID",
      S3_ONBOARDING_BUCKET: onboardingBucket.bucketName,
    };

    const handlersDir = path.join(repoRoot, "services", "api", "src", "handlers");

    const makeFn = (id: string, entryFile: string, timeoutSecs = 30) =>
      new NodejsFunction(this, id, {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(handlersDir, entryFile),
        handler: "handler",
        projectRoot: repoRoot,
        depsLockFilePath: path.join(repoRoot, "pnpm-lock.yaml"),
        timeout: Duration.seconds(timeoutSecs),
        bundling: {
          externalModules: ["@aws-sdk/*", "@coinbase/coinbase-sdk"],
        },
        environment: sharedEnv,
      });

    // ── Phase 1b Lambda functions ─────────────────────────────────────────────
    const enrollFn = makeFn("EnrollFn", "enroll.ts");
    const redeemFn = makeFn("RedeemFn", "redeem.ts");
    const attestIssueFn = makeFn("AttestIssueFn", "attest-issue.ts", 60);
    const attestVerifyFn = makeFn("AttestVerifyFn", "attest-verify.ts");

    // ── Phase 2 Lambda functions ──────────────────────────────────────────────
    const settleFn = makeFn("SettleFn", "settle.ts", 120);
    const onboardingReviewFn = makeFn("OnboardingReviewFn", "onboarding-review.ts", 120);
    const credentialVerifyFn = makeFn("CredentialVerifyFn", "credential-verify.ts", 30);

    // ── IAM — Phase 1b ────────────────────────────────────────────────────────
    table.grantWriteData(enrollFn);
    table.grantReadWriteData(redeemFn);
    table.grantWriteData(attestIssueFn);

    enrollFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
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

    // ── IAM — Phase 2 ─────────────────────────────────────────────────────────
    table.grantReadWriteData(settleFn);
    table.grantReadWriteData(onboardingReviewFn);

    onboardingBucket.grantReadWrite(onboardingReviewFn);

    // Bedrock agent invocation
    onboardingReviewFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "bedrock:InvokeAgent",
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "bedrock:Converse",
          "bedrock:ConverseStream",
          "textract:AnalyzeDocument",
          "textract:DetectDocumentText",
          "aws-marketplace:ViewSubscriptions",
          "aws-marketplace:Subscribe",
        ],
        resources: ["*"],
      }),
    );

    // ── EventBridge — daily settlement at 14:00 Puerto Rico time (18:00 UTC) ──
    new Rule(this, "DailySettlementRule", {
      schedule: Schedule.cron({ hour: "18", minute: "0" }),
      targets: [
        new EventsLambdaTarget(settleFn, {
          event: RuleTargetInput.fromObject({ activationId: "CRBN-2026-04" }),
        }),
      ],
    });

    // ── API Gateway ───────────────────────────────────────────────────────────
    const api = new RestApi(this, "AvalApi", {
      restApiName: "aval-api",
      description:
        "Aval credential rail — API key auth (Phase 1b/2); x402 on /credential/verify (Phase 3).",
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "x-api-key", "X-Payment"],
      },
    });

    const apiKey = api.addApiKey("AvalApiKey", { apiKeyName: "aval-demo-key" });
    const plan = api.addUsagePlan("AvalUsagePlan", { name: "aval-demo-plan" });
    plan.addApiKey(apiKey);
    plan.addApiStage({ stage: api.deploymentStage });

    const AUTH = { apiKeyRequired: true };

    // Phase 1b routes
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

    // Phase 2 routes
    api.root.addResource("settle").addMethod(
      "POST",
      new LambdaIntegration(settleFn),
      AUTH,
    );

    const onboarding = api.root.addResource("onboarding");
    onboarding
      .addResource("review")
      .addMethod("POST", new LambdaIntegration(onboardingReviewFn), AUTH);

    // Phase 3: /credential/verify — no API key required; x402 payment is the access control
    api.root.addResource("credential")
      .addResource("verify")
      .addMethod("GET", new LambdaIntegration(credentialVerifyFn));
  }
}
