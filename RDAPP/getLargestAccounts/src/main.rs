use anyhow::Result;
use solana_client::{
    nonblocking::rpc_client::RpcClient,
    rpc_config::{RpcLargestAccountsConfig, RpcLargestAccountsFilter},
};
use solana_commitment_config::CommitmentConfig;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let config = RpcLargestAccountsConfig {

        commitment: CommitmentConfig::finalized().into(),

        filter: RpcLargestAccountsFilter::Circulating.into(),
        sort_results: true.into(),
    };
    let largest_accounts = client.get_largest_accounts_with_config(config).await?;

    println!("{:#?}", largest_accounts);

    Ok(())
}
