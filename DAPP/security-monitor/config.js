const DEFAULT_RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
];

const DEFAULT_WS_ENDPOINTS = [
  "wss://api.mainnet-beta.solana.com",
];

function parseList(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMintPrices(value) {
  if (!value) {
    return {};
  }

  return value.split(",").reduce((acc, pair) => {
    const [mint, price] = pair.split(":").map((item) => item.trim());

    if (mint && price && !Number.isNaN(Number(price))) {
      acc[mint] = Number(price);
    }

    return acc;
  }, {});
}

function parsePoolWatchlist(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [account, label, dropPercent, minUsdDrop] = entry.split(":").map((item) => item.trim());

      return {
        account,
        label: label || account,
        dropPercent: Number(dropPercent || 30),
        minUsdDrop: Number(minUsdDrop || 10000),
      };
    })
    .filter((item) => item.account);
}

function loadConfig() {
  const rpcEndpoints = parseList(process.env.SOLANA_RPC_ENDPOINTS);
  const wsEndpoints = parseList(process.env.SOLANA_WS_ENDPOINTS);

  return {
    cluster: process.env.SOLANA_CLUSTER || "mainnet-beta",
    rpcEndpoints: rpcEndpoints.length ? rpcEndpoints : DEFAULT_RPC_ENDPOINTS,
    wsEndpoints: wsEndpoints.length ? wsEndpoints : DEFAULT_WS_ENDPOINTS,
    commitment: process.env.SOLANA_COMMITMENT || "confirmed",
    largeTransferUsdThreshold: Number(process.env.LARGE_TRANSFER_USD_THRESHOLD || 10000),
    solPriceUsd: Number(process.env.SOL_PRICE_USD || 180),
    mintPricesUsd: parseMintPrices(process.env.MINT_PRICES_USD),
    addressTxPerMinuteThreshold: Number(process.env.ADDRESS_TX_PER_MIN_THRESHOLD || 25),
    programCallsPerMinuteThreshold: Number(process.env.PROGRAM_CALLS_PER_MIN_THRESHOLD || 60),
    poolWatchlist: parsePoolWatchlist(process.env.POOL_WATCHLIST),
    notifierWebhookUrl: process.env.WEBHOOK_URL || "",
    maxSupportedTransactionVersion: 0,
    parsedTransactionRetryCount: Number(process.env.PARSED_TX_RETRIES || 5),
    parsedTransactionRetryDelayMs: Number(process.env.PARSED_TX_RETRY_DELAY_MS || 1200),
    parsedTransactionMaxDelayMs: Number(process.env.PARSED_TX_MAX_DELAY_MS || 10000),
    fetchConcurrency: Number(process.env.FETCH_CONCURRENCY || 3),
    logQueueMaxSize: Number(process.env.LOG_QUEUE_MAX_SIZE || 2000),
    endpointCooldownMs: Number(process.env.ENDPOINT_COOLDOWN_MS || 15000),
  };
}

module.exports = {
  loadConfig,
};
