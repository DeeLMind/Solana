import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let slotNumber = 377268280;
let blockTime = await connection.getBlockTime(slotNumber);

console.log("Block time:", blockTime);
