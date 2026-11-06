"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ICluster, SolanaStreamClient, getBN } from "@streamflow/stream";
import { DEVNET_USDC_MINT, USDC_DECIMALS, explorerTransactionUrl } from "@/lib/chain";
import { formatPeriod, type Plan } from "@/lib/plans";

export function CheckoutClient({ plan }: { plan: Plan }) {
  const { connection } = useConnection();
  const { connected, publicKey, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [result, setResult] = useState<{ signature: string; streamId: string } | null>(null);

  async function subscribe() {
    setError(""); setResult(null);
    if (!connected || !publicKey || !wallet) { setVisible(true); return; }
    setBusy(true);
    try {
      const client = new SolanaStreamClient({ connection, cluster: ICluster.Devnet, commitment: "confirmed" });
      const start = Math.floor(Date.now() / 1000) + 10;
      const total = getBN(plan.priceMicrousd / 1_000_000, USDC_DECIMALS);
      const rate = total.divn(plan.billingPeriodSeconds);
      if (rate.lten(0)) throw new Error("Plan price is too small for its billing period in USDC base units.");
      const created = await client.create({ recipient: plan.payoutAddress, tokenId: DEVNET_USDC_MINT, amount: total, start, cliff: start, period: 1, cliffAmount: getBN(0, USDC_DECIMALS), amountPerPeriod: rate, name: `Subscript plan ${plan.id}`, canTopup: true, canUpdateRate: false, cancelableBySender: true, cancelableByRecipient: false, transferableBySender: false, transferableByRecipient: false, automaticWithdrawal: false, withdrawalFrequency: 0 }, { sender: wallet.adapter as never, isNative: false });
      const response = await fetch("/api/subscriptions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ streamId: created.metadataId, planId: plan.id, subscriberWallet: publicKey.toBase58() }) });
      if (!response.ok) throw new Error("Stream was created, but the local subscription record could not be saved.");
      setResult({ signature: created.txId, streamId: created.metadataId });
    } catch (subscribeError) { setError(subscribeError instanceof Error ? subscribeError.message : "Subscription failed."); } finally { setBusy(false); }
  }

  return <><button className="action-button" onClick={subscribe} disabled={busy}>{busy ? "Waiting for wallet…" : connected ? "Start USDC stream" : "Connect wallet to subscribe"}<span>→</span></button>{!connected && <p className="signature-note">Use Phantom or Solflare on Solana Devnet. You need Devnet SOL for fees and Devnet USDC for the stream deposit.</p>}{error && <p className="form-error" role="alert">{error}</p>}{result && <div className="success-result"><p>Stream started successfully.</p><span>Stream ID: {result.streamId}</span><a href={explorerTransactionUrl(result.signature)} target="_blank" rel="noreferrer">View transaction on Explorer ↗</a></div>}</>;
}
