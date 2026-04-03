const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const TOKEN_PROGRAM_IDS = new Set([
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
]);

function publicKeyToString(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value.toBase58 === "function") {
    return value.toBase58();
  }

  if (typeof value.pubkey === "string") {
    return value.pubkey;
  }

  if (value.pubkey && typeof value.pubkey.toBase58 === "function") {
    return value.pubkey.toBase58();
  }

  return String(value);
}

function extractAccounts(tx) {
  return (tx.transaction.message.accountKeys || []).map((item) => {
    if (typeof item === "string") {
      return {
        pubkey: item,
        signer: false,
        writable: false,
      };
    }

    return {
      pubkey: publicKeyToString(item.pubkey || item),
      signer: Boolean(item.signer),
      writable: Boolean(item.writable),
    };
  });
}

function extractInstructions(tx) {
  const outerInstructions = tx.transaction.message.instructions || [];
  const innerInstructions = ((tx.meta && tx.meta.innerInstructions) || []).flatMap(
    (group) => group.instructions || []
  );

  return [...outerInstructions, ...innerInstructions].map((instruction) => ({
    program: instruction.program || null,
    programId: publicKeyToString(instruction.programId),
    parsedType: instruction.parsed?.type || null,
    parsedInfo: instruction.parsed?.info || null,
  }));
}

function extractTokenBalanceChanges(tx) {
  const meta = tx.meta || {};
  const preTokenBalances = meta.preTokenBalances || [];
  const postTokenBalances = meta.postTokenBalances || [];
  const preMap = new Map();

  preTokenBalances.forEach((item) => {
    preMap.set(`${item.accountIndex}:${item.mint}`, Number(item.uiTokenAmount?.uiAmount || 0));
  });

  return postTokenBalances
    .map((item) => {
      const key = `${item.accountIndex}:${item.mint}`;
      const before = preMap.get(key) || 0;
      const after = Number(item.uiTokenAmount?.uiAmount || 0);
      const delta = after - before;

      return {
        accountIndex: item.accountIndex,
        owner: item.owner || null,
        mint: item.mint,
        before,
        after,
        delta,
        decimals: item.uiTokenAmount?.decimals ?? null,
      };
    })
    .filter((change) => Math.abs(change.delta) > 0);
}

function extractSolBalanceChanges(tx) {
  const meta = tx.meta || {};
  const accounts = extractAccounts(tx);
  const preBalances = meta.preBalances || [];
  const postBalances = meta.postBalances || [];

  return accounts
    .map((account, index) => {
      const beforeLamports = preBalances[index] || 0;
      const afterLamports = postBalances[index] || 0;
      const deltaLamports = afterLamports - beforeLamports;

      return {
        owner: account.pubkey,
        beforeLamports,
        afterLamports,
        deltaLamports,
        deltaSol: deltaLamports / 1e9,
      };
    })
    .filter((change) => Math.abs(change.deltaLamports) > 0);
}

function getPrimarySignature(tx) {
  return tx.transaction.signatures[0];
}

function getProgramIds(tx) {
  return [...new Set(extractInstructions(tx).map((item) => item.programId).filter(Boolean))];
}

function getSignerAddresses(tx) {
  return extractAccounts(tx)
    .filter((account) => account.signer)
    .map((account) => account.pubkey);
}

function normalizeParsedTransaction(tx) {
  return {
    signature: getPrimarySignature(tx),
    slot: tx.slot,
    blockTime: tx.blockTime,
    accounts: extractAccounts(tx),
    instructions: extractInstructions(tx),
    tokenBalanceChanges: extractTokenBalanceChanges(tx),
    solBalanceChanges: extractSolBalanceChanges(tx),
    signerAddresses: getSignerAddresses(tx),
    programIds: getProgramIds(tx),
    err: tx.meta?.err || null,
    feeLamports: tx.meta?.fee || 0,
    raw: tx,
  };
}

function toUsd(value, priceUsd) {
  return Number((value * priceUsd).toFixed(2));
}

function isTokenProgram(programId) {
  return TOKEN_PROGRAM_IDS.has(programId);
}

module.exports = {
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_IDS,
  publicKeyToString,
  normalizeParsedTransaction,
  toUsd,
  isTokenProgram,
};
