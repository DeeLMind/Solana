// !collapse(1:12) collapsed

import {
  Cluster,
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { readFileSync } from "fs";
import { homedir } from "os";
import path from "path";

export async function loadKeypairFromFile(filePath: string): Promise<Keypair> {
  const resolvedPath = path.resolve(
    filePath.startsWith("~") ? filePath.replace("~", homedir()) : filePath
  );
  const loadedKeyBytes = Uint8Array.from(
    JSON.parse(readFileSync(resolvedPath, "utf8"))
  );
  return await Keypair.fromSecretKey(loadedKeyBytes);
}

const keypair = await loadKeypairFromFile("~/.config/solana/id.json");
console.log(keypair.publicKey.toBase58());

// !collapse(1:6) collapsed
export async function loadDefaultKeypair(): Promise<Keypair> {
  return await loadKeypairFromFile("~/.config/solana/id.json");
}

const keypair2 = await loadDefaultKeypair();
console.log(keypair2.publicKey.toBase58());

export async function loadDefaultKeypairWithAirdrop(
  cluster: Cluster
  // !collapse(1:21) collapsed
): Promise<Keypair> {
  const keypair = await loadDefaultKeypair();
  const connection = new Connection(clusterApiUrl(cluster), "finalized");

  try {
    const balance = await connection.getBalance(keypair.publicKey);

    // 1 LAMPORTS_PER_SOL === 1 SOL
    console.log(`Balance: ${balance} lamports`);
    if (balance < 0.05 * LAMPORTS_PER_SOL) {
      console.log(`Balance low requesting airdrop`);
      await connection.requestAirdrop(keypair.publicKey, 1_000_000_000);
    }
  } catch (err) {
    console.error("Error fetching balance:", err);
  }
  return keypair;
}

const keypair3 = await loadDefaultKeypairWithAirdrop("devnet");
console.log(keypair3.publicKey.toBase58());
