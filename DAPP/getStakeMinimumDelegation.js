import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let stakeMinDelegation = await connection.getStakeMinimumDelegation();

console.log(stakeMinDelegation);
