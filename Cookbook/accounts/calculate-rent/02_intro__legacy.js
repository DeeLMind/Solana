import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// allocate 1.5k bytes of extra space in the account for data
const space = 1500;
// !mark
const lamports = await connection.getMinimumBalanceForRentExemption(space);
console.log("Minimum balance for rent exemption:", lamports);
