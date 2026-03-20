use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let highest_snapshot_slot = client.get_highest_snapshot_slot().await?;

    println!("{:#?}", highest_snapshot_slot);

    Ok(())
}
