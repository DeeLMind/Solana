import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const slot_number = 377261141;

const block = await connection.getBlock(
  slot_number,

  {

    commitment: "finalized",

    transactionDetails: "full",

    maxSupportedTransactionVersion: 0,

    rewards: true
  }
);

console.log("block:", block);
