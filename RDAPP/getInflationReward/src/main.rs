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

    let addresses = [
        pubkey!("6dmNQ5jwLeLk5REvio1JcMshcbvkYMwy26sJ8pbkvStu"),
        pubkey!("BGsqMegLpV6n6Ve146sSX2dTjUMj3M92HnU8BbNRMhF2"),
    ];

    let epoch = 2;

    let inflation_reward = client.get_inflation_reward(&addresses, Some(epoch)).await?;

    println!("{:#?}", inflation_reward);

    Ok(())
}
