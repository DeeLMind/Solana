import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let startSlot = 377268280;

let endSlot = 377268285;
let blocks = await connection.getBlocks(startSlot, endSlot);

console.log("Blocks produced:", blocks);
