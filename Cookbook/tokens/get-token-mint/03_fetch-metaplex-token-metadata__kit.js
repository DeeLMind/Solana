import { address, createSolanaRpc } from "@solana/kit";
import { fetchMetadataFromSeeds } from "@metaplex-foundation/mpl-token-metadata-kit";

const rpc = createSolanaRpc("https://api.mainnet.solana.com");

// Example: USDC mint address
const mintAddress = address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// !mark(1:2)
// Fetch metadata directly using the mint address
const metadata = await fetchMetadataFromSeeds(rpc, { mint: mintAddress });

console.log("Token Name:", metadata.data.name);
console.log("Token Symbol:", metadata.data.symbol);
console.log("Metadata URI:", metadata.data.uri);
console.log("Update Authority:", metadata.data.updateAuthority);
