"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ICluster, SolanaStreamClient, getBN } from "@streamflow/stream";
import { DEVNET_USDC_MINT, USDC_DECIMALS, explorerTransactionUrl } from "@/lib/chain";
import { formatPeriod, formatUsdc, type Plan } from "@/lib/plans";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-modal";
import { QrModal } from "@/components/ui/qr-modal";

const FUND_PERIOD_OPTIONS = [
  { count: 1, label: "1 period" },
  { count: 3, label: "3 periods" },
  { count: 6, label: "6 periods" },
];

export function CheckoutClient({ plan }: { plan: Plan }) {
  const { connection } = useConnection();
  const { connected, publicKey, wallet } = useWallet();
  const [periods, setPeriods] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ signature: string; streamId: string } | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  const totalMicrousd = plan.priceMicrousd * periods;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  async function subscribe() {
    setError("");
    setResult(null);
    if (!connected || !publicKey || !wallet) return;
    setBusy(true);

    try {
      const client = new SolanaStreamClient({ connection, cluster: ICluster.Devnet, commitment: "confirmed" });
      const start = Math.floor(Date.now() / 1000) + 10;
      const total = getBN(totalMicrousd / 1_000_000, USDC_DECIMALS);
      const rate = getBN(plan.priceMicrousd / 1_000_000, USDC_DECIMALS).divn(plan.billingPeriodSeconds);

      if (rate.lten(0)) {
        throw new Error("Plan price is too small for its billing period in USDC base units.");
      }

      const created = await client.create(
        {
          recipient: plan.payoutAddress,
          tokenId: DEVNET_USDC_MINT,
          amount: total,
          start,
          cliff: start,
          period: 1,
          cliffAmount: getBN(0, USDC_DECIMALS),
          amountPerPeriod: rate,
          name: `Subscript plan ${plan.id}`,
          canTopup: true,
          canUpdateRate: false,
          cancelableBySender: true,
          cancelableByRecipient: false,
          transferableBySender: false,
          transferableByRecipient: false,
          automaticWithdrawal: false,
          withdrawalFrequency: 0,
        },
        { sender: wallet.adapter as never, isNative: false },
      );

      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          streamId: created.metadataId,
          planId: plan.id,
          subscriberWallet: publicKey.toBase58(),
        }),
      });

      if (!response.ok) {
        throw new Error("Stream was created, but the local subscription record could not be saved.");
      }

      setResult({ signature: created.txId, streamId: created.metadataId });
    } catch (subscribeError) {
      setError(subscribeError instanceof Error ? subscribeError.message : "Subscription failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={{ marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#556176" }}>Fund upfront</span>
          <button
            type="button"
            className="icon-button"
            onClick={() => setQrOpen(true)}
            title="Scan QR code with mobile wallet"
          >
            <span>⚲</span> QR Code
          </button>
        </div>

        <div className="period-selector-row">
          {FUND_PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.count}
              type="button"
              className={`period-pill ${periods === opt.count ? "active" : ""}`}
              onClick={() => setPeriods(opt.count)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="explainer-box">
        <p>Transaction Explainer</p>
        <ul>
          <li>
            Initial deposit: <strong>{formatUsdc(totalMicrousd)}</strong> ({periods} × {formatPeriod(plan.billingPeriodSeconds)})
          </li>
          <li>
            Accrual rate: <strong>{formatUsdc(plan.priceMicrousd)}</strong> per {formatPeriod(plan.billingPeriodSeconds)}
          </li>
          <li>
            Cancellation guarantee: <strong>Cancel at any second</strong> to receive 100% of remaining unstreamed USDC instantly.
          </li>
        </ul>
      </div>

      {connected ? (
        <button className="action-button" onClick={subscribe} disabled={busy}>
          {busy ? "Waiting for wallet…" : `Start USDC stream · ${formatUsdc(totalMicrousd)}`}
          <span>→</span>
        </button>
      ) : (
        <ConnectWalletButton />
      )}

      {!connected && (
        <p className="signature-note">
          Use Phantom or Solflare on Solana Devnet. You need Devnet SOL for fees and {formatUsdc(totalMicrousd)} Devnet USDC for the stream deposit.
        </p>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="success-result">
          <p>Stream started successfully!</p>
          <span>Stream ID: {result.streamId}</span>
          <a href={explorerTransactionUrl(result.signature)} target="_blank" rel="noreferrer">
            View transaction on Explorer ↗
          </a>
          <a href="/subscriber" style={{ display: "inline-block", marginTop: "8px", fontWeight: 800 }}>
            Go to Subscriber Dashboard →
          </a>
        </div>
      )}

      <QrModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        title={plan.name}
        url={currentUrl}
      />
    </>
  );
}
