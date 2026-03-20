import { address, createSolanaRpc } from "@solana/kit";
import { fetchMetadataFromSeeds } from "@metaplex-foundation/mpl-token-metadata-kit";

const rpc = createSolanaRpc("https://api.mainnet.solana.com");
const mintAddress = address("YourMintAddressHere");

// Fetch on-chain metadata
const metadata = await fetchMetadataFromSeeds(rpc, { mint: mintAddress });

// !mark(1:9)
// Fetch off-chain JSON metadata
if (metadata.data.uri) {
  const response = await fetch(metadata.data.uri);
  const jsonMetadata = await response.json();

  console.log("Name:", jsonMetadata.name);
  console.log("Description:", jsonMetadata.description);
  console.log("Image:", jsonMetadata.image);
}
