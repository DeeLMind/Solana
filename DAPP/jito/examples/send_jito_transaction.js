const fs = require("fs");
const path = require("path");
const {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");

// 这个示例演示一条非常典型的 Jito 发送路径：
// 1. 用普通 Solana RPC 获取最新 blockhash
// 2. 获取 Jito tip account
// 3. 构造一笔包含“正常转账 + Jito tip + priority fee”的交易
// 4. 将交易序列化成 base64
// 5. 调用 Jito Block Engine 的 sendTransaction 接口发送
//
// 为什么这样设计：
// - 正常转账：模拟你的真实业务动作
// - priority fee：提升在 Solana 里的竞争力
// - Jito tip：提升在 Jito 路径中的竞争力
// - bundleOnly=true：让这笔交易以单笔 bundle 的方式提交，获得 revert protection 语义
//
// 使用前请确认：
// - 这是 mainnet-beta 示例
// - 你的钱包里有足够 SOL
// - recipient 地址是你可控或明确知道用途的地址
// - tip 也是实际转出的 lamports，不是“虚拟参数”

const RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

const JITO_BASE_URL =
  process.env.JITO_BASE_URL || "https://mainnet.block-engine.jito.wtf";

const KEYPAIR_PATH =
  process.env.KEYPAIR_PATH || path.resolve(__dirname, "../../../id.json");

const RECIPIENT =
  process.env.RECIPIENT || "11111111111111111111111111111111";

// 正常业务转账金额。
// 演示默认值设置得很小，避免误操作时损失过大。
const TRANSFER_SOL = Number(process.env.TRANSFER_SOL || 0.001);

// Jito tip。官方文档提到 bundles 至少要 1000 lamports，
// 但在竞争激烈时只给最低值通常不够。
const JITO_TIP_LAMPORTS = Number(process.env.JITO_TIP_LAMPORTS || 1000);

// Priority fee 使用 micro-lamports / compute unit。
// 这个值越高，代表你愿意支付的优先费越高。
const PRIORITY_FEE_MICRO_LAMPORTS = Number(
  process.env.PRIORITY_FEE_MICRO_LAMPORTS || 5000
);

// 为了便于理解，这里手动给 compute unit 限额。
// 真实生产里建议基于 simulateTransaction 估算。
const COMPUTE_UNIT_LIMIT = Number(process.env.COMPUTE_UNIT_LIMIT || 30000);

// 如果你拿到了 Jito 的 UUID，可以通过这个 header 传。
// 按官方文档，默认发送场景并不一定需要 auth key。
const JITO_UUID = process.env.JITO_UUID || "";

function loadKeypair(filePath) {
  const secret = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function jitoRpcRequest(endpoint, method, params, extraHeaders = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`Jito returned non-JSON response: ${text}`);
  }

  if (!response.ok) {
    throw new Error(
      `Jito HTTP ${response.status}: ${payload.error?.message || text}`
    );
  }

  if (payload.error) {
    throw new Error(
      `Jito RPC error ${payload.error.code}: ${payload.error.message}`
    );
  }

  return {
    payload,
    headers: response.headers,
  };
}

async function getTipAccounts() {
  const headers = JITO_UUID ? { "x-jito-auth": JITO_UUID } : {};
  const { payload } = await jitoRpcRequest(
    `${JITO_BASE_URL}/api/v1/getTipAccounts`,
    "getTipAccounts",
    [],
    headers
  );

  if (!Array.isArray(payload.result) || payload.result.length === 0) {
    throw new Error("No Jito tip accounts returned by getTipAccounts");
  }

  return payload.result;
}

async function buildTransaction({ connection, payer, recipient, tipAccount }) {
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");

  // 指令 1：设置 compute unit 限额。
  // 没有这个也能发，但显式写出来更利于学习交易成本结构。
  const setComputeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: COMPUTE_UNIT_LIMIT,
  });

  // 指令 2：设置 priority fee。
  // 单位是 micro-lamports / compute unit，不是直接写 lamports。
  const setComputeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: PRIORITY_FEE_MICRO_LAMPORTS,
  });

  // 指令 3：真实业务动作，这里用最简单的 SOL 转账举例。
  const transferIx = SystemProgram.transfer({
    fromPubkey: payer.publicKey,
    toPubkey: recipient,
    lamports: Math.floor(TRANSFER_SOL * LAMPORTS_PER_SOL),
  });

  // 指令 4：给 Jito tip account 支付 tip。
  // 这笔钱会真实扣掉，所以请一定控制金额。
  const jitoTipIx = SystemProgram.transfer({
    fromPubkey: payer.publicKey,
    toPubkey: tipAccount,
    lamports: JITO_TIP_LAMPORTS,
  });

  // 这里使用 v0 transaction，是当前更常见的现代写法。
  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [
      setComputeUnitLimitIx,
      setComputeUnitPriceIx,
      transferIx,
      jitoTipIx,
    ],
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  transaction.sign([payer]);

  return {
    transaction,
    latestBlockhash,
  };
}

async function sendViaJito(serializedTxBase64) {
  const headers = JITO_UUID ? { "x-jito-auth": JITO_UUID } : {};

  // 官方文档说明：
  // - 单笔交易接口路径是 /api/v1/transactions
  // - 可以传 bundleOnly=true，让单笔交易按单笔 bundle 方式发送
  // - 文档也明确说明 sendTransaction 这条路径会 skip_preflight=true
  const { payload, headers: responseHeaders } = await jitoRpcRequest(
    `${JITO_BASE_URL}/api/v1/transactions?bundleOnly=true`,
    "sendTransaction",
    [serializedTxBase64, { encoding: "base64" }],
    headers
  );

  return {
    signature: payload.result,
    bundleId: responseHeaders.get("x-bundle-id"),
  };
}

async function main() {
  const payer = loadKeypair(KEYPAIR_PATH);
  const recipient = new PublicKey(RECIPIENT);
  const connection = new Connection(RPC_URL, "confirmed");

  console.log("Jito single transaction example");
  console.log("RPC URL:", RPC_URL);
  console.log("Jito URL:", JITO_BASE_URL);
  console.log("Payer:", payer.publicKey.toBase58());
  console.log("Recipient:", recipient.toBase58());
  console.log("Transfer SOL:", TRANSFER_SOL);
  console.log("Jito tip lamports:", JITO_TIP_LAMPORTS);
  console.log("Priority fee (micro-lamports/CU):", PRIORITY_FEE_MICRO_LAMPORTS);

  const payerBalance = await connection.getBalance(payer.publicKey, "confirmed");
  console.log("Payer balance (SOL):", payerBalance / LAMPORTS_PER_SOL);

  // 第一步：向 Jito 获取 tip accounts。
  // 官方文档建议从返回列表里随机挑一个，减少热点竞争。
  const tipAccounts = await getTipAccounts();
  const randomTipAccount = new PublicKey(
    tipAccounts[Math.floor(Math.random() * tipAccounts.length)]
  );

  console.log("Selected Jito tip account:", randomTipAccount.toBase58());

  // 第二步：构造并签名交易。
  const { transaction, latestBlockhash } = await buildTransaction({
    connection,
    payer,
    recipient,
    tipAccount: randomTipAccount,
  });

  // 第三步：把交易序列化后转成 base64。
  // 官方文档推荐 base64，不推荐 base58。
  const serializedTxBase64 = Buffer.from(transaction.serialize()).toString(
    "base64"
  );

  console.log("Latest blockhash:", latestBlockhash.blockhash);
  console.log("Last valid block height:", latestBlockhash.lastValidBlockHeight);

  // 第四步：调用 Jito sendTransaction。
  const result = await sendViaJito(serializedTxBase64);

  console.log("Jito sendTransaction signature:", result.signature);
  console.log("Jito bundle id:", result.bundleId || "not returned");
  console.log(`Solscan: https://solscan.io/tx/${result.signature}`);
}

main().catch((error) => {
  console.error("send_jito_transaction failed:");
  console.error(error.message || error);
  process.exit(1);
});
