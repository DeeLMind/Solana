import { createSolanaRpc, Address } from "@solana/kit";

const rpc = createSolanaRpc("https://api.mainnet.solana.com");

const addresss = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address;
// !mark
const { value } = await rpc.getBalance(addresss).send();

console.log(`Balance: ${Number(value) / 1_000_000_000} SOL`);
