import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let epochSchedule = await connection.getEpochSchedule();

console.log(epochSchedule);
