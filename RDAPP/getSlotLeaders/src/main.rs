use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let start_slot = 378037836;

    let limit = 10;

    let slot_leaders = client.get_slot_leaders(start_slot, limit).await?;

    println!("{:#?}", slot_leaders);

    Ok(())
}
