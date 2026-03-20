// !collapse(1:29) collapsed

import {
  airdropFactory,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  devnet,
  generateKeyPair,
  getAddressFromPublicKey,
  type KeyPairSigner,
  lamports
} from "@solana/kit";
import fs from "fs";
import path from "path";
import os from "os";

// The new library takes a brand-new approach to Solana key pairs and addresses,
// which will feel quite different from the classes PublicKey and Keypair from version 1.x.
// All key operations now use the native Ed25519 implementation in JavaScript’s
// Web Crypto API.
async function createKeypair() {
  const newKeypair: CryptoKeyPair = await generateKeyPair();
  const publicAddress = await getAddressFromPublicKey(newKeypair.publicKey);

  console.log(`Public key: ${publicAddress}`);
}

createKeypair();

export async function loadKeypairFromFile(
  filePath: string
): Promise<KeyPairSigner<string>> {
  // This is here so you can also load the default keypair from the file system.
  const resolvedPath = path.resolve(
    filePath.startsWith("~") ? filePath.replace("~", os.homedir()) : filePath
  );
  const loadedKeyBytes = Uint8Array.from(
    JSON.parse(fs.readFileSync(resolvedPath, "utf8"))
  );
  // Here you can also set the second parameter to true in case you need to extract your private key.
  const keypairSigner = await createKeyPairSignerFromBytes(loadedKeyBytes);
  return keypairSigner;
}

const keypairSigner = await loadKeypairFromFile("~/.config/solana/id.json");
console.log(keypairSigner.address);

// !collapse(1:6) collapsed
export async function loadDefaultKeypair(): Promise<KeyPairSigner<string>> {
  return await loadKeypairFromFile("~/.config/solana/id.json");
}

const keypairSigner2 = await loadDefaultKeypair();
console.log(keypairSigner2.address);

export async function loadDefaultKeypairWithAirdrop(
  cluster: string
  // !collapse(1:24) collapsed
): Promise<KeyPairSigner<string>> {
  const keypair = await loadDefaultKeypair();
  const rpc = createSolanaRpc(devnet(`https://api.${cluster}.solana.com`));
  const rpcSubscriptions = createSolanaRpcSubscriptions(
    devnet(`wss://api.${cluster}.solana.com`)
  );
  try {
    const result = await rpc.getBalance(keypair.address).send();

    console.log(`Balance: ${result.value} lamports`);
    if (result.value < lamports(500_000n)) {
      console.log(`Balance low requesting airdrop`);
      const airdrop = airdropFactory({ rpc, rpcSubscriptions });
      await airdrop({
        commitment: "confirmed",
        lamports: lamports(1_000_000_000n),
        recipientAddress: keypair.address
      });
    }
  } catch (err) {
    console.error("Error fetching balance:", err);
  }
  return keypair;
}

const keypairSigner2 = await loadDefaultKeypairWithAirdrop("devnet");
console.log(keypairSigner2.address);
