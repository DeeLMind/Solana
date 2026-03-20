import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let blockHeight = await connection.getBlockHeight();

console.log("block height:", blockHeight);
