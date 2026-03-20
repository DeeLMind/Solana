use anyhow::Result;
use solana_client::{nonblocking::rpc_client::RpcClient, rpc_request::TokenAccountsFilter};
use solana_commitment_config::CommitmentConfig;
use solana_sdk::pubkey;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let owner = pubkey!("4kg8oh3jdNtn7j2wcS7TrUua31AgbLzDVkBZgTAe44aF");

    let token_program = pubkey!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

    let token_accounts = client
        .get_token_accounts_by_owner(&owner, TokenAccountsFilter::ProgramId(token_program))
        .await?;

    println!("{:#?}", token_accounts);

    Ok(())
}
