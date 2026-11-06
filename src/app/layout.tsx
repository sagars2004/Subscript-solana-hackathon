import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Subscript | Streaming subscriptions on Solana",
  description: "Pay by the second. Cancel any second.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
