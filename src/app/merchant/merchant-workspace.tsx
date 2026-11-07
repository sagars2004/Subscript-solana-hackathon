"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ICluster, SolanaStreamClient } from "@streamflow/stream";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-modal";
import { QrModal } from "@/components/ui/qr-modal";
import { formatPeriod, formatUsdc, type Plan } from "@/lib/plans";
import type { MerchantSubscription } from "@/lib/db";

const PERIOD_OPTIONS = [
  { label: "1 minute (demo)", value: 60 },
  { label: "1 day", value: 86400 },
  { label: "1 month", value: 2592000 },
];

export function MerchantWorkspace() {
  const { connection } = useConnection();
  const { connected, publicKey, wallet } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";

  const [name, setName] = useState("");
  const [price, setPrice] = useState("10");
  const [period, setPeriod] = useState("2592000");
  const [payout, setPayout] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [createdPlan, setCreatedPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Active on-chain streams for real-time interpolation
  const [activeStreams, setActiveStreams] = useState<any[]>([]);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [subscribers, setSubscribers] = useState<MerchantSubscription[]>([]);

  // QR Modal state
  const [qrData, setQrData] = useState<{ url: string; title: string } | null>(null);

  const client = useMemo(
    () => new SolanaStreamClient({ connection, cluster: ICluster.Devnet, commitment: "confirmed" }),
    [connection],
  );

  // Fetch plans & subscribers from local DB
  const loadPlansAndSubs = useCallback(async () => {
    if (!walletAddress) {
      setPlans([]);
      setSubscribers([]);
      return;
    }
    setPayout((prev) => prev || walletAddress);
    try {
      const [plansRes, subsRes] = await Promise.all([
        fetch(`/api/plans?merchantWallet=${walletAddress}`),
        fetch(`/api/subscriptions?merchantWallet=${walletAddress}`),
      ]);
      const plansData = await plansRes.json();
      const subsData = await subsRes.json();
      setPlans(plansData.plans ?? []);
      setSubscribers(subsData.subscriptions ?? []);
    } catch {
      setError("Could not load your merchant data.");
    }
  }, [walletAddress]);

  useEffect(() => {
    void loadPlansAndSubs();
  }, [loadPlansAndSubs]);

  // Load active streams from Streamflow devnet periodically
  useEffect(() => {
    if (!walletAddress) {
      setActiveStreams([]);
      return;
    }

    const loadStreams = async () => {
      try {
        const streamEntries = await client.searchStreams({ recipient: walletAddress, closed: false });
        const loaded = await Promise.all(
          streamEntries.map(async (entry: any) => {
            try {
              return await client.getOne({ id: entry.publicKey.toBase58() });
            } catch {
              return null;
            }
          }),
        );
        setActiveStreams(loaded.filter(Boolean));
      } catch {
        // Devnet RPC rate limits handled gracefully
      }
    };

    void loadStreams();
    const interval = window.setInterval(() => void loadStreams(), 8000);
    return () => window.clearInterval(interval);
  }, [client, walletAddress]);

  // Smooth local timer for client-side accrual calculation (every 250ms)
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 250);
    return () => window.clearInterval(interval);
  }, []);

  // Compute live claimable accrued USDC across all active streams
  const claimable = useMemo(() => {
    return activeStreams.reduce((sum, s) => {
      try {
        const unlocked = s.unlocked(now);
        const diff = unlocked.sub(s.withdrawnAmount);
        if (diff.gtn(0)) {
          return sum + Number(diff.toString()) / 1_000_000;
        }
      } catch {
        // Fallback
      }
      return sum;
    }, 0);
  }, [activeStreams, now]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreatedPlan(null);

    if (!walletAddress) {
      setError("Connect a wallet before creating a plan.");
      return;
    }

    const dollars = Number(price);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setError("Enter a positive USDC price.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchantWallet: walletAddress,
          name,
          priceMicrousd: Math.round(dollars * 1_000_000),
          billingPeriodSeconds: Number(period),
          payoutAddress: payout || walletAddress,
        }),
      });

      const data = (await response.json()) as { plan?: Plan; error?: string };
      if (!response.ok || !data.plan) {
        throw new Error(data.error ?? "Could not create plan.");
      }

      setCreatedPlan(data.plan);
      setPlans((current) => [data.plan!, ...current]);
      setName("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create plan.");
    } finally {
      setBusy(false);
    }
  }

  const checkoutUrl = createdPlan ? `${typeof window !== "undefined" ? window.location.origin : ""}/checkout/${createdPlan.id}` : "";

  async function copyLink(urlToCopy: string) {
    if (!urlToCopy) return;
    await navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function claimRevenue() {
    if (!wallet || claimable <= 0) return;
    setClaiming(true);
    setError("");

    try {
      const streamEntries = await client.searchStreams({ recipient: walletAddress, closed: false });
      for (const entry of streamEntries as any[]) {
        const stream = await client.getOne({ id: entry.publicKey.toBase58() });
        const amount = stream.unlocked(Math.floor(Date.now() / 1000)).sub(stream.withdrawnAmount);
        if (amount.gtn(0)) {
          await client.withdraw({ id: entry.publicKey.toBase58(), amount }, { invoker: wallet.adapter as never });
        }
      }
      // Reload stream state
      setActiveStreams([]);
      const updated = await client.searchStreams({ recipient: walletAddress, closed: false });
      const loaded = await Promise.all(updated.map((e: any) => client.getOne({ id: e.publicKey.toBase58() })));
      setActiveStreams(loaded);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Claim failed.");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="merchant-layout">
      <div className="workspace-topbar">
        <div>
          <p className="eyebrow">Merchant workspace</p>
          <h1>Create a streaming plan.</h1>
          <p className="workspace-intro">
            Give subscribers a link. Streamflow handles settlement; your plan stays in your control.
          </p>
        </div>
        <ConnectWalletButton />
      </div>

      {!connected && (
        <div className="info-banner">
          <span className="status-dot" />
          Connect Phantom or Solflare on Devnet to manage your plans and claim accrued revenue.
        </div>
      )}

      <div className="revenue-card">
        <div>
          <p className="eyebrow">Accrued revenue · Live counter</p>
          <div className="stats-group">
            <strong>{formatUsdc(Math.round(claimable * 1_000_000))}</strong>
          </div>
          <span className="revenue-counter-sub">
            {claimable > 0 ? `${claimable.toFixed(6)} USDC accrued` : "0.000000 USDC"} · Across {activeStreams.length} active stream{activeStreams.length === 1 ? "" : "s"} ({subscribers.length} total subscriber{subscribers.length === 1 ? "" : "s"})
          </span>
        </div>
        <button
          className="claim-button"
          type="button"
          disabled={claiming || claimable === 0}
          onClick={() => void claimRevenue()}
        >
          {claiming ? "Claiming…" : "Claim accrued USDC"} ↗
        </button>
      </div>

      <div className="merchant-columns">
        <form className="form-card" onSubmit={submit}>
          <div className="card-heading">
            <span>01</span>
            <div>
              <h2>Plan details</h2>
              <p>What are you offering?</p>
            </div>
          </div>

          <label>
            Plan name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Signal Notes"
              required
              minLength={2}
              maxLength={80}
            />
          </label>

          <div className="form-row">
            <label>
              Price in USDC
              <div className="input-affix">
                <span>$</span>
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </label>

            <label>
              Billing period
              <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Payout address
            <input
              value={payout}
              onChange={(event) => setPayout(event.target.value)}
              placeholder="Defaults to connected wallet"
              required
            />
          </label>

          <div className="form-summary">
            <span>Subscriber pays</span>
            <strong>
              {formatUsdc(Math.round((Number(price) || 0) * 1_000_000))} / {formatPeriod(Number(period))}
            </strong>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button className="action-button" type="submit" disabled={busy || !connected}>
            {busy ? "Saving plan…" : "Create plan"}
            <span>→</span>
          </button>
          <p className="signature-note">No funds move when you create a plan. This only stores metadata locally.</p>
        </form>

        <aside className="plans-card">
          <div className="card-heading">
            <span>02</span>
            <div>
              <h2>Your plans</h2>
              <p>Share a link or QR code when you&apos;re ready.</p>
            </div>
          </div>

          {createdPlan && (
            <div className="checkout-result">
              <div>
                <p className="result-label">Checkout link ready</p>
                <strong>{createdPlan.name}</strong>
                <span>
                  {formatUsdc(createdPlan.priceMicrousd)} / {formatPeriod(createdPlan.billingPeriodSeconds)}
                </span>
              </div>
              <div className="link-row">
                <code>{checkoutUrl}</code>
                <button type="button" onClick={() => void copyLink(checkoutUrl)}>
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => setQrData({ url: checkoutUrl, title: createdPlan.name })}
                  title="Show QR Code"
                >
                  QR Code ⚲
                </button>
              </div>
            </div>
          )}

          {plans.length === 0 && !createdPlan ? (
            <div className="empty-state">
              <span className="empty-icon">+</span>
              <p>No plans yet</p>
              <span>Create your first plan to get a checkout link.</span>
            </div>
          ) : (
            <div className="plan-list">
              {plans
                .filter((p) => p.id !== createdPlan?.id)
                .map((p) => {
                  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/checkout/${p.id}`;
                  const planSubCount = subscribers.filter((s) => s.planId === p.id).length;
                  return (
                    <div className="plan-row" key={p.id}>
                      <div>
                        <strong>{p.name}</strong>
                        <span>
                          {formatUsdc(p.priceMicrousd)} / {formatPeriod(p.billingPeriodSeconds)} · {planSubCount} subscriber{planSubCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setQrData({ url, title: p.name })}
                          title="Show QR Code"
                        >
                          ⚲ QR
                        </button>
                        <a href={`/checkout/${p.id}`} target="_blank" rel="noreferrer">
                          Open ↗
                        </a>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </aside>
      </div>

      {/* Active Subscribers Table (PRD Requirement M2) */}
      <section className="subscribers-card">
        <div className="card-heading" style={{ marginBottom: "16px" }}>
          <span>03</span>
          <div>
            <h2>Active subscribers</h2>
            <p>Real-time list of streams paying into your payout address.</p>
          </div>
        </div>

        {subscribers.length === 0 ? (
          <div className="empty-state" style={{ minHeight: "140px" }}>
            <p>No subscribers yet</p>
            <span>Share a plan checkout link with your audience to begin receiving continuous streams.</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="subscriber-table">
              <thead>
                <tr>
                  <th>Subscriber Wallet</th>
                  <th>Plan</th>
                  <th>Rate</th>
                  <th>Subscribed</th>
                  <th>Stream</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub.streamId}>
                    <td>
                      <code>
                        {sub.subscriberWallet.slice(0, 4)}…{sub.subscriberWallet.slice(-4)}
                      </code>
                    </td>
                    <td>
                      <strong>{sub.planName}</strong>
                    </td>
                    <td>
                      {formatUsdc(sub.priceMicrousd)} / {formatPeriod(sub.billingPeriodSeconds)}
                    </td>
                    <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                    <td>
                      <a
                        href={`https://app.streamflow.finance/solana/devnet/stream/${sub.streamId}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--blue-dark)", fontWeight: 800 }}
                      >
                        Streamflow ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {qrData && (
        <QrModal
          isOpen={Boolean(qrData)}
          onClose={() => setQrData(null)}
          title={qrData.title}
          url={qrData.url}
        />
      )}
    </div>
  );
}
