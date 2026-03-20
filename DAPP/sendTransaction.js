import {
  Connection,
  VersionedTransaction,
  clusterApiUrl,
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const base64Tx =
  "AbuRLtc5C9bZtAUT4F4Y2H5SRRUK1HwOFZOK3V4qm/78MDJt+M2de/RCCaI3iTyodDepmrkUWbss0XRHS0lk5AOAAQABAzfDSQC/GjcggrLsDpYz7jAlT+Gca846HqtFb8UQMM9cCWPIi4AX32PV8HrY7/1WgoRc3IATttceZsUMeQ1qx7UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2dTRgcJmzcoGH1R3c2WqtHah2H19KvbC1p6BxLDqfoAQICAAEMAgAAAADKmjsAAAAAAA==";

let tx = VersionedTransaction.deserialize(Buffer.from(base64Tx, "base64"));

let sig = await connection.sendTransaction(tx);

console.log(sig);
