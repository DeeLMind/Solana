import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let limit = 2;

let performanceSamples = await connection.getRecentPerformanceSamples(limit);

console.log(performanceSamples);
