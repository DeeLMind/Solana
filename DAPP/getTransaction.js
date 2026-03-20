import {
  Connection,
  PublicKey,
  clusterApiUrl,
  type GetVersionedTransactionConfig,
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let signature =
  "5zSQuTcWsPy2cVAshBXWuJJXLwMD1GbgMpz3iq4xgwiV1s6mxYRbYb7qBiRGZd1xvDcYhQQRBKoNcnW8eKtcyZWg";

let config: GetVersionedTransactionConfig = {

  commitment: "finalized",

  maxSupportedTransactionVersion: 0,
};

let transaction = await connection.getTransaction(signature, config);

console.log(transaction);
