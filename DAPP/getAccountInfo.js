import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const publicKey = new PublicKey("vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg");
const accountInfo = await connection.getAccountInfo(publicKey);

console.log("Account Info:", JSON.stringify(accountInfo, null, 2));
