import { address, createSolanaRpc } from "@solana/kit";

const rpc_url = "https://api.devnet.solana.com";
const rpc = createSolanaRpc(rpc_url);

let owner = address("4kg8oh3jdNtn7j2wcS7TrUua31AgbLzDVkBZgTAe44aF");
let mint = address("6sgxNSdXgkEFVLA2YEQFnuFHU3WGafhu9WYzXAXY7yCq");

let response = await rpc
  .getTokenAccountsByOwner(owner, { mint }, { encoding: "jsonParsed" })
  .send();

response.value.forEach((accountInfo) => {
  console.log(`pubkey: ${accountInfo.pubkey}`);
  console.log(`mint: ${accountInfo.account.data["parsed"]["info"]["mint"]}`);
  console.log(`owner: ${accountInfo.account.data["parsed"]["info"]["owner"]}`);
  console.log(
    `decimals: ${accountInfo.account.data["parsed"]["info"]["tokenAmount"]["decimals"]}`
  );
  console.log(
    `amount: ${accountInfo.account.data["parsed"]["info"]["tokenAmount"]["amount"]}`
  );
  console.log("====================");
});
