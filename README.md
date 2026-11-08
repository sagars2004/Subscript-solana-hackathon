# Subscript: Streaming USDC Subscriptions on Solana

> **Pay by the second. Cancel any second. Get your unused balance back instantly.**

Subscript is a decentralized subscription infrastructure built on Solana Devnet for the **Solana Hackathon 2026 (DeFi Track)**.

Traditional card subscriptions charge in full upfront, lock users into rigid 30-day billing cycles, and forfeit unspent days upon cancellation. Subscript replaces recurring monthly charges with continuous **Streamflow USDC streams**. Subscribers watch their balance stream in real time, top up when needed, and cancel at any second to retrieve 100% of their unstreamed funds in the same transaction.

---

## Overview and Use Case

Subscriptions are frustrating for both sides of the transaction. Subscribers pay the full billing period upfront, can lose the value of unused time when they cancel, and often wait for slow or uncertain refunds. Merchants pay card processing fees on every renewal and lose customers to failed or expired cards.

Subscript replaces the fixed recurring charge with a continuous, non-custodial USDC stream. A subscriber funds a stream through a merchant's checkout link, pays only as time passes, and can cancel at any second. The accrued amount goes to the merchant and the unused balance returns to the subscriber in the same on-chain transaction.

The product serves two users:

- **Subscribers** connect Phantom or another Solana wallet, fund a plan, watch spending accrue in real time, top up when needed, and cancel for an instant refund of the unstreamed balance.
- **Merchants** connect Solflare or another Solana wallet, create a plan, share a checkout link or QR code, monitor subscribers and accrued revenue, and claim earned funds whenever they choose.

The project is designed for Solana Devnet demonstrations. It uses real wallet signatures and real Streamflow transactions, while plan metadata is stored locally by the app and the yield display is a clearly labeled projection.

## Key Highlights

- **Second-by-Second Accrual**: Both merchant and subscriber dashboards feature client-side linear accrual interpolation ticking continuously every 250ms.
- **Instant Refund on Cancel**: The subscriber can cancel at any second with 1 click; the merchant keeps accrued revenue, and the remaining unspent USDC returns to the subscriber's wallet in the exact same transaction.
- **DeFi Composability & Idle-Funds Yield Layer**: The subscriber dashboard displays a clearly labeled projected return for idle capital using a prevailing Solana lending-market rate. It is not a live deposit into Kamino, Save, or another lending vault in the current build.
- **Non-Custodial Architecture**: Subscript holds no user private keys or token escrows. All stream deposits, withdrawals, and cancellations occur directly through the audited **Streamflow Protocol** on Solana Devnet.
- **Instant Sharing & Mobile QR Codes**: Merchants get a shareable checkout URL and an on-demand QR code that mobile wallet cameras (Phantom/Solflare) can scan directly.

---

## Real vs. Simulated Matrix

To maintain full transparency with hackathon judges, here is the exact scope breakdown:

| Area | Status in Build | Implementation Notes |
| :--- | :--- | :--- |
| **Stream Create, Withdraw, Cancel, Top-up** | **100% Real** | Direct Streamflow JS SDK (`@streamflow/stream`) transactions signed in the user's wallet on Solana Devnet. |
| **Wallet Connection & Transaction Signing** | **100% Real** | Solana Wallet Adapter with custom Phantom & Solflare modal; real signatures verified on Solana Explorer. |
| **Accrual Calculations** | **100% Real** | Interpolated client-side from verified on-chain start time, end time, and deposit parameters (no spamming transactions per second). |
| **Plan & Merchant Metadata** | **Local DB** | Stored in lightweight SQLite (`node:sqlite`), mapping Stream IDs to Plan metadata. |
| **Idle-Funds Yield Layer** | **Projected** | Clear "Projected · Not Earned" interface showing a calculation at a prevailing market rate (~6.85% APY); no funds are deposited into a lending vault. |
| **Mock Merchants** | **Pre-seeded** | Realistic demo plans (e.g. Maya's *Signal Notes* newsletter, *Solana RPC Cloud*, *DevStream*) pre-seeded for instantaneous demo flow. |

---

## Two-Window Demo and Testing Instructions

The fastest end-to-end test uses two browser windows. Window 1 represents the merchant and uses a Solflare wallet. Window 2 represents the subscriber and uses a Phantom wallet. You can also use two different browser profiles or two different users if the wallet extensions cannot be isolated in one browser.

Before starting, switch both wallets to **Solana Devnet**, fund them with Devnet SOL for transaction fees, and make sure the subscriber wallet has Devnet USDC. Use the one-minute demo plan so the accrual is visible during the presentation.

1. **Merchant wallet and plan:** In the merchant window, open `/merchant`, connect Solflare, and confirm the Devnet badge is visible.
2. **Plan details:** Enter the plan name, price in USDC, billing period, and payout address. For the demo, use a one-minute billing period and a small amount.
3. **Create and share:** Click **Create Plan**, then copy the generated checkout URL. Open the **QR Code** modal to show the second sharing option.
4. **Subscriber checkout:** In the subscriber window, paste the checkout URL into the browser. Review the plan, upfront amount, accrual rate, and cancellation guarantee.
5. **Fund the stream:** Connect Phantom, choose how many periods to fund, and approve the **Start USDC stream** transaction. Confirm that a transaction link appears after signing.
6. **Verify the subscriber view:** Open `/subscriber` with the subscriber wallet connected. Show the live streamed amount, remaining balance, time left, progress bar, and any low-balance state.
7. **Verify the merchant view:** Return to `/merchant` with Solflare connected. Show the active subscriber and the merchant's claimable revenue increasing as the subscriber's balance decreases.
8. **Cancel and preview:** On the subscriber dashboard, click **Review cancellation**. Show the exact split between the amount the merchant keeps and the unused USDC returned to the subscriber.
9. **Settle and claim:** Confirm cancellation in Phantom. Then use the merchant dashboard's **Accrue Funds** or claim action to deposit the accrued USDC into the merchant wallet.
10. **Verify on-chain:** Open the Solana Explorer link for the create, cancel, or claim transaction. Explain that Streamflow executes the money movement directly and Subscript never holds private keys or USDC.

For a shorter pitch, focus on steps 1-3, 5-8, and 10. The yield card may be shown as an optional DeFi extension, but describe it as projected and not earned in the current build.

### Demo Script

“I built Subscript to make subscriptions simpler and fairer: subscribers pay only for what they use and receive their remaining balance back when they cancel, while merchants get predictable, low-fee payments without losing customers to expired cards. Every transaction is signed by the user's wallet on Solana Devnet and can be verified on Explorer.”

---

## Local Setup & Running

### Prerequisites
- Node.js 22.x
- Solana wallet (Phantom or Solflare) configured to **Solana Devnet**

### Installation
```bash
git clone https://github.com/your-username/Subscript-solana-hackathon.git
cd Subscript-solana-hackathon
npm install
```

### Devnet Wallet Funding
1. Obtain Devnet SOL for gas:
   ```bash
   solana airdrop 2 <YOUR_WALLET_ADDRESS> --url devnet
   ```
   Or visit the [Solana Devnet Faucet](https://faucet.solana.com).
2. Obtain Devnet USDC:
   - Subscript uses the standard Devnet USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (configurable via `NEXT_PUBLIC_DEVNET_USDC_MINT`).
   - You can swap Devnet SOL for Devnet USDC on Jupiter Devnet, or use the SPL token faucet.

### Seed Demo Plans (Optional)
To pre-populate sample plans for testing without manual creation:
```bash
npm run db:seed
```

### Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Hosted Demo

You can either clone the repository and run the app locally, or navigate to the hosted demo deployment provided with the project. The hosted demo uses the same Solana Devnet flow, so both wallets must be set to Devnet and funded with Devnet SOL and USDC before testing. Do not use a wallet containing real mainnet funds for this demonstration.

The current build stores plan metadata in a local SQLite database. This is sufficient for local development and a hackathon demo; a production Vercel deployment should replace it with a managed database if plan data must persist across serverless instances.

## Live On-Chain Test for Judges

Judges can test the complete flow with real Solana Devnet transactions. No mainnet funds are required. Use two browser windows, two browser profiles, or two separate users so the merchant and subscriber wallets stay separate:

- **Merchant:** Solflare wallet, used to create the plan and receive accrued USDC.
- **Subscriber:** Phantom wallet, used to fund, monitor, and cancel the stream.

### Before You Start

1. Install Phantom and Solflare, or use two wallets that support Solana Wallet Adapter.
2. Switch both wallets to **Solana Devnet**.
3. Fund both wallets with a small amount of Devnet SOL for transaction fees.
4. Fund the subscriber wallet with Devnet USDC. Subscript uses the Devnet USDC mint shown in the funding instructions above.
5. Open the hosted demo, or clone the repository and start the local app with `npm install` followed by `npm run dev`.
6. If testing locally without pre-seeded plans, run `npm run db:seed` in a second terminal before opening the app.

### Run the End-to-End Test

1. **Open the merchant workspace.** In the merchant window, go to `/merchant`, connect Solflare, and confirm that the wallet is on Devnet.
2. **Create a fast demo plan.** Enter a plan name, a small USDC price, a one-minute billing period, and the Solflare payout address. Click **Create Plan** and approve any wallet prompt if requested.
3. **Copy the checkout link.** Copy the generated plan URL. Optionally open the QR code modal to verify that the same checkout link can be shared by scanning it from a mobile wallet.
4. **Open checkout as the subscriber.** In the subscriber window, paste the plan URL. Confirm that the plan name, price, billing period, payout address, and cancellation terms are visible.
5. **Start the stream.** Connect Phantom, select how many periods to fund, and review the transaction explainer. Click **Start USDC stream** and approve the transaction in Phantom.
6. **Verify the create transaction.** Use the Solana Explorer link shown by the app. Confirm that the transaction is on Devnet and that a Streamflow stream was created for the subscriber and merchant wallets.
7. **Watch subscriber accrual.** Open `/subscriber` with Phantom connected. The streamed amount should increase continuously, while the remaining balance and time left decrease. The counter is interpolated locally between chain reads; it does not send a transaction every second.
8. **Watch merchant revenue.** Return to `/merchant` with Solflare connected. The active subscriber should appear in the subscriber list, and the claimable revenue should increase as the subscriber stream accrues.
9. **Preview cancellation.** In the subscriber window, click **Review cancellation**. Verify that the preview shows the exact amount the merchant keeps and the unused USDC that will return to the subscriber.
10. **Cancel the stream.** Click **Confirm cancellation** and approve the transaction in Phantom. The stream should settle in one transaction: accrued USDC goes to the merchant and the unused balance returns to the subscriber.
11. **Verify the refund.** Open the cancellation transaction in Solana Explorer and compare the settlement with the preview. The subscriber dashboard should show the stream as settled rather than continuing to accrue.
12. **Claim merchant revenue.** In the merchant window, use **Accrue Funds** or the available claim action to deposit accrued USDC into the merchant wallet. Approve the transaction in Solflare and open its Explorer link.
13. **Check the optional yield display.** If the subscriber has an active stream, the dashboard may show the yield card. It is labeled **Projected · Not Earned** and is a calculation only; the current build does not deposit funds into a live lending vault.

Every money-moving action should require an explicit wallet signature. Subscript does not receive private keys or custody USDC; Streamflow executes the stream, accrual settlement, cancellation, and withdrawal transactions on Solana Devnet.

## Feature Set

- Merchant plan creation with name, price, billing period, and payout address.
- Shareable checkout URL and QR code for every plan.
- Wallet connection through Phantom, Solflare, and Solana Wallet Adapter.
- Real Streamflow create, top-up, cancel, and accrued-funds transactions on Devnet.
- Subscriber dashboard with live streamed amount, remaining balance, time left, progress, top-up, and cancellation controls.
- Merchant dashboard with active subscribers, live accrued revenue, plan management, and claimable-funds action.
- Cancellation preview showing the merchant's accrued amount and the subscriber's expected refund before signing.
- Solana Explorer links for transaction verification.
- Projected idle-funds yield display labeled **Projected · Not Earned**.

## Technology Stack

### Application and Frontend

- **Framework:** Next.js 16 App Router with React 19.
- **Language:** TypeScript 7 with React and Node type definitions.
- **Styling:** Custom CSS and Tailwind CSS 4/PostCSS tooling.
- **Client state and effects:** React client components, hooks, browser timers, and client-side interpolation for the live accrual counters.
- **QR codes:** `qrcode` client-side generation for merchant checkout links.

### Solana and Wallet APIs

- **Network:** Solana Devnet.
- **Chain client:** `@solana/web3.js` 1.98 for connections, public keys, transactions, cluster configuration, and Devnet RPC calls.
- **Token APIs:** `@solana/spl-token` for SPL token accounts, test minting, balances, and Devnet USDC interactions in the protocol proof script.
- **Wallet integration:** Solana Wallet Adapter React, Wallet Adapter UI, Phantom adapter, and Solflare adapter.
- **Wallet actions:** Browser wallets handle connection and transaction signing; private keys never enter the application.
- **Transaction verification:** Solana Explorer links using Devnet transaction signatures.
- **Token:** Devnet USDC with six decimal places, using the configurable `NEXT_PUBLIC_DEVNET_USDC_MINT` value.

### Streaming and DeFi Protocols

- **Streaming protocol:** `@streamflow/stream` 13.4 and the Streamflow escrow program.
- **Stream operations:** Create streams, top up streams, read stream state, withdraw accrued funds, and cancel streams with an unused-balance refund.
- **Yield interface:** A local `YieldSource` abstraction with a projected Solana lending-market rate. The current build does not deposit funds into Kamino, Save, or another live lending vault.

### Backend, APIs, and Storage

- **Server framework:** Next.js Route Handlers.
- **Application APIs:** `/api/health`, `/api/plans`, and `/api/subscriptions` for health checks, plan metadata, and the local subscription-to-stream mapping.
- **Database:** SQLite through Node's built-in `node:sqlite` `DatabaseSync` API.
- **Stored data:** Plan metadata and the mapping between plan IDs, Streamflow stream IDs, and wallet addresses. The database does not custody USDC or private keys.
- **Local persistence:** The development database is stored under `.data/subscript.sqlite`.

### Runtime, Tooling, and Deployment

- **Runtime:** Node.js 22.x and npm.
- **Build and server:** Next.js development server, production build, and `next start`.
- **Scripts:** `tsx` for the seed-plan and Streamflow protocol-proof scripts.
- **Quality tooling:** TypeScript compiler and ESLint with `eslint-config-next`.
- **Hosting:** Vercel-compatible Next.js deployment for the hosted Devnet demo.
- **Source control and configuration:** Git and environment configuration through `NEXT_PUBLIC_DEVNET_USDC_MINT`.

---

## Technical Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Next.js 16 (App Router)              │
│  /           /merchant        /subscriber    /checkout │
└───────────┬───────────────┬───────────────────┬────────┘
            │               │                   │
            ▼               ▼                   ▼
┌───────────────────────┐ ┌──────────────────────────────┐
│     SQLite DB         │ │    Solana Wallet Adapter     │
│  - Plans              │ │  - Phantom & Solflare        │
│  - Subscriptions Map  │ │  - Devnet Signing            │
└───────────────────────┘ └──────────────┬───────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────┐
                          │   Streamflow JS SDK v13.4    │
                          │   - createStream             │
                          │   - withdrawAccrued          │
                          │   - cancelStream (Refund)    │
                          │   - topUpStream              │
                          └──────────────┬───────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────┐
                          │    Solana Devnet On-Chain    │
                          │  - Streamflow Escrow Program │
                          │  - Devnet USDC Mint          │
                          └──────────────────────────────┘
```

---

## Hackathon Judging Alignment

| Evaluation Criteria | How Subscript Delivers |
| :--- | :--- |
| **Solana Native Advantage** | Takes advantage of Solana's sub-second finality and negligible fees to make continuous micro-refunds viable where credit card rails fail. |
| **DeFi Track Composability** | Integrates Streamflow streaming contracts with a DeFi Yield Reserve interface demonstrating capital efficiency for idle subscription escrows. |
| **Real Product Execution** | Real Devnet transactions with verifiable signatures on Solana Explorer, responsive clean UI, QR code scanning, and live dual-side accrual counters. |
| **Honesty About Scope** | Clear distinctions between on-chain execution and simulated/projected elements. |
