export const MIN_BILLING_PERIOD_SECONDS = 60;

export type Plan = {
  id: string;
  merchantWallet: string;
  name: string;
  priceMicrousd: number;
  billingPeriodSeconds: number;
  payoutAddress: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePlanInput = {
  merchantWallet: string;
  name: string;
  priceMicrousd: number;
  billingPeriodSeconds: number;
  payoutAddress: string;
};

export function formatUsdc(microusd: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(microusd / 1_000_000);
}

export function formatPeriod(seconds: number) {
  if (seconds % 2_592_000 === 0) return `${seconds / 2_592_000} month`;
  if (seconds % 86_400 === 0) return `${seconds / 86_400} day`;
  if (seconds % 3_600 === 0) return `${seconds / 3_600} hour`;
  return `${seconds} seconds`;
}
