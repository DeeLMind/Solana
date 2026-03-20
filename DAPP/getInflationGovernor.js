import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let commitment = "finalized";
let inflationGovener = await connection.getInflationGovernor();

console.log(inflationGovener);
