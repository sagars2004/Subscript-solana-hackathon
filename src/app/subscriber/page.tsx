import Link from "next/link";

export default function SubscriberPage() {
  return <main className="shell"><Link className="back-link" href="/">← Back to Subscript</Link><section className="workspace-card"><p className="eyebrow">Subscriber workspace</p><h1>Only pay for the seconds you use.</h1><p>Checkout, live stream balances, and instant cancellation are the next product milestones. All payment actions will remain on devnet and require a connected wallet signature.</p><div className="coming-soon-row"><span className="status-dot" />Streamflow proof awaiting manually funded devnet test</div></section></main>;
}
