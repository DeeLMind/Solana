use anyhow::Result;
use solana_account_decoder::UiAccountEncoding;
use solana_client::{nonblocking::rpc_client::RpcClient, rpc_config::RpcAccountInfoConfig};
use solana_commitment_config::CommitmentConfig;
use solana_sdk::pubkey;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let addresses = [
        pubkey!("vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg"),
        pubkey!("4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA"),
    ];

    let config = RpcAccountInfoConfig {

        encoding: UiAccountEncoding::Base64.into(),

        data_slice: None,

        commitment: CommitmentConfig::finalized().into(),

        min_context_slot: None,
    };

    let accounts = client
        .get_multiple_accounts_with_config(&addresses, config)
        .await?;

    println!("{:#?}", accounts);

    Ok(())
}
