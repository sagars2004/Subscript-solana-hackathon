import Link from "next/link";

export function NavHeader({
  activeRoute,
}: {
  activeRoute?: "home" | "subscriber" | "merchant" | "checkout";
}) {
  return (
    <header className="nav" aria-label="Primary navigation" style={{ padding: "8px 0 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <Link className="brand" href="/">
          <span className="brand-mark">S</span>
          <span>Subscript</span>
        </Link>

        <nav style={{ display: "flex", gap: "16px", fontSize: "0.82rem", fontWeight: 700 }}>
          <Link
            href="/subscriber"
            style={{
              color: activeRoute === "subscriber" ? "var(--blue-dark)" : "#667085",
              borderBottom: activeRoute === "subscriber" ? "2px solid var(--blue)" : "2px solid transparent",
              paddingBottom: "3px",
              transition: "all 0.15s ease",
            }}
          >
            Subscriber
          </Link>
          <Link
            href="/merchant"
            style={{
              color: activeRoute === "merchant" ? "var(--blue-dark)" : "#667085",
              borderBottom: activeRoute === "merchant" ? "2px solid var(--blue)" : "2px solid transparent",
              paddingBottom: "3px",
              transition: "all 0.15s ease",
            }}
          >
            Merchant
          </Link>
        </nav>
      </div>

      <span className="network-badge">
        <span className="network-pulse" />
        Solana Devnet
      </span>
    </header>
  );
}

