import Link from "next/link";
import { NavHeader } from "@/components/ui/nav-header";
import { TipsCarousel } from "@/components/ui/tips-carousel";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="landing-shell">
      <NavHeader activeRoute="home" />

      <section className="landing-hero">
        <div className="landing-copy">
          <div className="landing-badge">
            <span className="network-pulse" />
            <span>Subscriptions, unbundled · Solana Devnet</span>
          </div>

          <h1 className="hero-title">
            Pay by the second.
            <br />
            <span className="hero-highlight">Cancel any second.</span>
          </h1>

          <p className="hero-copy">
            Subscript replaces card subscriptions with continuous USDC streams. Watch money move second by second, and stop at any moment—your unstreamed balance returns instantly in the same transaction.
          </p>

          <div className="hero-pills-row">
            <div className="hero-pill">
              <strong>Instant Refund</strong>
              <span>Unused balance returned</span>
            </div>
            <div className="hero-pill">
              <strong>Zero Custody</strong>
              <span>Streamflow audited escrow</span>
            </div>
            <div className="hero-pill">
              <strong>6.85% APY</strong>
              <span>DeFi yield on idle funds</span>
            </div>
          </div>

          <TipsCarousel />
        </div>

        <div className="landing-actions">
          <Link className="action-card" href="/subscriber">
            <div className="action-card-header">
              <div className="action-icon">↗</div>
              <span className="action-badge">For Subscribers</span>
            </div>
            <h3>I&apos;m a subscriber</h3>
            <p>
              Connect your wallet to monitor active streams, watch balances accrue in real time, and cancel anytime for an instant refund.
            </p>
            <div className="action-card-footer">
              <span>Open subscriber workspace</span>
              <span className="arrow">→</span>
            </div>
          </Link>

          <Link className="action-card" href="/merchant">
            <div className="action-card-header">
              <div className="action-icon merchant">+</div>
              <span className="action-badge">For Merchants</span>
            </div>
            <h3>I&apos;m a merchant</h3>
            <p>
              Create continuous streaming plans, share instant checkout links & QR codes, and claim accrued revenue whenever you choose.
            </p>
            <div className="action-card-footer">
              <span>Open merchant workspace</span>
              <span className="arrow">→</span>
            </div>
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div>
          <strong>Subscript</strong> · Solana Hackathon 2026 DeFi Track
        </div>
        <div className="footer-links">
          <span>Streamflow Protocol</span>
          <span>•</span>
          <span>Zero Custody</span>
          <span>•</span>
          <span>Devnet Tested</span>
        </div>
      </footer>
    </main>
  );
}
