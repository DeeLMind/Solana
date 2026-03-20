import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let startSlot = 378037836;

let limit = 10;

let slotLeaders = await connection.getSlotLeaders(startSlot, limit);

console.log(slotLeaders);
