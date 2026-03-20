import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let firstAvailableBlock = await connection.getFirstAvailableBlock();

console.log(firstAvailableBlock);
