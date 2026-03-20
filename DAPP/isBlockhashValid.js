import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let blockhash = "J7rBdM6AecPDEZp8aPq5iPSNKVkU5Q76F3oAV4eW5wsW";

let isValid = await connection.isBlockhashValid(blockhash);

console.log(isValid);
