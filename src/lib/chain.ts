export const DEVNET_USDC_MINT = process.env.NEXT_PUBLIC_DEVNET_USDC_MINT ?? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const USDC_DECIMALS = 6;
export function explorerTransactionUrl(signature: string) { return `https://explorer.solana.com/tx/${signature}?cluster=devnet`; }
