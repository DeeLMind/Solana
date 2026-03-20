use anyhow::Result;
use solana_account_decoder::UiAccountEncoding;
use solana_client::{
    nonblocking::rpc_client::RpcClient,
    rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig},
    rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
};
use solana_commitment_config::CommitmentConfig;
use solana_sdk::pubkey;

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(
        String::from("https://api.devnet.solana.com"),
        CommitmentConfig::confirmed(),
    );

    let program = pubkey!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

    let config = RpcProgramAccountsConfig {

        filters: vec![
            RpcFilterType::DataSize(165),
            RpcFilterType::Memcmp(Memcmp::new(
                0,
                MemcmpEncodedBytes::Base58("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr".to_string()),
            )),
            RpcFilterType::Memcmp(Memcmp::new(
                32,
                MemcmpEncodedBytes::Base58("5wx11hXBHQALycTQNkeQ5w1N9vgup4ardN2yLiDK4JyK".to_string()),
            )),
        ]
        .into(),
        account_config: RpcAccountInfoConfig {

            encoding: UiAccountEncoding::Base64.into(),

            data_slice: None,

            commitment: CommitmentConfig::finalized().into(),

            min_context_slot: None,
        },

        with_context: None,

        sort_results: true.into(),
    };

    let accounts = client
        .get_program_accounts_with_config(&program, config)
        .await?;

    println!("{:#?}", accounts);

    Ok(())
}
