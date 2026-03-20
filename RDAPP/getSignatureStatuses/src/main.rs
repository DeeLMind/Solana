use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_commitment_config::CommitmentConfig;
use solana_sdk::signature::Signature;
use std::str::FromStr;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let signatures_str = [
        "4cdd1oX7cfVALfr26tP52BZ6cSzrgnNGtYD7BFhm6FFeZV5sPTnRvg6NRn8yC6DbEikXcrNChBM5vVJnTgKhGhVu",
    ];
    let signatures = signatures_str.map(|sig| Signature::from_str(sig).unwrap());

    let signature_status = client
        .get_signature_statuses_with_history(&signatures)
        .await?;

    println!("{:#?}", signature_status);

    Ok(())
}
