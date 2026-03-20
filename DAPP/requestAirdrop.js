import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let receiver = new PublicKey("4kg8oh3jdNtn7j2wcS7TrUua31AgbLzDVkBZgTAe44aF");

let airdropAmt = 1 * LAMPORTS_PER_SOL;

let sig = await connection.requestAirdrop(receiver, airdropAmt);

console.log(sig);
