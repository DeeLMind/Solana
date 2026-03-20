use anyhow::Result;
use solana_client::{nonblocking::rpc_client::RpcClient, rpc_config::RpcLeaderScheduleConfig};
use solana_commitment_config::CommitmentConfig;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let slot_number = None;

    let config = RpcLeaderScheduleConfig {

        identity: String::from("dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92").into(),

        commitment: CommitmentConfig::finalized().into(),
    };
    let leader_schedule = client
        .get_leader_schedule_with_config(slot_number, config)
        .await?;

    println!("{:#?}", leader_schedule);

    Ok(())
}
