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

    let token_address = pubkey!("48gpnn8nsmkvkgso7462Z1nFhUrprGQ71u1YLBPzizbY");
    let token_acc_bal = client.get_token_account_balance(&token_address).await?;

    println!("{:#?}", token_acc_bal);

    Ok(())
}
