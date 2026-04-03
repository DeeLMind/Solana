const { publicKeyToString, toUsd, isTokenProgram } = require("./utils");

async function detectLargeTransfers(context) {
  const { parsedTx, config } = context;
  const findings = [];

  parsedTx.solBalanceChanges.forEach((change) => {
    if (change.deltaSol >= 0) {
      return;
    }

    const usdValue = Math.abs(toUsd(change.deltaSol, config.solPriceUsd));

    if (usdValue >= config.largeTransferUsdThreshold) {
      findings.push({
        rule: "RULE_1_LARGE_SOL_TRANSFER",
        scoreDelta: 20,
        summary: `Large SOL transfer from ${change.owner} amount=${Math.abs(change.deltaSol).toFixed(4)} SOL (~$${usdValue})`,
        entities: [change.owner],
        details: {
          asset: "SOL",
          address: change.owner,
          amount: Math.abs(change.deltaSol),
          usdValue,
        },
      });
    }
  });

  parsedTx.tokenBalanceChanges.forEach((change) => {
    if (change.delta >= 0) {
      return;
    }

    const mintPrice = config.mintPricesUsd[change.mint];

    if (!mintPrice) {
      return;
    }

    const usdValue = Math.abs(toUsd(change.delta, mintPrice));

    if (usdValue >= config.largeTransferUsdThreshold) {
      findings.push({
        rule: "RULE_1_LARGE_SPL_TRANSFER",
        scoreDelta: 20,
        summary: `Large SPL transfer owner=${change.owner || "unknown"} mint=${change.mint} amount=${Math.abs(change.delta)} (~$${usdValue})`,
        entities: [change.owner].filter(Boolean),
        details: {
          asset: change.mint,
          owner: change.owner,
          amount: Math.abs(change.delta),
          usdValue,
        },
      });
    }
  });

  return findings;
}

async function detectNewTokenCreation(context) {
  const { parsedTx } = context;
  const findings = [];

  parsedTx.instructions.forEach((instruction) => {
    if (!isTokenProgram(instruction.programId)) {
      return;
    }

    if (!["initializeMint", "initializeMint2"].includes(instruction.parsedType)) {
      return;
    }

    const mintAddress = publicKeyToString(instruction.parsedInfo?.mint);
    const authority = publicKeyToString(instruction.parsedInfo?.mintAuthority);

    findings.push({
      rule: "RULE_2_NEW_TOKEN_CREATION",
      scoreDelta: 30,
      summary: `New token mint detected mint=${mintAddress} authority=${authority || "unknown"}`,
      entities: [mintAddress, authority].filter(Boolean),
      details: {
        mintAddress,
        authority,
        freezeAuthority: publicKeyToString(instruction.parsedInfo?.freezeAuthority),
      },
    });
  });

  return findings;
}

async function detectMintAuthorityRisk(context) {
  const { parsedTx, cache, connections } = context;
  const findings = [];
  const candidateMints = new Map();

  parsedTx.instructions.forEach((instruction) => {
    if (!isTokenProgram(instruction.programId)) {
      return;
    }

    if (["initializeMint", "initializeMint2"].includes(instruction.parsedType)) {
      const mintAddress = publicKeyToString(instruction.parsedInfo?.mint);

      if (mintAddress) {
        candidateMints.set(mintAddress, {
          mintAuthority: publicKeyToString(instruction.parsedInfo?.mintAuthority),
          freezeAuthority: publicKeyToString(instruction.parsedInfo?.freezeAuthority),
        });
      }
    }
  });

  for (const change of parsedTx.tokenBalanceChanges) {
    if (!candidateMints.has(change.mint)) {
      candidateMints.set(change.mint, null);
    }
  }

  for (const [mintAddress, hintedAuthorities] of candidateMints.entries()) {
    let authorities = cache.mintAuthorityCache.get(mintAddress);

    if (!authorities) {
      authorities = hintedAuthorities;

      if (!authorities) {
        for (const connection of connections) {
          try {
            const parsedInfo = await connection.getParsedAccountInfo(mintAddress, "confirmed");
            const info = parsedInfo.value?.data?.parsed?.info;

            if (info) {
              authorities = {
                mintAuthority: publicKeyToString(info.mintAuthority),
                freezeAuthority: publicKeyToString(info.freezeAuthority),
              };
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }

      if (authorities) {
        cache.mintAuthorityCache.set(mintAddress, authorities);
      }
    }

    if (!authorities) {
      continue;
    }

    const hasMintAuthority = Boolean(authorities.mintAuthority);
    const hasFreezeAuthority = Boolean(authorities.freezeAuthority);

    if (!hasMintAuthority && !hasFreezeAuthority) {
      continue;
    }

    findings.push({
      rule: "RULE_3_MINT_AUTHORITY_RISK",
      scoreDelta: 40,
      summary: `Risk token mint=${mintAddress} mintAuthority=${authorities.mintAuthority || "none"} freezeAuthority=${authorities.freezeAuthority || "none"}`,
      entities: [mintAddress, authorities.mintAuthority, authorities.freezeAuthority].filter(Boolean),
      details: {
        mintAddress,
        mintAuthority: authorities.mintAuthority,
        freezeAuthority: authorities.freezeAuthority,
        riskFlags: [
          hasMintAuthority ? "MINT_AUTHORITY_ENABLED" : null,
          hasFreezeAuthority ? "FREEZE_AUTHORITY_ENABLED" : null,
        ].filter(Boolean),
      },
    });
  }

  return findings;
}

async function detectPoolReserveDrop(context) {
  const { parsedTx, cache, config } = context;
  const findings = [];
  const watchMap = new Map(config.poolWatchlist.map((item) => [item.account, item]));

  parsedTx.tokenBalanceChanges.forEach((change) => {
    const watch = watchMap.get(change.owner);

    if (!watch) {
      return;
    }

    const mintPrice = config.mintPricesUsd[change.mint] || 0;
    const previousBalance = cache.poolReserves.get(watch.account);
    cache.poolReserves.set(watch.account, change.after);

    if (previousBalance === undefined || change.delta >= 0) {
      return;
    }

    const dropAmount = Math.abs(change.delta);
    const dropPercent = previousBalance > 0 ? (dropAmount / previousBalance) * 100 : 0;
    const usdDrop = mintPrice ? toUsd(dropAmount, mintPrice) : 0;

    if (dropPercent >= watch.dropPercent || usdDrop >= watch.minUsdDrop) {
      findings.push({
        rule: "RULE_4_POOL_RESERVE_DROP",
        scoreDelta: 35,
        summary: `Pool reserve dropped pool=${watch.label} reserve=${watch.account} drop=${dropAmount} (${dropPercent.toFixed(2)}%)`,
        entities: [watch.account, change.owner].filter(Boolean),
        details: {
          pool: watch.label,
          reserveAccount: watch.account,
          mint: change.mint,
          previousBalance,
          currentBalance: change.after,
          dropAmount,
          dropPercent: Number(dropPercent.toFixed(2)),
          usdDrop,
        },
      });
    }
  });

  return findings;
}

async function detectHighFrequencyAddressActivity(context) {
  const { parsedTx, cache, config } = context;
  const findings = [];
  const now = Date.now();

  parsedTx.signerAddresses.forEach((address) => {
    const count = cache.addressActivity.increment(address, now);

    if (count > config.addressTxPerMinuteThreshold) {
      findings.push({
        rule: "RULE_5_HIGH_FREQUENCY_ADDRESS",
        scoreDelta: 25,
        summary: `Address ${address} submitted ${count} txs in the last minute`,
        entities: [address],
        details: {
          address,
          txCountLastMinute: count,
          threshold: config.addressTxPerMinuteThreshold,
        },
      });
    }
  });

  return findings;
}

async function detectProgramAbuse(context) {
  const { parsedTx, cache, config } = context;
  const findings = [];
  const now = Date.now();

  parsedTx.programIds.forEach((programId) => {
    const count = cache.programActivity.increment(programId, now);

    if (count > config.programCallsPerMinuteThreshold) {
      findings.push({
        rule: "RULE_6_PROGRAM_CALL_SPIKE",
        scoreDelta: 30,
        summary: `Program ${programId} was invoked ${count} times in the last minute`,
        entities: [programId],
        details: {
          programId,
          callCountLastMinute: count,
          threshold: config.programCallsPerMinuteThreshold,
        },
      });
    }
  });

  return findings;
}

function createRuleEngine() {
  const rules = [
    detectLargeTransfers,
    detectNewTokenCreation,
    detectMintAuthorityRisk,
    detectPoolReserveDrop,
    detectHighFrequencyAddressActivity,
    detectProgramAbuse,
  ];

  return {
    register(rule) {
      rules.push(rule);
    },
    async evaluate(context) {
      const findings = [];

      for (const rule of rules) {
        const result = await rule(context);

        if (Array.isArray(result) && result.length) {
          findings.push(...result);
        }
      }

      return findings;
    },
  };
}

module.exports = {
  createRuleEngine,
};
