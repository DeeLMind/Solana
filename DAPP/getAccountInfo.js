import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const publicKey = new PublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
const accountInfo = await connection.getAccountInfo(publicKey);

console.log("Account Info:", JSON.stringify(accountInfo, null, 2));