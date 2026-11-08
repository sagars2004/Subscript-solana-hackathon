import { createPlan, listPlans } from "../src/lib/db";

const DEMO_MERCHANT_WALLET = "Mya1111111111111111111111111111111111111111"; // Maya's demo wallet

const SAMPLE_PLANS = [
  {
    name: "Signal Notes by Maya (Demo Fast Accrual)",
    priceMicrousd: 10_000_000, // $10.00
    billingPeriodSeconds: 60, // 1 minute demo rate
    merchantWallet: DEMO_MERCHANT_WALLET,
    payoutAddress: DEMO_MERCHANT_WALLET,
  },
  {
    name: "Solana RPC Cloud Pro",
    priceMicrousd: 49_000_000, // $49.00
    billingPeriodSeconds: 2592000, // 1 month
    merchantWallet: DEMO_MERCHANT_WALLET,
    payoutAddress: DEMO_MERCHANT_WALLET,
  },
  {
    name: "DevStream Live Pass",
    priceMicrousd: 5_000_000, // $5.00
    billingPeriodSeconds: 86400, // 1 day
    merchantWallet: DEMO_MERCHANT_WALLET,
    payoutAddress: DEMO_MERCHANT_WALLET,
  },
];

async function main() {
  const existing = listPlans();
  console.log(`Current plans count: ${existing.length}`);

  for (const sample of SAMPLE_PLANS) {
    const alreadyExists = existing.some((p) => p.name === sample.name);
    if (!alreadyExists) {
      const created = createPlan(sample);
      console.log(`✓ Seeded plan: "${created.name}" (ID: ${created.id})`);
    } else {
      console.log(`- Plan already exists: "${sample.name}"`);
    }
  }

  console.log("\nSeeding complete! Checkout links are ready.");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

