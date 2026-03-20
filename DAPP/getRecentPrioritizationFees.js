import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let addresses = [new PublicKey("CxELquR1gPP8wHe33gZ4QxqGB3sZ9RSwsJ2KshVewkFY")];

let prioritizationFees = await connection.getRecentPrioritizationFees({
  lockedWritableAccounts: addresses,
});

console.log(prioritizationFees);
