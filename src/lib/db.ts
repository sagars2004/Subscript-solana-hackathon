import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import type { CreatePlanInput, Plan } from "@/lib/plans";

const databaseDirectory = path.join(process.cwd(), ".data");
const databasePath = path.join(databaseDirectory, "subscript.sqlite");

let database: DatabaseSync | undefined;

function getDatabase() {
  if (database) return database;

  mkdirSync(databaseDirectory, { recursive: true });
  database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      merchant_wallet TEXT NOT NULL,
      name TEXT NOT NULL,
      price_microusd INTEGER NOT NULL CHECK (price_microusd > 0),
      billing_period_seconds INTEGER NOT NULL CHECK (billing_period_seconds >= 60),
      payout_address TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscription_links (
      stream_id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL REFERENCES plans(id),
      subscriber_wallet TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  return database;
}

type PlanRow = {
  id: string;
  merchant_wallet: string;
  name: string;
  price_microusd: number;
  billing_period_seconds: number;
  payout_address: string;
  created_at: string;
  updated_at: string;
};

function toPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    merchantWallet: row.merchant_wallet,
    name: row.name,
    priceMicrousd: row.price_microusd,
    billingPeriodSeconds: row.billing_period_seconds,
    payoutAddress: row.payout_address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listPlans(merchantWallet?: string): Plan[] {
  const db = getDatabase();
  const rows = merchantWallet
    ? (db.prepare("SELECT * FROM plans WHERE merchant_wallet = ? ORDER BY created_at DESC").all(merchantWallet) as PlanRow[])
    : (db.prepare("SELECT * FROM plans ORDER BY created_at DESC").all() as PlanRow[]);

  return rows.map(toPlan);
}

export function createPlan(input: CreatePlanInput): Plan {
  const db = getDatabase();
  const now = new Date().toISOString();
  const plan: Plan = { id: randomUUID(), ...input, createdAt: now, updatedAt: now };

  db.prepare(
    `INSERT INTO plans (
      id, merchant_wallet, name, price_microusd, billing_period_seconds,
      payout_address, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(plan.id, plan.merchantWallet, plan.name, plan.priceMicrousd, plan.billingPeriodSeconds, plan.payoutAddress, plan.createdAt, plan.updatedAt);

  return plan;
}

export function saveSubscriptionLink(input: { streamId: string; planId: string; subscriberWallet: string }) {
  const db = getDatabase();
  db.prepare(`INSERT OR REPLACE INTO subscription_links (stream_id, plan_id, subscriber_wallet, created_at) VALUES (?, ?, ?, ?)`).run(input.streamId, input.planId, input.subscriberWallet, new Date().toISOString());
}

export function listSubscriptionLinks(subscriberWallet: string) {
  const db = getDatabase();
  return db.prepare(`SELECT stream_id as streamId, plan_id as planId, subscriber_wallet as subscriberWallet, created_at as createdAt FROM subscription_links WHERE subscriber_wallet = ? ORDER BY created_at DESC`).all(subscriberWallet) as { streamId: string; planId: string; subscriberWallet: string; createdAt: string }[];
}
