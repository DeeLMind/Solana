import {
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const address = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
// !mark
const balance = await connection.getBalance(address);
console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
