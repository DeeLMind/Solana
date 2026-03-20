import { Connection, clusterApiUrl, type GetSlotConfig } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let config: GetSlotConfig = {

  commitment: "finalized",
};

let slot = await connection.getSlot(config);

console.log(slot);
