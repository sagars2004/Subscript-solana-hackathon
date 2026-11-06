import Link from "next/link";

const benefits = [["00.01s", "counter updates locally", "Live accrual"], ["1 click", "to end the stream", "Instant cancellation"], ["Devnet", "wallet-signed only", "No custody"]];

export default function Home() {
  return <main className="landing-shell">
    <nav className="nav" aria-label="Primary navigation"><Link className="brand" href="/"><span className="brand-mark">S</span><span>Subscript</span></Link><span className="network-badge"><span className="network-pulse" />Solana Devnet</span></nav>
    <section className="hero"><p className="eyebrow">Subscriptions, unbundled</p><h1>Pay by the second.<br />Cancel any second.</h1><p className="hero-copy">Subscript turns a subscription into a live USDC stream. Watch the balance move, then stop it whenever you want—the unused amount returns instantly.</p><div className="entry-points"><Link className="entry-card primary-entry" href="/subscriber"><span className="entry-icon">↗</span><span><strong>I&apos;m a subscriber</strong><small>Pay only for time used</small></span></Link><Link className="entry-card" href="/merchant"><span className="entry-icon">+</span><span><strong>I&apos;m a merchant</strong><small>Create a streaming plan</small></span></Link></div></section>
    <section className="signal-grid" aria-label="Subscript product principles">{benefits.map(([value, note, label]) => <article className="signal-card" key={label}><p>{label}</p><strong>{value}</strong><span>{note}</span></article>)}</section>
    <p className="foundation-note">Foundation build · Wallet and transaction testing continue on devnet</p>
  </main>;
}
