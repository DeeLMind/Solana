import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let owner = new PublicKey("4kg8oh3jdNtn7j2wcS7TrUua31AgbLzDVkBZgTAe44aF");

let tokenProgram = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

let tokenAccounts = await connection.getTokenAccountsByOwner(owner, {
  programId: tokenProgram,
});

console.log(tokenAccounts);
