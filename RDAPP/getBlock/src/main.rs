use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;
use solana_transaction_status_client_types::{TransactionDetails, UiTransactionEncoding};

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let slot_number = 377261141;

    let config = solana_client::rpc_config::RpcBlockConfig {

        encoding: UiTransactionEncoding::Json.into(),

        transaction_details: TransactionDetails::Full.into(),

        rewards: None,

        commitment: CommitmentConfig::finalized().into(),

        max_supported_transaction_version: Some(0),
    };
    let block = client.get_block_with_config(slot_number, config).await?;

    println!("Block: {:#?}", block);

    Ok(())
}
