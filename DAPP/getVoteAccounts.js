import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let voteAccounts = await connection.getVoteAccounts();

console.log(voteAccounts);
