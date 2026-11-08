"use client";

import { useEffect, useRef, useState } from "react";

const TIPS = [
  {
    headline: "You only pay for time you actually use",
    body: "Card subscriptions charge the full month upfront. Subscript streams USDC by the second — cancel on day 3 and you pay for 3 days, not 30.",
  },
  {
    headline: "Instant refund, same transaction",
    body: "When you cancel, the accrued portion goes to the merchant and your unused balance returns to your wallet in a single Solana transaction — no waiting, no support tickets.",
  },
  {
    headline: "Watch your money move in real time",
    body: "Both the subscriber and merchant dashboard update every 250 ms. You can see exactly how much has been streamed and how much sits in your escrow right now.",
  },
  {
    headline: "Idle funds can earn DeFi yield",
    body: "While USDC waits in your stream escrow it isn't doing anything. Subscript tracks what that idle capital could earn at prevailing Solana lending rates (~6.85% APY on Kamino / Save).",
  },
  {
    headline: "Subscript never touches your funds",
    body: "Stream deposits, withdrawals, and cancellations go directly through the audited Streamflow program on Solana. Subscript holds no private keys and no USDC.",
  },
  {
    headline: "Share a plan with a QR code",
    body: "Merchants get a checkout link and a QR code for every plan. Subscribers can scan it with Phantom or Solflare on their phone and approve without touching a desktop.",
  },
  {
    headline: "Top up without creating a new stream",
    body: "Running low? Hit Top up on any active subscription to extend the existing stream by one billing period — no new stream ID, no interrupted accrual.",
  },
  {
    headline: "Low-balance warning before you run dry",
    body: "If fewer than 2 days of escrow remain on a stream, the subscriber dashboard shows a warning so you can top up before the stream ends automatically.",
  },
];

const INTERVAL_MS = 15_000;

export function TipsCarousel() {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % TIPS.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  function goTo(index: number) {
    setActive(index);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0]?.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 40) return;
    const direction = distance < 0 ? 1 : -1;
    goTo((active + direction + TIPS.length) % TIPS.length);
  }

  const tip = TIPS[active];

  return (
    <div
      className="tips-carousel"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="tips-track">
        <p className="tips-headline">{tip.headline}</p>
        <p className="tips-body">{tip.body}</p>
      </div>

      <div className="tips-dots">
        {TIPS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Tip ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            className={`tips-dot ${i === active ? "active" : ""}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <div className="tips-progress">
        <span
          className="tips-progress-bar"
          key={active}
          style={{ animationDuration: `${INTERVAL_MS}ms` }}
        />
      </div>
    </div>
  );
}

