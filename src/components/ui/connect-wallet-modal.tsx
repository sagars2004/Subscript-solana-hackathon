"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

function WalletGlyph({ name }: { name: string }) {
  return <span className={`wallet-glyph ${name.toLowerCase()}`}>{name.slice(0, 1)}</span>;
}

export function ConnectWalletButton() {
  const { connected, publicKey, wallets, select, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const address = publicKey?.toBase58() ?? "";

  async function chooseWallet(walletName: string) {
    setError("");
    setConnecting(true);

    try {
      const target = wallets.find(
        (available) => available.adapter.name.toLowerCase().includes(walletName.toLowerCase()),
      );

      if (!target) {
        setError(`${walletName} wallet not detected. Is the Chrome extension installed?`);
        setConnecting(false);
        return;
      }

      select(target.adapter.name);
      await target.adapter.connect();
      setOpen(false);
    } catch (connectError: any) {
      console.warn("Wallet connection error:", connectError);
      if (
        connectError?.name === "WalletConnectionError" ||
        connectError?.message?.includes("User rejected")
      ) {
        setError("Connection closed or rejected. Unlock Phantom from your Chrome toolbar and try again.");
      } else {
        setError(connectError?.message ?? "Wallet connection failed.");
      }
    } finally {
      setConnecting(false);
    }
  }

  if (connected) {
    return (
      <button className="connect-button" type="button" onClick={() => void disconnect()}>
        {`${address.slice(0, 4)}…${address.slice(-4)} · Disconnect`}
      </button>
    );
  }

  return (
    <>
      <button
        className="connect-button"
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Connect wallet
      </button>

      {open && (
        <div
          className="wallet-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Connect your wallet"
          onClick={() => setOpen(false)}
        >
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="wallet-close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>Connect your Wallet</h2>
            <p className="wallet-subtitle">Use a Solana wallet on Devnet to continue.</p>

            <div className="wallet-options">
              {["Phantom", "Solflare"].map((name) => (
                <button
                  className="wallet-option"
                  key={name}
                  type="button"
                  disabled={connecting}
                  onClick={() => void chooseWallet(name)}
                >
                  <span>
                    <WalletGlyph name={name} />
                    <strong>{name}</strong>
                  </span>
                  <span className="wallet-arrow">{connecting ? "…" : "→"}</span>
                </button>
              ))}

              <div className="wallet-option disabled">
                <span>
                  <span className="wallet-glyph other">•••</span>
                  <strong>Other wallets</strong>
                </span>
                <span className="wallet-soon">Coming soon</span>
              </div>
            </div>

            <p className="wallet-terms">
              Make sure your wallet extension is set to <strong>Solana Devnet</strong>.
            </p>

            {error && (
              <p className="form-error" role="alert" style={{ marginTop: "14px" }}>
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
