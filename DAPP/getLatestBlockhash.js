import { Connection, clusterApiUrl, type Commitment } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let commitment: Commitment = "processed";
let latestBlockhash = await connection.getLatestBlockhash(commitment);

console.log(latestBlockhash);
