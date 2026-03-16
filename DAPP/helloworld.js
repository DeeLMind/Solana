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

// 4️⃣ 构造调用指令
const instruction = new TransactionInstruction({
  programId,
  keys: [],           // 没有账户
  data: Buffer.alloc(0), // 空 instruction_data
});

// 5️⃣ 构造交易
const transaction = new Transaction().add(instruction);

// 6️⃣ 发送并确认交易
async function main() {
  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
    console.log("Transaction signature:", signature);

    // 可选：查询日志
    const txInfo = await connection.getTransaction(signature, { commitment: "confirmed" });
    console.log("Transaction logs:", txInfo?.meta?.logMessages);
  } catch (err) {
    console.error("Error sending transaction:", err);
  }
}

main();