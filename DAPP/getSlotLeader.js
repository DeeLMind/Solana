import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let slotLeader = await connection.getSlotLeader();

console.log(slotLeader);
