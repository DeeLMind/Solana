use anyhow::Result;
use base64::{Engine as _, engine::general_purpose};
use solana_client::{nonblocking::rpc_client::RpcClient, rpc_config::RpcSendTransactionConfig};
use solana_commitment_config::{CommitmentConfig, CommitmentLevel};
use solana_sdk::transaction::VersionedTransaction;
use solana_transaction_status_client_types::UiTransactionEncoding;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let b64_tx = "AbuRLtc5C9bZtAUT4F4Y2H5SRRUK1HwOFZOK3V4qm/78MDJt+M2de/RCCaI3iTyodDepmrkUWbss0XRHS0lk5AOAAQABAzfDSQC/GjcggrLsDpYz7jAlT+Gca846HqtFb8UQMM9cCWPIi4AX32PV8HrY7/1WgoRc3IATttceZsUMeQ1qx7UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2dTRgcJmzcoGH1R3c2WqtHah2H19KvbC1p6BxLDqfoAQICAAEMAgAAAADKmjsAAAAAAA==";
    let tx_bytes = general_purpose::STANDARD.decode(b64_tx).unwrap();
    let tx: VersionedTransaction = bincode::deserialize(&tx_bytes).unwrap();

    let config = RpcSendTransactionConfig {

        skip_preflight: true,

        preflight_commitment: CommitmentLevel::Finalized.into(),

        encoding: UiTransactionEncoding::Base64.into(),

        max_retries: None,

        min_context_slot: None,
    };

    match client.send_transaction_with_config(&tx, config).await {
        Ok(signature) => println!("Transaction Signature: {}", signature),
        Err(err) => eprintln!("Error transferring tokens: {}", err),
    }

    Ok(())
}
