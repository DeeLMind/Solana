use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let commitment = CommitmentConfig::processed();
    let latest_blockhash = client
        .get_latest_blockhash_with_commitment(commitment)
        .await?;

    println!("{:#?}", latest_blockhash);

    Ok(())
}
