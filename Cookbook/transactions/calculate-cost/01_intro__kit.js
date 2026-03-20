import {
  airdropFactory,
  appendTransactionMessageInstructions,
  compileTransactionMessage,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getBase64Decoder,
  getCompiledTransactionMessageEncoder,
  getComputeUnitEstimateForTransactionMessageFactory,
  getSignatureFromTransaction,
  lamports,
  pipe,
  prependTransactionMessageInstructions,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type TransactionMessageBytesBase64
} from "@solana/kit";
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction
} from "@solana-program/compute-budget";
import { getAddMemoInstruction } from "@solana-program/memo";

// 1. Setup RPC connections
const rpc = createSolanaRpc("http://localhost:8899");
const rpcSubscriptions = createSolanaRpcSubscriptions("ws://localhost:8900");

// 2. Create utility functions
const getComputeUnitEstimate =
  getComputeUnitEstimateForTransactionMessageFactory({ rpc });
const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions
});
const airdrop = airdropFactory({ rpc, rpcSubscriptions });

// 3. Create and fund an account
const signer = await generateKeyPairSigner();
await airdrop({
  commitment: "confirmed",
  lamports: lamports(1000_000n),
  recipientAddress: signer.address
});
console.log("Create and fund account with address", signer.address);

// 4. Create a memo transaction
console.log("Creating a memo transaction");
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
const transactionMessage = pipe(
  createTransactionMessage({ version: "legacy" }),
  (m) => setTransactionMessageFeePayerSigner(signer, m),
  (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
  (m) =>
    appendTransactionMessageInstructions(
      [
        getSetComputeUnitPriceInstruction({ microLamports: 5000n }),
        getAddMemoInstruction({ memo: "Hello, world!" })
      ],
      m
    )
);

// 5. Estimate compute units
const estimatedComputeUnits = await getComputeUnitEstimate(transactionMessage);
// Transaction is estimated to consume 6236 compute units
console.log(
  `Transaction is estimated to consume ${estimatedComputeUnits} compute units`
);

// 6. Add compute unit limit instruction to the transaction
const budgetedTransactionMessage = prependTransactionMessageInstructions(
  [getSetComputeUnitLimitInstruction({ units: estimatedComputeUnits })],
  transactionMessage
);

// 7. Calculate transaction fee
const base64EncodedMessage = pipe(
  budgetedTransactionMessage,
  compileTransactionMessage,
  getCompiledTransactionMessageEncoder().encode,
  getBase64Decoder().decode
) as TransactionMessageBytesBase64;

const transactionCost = await rpc.getFeeForMessage(base64EncodedMessage).send();
// Transaction is estimated to cost 5032 lamports
console.log(
  "Transaction is estimated to cost " + transactionCost.value + " lamports"
);

// 8. Sign and send the transaction
const signedTx = await signTransactionMessageWithSigners(
  budgetedTransactionMessage
);
const transactionSignature = getSignatureFromTransaction(signedTx);
console.log("Transaction Signature:", transactionSignature);

await sendAndConfirmTransaction(signedTx, { commitment: "confirmed" });
