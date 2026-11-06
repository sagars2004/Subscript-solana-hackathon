import Link from "next/link";

export default function MerchantPage() {
  return <main className="shell"><Link className="back-link" href="/">← Back to Subscript</Link><section className="workspace-card"><p className="eyebrow">Merchant workspace</p><h1>Your streaming plans will live here.</h1><p>The local plan store and API are ready. The next milestone adds the wallet-aware plan creator, shareable checkout URL, and QR code.</p><div className="coming-soon-row"><span className="status-dot" />Wallet connection queued for the next build step</div></section></main>;
}
