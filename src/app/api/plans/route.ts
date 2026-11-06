import { NextRequest, NextResponse } from "next/server";
import { createPlan, listPlans } from "@/lib/db";
import { MIN_BILLING_PERIOD_SECONDS, type CreatePlanInput } from "@/lib/plans";

export const runtime = "nodejs";

function invalid(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function isWalletAddress(value: unknown): value is string {
  return typeof value === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function validatePlan(body: unknown): CreatePlanInput | string {
  if (!body || typeof body !== "object") return "Expected a JSON object.";
  const data = body as Record<string, unknown>;
  if (!isWalletAddress(data.merchantWallet)) return "A valid merchant wallet is required.";
  if (!isWalletAddress(data.payoutAddress)) return "A valid payout address is required.";
  if (typeof data.name !== "string" || data.name.trim().length < 2 || data.name.trim().length > 80) return "Plan name must be between 2 and 80 characters.";
  if (!isSafeInteger(data.priceMicrousd) || data.priceMicrousd <= 0) return "Price must be a positive whole number of micro-USDC.";
  if (!isSafeInteger(data.billingPeriodSeconds) || data.billingPeriodSeconds < MIN_BILLING_PERIOD_SECONDS) return `Billing period must be at least ${MIN_BILLING_PERIOD_SECONDS} seconds.`;

  return {
    merchantWallet: data.merchantWallet,
    name: data.name.trim(),
    priceMicrousd: data.priceMicrousd,
    billingPeriodSeconds: data.billingPeriodSeconds,
    payoutAddress: data.payoutAddress,
  };
}

export function GET(request: NextRequest) {
  const merchantWallet = request.nextUrl.searchParams.get("merchantWallet") ?? undefined;
  return NextResponse.json({ plans: listPlans(merchantWallet) });
}

export async function POST(request: NextRequest) {
  const validation = validatePlan(await request.json().catch(() => undefined));
  if (typeof validation === "string") return invalid(validation);
  return NextResponse.json({ plan: createPlan(validation) }, { status: 201 });
}
