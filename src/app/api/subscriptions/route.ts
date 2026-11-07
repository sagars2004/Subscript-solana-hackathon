import { NextRequest, NextResponse } from "next/server";
import { listSubscriptionLinks, saveSubscriptionLink } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("subscriberWallet");
  if (!wallet) return NextResponse.json({ error: "subscriberWallet is required." }, { status: 400 });
  return NextResponse.json({ subscriptions: listSubscriptionLinks(wallet) });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => undefined)) as Record<string, unknown> | undefined;
  if (!body || typeof body.streamId !== "string" || typeof body.planId !== "string" || typeof body.subscriberWallet !== "string") return NextResponse.json({ error: "streamId, planId, and subscriberWallet are required." }, { status: 400 });
  saveSubscriptionLink({ streamId: body.streamId, planId: body.planId, subscriberWallet: body.subscriberWallet });
  return NextResponse.json({ ok: true }, { status: 201 });
}
