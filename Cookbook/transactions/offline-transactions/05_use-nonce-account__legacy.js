import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  NonceAccount,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import * as bs58 from "bs58";
import { getKeypairFromFile } from "@solana-developers/helpers";

(async () => {
  // Setup our connection and wallet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const feePayer = Keypair.generate();

  // Fund our wallet with 1 SOL
  const airdropSignature = await connection.requestAirdrop(
    feePayer.publicKey,
    LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(airdropSignature);

  // you can use any keypair as nonce account authority,
  // but nonceAccountAuth must be the same as the one used in nonce account creation
  // load default solana keypair for nonce account authority
  const nonceAccountAuth = await getKeypairFromFile();

  const nonceAccountPubkey = new PublicKey(
    "7H18z3v3rZEoKiwY3kh8DLn9eFT6nFCQ2m4kiC7RZ3a4"
  );
  let nonceAccountInfo = await connection.getAccountInfo(nonceAccountPubkey);
  let nonceAccount = NonceAccount.fromAccountData(nonceAccountInfo.data);

  let tx = new Transaction().add(
    // nonce advance must be the first instruction
    SystemProgram.nonceAdvance({
      noncePubkey: nonceAccountPubkey,
      authorizedPubkey: nonceAccountAuth.publicKey
    }),
    // after that, you do what you really want to do, here we append a transfer instruction as an example.
    SystemProgram.transfer({
      fromPubkey: feePayer.publicKey,
      toPubkey: nonceAccountAuth.publicKey,
      lamports: 1
    })
  );
  // assign `nonce` as recentBlockhash
  tx.recentBlockhash = nonceAccount.nonce;
  tx.feePayer = feePayer.publicKey;
  tx.sign(
    feePayer,
    nonceAccountAuth
  ); /* fee payer + nonce account authority + ... */

  console.log(`txhash: ${await connection.sendRawTransaction(tx.serialize())}`);
})();
