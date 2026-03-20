import {
  Connection,
  VersionedTransaction,
  clusterApiUrl,
  type SimulateTransactionConfig,
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const base64Tx =
  "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEEjNmKiZGiOtSZ+g0//wH5kEQo3+UzictY+KlLV8hjXcs44M/Xnr+1SlZsqS6cFMQc46yj9PIsxqkycxJmXT+veJjIvefX4nhY9rY+B5qreeqTHu4mG6Xtxr5udn4MN8PnBt324e51j94YQl285GzN2rYa/E2DuQ0n/r35KNihi/zamQ6EeyeeVDvPVgUO2W3Lgt9hT+CfyqHvIa11egFPCgEDAwIBAAkDZAAAAAAAAAA=";

let tx = VersionedTransaction.deserialize(Buffer.from(base64Tx, "base64"));

let simulateTxConfig: SimulateTransactionConfig = {

  commitment: "finalized",

  replaceRecentBlockhash: true,

  sigVerify: false,

  minContextSlot: undefined,

  innerInstructions: undefined,

  accounts: undefined,
};

let simulateResult = await connection.simulateTransaction(tx, simulateTxConfig);

console.log(simulateResult);
