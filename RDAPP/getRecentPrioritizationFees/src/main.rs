use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;
use solana_sdk::pubkey;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let addresses = [pubkey!("CxELquR1gPP8wHe33gZ4QxqGB3sZ9RSwsJ2KshVewkFY")];
    let prioritization_fees = client.get_recent_prioritization_fees(&addresses).await?;

    println!("{:#?}", prioritization_fees);

    Ok(())
}
