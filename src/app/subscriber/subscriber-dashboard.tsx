"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ICluster, SolanaStreamClient } from "@streamflow/stream";
import { explorerTransactionUrl } from "@/lib/chain";
import { formatPeriod, formatUsdc, type Plan } from "@/lib/plans";

type LinkRecord = { streamId: string; planId: string };
type StreamView = { id: string; plan: Plan; stream: any };

function baseUnitsToUsdc(value: any) { return Number(value?.toString?.() ?? value) / 1_000_000; }

export function SubscriberDashboard() {
  const { connection } = useConnection();
  const { connected, publicKey, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [items, setItems] = useState<StreamView[]>([]); const [now, setNow] = useState(() => Math.floor(Date.now() / 1000)); const [busyId, setBusyId] = useState(""); const [error, setError] = useState(""); const [cancelled, setCancelled] = useState<{ signature: string; id: string } | null>(null);
  const walletAddress = publicKey?.toBase58() ?? "";
  const client = useMemo(() => new SolanaStreamClient({ connection, cluster: ICluster.Devnet, commitment: "confirmed" }), [connection]);

  const load = useCallback(async () => {
    if (!walletAddress) { setItems([]); return; }
    try {
      const [linksResponse, plansResponse] = await Promise.all([fetch(`/api/subscriptions?subscriberWallet=${walletAddress}`), fetch("/api/plans")]);
      const links = (await linksResponse.json()).subscriptions as LinkRecord[]; const plans = (await plansResponse.json()).plans as Plan[]; const plansById = new Map(plans.map((plan) => [plan.id, plan]));
      const next = await Promise.all(links.map(async (link) => { const plan = plansById.get(link.planId); if (!plan) return null; try { return { id: link.streamId, plan, stream: await client.getOne({ id: link.streamId }) }; } catch { return null; } }));
      setItems(next.filter((item): item is StreamView => Boolean(item)));
    } catch { setError("Could not load your subscriptions from Devnet."); }
  }, [client, walletAddress]);

  useEffect(() => { void load(); const interval = window.setInterval(() => void load(), 8000); return () => window.clearInterval(interval); }, [load]);
  useEffect(() => { const interval = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 250); return () => window.clearInterval(interval); }, []);

  async function cancel(item: StreamView) {
    if (!wallet || !publicKey) { setVisible(true); return; }
    setError(""); setBusyId(item.id);
    try { const result = await client.cancel({ id: item.id }, { invoker: wallet.adapter as never }); setCancelled({ signature: result.txId, id: item.id }); await load(); } catch (cancelError) { setError(cancelError instanceof Error ? cancelError.message : "Cancellation failed."); } finally { setBusyId(""); }
  }

  return <div className="merchant-layout"><div className="workspace-topbar"><div><p className="eyebrow">Subscriber workspace</p><h1>Your streams, in real time.</h1><p className="workspace-intro">Every card reads from Streamflow on Devnet. The counter below is interpolated locally between chain reads.</p></div><button className="connect-button" type="button" onClick={() => connected ? undefined : setVisible(true)}>{connected ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}` : "Connect wallet"}</button></div>{!connected && <div className="info-banner"><span className="status-dot" />Connect the wallet you used at checkout to see its active streams.</div>}{error && <p className="form-error" role="alert">{error}</p>}{cancelled && <div className="success-result"><p>Stream cancelled.</p><a href={explorerTransactionUrl(cancelled.signature)} target="_blank" rel="noreferrer">View cancellation transaction ↗</a></div>}<div className="subscription-list">{connected && items.length === 0 ? <div className="empty-state"><span className="empty-icon">◌</span><p>No subscriptions found</p><span>Create one from a merchant checkout link, then return here.</span></div> : items.map((item) => { const stream = item.stream; const deposited = baseUnitsToUsdc(stream.depositedAmount); const withdrawn = baseUnitsToUsdc(stream.withdrawnAmount); const unlocked = Math.min(deposited, baseUnitsToUsdc(stream.unlocked(now))); const spent = Math.max(withdrawn, unlocked); const remaining = Math.max(0, deposited - spent); const secondsLeft = Math.max(0, stream.end - now); const percent = deposited ? Math.min(100, (spent / deposited) * 100) : 0; const isClosed = Boolean(stream.closed); return <article className="subscription-card" key={item.id}><div className="subscription-header"><div><p className="result-label">{isClosed ? "Settled stream" : "Active stream"}</p><h2>{item.plan.name}</h2><span>{formatUsdc(item.plan.priceMicrousd)} / {formatPeriod(item.plan.billingPeriodSeconds)}</span></div><span className={`stream-status ${isClosed ? "settled" : "streaming"}`}>{isClosed ? "Settled" : "Streaming"}</span></div><div className="counter-block"><span>Streamed so far</span><strong>{formatUsdc(Math.round(spent * 1_000_000))}</strong><div className="progress-track"><span style={{ width: `${percent}%` }} /></div></div><div className="subscription-metrics"><div><span>Remaining</span><strong>{formatUsdc(Math.round(remaining * 1_000_000))}</strong></div><div><span>Time left</span><strong>{isClosed ? "—" : secondsLeft < 60 ? `${secondsLeft}s` : `${Math.ceil(secondsLeft / 86400)}d`}</strong></div></div>{!isClosed && <button className="cancel-button" type="button" disabled={busyId === item.id} onClick={() => void cancel(item)}>{busyId === item.id ? "Waiting for wallet…" : `Cancel · return ${formatUsdc(Math.round(remaining * 1_000_000))}`}<span>↗</span></button>}<a className="stream-id" href={`https://app.streamflow.finance/solana/devnet/stream/${item.id}`} target="_blank" rel="noreferrer">View stream details ↗</a></article>; })}</div></div>;
}
