"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

function WalletGlyph({ name }: { name: string }) { return <span className={`wallet-glyph ${name.toLowerCase()}`}>{name.slice(0, 1)}</span>; }

export function ConnectWalletButton() {
  const { connected, publicKey, wallet, wallets, select, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false); const [error, setError] = useState(""); const [pendingWallet, setPendingWallet] = useState<string | null>(null); const address = publicKey?.toBase58() ?? "";
  useEffect(() => { if (!pendingWallet || wallet?.adapter.name !== pendingWallet) return; setPendingWallet(null); void connect().catch((connectError) => setError(connectError instanceof Error ? connectError.message : "Wallet connection failed.")); }, [connect, pendingWallet, wallet]);
  function chooseWallet(walletName: string) { setError(""); const target = wallets.find((available) => available.adapter.name === walletName); if (!target) { setError(`${walletName} is not installed or available.`); return; } select(target.adapter.name); setPendingWallet(target.adapter.name); setOpen(false); }
  if (connected) return <button className="connect-button" type="button" onClick={() => void disconnect()}>{`${address.slice(0, 4)}…${address.slice(-4)} · Disconnect`}</button>;
  return <><button className="connect-button" type="button" onClick={() => { setError(""); setOpen(true); }}>Connect wallet</button>{open && <div className="wallet-overlay" role="dialog" aria-modal="true" aria-label="Connect your wallet"><div className="wallet-modal"><button className="wallet-close" type="button" onClick={() => setOpen(false)} aria-label="Close">×</button><h2>Connect your Wallet</h2><p className="wallet-subtitle">Use a Solana wallet on Devnet to continue.</p><div className="wallet-options">{["Phantom", "Solflare"].map((name) => <button className="wallet-option" key={name} type="button" onClick={() => void chooseWallet(name)}><span><WalletGlyph name={name} /><strong>{name}</strong></span><span className="wallet-arrow">→</span></button>)}<div className="wallet-option disabled"><span><span className="wallet-glyph other">•••</span><strong>Other wallets</strong></span><span className="wallet-soon">Coming soon</span></div></div><p className="wallet-terms">By connecting your wallet, you agree to use Solana Devnet test assets only.</p>{error && <p className="form-error" role="alert">{error}</p>}</div></div>}</>;
}
