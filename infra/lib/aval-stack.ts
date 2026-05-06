import { Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";

/**
 * Aval demo stack. Phase 0a: empty stack so `cdk synth` succeeds.
 *
 * Phase 1b adds: DynamoDB (aval-records), Rekognition collection,
 * KMS key (alias/aval-pii), API Gateway (REST), and the four Phase 1 Lambdas
 * (/enroll, /redeem, /attest/issue, /attest/verify).
 *
 * Phase 2 adds: S3 onboarding bucket with 24h lifecycle, Bedrock Agent action
 * group Lambdas, /onboarding/review Lambda, Cognito user pool with five groups,
 * settlement Lambda + EventBridge schedule.
 *
 * Phase 3 adds: x402 middleware fronting /credential/verify (the agent-native
 * read endpoint).
 */
export class AvalStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // intentionally empty — resources land in their respective phases.
  }
}
