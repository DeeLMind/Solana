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

// 4️⃣ 构造要传入的账户（示例可以传自己钱包）
const accounts = [
  { pubkey: payer.publicKey, isSigner: true, isWritable: true }
];

// 5️⃣ 构造 instruction_data（字符可打印）
const data = Buffer.from("DeeLMind", "utf-8");

// 6️⃣ 构造指令
const instruction = new TransactionInstruction({
  programId,
  keys: accounts,
  data: data,
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

// https://solscan.io/tx/39aQYVVfnThR7oCf1r8iSXd187CSrMCWp8Zs6uaGSPoZf96fVgAdXAv1eksv9zvkvGggHqDs9okaW2KMbf782rZG?cluster=devnet