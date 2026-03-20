import {
  Connection,
  PublicKey,
  clusterApiUrl,
  type SignaturesForAddressOptions,
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let signaturesOptions: SignaturesForAddressOptions = {

  limit: 1,
};

let address = new PublicKey("Vote111111111111111111111111111111111111111");
let signatures = await connection.getSignaturesForAddress(
  address,
  signaturesOptions,
);

console.log(signatures);
