#!/usr/bin/env node

/**
 * Get Solana validators and leader information via JSON-RPC.
 *
 * Usage:
 *   node get-validator-and-leader.js
 *   node get-validator-and-leader.js https://api.mainnet-beta.solana.com
 *
 * Optional env vars:
 *   RPC_URL=https://api.mainnet-beta.solana.com
 *   SLOT_LEADERS_LIMIT=10
 *   VALIDATOR_LIMIT=20
 */

const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";
const rpcUrl = process.env.RPC_URL || process.argv[2] || DEFAULT_RPC_URL;
const slotLeadersLimit = Number(process.env.SLOT_LEADERS_LIMIT || 10);
const validatorLimit = Number(process.env.VALIDATOR_LIMIT || 20);

async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `${method}-${Date.now()}`,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(`${method} failed: ${json.error.message}`);
  }

  return json.result;
}

function summarizeValidators(current = [], delinquent = []) {
  return [...current, ...delinquent]
    .sort((a, b) => b.activatedStake - a.activatedStake)
    .slice(0, validatorLimit)
    .map((validator, index) => ({
      rank: index + 1,
      identityPubkey: validator.nodePubkey,
      votePubkey: validator.votePubkey,
      commission: validator.commission,
      activatedStake: validator.activatedStake,
      lastVote: validator.lastVote,
      rootSlot: validator.rootSlot,
      epochCredits: validator.epochCredits?.at(-1)?.[1] ?? null,
      delinquent: delinquent.some((item) => item.votePubkey === validator.votePubkey),
    }));
}

function summarizeLeaderSchedule(leaderSchedule = {}, maxEntries = 20) {
  return Object.entries(leaderSchedule)
    .map(([identity, slots]) => ({
      identity,
      slotCount: slots.length,
      firstSlots: slots.slice(0, 5),
    }))
    .sort((a, b) => b.slotCount - a.slotCount)
    .slice(0, maxEntries);
}

async function main() {
  const epochInfo = await rpc("getEpochInfo");
  const currentSlot = epochInfo.absoluteSlot;
  const epoch = epochInfo.epoch;

  const [
    clusterNodes,
    voteAccounts,
    currentLeader,
    upcomingLeaders,
    leaderSchedule,
  ] = await Promise.all([
    rpc("getClusterNodes"),
    rpc("getVoteAccounts"),
    rpc("getSlotLeader"),
    rpc("getSlotLeaders", [currentSlot, slotLeadersLimit]),
    rpc("getLeaderSchedule", [null]),
  ]);

  const validators = summarizeValidators(
    voteAccounts.current ?? [],
    voteAccounts.delinquent ?? [],
  );

  const clusterNodeMap = new Map(
    clusterNodes.map((node) => [node.pubkey, node]),
  );

  const validatorsWithNetwork = validators.map((validator) => ({
    ...validator,
    gossip: clusterNodeMap.get(validator.identityPubkey)?.gossip ?? null,
    tpu: clusterNodeMap.get(validator.identityPubkey)?.tpu ?? null,
    rpc: clusterNodeMap.get(validator.identityPubkey)?.rpc ?? null,
    version: clusterNodeMap.get(validator.identityPubkey)?.version ?? null,
  }));

  const output = {
    rpcUrl,
    epoch,
    currentSlot,
    currentLeader,
    upcomingLeaders,
    validatorCount: {
      current: voteAccounts.current?.length ?? 0,
      delinquent: voteAccounts.delinquent?.length ?? 0,
      shown: validatorsWithNetwork.length,
    },
    topValidators: validatorsWithNetwork,
    leaderScheduleSummary: summarizeLeaderSchedule(leaderSchedule, 20),
    rawLeaderScheduleKeys: Object.keys(leaderSchedule).length,
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
