import {
  Connection,
  PublicKey,
  clusterApiUrl,
  type GetMultipleAccountsConfig,
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let addresses = [
  new PublicKey("vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg"),
  new PublicKey("4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA"),
];

let config: GetMultipleAccountsConfig = {

  commitment: "finalized",
};

let accounts = await connection.getMultipleAccountsInfo(addresses, config);

console.log(accounts);
