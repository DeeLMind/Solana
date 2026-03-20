use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;
use solana_sdk::{native_token::LAMPORTS_PER_SOL, pubkey};

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let receiver = pubkey!("4kg8oh3jdNtn7j2wcS7TrUua31AgbLzDVkBZgTAe44aF");

    let lamports = 1 * LAMPORTS_PER_SOL;

    let transaction_signature = client.request_airdrop(&receiver, lamports).await?;
    loop {
        if client.confirm_transaction(&transaction_signature).await? {
            break;
        }
    }

    println!("{}", transaction_signature);

    Ok(())
}
