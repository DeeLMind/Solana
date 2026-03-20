import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let inflationRate = await connection.getInflationRate();

console.log(inflationRate);
