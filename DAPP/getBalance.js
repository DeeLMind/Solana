import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const publicKey = new PublicKey("83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri");
const balance = await connection.getBalance(publicKey);

console.log("Account Balance:", JSON.stringify(balance, null, 2));
