import {
  Connection,
  clusterApiUrl,
  type SignatureStatusConfig
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let signatures = [
  "4cdd1oX7cfVALfr26tP52BZ6cSzrgnNGtYD7BFhm6FFeZV5sPTnRvg6NRn8yC6DbEikXcrNChBM5vVJnTgKhGhVu"
];

let config: SignatureStatusConfig = {

  searchTransactionHistory: true
};

let signatureStatus = await connection.getSignatureStatuses(signatures, config);
console.log(signatureStatus);
