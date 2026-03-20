import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  transfer
} from "@solana/spl-token";

// Create connection to local validator
const connection = new Connection("http://localhost:8899", "confirmed");
const latestBlockhash = await connection.getLatestBlockhash();

// Generate a new keypair for the fee payer
const feePayer = Keypair.generate();

// Generate a new keypair for the recipient
const recipient = Keypair.generate();

// Airdrop 1 SOL to fee payer
const airdropSignature = await connection.requestAirdrop(
  feePayer.publicKey,
  LAMPORTS_PER_SOL
);
await connection.confirmTransaction({
  blockhash: latestBlockhash.blockhash,
  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  signature: airdropSignature
});

// Airdrop 0.1 SOL to recipient for rent exemption
const recipientAirdropSignature = await connection.requestAirdrop(
  recipient.publicKey,
  LAMPORTS_PER_SOL / 10
);
await connection.confirmTransaction({
  blockhash: latestBlockhash.blockhash,
  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  signature: recipientAirdropSignature
});

// Create mint using helper function
const mintPubkey = await createMint(
  connection, // connection
  feePayer, // fee payer
  feePayer.publicKey, // mint authority
  feePayer.publicKey, // freeze authority
  2, // decimals
  Keypair.generate(), // keypair (optional)
  {
    commitment: "confirmed" // confirmation options
  },
  TOKEN_PROGRAM_ID // program id
);
console.log("Mint Address:", mintPubkey.toBase58());

// Create associated token account using helper function for fee payer
const feePayerATA = await createAssociatedTokenAccount(
  connection, // connection
  feePayer, // fee payer
  mintPubkey, // mint
  feePayer.publicKey, // owner
  {
    commitment: "confirmed" // confirmation options
  },
  TOKEN_PROGRAM_ID // program id
);
console.log("Fee Payer ATA Address:", feePayerATA.toBase58());

// Create associated token account using helper function for recipient
const recipientATA = await createAssociatedTokenAccount(
  connection, // connection
  feePayer, // fee payer (still paying for the transaction)
  mintPubkey, // mint
  recipient.publicKey, // owner (the recipient)
  {
    commitment: "confirmed" // confirmation options
  },
  TOKEN_PROGRAM_ID // program id
);
console.log("Recipient ATA Address:", recipientATA.toBase58());

// Mint 100 tokens to the fee payer's associated token account (with 2 decimals, this is 1.00 tokens)
const mintAmount = 100; // 1.00 tokens with 2 decimals
const mintSignature = await mintTo(
  connection, // connection
  feePayer, // payer
  mintPubkey, // mint
  feePayerATA, // destination
  feePayer, // authority (mint authority)
  mintAmount, // amount
  [], // additional signers
  {
    commitment: "confirmed" // confirmation options
  },
  TOKEN_PROGRAM_ID // program id
);
console.log("Successfully minted 1.0 tokens");
console.log("Transaction Signature:", mintSignature);

// Transfer 50 tokens (0.50 with 2 decimals) from fee payer to recipient
const transferAmount = 50;
const transferTransactionSignature = await transfer(
  connection,
  feePayer,
  feePayerATA,
  recipientATA,
  feePayer.publicKey, // Owner of source account
  transferAmount,
  [],
  {
    commitment: "confirmed"
  },
  TOKEN_PROGRAM_ID
);
console.log("Successfully transferred 0.5 tokens");
console.log("Transaction Signature:", transferTransactionSignature);

// Fetch and display actual balances after transfer
import { getAccount } from "@solana/spl-token";

const senderTokenAccount = await getAccount(
  connection,
  feePayerATA,
  "confirmed",
  TOKEN_PROGRAM_ID
);
const recipientTokenAccount = await getAccount(
  connection,
  recipientATA,
  "confirmed",
  TOKEN_PROGRAM_ID
);

console.log("=== Final Balances ===");
console.log(
  "Sender balance:",
  Number(senderTokenAccount.amount) / 100,
  "tokens"
);
console.log(
  "Recipient balance:",
  Number(recipientTokenAccount.amount) / 100,
  "tokens"
);
