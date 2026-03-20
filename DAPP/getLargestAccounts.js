import {
  Connection,
  clusterApiUrl,
  type GetLargestAccountsConfig,
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let config: GetLargestAccountsConfig = {

  commitment: "finalized",

  filter: "circulating",
};

let largestAccounts = await connection.getLargestAccounts(config);

console.log(largestAccounts);
