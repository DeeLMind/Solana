import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let addresses = [
  new PublicKey("6dmNQ5jwLeLk5REvio1JcMshcbvkYMwy26sJ8pbkvStu"),
  new PublicKey("BGsqMegLpV6n6Ve146sSX2dTjUMj3M92HnU8BbNRMhF2"),
];

let epoch = 2;

let inflationReward = await connection.getInflationReward(addresses, epoch);

console.log(inflationReward);
