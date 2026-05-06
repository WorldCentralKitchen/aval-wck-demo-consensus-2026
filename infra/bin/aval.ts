#!/usr/bin/env -S tsx
/**
 * CDK app entrypoint. One stack, AvalStack — keeps the demo's blast radius
 * scoped and the deploy reversible by design.
 *
 * Resources defined in Phase 1b and Phase 2 fold into the same stack. The
 * x402 paywall, Bedrock action group, and Cognito wiring are added in their
 * own phases but stay on this stack so a single `cdk deploy` produces the
 * whole demo environment.
 */

import { App, Tags } from "aws-cdk-lib";
import { AvalStack } from "../lib/aval-stack.js";

const account = process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || "us-east-1";

if (!account) {
  console.error(
    "AWS_ACCOUNT_ID is not set. Source .env (e.g. `set -a; source .env; set +a`) before running CDK commands.",
  );
  process.exit(1);
}

const app = new App();

const stack = new AvalStack(app, "AvalStack", {
  env: { account, region },
  description: "Aval — credential and agent-native infrastructure for WCK (demo).",
});

Tags.of(stack).add("project", "aval");
Tags.of(stack).add("env", "demo");
Tags.of(stack).add("owner", "wck-aval-team");
