use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );
    let pubkey = Pubkey::from_str("vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg")?;
    let account = client.get_account(&pubkey).await?;

    println!("{:#?}", account);

    Ok(())
}
