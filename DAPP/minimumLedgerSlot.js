import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let minLedgerSlot = await connection.getMinimumLedgerSlot();

console.log(minLedgerSlot);
