use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let data_len = 50;

    let min_bal_for_rent_exemption = client
        .get_minimum_balance_for_rent_exemption(data_len)
        .await?;

    println!("{:#?}", min_bal_for_rent_exemption);

    Ok(())
}
