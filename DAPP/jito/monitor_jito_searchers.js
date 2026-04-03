const { Connection, PublicKey } = require("@solana/web3.js");
const { normalizeParsedTransaction } = require("../security-monitor/utils");

const COMPUTE_BUDGET_PROGRAM_ID =
  "ComputeBudget111111111111111111111111111111";

const CORE_PROGRAMS = new Set([
  "11111111111111111111111111111111",
  COMPUTE_BUDGET_PROGRAM_ID,
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseList(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseWatchAddresses(value) {
  return new Set(parseList(value));
}

function isRateLimitError(error) {
  const message = String(error && error.message ? error.message : error || "");
  return message.includes("429") || message.toLowerCase().includes("too many requests");
}

class SlidingWindowCounter {
  constructor(windowMs) {
    this.windowMs = windowMs;
    this.store = new Map();
  }

  increment(key, now = Date.now()) {
    const queue = this.store.get(key) || [];
    queue.push(now);
    this.store.set(key, queue);
    return this.getCount(key, now);
  }

  getCount(key, now = Date.now()) {
    const queue = this.store.get(key) || [];
    const next = queue.filter((timestamp) => now - timestamp <= this.windowMs);

    if (next.length) {
      this.store.set(key, next);
      return next.length;
    }

    this.store.delete(key);
    return 0;
  }
}

class AsyncQueue {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.items = [];
    this.waiters = [];
  }

  push(item) {
    if (this.items.length >= this.maxSize) {
      return false;
    }

    const waiter = this.waiters.shift();

    if (waiter) {
      waiter(item);
      return true;
    }

    this.items.push(item);
    return true;
  }

  async shift() {
    if (this.items.length) {
      return this.items.shift();
    }

    return new Promise((resolve) => {
      this.waiters.push(resolve);
    });
  }
}

function loadConfig() {
  return {
    rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
    wsUrl: process.env.SOLANA_WS_URL || "wss://api.mainnet-beta.solana.com",
    commitment: process.env.SOLANA_COMMITMENT || "confirmed",
    jitoBaseUrl:
      process.env.JITO_BASE_URL || "https://mainnet.block-engine.jito.wtf",
    jitoUuid: process.env.JITO_UUID || "",
    fetchConcurrency: Number(process.env.FETCH_CONCURRENCY || 2),
    queueMaxSize: Number(process.env.QUEUE_MAX_SIZE || 1000),
    parsedTxRetries: Number(process.env.PARSED_TX_RETRIES || 5),
    parsedTxRetryDelayMs: Number(process.env.PARSED_TX_RETRY_DELAY_MS || 1200),
    signerTxPerMinuteThreshold: Number(
      process.env.SIGNER_TX_PER_MIN_THRESHOLD || 8
    ),
    largeTipLamports: Number(process.env.LARGE_TIP_LAMPORTS || 100000),
    watchSearchers: parseWatchAddresses(process.env.WATCH_SEARCHERS),
  };
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

  return payload.result;
}

async function getTipAccounts(config) {
  const headers = config.jitoUuid ? { "x-jito-auth": config.jitoUuid } : {};
  const result = await jitoRpcRequest(
    `${config.jitoBaseUrl}/api/v1/getTipAccounts`,
    "getTipAccounts",
    [],
    headers
  );

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error("No Jito tip accounts returned");
  }

  return result;
}

async function getParsedTransactionWithRetry(connection, signature, config) {
  for (let attempt = 0; attempt < config.parsedTxRetries; attempt += 1) {
    try {
      const tx = await connection.getParsedTransaction(signature, {
        commitment: config.commitment,
        maxSupportedTransactionVersion: 0,
      });

      if (tx) {
        return tx;
      }
    } catch (error) {
      if (!isRateLimitError(error) && attempt === config.parsedTxRetries - 1) {
        throw error;
      }
    }

    await sleep(config.parsedTxRetryDelayMs * (attempt + 1));
  }

  return null;
}

function sumJitoTipLamports(parsedTx, tipAccountSet) {
  return parsedTx.solBalanceChanges
    .filter(
      (change) =>
        tipAccountSet.has(change.owner) && change.deltaLamports > 0
    )
    .reduce((sum, change) => sum + change.deltaLamports, 0);
}

function getNonCorePrograms(parsedTx) {
  return parsedTx.programIds.filter((programId) => !CORE_PROGRAMS.has(programId));
}

function getDistinctMints(parsedTx) {
  return [...new Set(parsedTx.tokenBalanceChanges.map((item) => item.mint))];
}

function getSignerTokenFlow(parsedTx) {
  const signerSet = new Set(parsedTx.signerAddresses);

  return parsedTx.tokenBalanceChanges.filter(
    (change) => change.owner && signerSet.has(change.owner)
  );
}

function classifyTransaction({
  parsedTx,
  tipAccountSet,
  signerCounter,
  config,
}) {
  const now = Date.now();
  const signers = parsedTx.signerAddresses;
  const signerCounts = signers.map((signer) => ({
    signer,
    txCountLastMinute: signerCounter.increment(signer, now),
  }));
  const maxSignerActivity = signerCounts.reduce(
    (best, item) =>
      item.txCountLastMinute > best.txCountLastMinute ? item : best,
    { signer: null, txCountLastMinute: 0 }
  );

  const tipLamports = sumJitoTipLamports(parsedTx, tipAccountSet);
  const nonCorePrograms = getNonCorePrograms(parsedTx);
  const distinctMints = getDistinctMints(parsedTx);
  const signerTokenFlow = getSignerTokenFlow(parsedTx);
  const labels = ["JITO_TIPPED_TRANSACTION"];

  if (tipLamports >= config.largeTipLamports) {
    labels.push("LARGE_JITO_TIP");
  }

  if (maxSignerActivity.txCountLastMinute >= config.signerTxPerMinuteThreshold) {
    labels.push("HIGH_FREQUENCY_SEARCHER");
  }

  if (nonCorePrograms.length >= 2 && distinctMints.length >= 2) {
    labels.push("MULTI_VENUE_ROUTE");
  }

  if (signerTokenFlow.length >= 2 && distinctMints.length >= 2) {
    labels.push("TOKEN_ARBITRAGE_PATTERN");
  }

  if (
    labels.includes("HIGH_FREQUENCY_SEARCHER") &&
    labels.includes("TOKEN_ARBITRAGE_PATTERN")
  ) {
    labels.push("LIKELY_JITO_ARBITRAGEUR");
  }

  const watchedSearchers = signers.filter((signer) =>
    config.watchSearchers.has(signer)
  );

  if (watchedSearchers.length) {
    labels.push("WATCHLIST_MATCH");
  }

  return {
    detectedAt: new Date().toISOString(),
    signature: parsedTx.signature,
    slot: parsedTx.slot,
    blockTime: parsedTx.blockTime
      ? new Date(parsedTx.blockTime * 1000).toISOString()
      : null,
    signers,
    signerCounts,
    tipLamports,
    tipSol: tipLamports / 1e9,
    labels,
    watchedSearchers,
    feeLamports: parsedTx.feeLamports,
    usesPriorityFee: parsedTx.programIds.includes(COMPUTE_BUDGET_PROGRAM_ID),
    nonCorePrograms,
    distinctMints,
    tokenBalanceChanges: parsedTx.tokenBalanceChanges.slice(0, 8),
    solBalanceChanges: parsedTx.solBalanceChanges
      .filter((change) => signers.includes(change.owner) || tipAccountSet.has(change.owner))
      .slice(0, 8),
    solscanUrl: `https://solscan.io/tx/${parsedTx.signature}`,
  };
}

function printEvent(event) {
  console.log("=".repeat(88));
  console.log(`[${event.detectedAt}] ${event.labels.join(" | ")}`);
  console.log("signature:", event.signature);
  console.log("slot:", event.slot);
  console.log("signers:", event.signers.join(", ") || "N/A");
  console.log("tip:", `${event.tipLamports} lamports (${event.tipSol} SOL)`);
  console.log("programs:", event.nonCorePrograms.join(", ") || "N/A");
  console.log("mints:", event.distinctMints.join(", ") || "N/A");
  console.log("solscan:", event.solscanUrl);
  console.log(JSON.stringify(event, null, 2));
}

async function startMonitor() {
  const config = loadConfig();
  const tipAccounts = await getTipAccounts(config);
  const tipAccountSet = new Set(tipAccounts);
  const connection = new Connection(config.rpcUrl, {
    commitment: config.commitment,
    wsEndpoint: config.wsUrl,
  });
  const signerCounter = new SlidingWindowCounter(60 * 1000);
  const queue = new AsyncQueue(config.queueMaxSize);
  const pending = new Set();
  const subscriptions = [];

  console.log("jito searcher monitor started");
  console.log("rpc:", config.rpcUrl);
  console.log("ws:", config.wsUrl);
  console.log("jito block engine:", config.jitoBaseUrl);
  console.log("tip accounts:", tipAccounts.join(", "));
  console.log("strategy: subscribe to Jito tip accounts only");
  console.log("waiting for Jito-tipped transactions...\n");

  async function workerLoop(workerId) {
    while (true) {
      const logInfo = await queue.shift();

      try {
        const tx = await getParsedTransactionWithRetry(
          connection,
          logInfo.signature,
          config
        );

        if (!tx || tx.meta?.err) {
          continue;
        }

        const parsedTx = normalizeParsedTransaction(tx);
        const event = classifyTransaction({
          parsedTx,
          tipAccountSet,
          signerCounter,
          config,
        });

        printEvent(event);
      } catch (error) {
        console.error(
          `worker ${workerId} failed signature=${logInfo.signature}:`,
          error.message || error
        );
      } finally {
        pending.delete(logInfo.signature);
      }
    }
  }

  for (let i = 1; i <= config.fetchConcurrency; i += 1) {
    workerLoop(i);
  }

  for (const tipAccount of tipAccounts) {
    const subscriptionId = connection.onLogs(
      new PublicKey(tipAccount),
      async (logInfo) => {
        if (logInfo.err || pending.has(logInfo.signature)) {
          return;
        }

        pending.add(logInfo.signature);

        if (!queue.push(logInfo)) {
          pending.delete(logInfo.signature);
          console.warn("queue full, dropped signature:", logInfo.signature);
        }
      },
      config.commitment
    );

    subscriptions.push(subscriptionId);
  }

  process.on("SIGINT", async () => {
    console.log("\nstopping Jito monitor...");

    for (const subscriptionId of subscriptions) {
      await connection.removeOnLogsListener(subscriptionId);
    }

    process.exit(0);
  });
}

startMonitor().catch((error) => {
  console.error("failed to start Jito monitor:", error);
  process.exit(1);
});
