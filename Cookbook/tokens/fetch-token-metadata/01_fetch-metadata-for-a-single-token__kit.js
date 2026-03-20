import { address, createSolanaRpc } from "@solana/kit";
import {
  findMetadataPda,
  fetchMetadata,
  fetchMaybeMetadata,
  fetchMetadataFromSeeds
} from "@metaplex-foundation/mpl-token-metadata-kit";

const rpc = createSolanaRpc("https://api.mainnet.solana.com");

// Example: USDC mint address
const mintAddress = address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// !mark(1:2)
// Option 1: Fetch directly from mint (simplest)
const metadata = await fetchMetadataFromSeeds(rpc, { mint: mintAddress });

console.log("Token Name:", metadata.data.name);
console.log("Token Symbol:", metadata.data.symbol);
console.log("Metadata URI:", metadata.data.uri);
console.log("Update Authority:", metadata.data.updateAuthority);
console.log("Is Mutable:", metadata.data.isMutable);

// Check optional fields
if (metadata.data.creators.__option === "Some") {
  console.log("Creators:", metadata.data.creators.value);
}

// !mark(1:9)
// Option 2: Safe fetch (returns exists: false if not found)
const [metadataPda] = await findMetadataPda({ mint: mintAddress });
const maybeMetadata = await fetchMaybeMetadata(rpc, metadataPda);

if (maybeMetadata.exists) {
  console.log("Found metadata:", maybeMetadata.data.name);
} else {
  console.log("No metadata found for this mint");
}
