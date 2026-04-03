const { Connection } = require("@solana/web3.js");
const { loadConfig } = require("./config");
const { MonitorCache } = require("./cache");
const { logEvent, notify } = require("./logger");
const { normalizeParsedTransaction } = require("./utils");
const { createRuleEngine } = require("./rules");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error) {
  const message = String(error && error.message ? error.message : error || "");
  return message.includes("429") || message.toLowerCase().includes("too many requests");
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

  size() {
    return this.items.length;
  }
}

class RpcPool {
  constructor(config) {
    this.config = config;
    this.pointer = 0;
    this.endpoints = config.rpcEndpoints.map((endpoint, index) => {
      const wsEndpoint = config.wsEndpoints[index] || config.wsEndpoints[0];

      return {
        endpoint,
        wsEndpoint,
        cooldownUntil: 0,
        connection: new Connection(endpoint, {
          commitment: config.commitment,
          wsEndpoint,
        }),
      };
    });
    this.connections = this.endpoints.map((item) => item.connection);
  }

  primary() {
    return this.endpoints[0].connection;
  }

  next() {
    const now = Date.now();

    for (let index = 0; index < this.endpoints.length; index += 1) {
      const item = this.endpoints[this.pointer % this.endpoints.length];
      this.pointer += 1;

      if (item.cooldownUntil <= now) {
        return item;
      }
    }

    const item = this.endpoints[this.pointer % this.endpoints.length];
    this.pointer += 1;
    return item;
  }

  async getParsedTransaction(signature) {
    for (let attempt = 0; attempt < this.config.parsedTransactionRetryCount; attempt += 1) {
      for (let index = 0; index < this.endpoints.length; index += 1) {
        const endpoint = this.next();

        try {
          const tx = await endpoint.connection.getParsedTransaction(signature, {
            commitment: this.config.commitment,
            maxSupportedTransactionVersion: this.config.maxSupportedTransactionVersion,
          });

          if (tx) {
            return tx;
          }
        } catch (error) {
          if (isRateLimitError(error)) {
            endpoint.cooldownUntil = Date.now() + this.config.endpointCooldownMs;
          }

          continue;
        }
      }

      const delayMs = Math.min(
        this.config.parsedTransactionRetryDelayMs * (attempt + 1),
        this.config.parsedTransactionMaxDelayMs
      );
      await sleep(delayMs);
    }

    return null;
  }
}

function buildEvent(parsedTx, findings) {
  const riskScore = Math.min(
    100,
    findings.reduce((sum, finding) => sum + (finding.scoreDelta || 0), 0)
  );

  const observedAddresses = [
    ...new Set(
      findings.flatMap((finding) => finding.entities || []).filter(Boolean)
    ),
  ];

  return {
    detectedAt: new Date().toISOString(),
    signature: parsedTx.signature,
    slot: parsedTx.slot,
    blockTime: parsedTx.blockTime ? new Date(parsedTx.blockTime * 1000).toISOString() : null,
    riskScore,
    accounts: parsedTx.accounts,
    instructions: parsedTx.instructions,
    tokenBalanceChanges: parsedTx.tokenBalanceChanges,
    solBalanceChanges: parsedTx.solBalanceChanges,
    findings,
    observedAddresses,
  };
}

async function startSecurityMonitor() {
  const config = loadConfig();
  const rpcPool = new RpcPool(config);
  const cache = new MonitorCache();
  const ruleEngine = createRuleEngine();
  const connection = rpcPool.primary();
  const queue = new AsyncQueue(config.logQueueMaxSize);
  const pendingSignatures = new Set();
  let droppedLogs = 0;

  console.log("security monitor started");
  console.log("cluster:", config.cluster);
  console.log("rpc endpoints:", config.rpcEndpoints.join(", "));
  console.log("ws endpoints:", config.wsEndpoints.join(", "));
  console.log("mode: onLogs(all) + parsed transaction analysis");
  console.log("fetch concurrency:", config.fetchConcurrency);
  console.log("log queue max size:", config.logQueueMaxSize);
  console.log("waiting for mainnet-beta transaction logs...\n");

  async function handleLog(logInfo) {
    const tx = await rpcPool.getParsedTransaction(logInfo.signature);

    if (!tx || tx.meta?.err) {
      return;
    }

    const parsedTx = normalizeParsedTransaction(tx);
    const findings = await ruleEngine.evaluate({
      config,
      cache,
      connections: rpcPool.connections,
      parsedTx,
      rawLog: logInfo,
    });

    if (!findings.length) {
      return;
    }

    const event = buildEvent(parsedTx, findings);
    logEvent(event);
    await notify(event, config.notifierWebhookUrl);
  }

  async function workerLoop(workerId) {
    while (true) {
      const logInfo = await queue.shift();

      try {
        await handleLog(logInfo);
      } catch (error) {
        console.error(
          `worker ${workerId} failed signature=${logInfo.signature}:`,
          error.message || error
        );
      } finally {
        pendingSignatures.delete(logInfo.signature);
      }
    }
  }

  for (let workerId = 1; workerId <= config.fetchConcurrency; workerId += 1) {
    workerLoop(workerId);
  }

  const subscriptionId = connection.onLogs(
    "all",
    async (logInfo) => {
      if (logInfo.err) {
        return;
      }

      if (pendingSignatures.has(logInfo.signature)) {
        return;
      }

      pendingSignatures.add(logInfo.signature);
      const queued = queue.push(logInfo);

      if (queued) {
        return;
      }

      pendingSignatures.delete(logInfo.signature);
      droppedLogs += 1;

      if (droppedLogs === 1 || droppedLogs % 100 === 0) {
        console.warn(
          `log queue full, dropped=${droppedLogs}, current_queue=${queue.size()}`
        );
      }
    },
    config.commitment
  );

  process.on("SIGINT", async () => {
    console.log("\nstopping security monitor...");
    await connection.removeOnLogsListener(subscriptionId);
    process.exit(0);
  });
}

startSecurityMonitor().catch((error) => {
  console.error("failed to start security monitor:", error);
  process.exit(1);
});
