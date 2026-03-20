use anyhow::Result;
use base64::{Engine as _, engine::general_purpose};

use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;
use solana_sdk::message::Message;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let base_64_message = "AQABAgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQAA";
    let bytes = general_purpose::STANDARD.decode(base_64_message).unwrap();
    let message: Message = bincode::deserialize(&bytes).unwrap();

    let fee = client.get_fee_for_message(&message).await?;

    println!("{:#?}", fee);

    Ok(())
}
