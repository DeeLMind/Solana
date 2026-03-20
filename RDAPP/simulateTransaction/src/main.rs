use anyhow::Result;
use base64::{Engine as _, engine::general_purpose};
use solana_client::{nonblocking::rpc_client::RpcClient, rpc_config::RpcSimulateTransactionConfig};
use solana_commitment_config::CommitmentConfig;
use solana_sdk::transaction::VersionedTransaction;
use solana_transaction_status_client_types::UiTransactionEncoding;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let b64_tx = "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEEjNmKiZGiOtSZ+g0//wH5kEQo3+UzictY+KlLV8hjXcs44M/Xnr+1SlZsqS6cFMQc46yj9PIsxqkycxJmXT+veJjIvefX4nhY9rY+B5qreeqTHu4mG6Xtxr5udn4MN8PnBt324e51j94YQl285GzN2rYa/E2DuQ0n/r35KNihi/zamQ6EeyeeVDvPVgUO2W3Lgt9hT+CfyqHvIa11egFPCgEDAwIBAAkDZAAAAAAAAAA=";
    let tx_bytes = general_purpose::STANDARD.decode(b64_tx).unwrap();
    let tx: VersionedTransaction = bincode::deserialize(&tx_bytes).unwrap();

    let config = RpcSimulateTransactionConfig {

        commitment: CommitmentConfig::finalized().into(),

        encoding: UiTransactionEncoding::Base64.into(),

        replace_recent_blockhash: true,

        sig_verify: false,

        min_context_slot: None,

        inner_instructions: false,

        accounts: None,
    };

    let simulate_result = client.simulate_transaction_with_config(&tx, config).await?;

    println!("{:#?}", simulate_result);

    Ok(())
}
