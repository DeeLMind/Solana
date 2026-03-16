import { Connection, clusterApiUrl } from '@solana/web3.js';

// 选择 RPC + Websocket endpoint
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
