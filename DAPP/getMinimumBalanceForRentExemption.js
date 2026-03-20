import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let dataLength = 50;
let minBalForRentExemption =
  await connection.getMinimumBalanceForRentExemption(dataLength);

console.log(minBalForRentExemption);
