use anyhow::Result;
use solana_client::{
    nonblocking::rpc_client::RpcClient, rpc_client::GetConfirmedSignaturesForAddress2Config,
};
use solana_commitment_config::CommitmentConfig;
use solana_sdk::pubkey;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let address = pubkey!("Vote111111111111111111111111111111111111111");

    let signatures_for_config = GetConfirmedSignaturesForAddress2Config {

        before: None,

        until: None,

        limit: Some(1),

        commitment: CommitmentConfig::finalized().into(),
    };

    let signatures = client
        .get_signatures_for_address_with_config(&address, signatures_for_config)
        .await?;

    println!("{:#?}", signatures);

    Ok(())
}
