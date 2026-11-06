import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { ICluster, SolanaStreamClient, getBN } from "@streamflow/stream";

const RPC_URL = clusterApiUrl("devnet");
const EXPLORER_BASE = "https://explorer.solana.com/tx/";
const TOKEN_DECIMALS = 6;
const STREAM_AMOUNT = 60;
const TOP_UP_AMOUNT = 60;
const INITIAL_TEST_BALANCE = 240;

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const unixNow = () => Math.floor(Date.now() / 1000);
const explorerUrl = (signature: string) => `${EXPLORER_BASE}${signature}?cluster=devnet`;

function asTokens(amount: bigint) {
  return Number(amount) / 10 ** TOKEN_DECIMALS;
}

async function requestDevnetSol(connection: Connection, wallet: Keypair) {
  const signature = await connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
  const confirmation = await connection.confirmTransaction(signature, "confirmed");

  if (confirmation.value.err) {
    throw new Error(`Devnet airdrop failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  return signature;
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const client = new SolanaStreamClient(RPC_URL, ICluster.Devnet, "confirmed");
  const sender = Keypair.generate();
  const recipient = Keypair.generate();

  console.log("Streamflow devnet protocol proof");
  console.log(`Sender: ${sender.publicKey.toBase58()}`);
  console.log(`Recipient: ${recipient.publicKey.toBase58()}`);

  const airdropSignature = await requestDevnetSol(connection, sender);
  console.log(`Airdrop: ${explorerUrl(airdropSignature)}`);

  const mint = await createMint(connection, sender, sender.publicKey, null, TOKEN_DECIMALS);
  const senderTokenAccount = await getOrCreateAssociatedTokenAccount(connection, sender, mint, sender.publicKey);
  const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    sender,
    mint,
    recipient.publicKey,
  );

  await mintTo(
    connection,
    sender,
    mint,
    senderTokenAccount.address,
    sender,
    getBN(INITIAL_TEST_BALANCE, TOKEN_DECIMALS).toNumber(),
  );

  const senderBalanceBefore = (await getAccount(connection, senderTokenAccount.address)).amount;
  const recipientBalanceBefore = (await getAccount(connection, recipientTokenAccount.address)).amount;
  console.log(`Test mint: ${mint.toBase58()}`);
  console.log(`Initial balances — sender: ${asTokens(senderBalanceBefore)}, recipient: ${asTokens(recipientBalanceBefore)}`);

  const firstStart = unixNow() + 2;
  const firstStream = await client.create(
    {
      recipient: recipient.publicKey.toBase58(),
      tokenId: mint.toBase58(),
      amount: getBN(STREAM_AMOUNT, TOKEN_DECIMALS),
      start: firstStart,
      cliff: firstStart,
      period: 1,
      cliffAmount: getBN(0, TOKEN_DECIMALS),
      amountPerPeriod: getBN(1, TOKEN_DECIMALS),
      name: "Subscript protocol proof: cancellable stream",
      canTopup: true,
      canUpdateRate: false,
      cancelableBySender: true,
      cancelableByRecipient: false,
      transferableBySender: false,
      transferableByRecipient: false,
      automaticWithdrawal: false,
      withdrawalFrequency: 0,
    },
    { sender, isNative: false },
  );

  console.log(`Create: ${explorerUrl(firstStream.txId)}`);
  console.log(`First stream ID: ${firstStream.metadataId}`);

  await sleep(5_000);
  const beforeWithdraw = await client.getOne({ id: firstStream.metadataId });
  const availableToWithdraw = beforeWithdraw.unlocked(unixNow()).sub(beforeWithdraw.withdrawnAmount);

  console.log(
    `Before withdrawal — unlocked: ${availableToWithdraw.toString()} base units, withdrawn: ${beforeWithdraw.withdrawnAmount.toString()} base units`,
  );

  if (availableToWithdraw.gt(getBN(0, TOKEN_DECIMALS))) {
    const withdrawal = await client.withdraw(
      { id: firstStream.metadataId, amount: availableToWithdraw },
      { invoker: recipient },
    );
    console.log(`Withdraw: ${explorerUrl(withdrawal.txId)}`);
  }

  await sleep(2_000);
  const beforeCancel = await client.getOne({ id: firstStream.metadataId });
  const unlockedAtCancel = beforeCancel.unlocked(unixNow());
  const cancel = await client.cancel({ id: firstStream.metadataId }, { invoker: sender });
  console.log(`Cancel: ${explorerUrl(cancel.txId)}`);

  const firstStreamAfterCancel = await client.getOne({ id: firstStream.metadataId });
  const senderBalanceAfterCancel = (await getAccount(connection, senderTokenAccount.address)).amount;
  const recipientBalanceAfterCancel = (await getAccount(connection, recipientTokenAccount.address)).amount;

  console.log(
    `Cancel outcome — recipient received: ${asTokens(recipientBalanceAfterCancel - recipientBalanceBefore)}, sender balance: ${asTokens(senderBalanceAfterCancel)}`,
  );
  console.log(
    `Cancellation state — closed: ${firstStreamAfterCancel.closed}, sender-cancel: ${beforeCancel.cancelableBySender}, recipient-cancel: ${beforeCancel.cancelableByRecipient}, unlocked-at-cancel: ${unlockedAtCancel.toString()} base units`,
  );

  const topUpStart = unixNow() + 2;
  const topUpStream = await client.create(
    {
      recipient: recipient.publicKey.toBase58(),
      tokenId: mint.toBase58(),
      amount: getBN(STREAM_AMOUNT, TOKEN_DECIMALS),
      start: topUpStart,
      cliff: topUpStart,
      period: 1,
      cliffAmount: getBN(0, TOKEN_DECIMALS),
      amountPerPeriod: getBN(1, TOKEN_DECIMALS),
      name: "Subscript protocol proof: top-up behavior",
      canTopup: true,
      canUpdateRate: false,
      cancelableBySender: true,
      cancelableByRecipient: false,
      transferableBySender: false,
      transferableByRecipient: false,
      automaticWithdrawal: false,
      withdrawalFrequency: 0,
    },
    { sender, isNative: false },
  );

  const streamBeforeTopUp = await client.getOne({ id: topUpStream.metadataId });
  const topUp = await client.topup(
    { id: topUpStream.metadataId, amount: getBN(TOP_UP_AMOUNT, TOKEN_DECIMALS) },
    { invoker: sender, isNative: false },
  );
  const streamAfterTopUp = await client.getOne({ id: topUpStream.metadataId });
  console.log(`Top-up create: ${explorerUrl(topUpStream.txId)}`);
  console.log(`Top-up: ${explorerUrl(topUp.txId)}`);
  console.log(
    `Top-up behavior — deposit ${streamBeforeTopUp.depositedAmount.toString()} → ${streamAfterTopUp.depositedAmount.toString()} base units; end ${streamBeforeTopUp.end} → ${streamAfterTopUp.end}`,
  );

  const topUpCleanup = await client.cancel({ id: topUpStream.metadataId }, { invoker: sender });
  console.log(`Top-up stream cleanup cancel: ${explorerUrl(topUpCleanup.txId)}`);

  if (!firstStreamAfterCancel.closed) {
    throw new Error("Cancellation did not close the first stream.");
  }
  if (!beforeCancel.cancelableBySender || beforeCancel.cancelableByRecipient) {
    throw new Error("Cancellation permissions differ from the required subscription configuration.");
  }
  if (recipientBalanceAfterCancel <= recipientBalanceBefore) {
    throw new Error("Recipient did not receive accrued funds after withdrawal and cancellation.");
  }

  console.log("PROOF PASSED: create, accrue, withdraw, cancel, and top-up all completed on devnet.");
}

main().catch((error: unknown) => {
  console.error("PROOF FAILED", error);
  process.exitCode = 1;
});
