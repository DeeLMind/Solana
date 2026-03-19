const { Connection, PublicKey } = require("@solana/web3.js");

const COMMITMENT = "confirmed";
const DEFAULT_MONITOR_ADDRESS = "2AQdpHJ2JpcEgPiATUXjQxA8QmafFegfQwSLWSprPicm";
const CLUSTERS = {
  mainnet: "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
};

function resolveCluster(value) {
  if (!value) {
    return "mainnet";
  }

  const normalized = value.toLowerCase();

  if (normalized === "mainnet" || normalized === "mainnet-beta") {
    return "mainnet";
  }

  if (normalized === "devnet") {
    return "devnet";
  }

  throw new Error(`unsupported cluster: ${value}. Use mainnet or devnet.`);
}

function buildSolscanTxUrl(signature, cluster) {
  if (cluster === "mainnet") {
    return `https://solscan.io/tx/${signature}`;
  }

  return `https://solscan.io/tx/${signature}?cluster=${cluster}`;
}

const clusterArg = process.argv[3] || process.env.SOLANA_CLUSTER || "mainnet";
const cluster = resolveCluster(clusterArg);
const RPC_URL = process.env.SOLANA_RPC_URL || CLUSTERS[cluster];
const addressArg = process.argv[2] || process.env.MONITOR_ADDRESS || DEFAULT_MONITOR_ADDRESS;
const connection = new Connection(RPC_URL, COMMITMENT);
const monitorPublicKey = new PublicKey(addressArg);

async function getParsedTransactionWithRetry(signature, retries = 5, delayMs = 1200) {
  for (let i = 0; i < retries; i += 1) {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: COMMITMENT,
    });

    if (tx) {
      return tx;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return null;
}

function printTransactionSummary(signature, parsedTx, clusterName) {
  if (!parsedTx) {
    console.log("parsed transaction: pending, retry timeout");
    return;
  }

  const signerKeys = parsedTx.transaction.message.accountKeys
    .filter((account) => account.signer)
    .map((account) => account.pubkey.toBase58());

  console.log("slot:", parsedTx.slot);
  console.log(
    "block time:",
    parsedTx.blockTime ? new Date(parsedTx.blockTime * 1000).toLocaleString() : "N/A"
  );
  console.log("signers:", signerKeys.length ? signerKeys.join(", ") : "N/A");

  parsedTx.transaction.message.instructions.forEach((instruction, index) => {
    if ("parsed" in instruction) {
      console.log(
        `instruction[${index}]:`,
        `${instruction.program} | ${instruction.programId.toBase58()}`
      );
      return;
    }

    console.log(`instruction[${index}]:`, `raw | ${instruction.programId.toBase58()}`);
  });

  console.log("solscan:", buildSolscanTxUrl(signature, clusterName));
}

async function startMonitor() {
  console.log("cluster:", cluster);
  console.log("RPC:", RPC_URL);
  console.log("monitor address:", monitorPublicKey.toBase58());
  console.log("commitment:", COMMITMENT);
  console.log("waiting for new transactions...\n");

  const subscriptionId = connection.onLogs(
    monitorPublicKey,
    async (logInfo) => {
      const timestamp = new Date().toLocaleString();

      console.log("=".repeat(72));
      console.log(`[${timestamp}] new transaction`);
      console.log("signature:", logInfo.signature);
      console.log("slot:", logInfo.slot);
      console.log("error:", logInfo.err ? JSON.stringify(logInfo.err) : "none");

      if (logInfo.logs.length) {
        console.log("logs:");
        logInfo.logs.forEach((log) => console.log(" ", log));
      }

      const parsedTx = await getParsedTransactionWithRetry(logInfo.signature);
      printTransactionSummary(logInfo.signature, parsedTx, cluster);
      console.log();
    },
    COMMITMENT
  );

  process.on("SIGINT", async () => {
    console.log("\nstopping monitor...");
    await connection.removeOnLogsListener(subscriptionId);
    process.exit(0);
  });
}

startMonitor().catch((error) => {
  console.error("failed to start monitor:", error);
  process.exit(1);
});
