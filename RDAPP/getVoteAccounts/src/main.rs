use anyhow::Result;
use solana_client::{nonblocking::rpc_client::RpcClient, rpc_config::RpcGetVoteAccountsConfig};
use solana_commitment_config::CommitmentConfig;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let vote_pubkey = String::from("5ZWgXcyqrrNpQHCme5SdC5hCeYb2o3fEJhF7Gok3bTVN");

    let config = RpcGetVoteAccountsConfig {
        vote_pubkey: Some(vote_pubkey),
        commitment: CommitmentConfig::finalized().into(),
        keep_unstaked_delinquents: None,
        delinquent_slot_distance: None,
    };

    let vote_accounts = client.get_vote_accounts_with_config(config).await?;

    println!("{:#?}", vote_accounts);

    Ok(())
}
