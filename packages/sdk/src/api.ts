/**
 * Typed REST client for the Aval API Gateway.
 *
 * Usage in Vite apps:
 *   import { createAvalClient } from "@aval/sdk";
 *   const api = createAvalClient(import.meta.env.VITE_API_URL, import.meta.env.VITE_API_KEY);
 */

// ── Request / response types ──────────────────────────────────────────────────

export interface EnrollParams {
  activationId: string;
  base64Image: string;
}

export interface EnrollResult {
  anonRecipientId: string;
  enrolledAt: number;
}

export interface RedeemParams {
  vendorAddress: string;
  activationId: string;
  base64Image: string;
  itemCode: "meal" | "water" | "snack";
}

export interface RedeemResult {
  matched: boolean;
  denied?: boolean;
  reason?: "daily_cap";
  anonRecipientId?: string;
  confidence?: number;
  itemCode?: string;
}

export interface AttestIssueParams {
  vendorAddress: string;
  region: string;
  category: "restaurant" | "food_shop" | "water" | "supplies" | "other";
  validUntil: number;
  issuerNote?: string;
}

export interface AttestIssueResult {
  uid: string;
  easScanUrl: string;
}

export interface AttestVerifyResult {
  attested: boolean;
  attestation?: {
    uid: string;
    time: string;
    expirationTime: string;
    revocationTime: string;
    recipient: string;
    attester: string;
  };
}

export interface SettleParams {
  activationId: string;
}

export interface SettleResult {
  activationId: string;
  settlements: {
    vendorAddress: string;
    count: number;
    usdcAmount: number;
    txHash: string;
  }[];
  totalVendors: number;
  totalRedemptions: number;
  settledAt: number;
}

export interface OnboardingReviewParams {
  vendorId: string;
}

export interface OnboardingReviewResult {
  vendorId: string;
  status: "agent-done" | "running";
  recommendation: "approve" | "escalate" | "reject";
  confidence: number;
  docsRead: number;
  flags: { severity: string; field: string; detail: string; resolved: boolean }[];
  reasoning: string;
  extractedFields: Record<string, string>;
  reviewedAt: number;
  reviewDurationMs: number;
}

export interface CredentialVerifyResult {
  attested: boolean;
  vendorAddress: string;
  attestation?: {
    uid: string;
    schema: string;
    time: string;
    recipient: string;
    attester: string;
  };
  easScanUrl?: string;
  paymentAmount?: string;
  paymentAsset?: string;
}

// ── Client ────────────────────────────────────────────────────────────────────

export interface AvalApiClient {
  enroll(params: EnrollParams): Promise<EnrollResult>;
  redeem(params: RedeemParams): Promise<RedeemResult>;
  attestIssue(params: AttestIssueParams): Promise<AttestIssueResult>;
  attestVerify(params: { vendorAddress: string }): Promise<AttestVerifyResult>;
  settle(params: SettleParams): Promise<SettleResult>;
  onboardingReview(params: OnboardingReviewParams): Promise<OnboardingReviewResult>;
  credentialVerify(params: { vendorAddress: string; paymentHeader?: string }): Promise<{ status: 200 | 402; body: CredentialVerifyResult | unknown }>;
}

export function createAvalClient(baseUrl: string, apiKey: string): AvalApiClient {
  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw Object.assign(new Error(`API ${res.status}: ${text}`), {
        status: res.status,
        body: text,
      });
    }
    return res.json() as Promise<T>;
  }

  async function get<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${baseUrl}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      headers: apiKey ? { "x-api-key": apiKey } : {},
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw Object.assign(new Error(`API ${res.status}: ${text}`), {
        status: res.status,
        body: text,
      });
    }
    return res.json() as Promise<T>;
  }

  return {
    enroll: (p) => post("/enroll", p),
    redeem: (p) => post("/redeem", p),
    attestIssue: (p) => post("/attest/issue", p),
    attestVerify: (p) => get("/attest/verify", { vendorAddress: p.vendorAddress }),
    settle: (p) => post("/settle", p),
    onboardingReview: (p) => post("/onboarding/review", p),

    async credentialVerify({ vendorAddress, paymentHeader }) {
      const url = new URL(`${baseUrl}/credential/verify`);
      url.searchParams.set("vendorAddress", vendorAddress);
      const headers: Record<string, string> = apiKey ? { "x-api-key": apiKey } : {};
      if (paymentHeader) headers["X-Payment"] = paymentHeader;
      const res = await fetch(url.toString(), { headers });
      const body = await res.json();
      return { status: res.status as 200 | 402, body };
    },
  };
}
