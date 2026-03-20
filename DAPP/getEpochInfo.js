import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let epochInfo = await connection.getEpochInfo();

console.log(epochInfo);
