import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";
import fs from "fs";

// 1️⃣ 连接 Devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
console.log("Connection to Solana Devnet established.");

// 2️⃣ 加载本地钱包（payer）
const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync("../id.json", "utf-8")))
);

// 3️⃣ 部署好的 Program ID
const programId = new PublicKey("DYjGmmcQEkyzCoKgUFQRKwbMByvbDu4FnkpcM3MsyrSW");

// 示例传入 3 个账户
const accounts = [
  { pubkey: payer.publicKey, isSigner: true, isWritable: true },
  { pubkey: programId, isSigner: false, isWritable: false }, // 程序账户示例
  { pubkey: Keypair.generate().publicKey, isSigner: false, isWritable: true } // 额外账户
];

// Instruction 数据为空
const instruction = new TransactionInstruction({
  programId,
  keys: accounts,
  data: Buffer.alloc(0),
});

(async () => {
  const tx = new Transaction().add(instruction);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log("Transaction signature:", sig);
})();
