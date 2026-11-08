"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ICluster, SolanaStreamClient, getBN } from "@streamflow/stream";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-modal";
import { explorerTransactionUrl } from "@/lib/chain";
import { formatPeriod, formatUsdc, type Plan } from "@/lib/plans";
import { activeYieldSource } from "@/lib/yield";

type LinkRecord = { streamId: string; planId: string };
type StreamView = { id: string; plan: Plan; stream: any };
const toUsdc = (value: any) => Number(value?.toString?.() ?? value) / 1_000_000;

export function SubscriberDashboard() {
  const { connection } = useConnection();
  const { connected, publicKey, wallet } = useWallet();
  const [items, setItems] = useState<StreamView[]>([]);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [review, setReview] = useState<{ item: StreamView; refund: number; merchantKeeps: number } | null>(null);

  const walletAddress = publicKey?.toBase58() ?? "";
  const client = useMemo(
    () => new SolanaStreamClient({ connection, cluster: ICluster.Devnet, commitment: "confirmed" }),
    [connection],
  );

  const load = useCallback(async () => {
    if (!walletAddress) {
      setItems([]);
      return;
    }
    try {
      const [linksResponse, plansResponse] = await Promise.all([
        fetch(`/api/subscriptions?subscriberWallet=${walletAddress}`),
        fetch("/api/plans"),
      ]);
      const links = (await linksResponse.json()).subscriptions as LinkRecord[];
      const plans = (await plansResponse.json()).plans as Plan[];
      const byId = new Map(plans.map((plan) => [plan.id, plan]));
      const next = await Promise.all(
        links.map(async (link) => {
          const plan = byId.get(link.planId);
          if (!plan) return null;
          try {
            return { id: link.streamId, plan, stream: await client.getOne({ id: link.streamId }) };
          } catch {
            return null;
          }
        }),
      );
      setItems(next.filter((item): item is StreamView => Boolean(item)));
    } catch {
      setError("Could not load your subscriptions from Devnet.");
    }
  }, [client, walletAddress]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 250);
    return () => window.clearInterval(interval);
  }, []);

  // Compute total unstreamed idle capital across active streams
  const totalIdleRemainingUsdc = useMemo(() => {
    return items.reduce((acc, item) => {
      const stream = item.stream;
      if (stream.closed) return acc;
      const deposited = toUsdc(stream.depositedAmount);
      const withdrawn = toUsdc(stream.withdrawnAmount);
      const unlocked = Math.min(deposited, toUsdc(stream.unlocked(now)));
      const spent = Math.max(withdrawn, unlocked);
      return acc + Math.max(0, deposited - spent);
    }, 0);
  }, [items, now]);

  const projectedAnnualEarnings = activeYieldSource.calculateReturn(totalIdleRemainingUsdc, 365);

  async function cancel(item: StreamView) {
    if (!wallet || !publicKey) return;
    setError("");
    setBusyId(item.id);
    setReview(null);

    try {
      const tx = await client.cancel({ id: item.id }, { invoker: wallet.adapter as never });
      setResult(tx.txId);
      await load();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Cancellation failed.");
    } finally {
      setBusyId("");
    }
  }

  async function topUp(item: StreamView) {
    if (!wallet) return;
    setError("");
    setBusyId(item.id);

    try {
      const tx = await client.topup(
        { id: item.id, amount: getBN(item.plan.priceMicrousd / 1_000_000, 6) },
        { invoker: wallet.adapter as never },
      );
      setResult(tx.txId);
      await load();
    } catch (topUpError) {
      setError(topUpError instanceof Error ? topUpError.message : "Top-up failed.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="merchant-layout">
      <div className="workspace-topbar">
        <div>
          <p className="eyebrow">Subscriber workspace</p>
          <h1>Your streams, in real time.</h1>
          <p className="workspace-intro">
            Every card reads from Streamflow on Devnet. The counter interpolates locally between chain reads.
          </p>
        </div>
        <ConnectWalletButton />
      </div>

      {!connected && (
        <div className="info-banner">
          <span className="status-dot" />
          Connect the wallet you used at checkout to see its active streams.
        </div>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="success-result">
          <p>Transaction submitted.</p>
          <a href={explorerTransactionUrl(result)} target="_blank" rel="noreferrer">
            View on Solana Explorer ↗
          </a>
        </div>
      )}

      {/* DeFi Yield Layer Card (PRD P1 / Composability) */}
      {connected && items.length > 0 && (
        <section className="yield-card" aria-label="Idle-Funds Yield Reserve">
          <div className="yield-header">
            <div>
              <p className="eyebrow" style={{ margin: 0, marginBottom: "4px" }}>
                DeFi Composability · {activeYieldSource.name}
              </p>
              <span style={{ fontSize: "0.78rem", color: "#596274" }}>
                Idle funds waiting in stream escrows earn yield until streamed
              </span>
            </div>
            <span className="yield-badge">Projected · Not Earned</span>
          </div>

          <div className="yield-metrics-grid">
            <div className="yield-metric-box">
              <span>Idle escrow capital</span>
              <strong>{formatUsdc(Math.round(totalIdleRemainingUsdc * 1_000_000))}</strong>
            </div>
            <div className="yield-metric-box">
              <span>Lending market APY</span>
              <strong>{activeYieldSource.apyPercent}%</strong>
            </div>
            <div className="yield-metric-box">
              <span>Projected annual return</span>
              <strong>{formatUsdc(Math.round(projectedAnnualEarnings * 1_000_000))}</strong>
            </div>
          </div>

          <p className="yield-explainer">
            Traditional subscriptions bill 100% upfront and forfeit unused funds. Subscript streams by the second, refunds instantly on cancellation, and integrates with Solana lending pools ({activeYieldSource.protocol}) so parked capital continues working for you.
          </p>
        </section>
      )}

      <div className="subscription-list">
        {connected && items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">◌</span>
            <p>No subscriptions found</p>
            <span>Create one from a merchant checkout link, then return here.</span>
          </div>
        ) : (
          items.map((item) => {
            const stream = item.stream;
            const isClosed = Boolean(stream.closed);
            const deposited = toUsdc(stream.depositedAmount);
            const withdrawn = toUsdc(stream.withdrawnAmount);
            // For settled streams freeze at withdrawnAmount so the counter
            // does not keep ticking upward after cancellation.
            const unlocked = isClosed ? withdrawn : Math.min(deposited, toUsdc(stream.unlocked(now)));
            const spent = isClosed ? withdrawn : Math.max(withdrawn, unlocked);
            const remaining = Math.max(0, deposited - spent);
            const secondsLeft = isClosed ? 0 : Math.max(0, stream.end - now);
            const percent = deposited ? Math.min(100, (spent / deposited) * 100) : 0;
            const lowBalance = !isClosed && secondsLeft < 172800;

            return (
              <article className="subscription-card" key={item.id}>
                <div className="subscription-header">
                  <div>
                    <p className="result-label">{isClosed ? "Settled stream" : "Active stream"}</p>
                    <h2>{item.plan.name}</h2>
                    <span>
                      {formatUsdc(item.plan.priceMicrousd)} / {formatPeriod(item.plan.billingPeriodSeconds)}
                    </span>
                  </div>
                  <span className={`stream-status ${isClosed ? "settled" : "streaming"}`}>
                    {isClosed ? "Settled" : "Streaming"}
                  </span>
                </div>

                <div className="counter-block">
                  <span>Streamed so far</span>
                  <strong>{formatUsdc(Math.round(spent * 1_000_000))}</strong>
                  <div className="progress-track">
                    <span style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="subscription-metrics">
                  <div>
                    <span>Remaining</span>
                    <strong>{formatUsdc(Math.round(remaining * 1_000_000))}</strong>
                  </div>
                  <div>
                    <span>Time left</span>
                    <strong>
                      {isClosed ? "—" : secondsLeft < 60 ? `${secondsLeft}s` : `${Math.ceil(secondsLeft / 86400)}d`}
                    </strong>
                  </div>
                </div>

                {lowBalance && <div className="low-balance">Low balance · top up before this stream runs dry.</div>}

                {!isClosed && (
                  <div className="subscription-actions">
                    <button
                      className="cancel-button"
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => setReview({ item, refund: remaining, merchantKeeps: spent })}
                    >
                      {`Review cancellation · return ${formatUsdc(Math.round(remaining * 1_000_000))}`}
                      <span>↗</span>
                    </button>
                    <button
                      className="topup-button"
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void topUp(item)}
                    >
                      {busyId === item.id ? "Waiting…" : "Top up one period"}
                    </button>
                  </div>
                )}

                <a
                  className="stream-id"
                  href={`https://app.streamflow.finance/solana/devnet/stream/${item.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View stream details ↗
                </a>
              </article>
            );
          })
        )}
      </div>

      {review && (
        <div className="review-overlay" role="dialog" aria-modal="true">
          <div className="review-card">
            <p className="eyebrow">Review cancellation</p>
            <h2>Stop {review.item.plan.name}?</h2>
            <p className="review-copy">
              This signs one Streamflow transaction. The merchant keeps the amount streamed so far and the unused balance
              returns to your wallet.
            </p>
            <div className="review-amounts">
              <div>
                <span>Merchant keeps</span>
                <strong>{formatUsdc(Math.round(review.merchantKeeps * 1_000_000))}</strong>
              </div>
              <div>
                <span>You receive</span>
                <strong>{formatUsdc(Math.round(review.refund * 1_000_000))}</strong>
              </div>
            </div>
            <div className="review-actions">
              <button className="secondary-button" type="button" onClick={() => setReview(null)}>
                Keep stream
              </button>
              <button className="cancel-button" type="button" onClick={() => void cancel(review.item)}>
                Confirm cancellation ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
