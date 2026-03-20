use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let start_slot = 377268280;

    let limit = 5;

    let blocks = client.get_blocks_with_limit(start_slot, limit).await?;

    println!("Blocks produced: {:?}", blocks);

    Ok(())
}
