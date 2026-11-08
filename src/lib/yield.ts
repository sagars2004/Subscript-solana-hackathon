/**
 * Subscript DeFi Yield Layer
 *
 * Implements the YieldSource interface specified in Subscript PRD Section 178-196.
 * Idle balances waiting in stream escrows or parked for upcoming subscription renewals
 * generate projected yield calculations based on prevailing Solana DeFi lending markets (e.g. Kamino / Save).
 */

export interface YieldSource {
  readonly id: string;
  readonly name: string;
  readonly protocol: string;
  readonly apyPercent: number;
  readonly isProjected: boolean;
  calculateReturn(principalUsdc: number, durationDays: number): number;
  getYieldPerSecond(principalUsdc: number): number;
}

export class ProjectedDeFiYieldSource implements YieldSource {
  readonly id = "solana-usdc-lending";
  readonly name = "Subscript Yield Reserve";
  readonly protocol = "Solana DeFi Lending (Kamino / Save Market Rate)";
  readonly apyPercent = 6.85; // Prevailing Solana Devnet / Mainnet USDC APY
  readonly isProjected = true;

  calculateReturn(principalUsdc: number, durationDays: number): number {
    return principalUsdc * (this.apyPercent / 100) * (durationDays / 365);
  }

  getYieldPerSecond(principalUsdc: number): number {
    return (principalUsdc * (this.apyPercent / 100)) / (365 * 86400);
  }
}

export const activeYieldSource: YieldSource = new ProjectedDeFiYieldSource();

