const { Connection } = require("@solana/web3.js");

const COMMITMENT = "confirmed";
const DEFAULT_CLUSTER = "mainnet";
const CLUSTERS = {
  mainnet: "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
};

const CORE_PROGRAMS = new Set([
  "11111111111111111111111111111111",
  "ComputeBudget111111111111111111111111111111",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
]);

function resolveCluster(value) {
  if (!value) {
    return DEFAULT_CLUSTER;
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getProgramIdFromInstruction(instruction) {
  if (!instruction) {
    return null;
  }

  if (instruction.programId && typeof instruction.programId.toBase58 === "function") {
    return instruction.programId.toBase58();
  }

  if (typeof instruction.programId === "string") {
    return instruction.programId;
  }

  return null;
}

function summarizeTokenBalanceChanges(meta) {
  const preBalances = new Map();

  (meta.preTokenBalances || []).forEach((item) => {
    preBalances.set(`${item.accountIndex}-${item.mint}`, Number(item.uiTokenAmount?.uiAmount || 0));
  });

  return (meta.postTokenBalances || [])
    .map((item) => {
      const key = `${item.accountIndex}-${item.mint}`;
      const before = preBalances.get(key) || 0;
      const after = Number(item.uiTokenAmount?.uiAmount || 0);
      const diff = after - before;

      if (Math.abs(diff) < 0.000001) {
        return null;
      }

      return {
        owner: item.owner || `accountIndex:${item.accountIndex}`,
        mint: item.mint,
        diff,
      };
    })
    .filter(Boolean);
}

function scoreTransaction(tx) {
  const meta = tx.meta;

  if (!meta || meta.err) {
    return null;
  }

  const outerPrograms = tx.transaction.message.instructions
    .map(getProgramIdFromInstruction)
    .filter(Boolean);

  const innerPrograms = (meta.innerInstructions || [])
    .flatMap((group) => group.instructions || [])
    .map(getProgramIdFromInstruction)
    .filter(Boolean);

  const allPrograms = [...outerPrograms, ...innerPrograms];
  const nonCorePrograms = [...new Set(allPrograms.filter((programId) => !CORE_PROGRAMS.has(programId)))];
  const tokenChanges = summarizeTokenBalanceChanges(meta);
  const signerKeys = tx.transaction.message.accountKeys
    .filter((account) => account.signer)
    .map((account) => account.pubkey.toBase58());

  let score = 0;
  const reasons = [];

  if (nonCorePrograms.length >= 2) {
    score += 3;
    reasons.push(`multi-program:${nonCorePrograms.length}`);
  }

  if (tokenChanges.length >= 2) {
    score += 2;
    reasons.push(`token-balance-changes:${tokenChanges.length}`);
  }

  if ((meta.innerInstructions || []).length >= 2) {
    score += 1;
    reasons.push(`inner-instruction-groups:${meta.innerInstructions.length}`);
  }

  if (meta.fee >= 10000) {
    score += 1;
    reasons.push(`higher-fee:${meta.fee}`);
  }

  if (tx.transaction.message.instructions.length >= 4) {
    score += 1;
    reasons.push(`many-instructions:${tx.transaction.message.instructions.length}`);
  }

  if (tokenChanges.length >= 4) {
    score += 1;
    reasons.push("complex-token-flow");
  }

  if (score < 4) {
    return null;
  }

  return {
    score,
    reasons,
    signerKeys,
    nonCorePrograms,
    tokenChanges: tokenChanges.slice(0, 6),
    fee: meta.fee,
    signature: tx.transaction.signatures[0],
  };
}

async function getParsedBlockWithRetry(connection, slot, retries = 6, delayMs = 1200) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const block = await connection.getParsedBlock(slot, {
        commitment: COMMITMENT,
        maxSupportedTransactionVersion: 0,
        transactionDetails: "full",
        rewards: false,
      });

      if (block) {
        return block;
      }
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
    }

    await sleep(delayMs);
  }

  return null;
}

function printCandidate(slot, candidate, cluster) {
  console.log("=".repeat(72));
  console.log(`[MEV candidate] slot ${slot}`);
  console.log("signature:", candidate.signature);
  console.log("score:", candidate.score, `(${candidate.reasons.join(", ")})`);
  console.log("fee:", candidate.fee);
  console.log("signers:", candidate.signerKeys.length ? candidate.signerKeys.join(", ") : "N/A");
  console.log(
    "programs:",
    candidate.nonCorePrograms.length ? candidate.nonCorePrograms.join(", ") : "N/A"
  );

  if (candidate.tokenChanges.length) {
    console.log("token changes:");
    candidate.tokenChanges.forEach((change) => {
      console.log(" ", `${change.owner} | ${change.mint} | ${change.diff}`);
    });
  }

  console.log("solscan:", buildSolscanTxUrl(candidate.signature, cluster));
  console.log();
}

async function startMevMonitor() {
  const clusterArg = process.argv[2] || process.env.SOLANA_CLUSTER || DEFAULT_CLUSTER;
  const cluster = resolveCluster(clusterArg);
  const rpcUrl = process.env.SOLANA_RPC_URL || CLUSTERS[cluster];
  const connection = new Connection(rpcUrl, COMMITMENT);
  const processedSlots = new Set();

  console.log("cluster:", cluster);
  console.log("RPC:", rpcUrl);
  console.log("mode: block-level MEV candidate monitor");
  console.log("waiting for confirmed slots...\n");

  connection.onSlotChange(async (slotInfo) => {
    const slot = slotInfo.slot;

    if (processedSlots.has(slot)) {
      return;
    }

    processedSlots.add(slot);

    if (processedSlots.size > 200) {
      const oldest = processedSlots.values().next().value;
      processedSlots.delete(oldest);
    }

    try {
      const block = await getParsedBlockWithRetry(connection, slot);

      if (!block || !block.transactions?.length) {
        return;
      }

      for (const tx of block.transactions) {
        const candidate = scoreTransaction(tx);

        if (candidate) {
          printCandidate(slot, candidate, cluster);
        }
      }
    } catch (error) {
      console.error(`failed to inspect slot ${slot}:`, error.message || error);
    }
  });
}

startMevMonitor().catch((error) => {
  console.error("failed to start MEV monitor:", error);
  process.exit(1);
});
