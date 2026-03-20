use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;
use solana_sdk::hash::Hash;
use std::str::FromStr;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let blockhash = Hash::from_str("J7rBdM6AecPDEZp8aPq5iPSNKVkU5Q76F3oAV4eW5wsW")?;

    let is_valid = client
        .is_blockhash_valid(&blockhash, CommitmentConfig::finalized())
        .await?;

    println!("{:#?}", is_valid);

    Ok(())
}
