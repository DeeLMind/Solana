import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let blockProduction = await connection.getBlockProduction();

console.log("block production:", blockProduction);
