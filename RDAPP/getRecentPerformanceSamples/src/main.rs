use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let limit = 2;
    let performance_samples = client.get_recent_performance_samples(limit.into()).await?;

    println!("{:#?}", performance_samples);

    Ok(())
}
